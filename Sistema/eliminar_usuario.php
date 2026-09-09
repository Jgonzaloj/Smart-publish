<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config/conexion.php';
verificar_rol(['Administrador']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $usuario_actual = $_SESSION['usuario_id'] ?? 0;

    // Validación: Prevenir eliminarse a sí mismo
    if ($id > 0 && $id === $usuario_actual) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'No puedes eliminar tu propia cuenta mientras mantienes la sesión activa.'
        ]);
        exit();
    }

    if ($id > 0) {
        try {
            $db = Conexion::getConexion();
            $stmt = $db->prepare("DELETE FROM usuarios WHERE id = :id");
            $result = $stmt->execute([':id' => $id]);

            if ($result && $stmt->rowCount() > 0) {
                echo json_encode([
                    'status'  => 'success',
                    'message' => 'El usuario ha sido eliminado correctamente.'
                ]);
            } else {
                echo json_encode([
                    'status'  => 'error',
                    'message' => 'No se encontró el usuario o ya fue eliminado.'
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'Error en la base de datos: ' . $e->getMessage()
            ]);
        }
    } else {
        echo json_encode([
            'status'  => 'error',
            'message' => 'ID de usuario no válido.'
        ]);
    }
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Método de solicitud no permitido.'
    ]);
}
?>