<?php
require_once '../config/config.php';

// Vaciar todas las variables de sesión
$_SESSION = array();

// Destruir la cookie de sesión si existe
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destruir la sesión en el servidor por completo
session_destroy();

// Redirigir de inmediato al login principal
header("Location: ../index.php");
exit();
?>