<?php
// Cargar conexión
require_once 'config/conexion.php';
verificar_rol(['Administrador']);

$db = Conexion::getConexion();

// Consulta para obtener usuarios
try {
    $sql = "SELECT id, nombre_completo, username, rol, estado FROM usuarios ORDER BY id DESC";
    $usuarios = $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $sql = "SELECT id, nombre_completo, username FROM usuarios ORDER BY id DESC";
    $usuarios_raw = $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    $usuarios = array_map(function($u) {
        $u['rol'] = 'Administrador';
        $u['estado'] = 'Activo';
        return $u;
    }, $usuarios_raw);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administración de Usuarios | GeoRegistro</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
</head>
<body class="bg-light">

<div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <?php include 'includes/sidebar.php'; ?>
    
    <div id="page-content-wrapper" class="w-100">
        <div class="container-fluid py-4 px-4 px-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center">
            <button class="btn btn-outline-primary d-md-none me-3 border-0" onclick="toggleMobileMenu()">
                <i class="fa-solid fa-bars fs-5"></i>
            </button>
            <div>
                <h4 class="fw-bold mb-0 text-dark"><i class="fa-solid fa-users-gear me-2 text-primary"></i>Gestión de Usuarios</h4>
                <p class="text-muted small mb-0">GeoRegistro - Sistema de Gestión Territorial</p>
            </div>
        </div>
        <a href="dashboard.php" class="btn btn-outline-secondary btn-sm rounded-2"><i class="fa-solid fa-arrow-left me-1"></i> Volver al Panel</a>
    </div>

    <div class="row g-4">
        <div class="col-md-4">
            <div class="card">
                <div class="card-header card-header-custom p-3 fw-bold">
                    <i class="fa-solid fa-user-plus me-1"></i> Registrar Nuevo Acceso
                </div>
                <div class="card-body p-3">
                    <form id="formUsuario">
                        <div class="mb-3">
                            <label class="form-label small fw-bold">Nombre Completo *</label>
                            <input type="text" name="nombre_completo" class="form-control form-control-sm" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-bold">Usuario de Acceso *</label>
                            <input type="text" name="username" class="form-control form-control-sm" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-bold">Contraseña *</label>
                            <input type="password" name="password" class="form-control form-control-sm" minlength="6" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-bold">Rol *</label>
                            <select name="rol" class="form-select form-select-sm" required>
                                <option value="Operador">Operador (Campo)</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm w-100 fw-bold mt-2"><i class="fa-solid fa-floppy-disk me-1"></i> Guardar Usuario</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-md-8">
            <div class="card">
                <div class="card-header bg-white border-bottom p-3 fw-bold text-dark">
                    <i class="fa-solid fa-list me-1 text-primary"></i> Lista de Usuarios del Sistema
                </div>
                <div class="card-body p-3">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle small mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>N°</th>
                                    <th>Nombre Completo</th>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php $i = 1; foreach ($usuarios as $u): ?>
                                <tr>
                                    <td><?= $i++; ?></td>
                                    <td class="fw-bold"><?= htmlspecialchars($u['nombre_completo']) ?></td>
                                    <td><span class="badge bg-light text-dark border"><?= htmlspecialchars($u['username']) ?></span></td>
                                    <td><span class="badge <?= ($u['rol'] ?? 'Operador') === 'Administrador' ? 'bg-danger' : 'bg-info text-dark' ?>"><?= $u['rol'] ?? 'Operador' ?></span></td>
                                    <td><span class="badge bg-success"><?= $u['estado'] ?? 'Activo' ?></span></td>
                                    <td class="text-center">
                                        <?php if ($u['id'] != $_SESSION['usuario_id']): ?>
                                            <button class="btn btn-outline-danger btn-sm px-2 py-0" onclick="eliminarUsuario(<?= $u['id']; ?>, '<?= htmlspecialchars($u['username'], ENT_QUOTES); ?>')" title="Eliminar usuario">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        <?php else: ?>
                                            <span class="badge bg-light text-muted border">Tú</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>

<script src="https://code.jquery.com/jquery-3.7.0.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
// Guardar Usuario
$('#formUsuario').on('submit', function(e) {
    e.preventDefault();
    $.ajax({
        url: 'guardar_usuario.php',
        type: 'POST',
        data: $(this).serialize(),
        dataType: 'json',
        success: function(res) {
            if (res.status === 'success') {
                Swal.fire('¡Registrado!', res.message, 'success').then(() => location.reload());
            } else {
                Swal.fire('Atención', res.message, 'warning');
            }
        },
        error: function() {
            Swal.fire('Error', 'No se pudo guardar el usuario.', 'error');
        }
    });
});

// Eliminar Usuario
function eliminarUsuario(id, username) {
    Swal.fire({
        title: '¿Eliminar usuario?',
        text: `¿Estás seguro de eliminar a "${username}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: 'eliminar_usuario.php',
                type: 'POST',
                data: { id: id },
                dataType: 'json',
                success: function(res) {
                    if (res.status === 'success') {
                        Swal.fire('¡Eliminado!', res.message, 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Error', res.message, 'error');
                    }
                },
                error: function() {
                    Swal.fire('Error', 'No se pudo procesar la solicitud.', 'error');
                }
            });
        }
    });
}
</script>
</body>
</html>