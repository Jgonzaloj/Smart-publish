<?php
// Incluir la configuración global de seguridad y sesiones
require_once 'config/config.php';

// Si el usuario ya inició sesión previamente, redirigirlo directo al Dashboard
if (isset($_SESSION['usuario_id'])) {
    header("Location: dashboard.php");
    exit();
}

// Capturar mensajes de error de forma segura en la URL
$error_msg = "";
if (isset($_GET['error'])) {
    switch ($_GET['error']) {
        case 'invalid':
            $error_msg = "Usuario o contraseña incorrectos.";
            break;
        case 'unauthorized':
            $error_msg = "Acceso denegado. Debe iniciar sesión para acceder.";
            break;
        case 'expired':
            $error_msg = "La sesión ha expirado por inactividad. Inicie sesión nuevamente.";
            break;
    }
}
?>
<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión | GeoRegistro</title>
    <!-- Fonts & Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
</head>
<body>

<div class="login-fullscreen d-flex align-items-center justify-content-center">
    <div class="login-fullscreen-overlay"></div>
    
    <div class="login-glass-card module-card position-relative z-1 shadow-lg">
        <div class="text-center mb-4">
            <img src="assets/img/logo.png" alt="GeoRegistro Logo" class="brand-logo mb-2 shadow-sm" style="max-height: 80px; width: auto; border-radius: 18px;">
            <h4 class="fw-bold mt-3 mb-1 text-dark" style="letter-spacing: -0.5px;">GeoRegistro</h4>
            <p class="small text-muted mb-0"><i class="fa-solid fa-shield-halved text-success me-1"></i> HTTPS Activo | Acceso Seguro</p>
        </div>
        
        <?php if (!empty($error_msg)): ?>
            <div class="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 small mb-4" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fa-solid fa-circle-exclamation fs-5 me-2"></i>
                    <div><?= htmlspecialchars($error_msg, ENT_QUOTES, 'UTF-8') ?></div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <form action="auth/login_process.php" method="POST" autocomplete="off">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?? '' ?>">
            
            <div class="mb-3">
                <label for="username" class="form-label small fw-semibold text-muted">Usuario</label>
                <div class="input-group">
                    <span class="input-group-text border-end-0 bg-white text-muted"><i class="fa-regular fa-user"></i></span>
                    <input type="text" class="form-control border-start-0 ps-0 bg-white" id="username" name="username" placeholder="Nombre de usuario" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label for="password" class="form-label small fw-semibold text-muted">Contraseña</label>
                <div class="input-group">
                    <span class="input-group-text border-end-0 bg-white text-muted"><i class="fa-solid fa-lock"></i></span>
                    <input type="password" class="form-control border-start-0 border-end-0 ps-0 bg-white" id="password" name="password" placeholder="••••••••" required>
                    <span class="input-group-text border-start-0 bg-white toggle-password text-muted" onclick="togglePasswordVisibility()" style="cursor:pointer;">
                        <i class="fa-regular fa-eye" id="toggleIcon"></i>
                    </span>
                </div>
            </div>

            <div class="d-grid gap-2 mb-3 mt-4">
                <button type="submit" class="btn btn-primary btn-lg rounded-3 fs-6 fw-bold shadow-sm">
                    Ingresar a la plataforma <i class="fa-solid fa-arrow-right ms-2"></i>
                </button>
            </div>
            
            <div class="text-center">
                <a href="#" class="text-decoration-none small text-secondary hover-primary">¿Olvidó su contraseña?</a>
            </div>
        </form>
        
        <div class="text-center mt-5 pt-3 border-top border-secondary border-opacity-10">
            <p class="text-muted small mb-0">&copy; <?= date('Y') ?> Inversiones Vawi.</p>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('toggleIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
</script>
</body>
</html>