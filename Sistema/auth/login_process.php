<?php
// 1. Incluir la conexión y configuraciones globales de sesión
require_once '../config/conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // 2. Validar el Token de seguridad CSRF
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        header("Location: ../index.php?error=invalid");
        exit();
    }

    // 3. Sanitizar las entradas del formulario
    $username = sanitize($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        header("Location: ../index.php?error=invalid");
        exit();
    }

    // 4. Conectar a la base de datos y buscar al usuario activo
    $db = Conexion::getConexion();
    $stmt = $db->prepare("SELECT u.*, r.nombre AS rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = ? AND u.activo = 1");
    $stmt->execute([$username]);
    $usuario = $stmt->fetch();

    // 5. Verificación inteligente: Soporta el nuevo PASSWORD_BCRYPT y el antiguo MD5
    $login_valido = false;

    if ($usuario) {
        // Primero evalúa si la contraseña se guardó con el método nuevo y seguro BCRYPT
        if (password_verify($password, $usuario['password'])) {
            $login_valido = true;
        } 
        // Si falla, evalúa si es una cuenta antigua usando MD5
        elseif (md5($password) === $usuario['password']) {
            $login_valido = true;
        }
    }

    // 6. Si el inicio de sesión es correcto, inicializar la sesión de la plataforma
    if ($login_valido) {
        
        // Regenerar ID de sesión por seguridad (Previene fijación de sesiones)
        session_regenerate_id(true);
        
        // Guardar datos en la sesión global de PHP para los Navbar y Dashboards
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['username']   = $usuario['username'];
        $_SESSION['nombre']     = $usuario['nombre_completo'];
        $_SESSION['rol']        = $usuario['rol_nombre']; // Guardará 'Administrador' u 'Operador'

        // Redirigir con éxito al Dashboard principal en el subdominio
        header("Location: ../dashboard.php");
        exit();
    } else {
        // Si no coincide la clave o el usuario, regresar al login con error
        header("Location: ../index.php?error=invalid");
        exit();
    }
} else {
    header("Location: ../index.php");
    exit();
}
?>