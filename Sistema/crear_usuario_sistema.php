<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'config/conexion.php';

header('Content-Type: application/json');

// 1. Validación de seguridad de sesión
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'Administrador') {
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado. No tiene permisos de Administrador.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

// 2. Recibir entradas del formulario
$nombre   = isset($_POST['nombre_completo']) ? htmlspecialchars(trim($_POST['nombre_completo']), ENT_QUOTES, 'UTF-8') : '';
$username = isset($_POST['username']) ? strtolower(trim(htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8'))) : '';
$password = $_POST['password'] ?? '';
$rol_txt  = isset($_POST['rol']) ? $_POST['rol'] : ''; // Recibe 'Administrador' u 'Operador'

if (empty($nombre) || empty($username) || empty($password) || empty($rol_txt)) {
    echo json_encode(['status' => 'error', 'message' => 'Todos los campos marcados con (*) son obligatorios.']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'La contraseña debe tener un mínimo de 6 caracteres.']);
    exit();
}

// 3. Convertir el texto del rol al ID numérico correspondiente de tu columna rol_id
$rol_id = ($rol_txt === 'Administrador') ? 1 : 2; 

$db = Conexion::getConexion();

try {
    // 4. Verificar si el usuario ya existe en tu columna 'username' de la tabla 'usuarios'
    $stmt_check = $db->prepare("SELECT id FROM usuarios WHERE username = ?");
    $stmt_check->execute([$username]);
    if ($stmt_check->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'El usuario de acceso ya se encuentra registrado. Intente con otro.']);
        exit();
    }

    // 5. Encriptar contraseña
    $password_encriptada = password_hash($password, PASSWORD_BCRYPT);

    // 6. INSERT exacto con las columnas de tu phpMyAdmin: username, password, nombre_completo, rol_id, activo
    $sql = "INSERT INTO usuarios (username, password, nombre_completo, rol_id, activo) VALUES (?, ?, ?, ?, 1)";
    $stmt = $db->prepare($sql);
    $stmt->execute([$username, $password_encriptada, $nombre, $rol_id]);

    echo json_encode(['status' => 'success', 'message' => 'El nuevo usuario ha sido creado con éxito. Ya puede iniciar sesión.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error en la base de datos al guardar: ' . $e->getMessage()]);
}
?>