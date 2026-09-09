<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador']);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

$nombre   = isset($_POST['nombre_completo']) ? trim($_POST['nombre_completo']) : '';
$username = isset($_POST['username']) ? strtolower(trim($_POST['username'])) : '';
$password = $_POST['password'] ?? '';
$rol_nombre = isset($_POST['rol']) ? trim($_POST['rol']) : 'Operador';

if (empty($nombre) || empty($username) || empty($password)) {
    echo json_encode(['status' => 'error', 'message' => 'Todos los campos marcados son obligatorios.']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'La contraseña debe tener mínimo 6 caracteres.']);
    exit();
}

$db = Conexion::getConexion();

try {
    // 1. Verificar si el usuario ya existe
    $stmt_check = $db->prepare("SELECT id FROM usuarios WHERE username = ?");
    $stmt_check->execute([$username]);
    if ($stmt_check->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'El nombre de usuario ya se encuentra registrado.']);
        exit();
    }

    // 2. Obtener el ID del rol desde la tabla 'roles'
    $stmt_rol = $db->prepare("SELECT id FROM roles WHERE nombre = ? OR id = ? LIMIT 1");
    $stmt_rol->execute([$rol_nombre, $rol_nombre]);
    $rol_data = $stmt_rol->fetch(PDO::FETCH_ASSOC);

    // Si no encuentra el rol exacto, asigna por defecto el ID 1 o 2 (ajustable)
    if ($rol_data) {
        $rol_id = $rol_data['id'];
    } else {
        $rol_id = ($rol_nombre === 'Administrador') ? 1 : 2;
    }

    $password_encriptada = password_hash($password, PASSWORD_BCRYPT);

    // 3. Inserción asignando el rol_id obligatorio
    try {
        $sql = "INSERT INTO usuarios (nombre_completo, username, password, rol_id, rol, estado) VALUES (?, ?, ?, ?, ?, 'Activo')";
        $stmt = $db->prepare($sql);
        $stmt->execute([$nombre, $username, $password_encriptada, $rol_id, $rol_nombre]);
    } catch (PDOException $ex) {
        // En caso de que la tabla NO tenga columna 'rol' o 'estado', prueba la estructura mínima con rol_id
        $sql = "INSERT INTO usuarios (nombre_completo, username, password, rol_id) VALUES (?, ?, ?, ?)";
        $stmt = $db->prepare($sql);
        $stmt->execute([$nombre, $username, $password_encriptada, $rol_id]);
    }

    echo json_encode(['status' => 'success', 'message' => 'El nuevo usuario ha sido registrado con éxito.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error en base de datos: ' . $e->getMessage()]);
}
?>