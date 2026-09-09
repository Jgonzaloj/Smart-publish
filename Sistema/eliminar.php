<?php
require_once 'config/conexion.php';
// 1. Permitir acceso tanto a Administrador como a Operador
verificar_rol(['Administrador', 'Operador']);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'ID de registro no válido o ausente.']);
    exit();
}

$db = Conexion::getConexion();
$usuario_id = $_SESSION['usuario_id'] ?? null;
$rol_usuario = $_SESSION['rol'] ?? 'Operador'; // Ajusta la clave según cómo guardes el rol en la sesión

try {
    // 2. Buscar el registro y verificar la propiedad si es Operador
    $stmt_file = $db->prepare("SELECT nombre_completo, dni, foto_domicilio, usuario_registro_id FROM personas WHERE id = ?");
    $stmt_file->execute([$id]);
    $persona = $stmt_file->fetch();

    if (!$persona) {
        echo json_encode(['status' => 'error', 'message' => 'El registro no existe en el sistema.']);
        exit();
    }

    // 3. Validar si el Operador intenta borrar un registro que NO le pertenece
    if ($rol_usuario === 'Operador' && (int)$persona['usuario_registro_id'] !== (int)$usuario_id) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'No tienes permiso para eliminar este registro porque fue ingresado por otro usuario.'
        ]);
        exit();
    }

    $db->beginTransaction();

    // 4. Eliminar el historial de la tabla de auditoría previa
    $stmt_audit_del = $db->prepare("DELETE FROM auditoria WHERE persona_id = ?");
    $stmt_audit_del->execute([$id]);

    // 5. Eliminar el registro principal
    if ($rol_usuario === 'Administrador') {
        $stmt_del = $db->prepare("DELETE FROM personas WHERE id = ?");
        $stmt_del->execute([$id]);
    } else {
        // Garantía extra en la consulta SQL para el Operador
        $stmt_del = $db->prepare("DELETE FROM personas WHERE id = ? AND usuario_registro_id = ?");
        $stmt_del->execute([$id, $usuario_id]);
    }

    // 6. Registrar en auditoría la acción de eliminación
    $stmt_audit = $db->prepare("INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)");
    $detalles_audit = "REGISTRO ELIMINADO - Nombre: " . $persona['nombre_completo'] . " | DNI: " . $persona['dni'];
    $stmt_audit->execute([$usuario_id, 'DELETE', $detalles_audit]);

    // Confirmar la transacción
    $db->commit();

    // 7. Eliminar físicamente el archivo
    if (!empty($persona['foto_domicilio'])) {
        $ruta_foto = __DIR__ . '/assets/uploads/' . $persona['foto_domicilio'];
        if (file_exists($ruta_foto)) {
            @unlink($ruta_foto);
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'El registro ha sido eliminado correctamente del sistema.']);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Error al intentar eliminar el registro: ' . $e->getMessage()]);
}
?>