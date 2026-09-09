<?php
// Iniciar la sesión si no está activa para poder leer el rol
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'config/conexion.php';

header('Content-Type: application/json');

// Validación de seguridad manual sustituyendo a verificar_rol()
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'Administrador') {
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado. No tiene permisos de Administrador.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

// Recibir y limpiar únicamente las entradas obligatorias usando funciones nativas de PHP
$nombre   = isset($_POST['nombre_completo']) ? htmlspecialchars(trim($_POST['nombre_completo']), ENT_QUOTES, 'UTF-8') : '';
$username = isset($_POST['username']) ? strtolower(trim(htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8'))) : '';
$password = $_POST['password'] ?? '';
$rol      = isset($_POST['rol']) ? htmlspecialchars(trim($_POST['rol']), ENT_QUOTES, 'UTF-8') : '';

// Validaciones obligatorias
if (empty($nombre) || empty($username) || empty($password) || empty($rol)) {
    echo json_encode(['status' => 'error', 'message' => 'Todos los campos marcados con (*) son obligatorios.']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'La contraseña debe tener un mínimo de 6 caracteres.']);
    exit();
}

$db = Conexion::getConexion();

try {
    // 1. Verificar si el nombre de usuario ya está registrado en el sistema
    $stmt_check = $db->prepare("SELECT id FROM usuarios WHERE username = ?");
    $stmt_check->execute([$username]);
    if ($stmt_check->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'El usuario de acceso ya se encuentra registrado. Intente con otro.']);
        exit();
    }

    // 2. Encriptación segura de la contraseña
    $password_encriptada = password_hash($password, PASSWORD_BCRYPT);

    // 3. Insertar el nuevo usuario usando únicamente los campos existentes en tu base de datos
    $sql = "INSERT INTO usuarios (nombre_completo, username, password, rol, estado) VALUES (?, ?, ?, ?, 'Activo')";
    $stmt = $db->prepare($sql);
    $stmt->execute([$nombre, $username, $password_encriptada, $rol]);

    echo json_encode(['status' => 'success', 'message' => 'El nuevo usuario ha sido creado con éxito. Ya puede iniciar sesión.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error en la base de datos al guardar: ' . $e->getMessage()]);
}
?>