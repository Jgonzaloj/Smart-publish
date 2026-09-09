<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador', 'Operador']); // Ambos roles pueden cambiar claves

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

$password_nueva = $_POST['password_nueva'] ?? '';
$id_objetivo = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : 0;

if (empty($password_nueva) || strlen($password_nueva) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'La nueva contraseña debe tener un mínimo de 6 caracteres.']);
    exit();
}

// Regla de seguridad: Si no es Administrador, solo puede cambiarse la clave a sí mismo
if ($_SESSION['rol'] !== 'Administrador' && $id_objetivo !== $_SESSION['usuario_id']) {
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado. No puedes modificar la clave de otro usuario.']);
    exit();
}

// Si el Administrador cambia la clave desde el panel general, usa el id_objetivo; si el usuario lo hace desde su perfil, usa su sesión.
$id_usuario_final = ($id_objetivo > 0 && $_SESSION['rol'] === 'Administrador') ? $id_objetivo : $_SESSION['usuario_id'];

$db = Conexion::getConexion();

try {
    // Generar el nuevo hash seguro equivalente al sistema de login
    $password_encriptada = password_hash($password_nueva, PASSWORD_BCRYPT);

    $sql = "UPDATE usuarios SET password = ? WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$password_encriptada, $id_usuario_final]);

    echo json_encode(['status' => 'success', 'message' => 'La contraseña ha sido actualizada con éxito.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error al actualizar: ' . $e->getMessage()]);
}
?>