<?php
// =========================================================================
// CONFIGURACIÓN DE SESIONES Y COOKIES
// =========================================================================
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.cookie_domain', '.tudominio.com'); 

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// =========================================================================
// CREDENCIALES DE LA BASE DE DATOS (cPanel / MySQL)
// =========================================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'tu_base_datos'); 
define('DB_USER', 'tu_usuario'); 
define('DB_PASS', 'tu_password');   

define('UPLOAD_DIR', __DIR__ . '/../assets/uploads/');
define('URL_SITIO', 'https://tudominio.com/');

// =========================================================================
// CONFIGURACIÓN DE ALMACENAMIENTO EN LA NUBE (AWS S3)
// =========================================================================
define('USE_S3', false);
define('S3_KEY', 'TU_ACCESS_KEY');
define('S3_SECRET', 'TU_SECRET_KEY');
define('S3_REGION', 'us-east-1');
define('S3_BUCKET', 'nombre-de-tu-bucket');
define('S3_URL', 'https://' . S3_BUCKET . '.s3.' . S3_REGION . '.amazonaws.com/');

// =========================================================================
// CABECERAS DE SEGURIDAD HTTP Y FUNCIONES GLOBALES
// =========================================================================
header("X-XSS-Protection: 1; mode=block");
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");

function sanitize($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function verificar_rol($roles_permitidos) {
    if (!isset($_SESSION['usuario_id']) || !in_array($_SESSION['rol'], $roles_permitidos)) {
        header("Location: index.php?error=unauthorized");
        exit();
    }
}
?>
