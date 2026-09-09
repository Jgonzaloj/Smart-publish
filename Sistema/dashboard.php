<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador', 'Operador']);

$db = Conexion::getConexion();
$userId = $_SESSION['usuario_id'];

// LÓGICA DE PRIVACIDAD: Estadísticas adaptadas según el rol del usuario
if ($_SESSION['rol'] === 'Administrador') {
    // 1. Consultas de estadísticas globales para el Administrador
    $total = $db->query("SELECT COUNT(*) FROM personas")->fetchColumn();
    $hoy = $db->query("SELECT COUNT(*) FROM personas WHERE DATE(fecha_registro) = CURRENT_DATE()")->fetchColumn();
    $mes = $db->query("SELECT COUNT(*) FROM personas WHERE MONTH(fecha_registro) = MONTH(CURRENT_DATE()) AND YEAR(fecha_registro) = YEAR(CURRENT_DATE())")->fetchColumn();

    // Obtener el último registro global ingresado en la empresa
    $stmt_last = $db->query("SELECT nombre_completo, fecha_registro FROM personas ORDER BY id DESC LIMIT 1");
    $ultimo = $stmt_last->fetch();
} else {
    // 2. Consultas de estadísticas exclusivas para el Operador logueado
    $stmt_total = $db->prepare("SELECT COUNT(*) FROM personas WHERE usuario_registro_id = ?");
    $stmt_total->execute([$userId]);
    $total = $stmt_total->fetchColumn();

    $stmt_hoy = $db->prepare("SELECT COUNT(*) FROM personas WHERE usuario_registro_id = ? AND DATE(fecha_registro) = CURRENT_DATE()");
    $stmt_hoy->execute([$userId]);
    $hoy = $stmt_hoy->fetchColumn();

    $stmt_mes = $db->prepare("SELECT COUNT(*) FROM personas WHERE usuario_registro_id = ? AND MONTH(fecha_registro) = MONTH(CURRENT_DATE()) AND YEAR(fecha_registro) = YEAR(CURRENT_DATE())");
    $stmt_mes->execute([$userId]);
    $mes = $stmt_mes->fetchColumn();

    // Obtener el último registro propio ingresado por este operador
    $stmt_last = $db->prepare("SELECT nombre_completo, fecha_registro FROM personas WHERE usuario_registro_id = ? ORDER BY id DESC LIMIT 1");
    $stmt_last->execute([$userId]);
    $ultimo = $stmt_last->fetch();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | GeoRegistro</title>
    <!-- Fonts & Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        /* Ajuste extra para asegurar que el sidebar llegue al fondo de la pantalla y use flexbox */
        html, body {
            height: 100%;
        }
        #wrapper {
            min-height: 100vh;
        }
        #sidebar {
            display: flex;
            flex-direction: column;
        }
    </style>
</head>
<body class="bg-light">

<div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <?php include 'includes/sidebar.php'; ?>
    <!-- /#sidebar -->

    <!-- Page Content -->
    <div id="page-content-wrapper" class="w-100">
        <!-- Top navigation -->
        <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-4 py-3">
            <div class="d-flex align-items-center w-100">
                <button class="btn btn-outline-primary d-md-none me-3 border-0" onclick="toggleMobileMenu()">
                    <i class="fa-solid fa-bars fs-5"></i>
                </button>
                <h4 class="mb-0 fw-bold text-dark">Dashboard General</h4>
                <div class="ms-auto d-flex align-items-center">
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                        <i class="fa-solid fa-server me-1"></i> Servidor en línea
                    </span>
                </div>
            </div>
        </nav>

        <div class="container-fluid px-4 py-4">
            <!-- Fila 1: KPIs Compactos -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card module-card p-3 h-100">
                        <h6 class="text-muted small fw-semibold text-uppercase mb-2">Total Registrados</h6>
                        <div class="d-flex justify-content-between align-items-end mt-auto">
                            <h2 class="fw-bold mb-0 text-dark"><?= $total ?></h2>
                            <span class="text-success small fw-bold"><i class="fa-solid fa-arrow-up"></i> +12% vs mes anterior</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card module-card p-3 h-100">
                        <h6 class="text-muted small fw-semibold text-uppercase mb-2">Registros de Hoy</h6>
                        <div class="d-flex justify-content-between align-items-end mt-auto">
                            <h2 class="fw-bold mb-0 text-dark"><?= $hoy ?></h2>
                            <span class="text-muted small">Hoy</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card module-card p-3 h-100">
                        <h6 class="text-muted small fw-semibold text-uppercase mb-2">Registros del Mes</h6>
                        <div class="d-flex justify-content-between align-items-end mt-auto">
                            <h2 class="fw-bold mb-0 text-dark"><?= $mes ?></h2>
                            <span class="text-muted small">Este mes</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card module-card p-3 h-100">
                        <h6 class="text-muted small fw-semibold text-uppercase mb-2">Último Ingreso</h6>
                        <div class="d-flex justify-content-between align-items-end mt-auto">
                            <h5 class="fw-bold mb-0 text-dark text-truncate" style="max-width: 150px;" title="<?= $ultimo ? htmlspecialchars($ultimo['nombre_completo']) : 'Ninguno' ?>">
                                <?= $ultimo ? htmlspecialchars($ultimo['nombre_completo']) : 'Ninguno' ?>
                            </h5>
                            <span class="text-muted small"><i class="fa-regular fa-clock"></i> Reciente</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fila 2: Accesos Rápidos (Minimalistas) Movidos arriba -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card module-card p-4 h-100">
                        <div class="d-flex align-items-center mb-3">
                            <div class="p-3 bg-primary bg-opacity-10 rounded-circle text-primary me-3">
                                <i class="fa-solid fa-user-plus fa-lg"></i>
                            </div>
                            <h6 class="mb-0 fw-bold fs-5">Nuevo Registro</h6>
                        </div>
                        <a href="registro.php" class="btn btn-primary w-100 fw-semibold rounded-pill mt-auto">Ingresar Datos</a>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card module-card p-4 h-100">
                        <div class="d-flex align-items-center mb-3">
                            <div class="p-3 bg-success bg-opacity-10 rounded-circle text-success me-3">
                                <i class="fa-solid fa-table-list fa-lg"></i>
                            </div>
                            <h6 class="mb-0 fw-bold fs-5">Padrones</h6>
                        </div>
                        <div class="d-flex gap-2 mt-auto">
                            <a href="listado.php" class="btn btn-outline-success w-100 fw-semibold rounded-pill">Buscar · Filtrar</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card module-card p-4 h-100">
                        <div class="d-flex align-items-center mb-3">
                            <div class="p-3 bg-warning bg-opacity-10 rounded-circle text-warning me-3">
                                <i class="fa-solid fa-chart-pie fa-lg"></i>
                            </div>
                            <h6 class="mb-0 fw-bold fs-5">Reportes</h6>
                        </div>
                        <a href="reportes.php" class="btn btn-outline-warning text-dark w-100 fw-semibold rounded-pill mt-auto">Ver Estadísticas</a>
                    </div>
                </div>
            </div>

            <!-- Fila 3: Mapa Protagonista + Actividad Reciente -->
            <div class="row g-4 mb-4">
                <div class="col-lg-8">
                    <div class="card module-card h-100">
                        <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                            <h6 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-earth-americas me-2 text-primary"></i> Cobertura Territorial</h6>
                            <a href="mapa_general.php" class="btn btn-sm btn-outline-primary rounded-pill px-3">Abrir mapa completo</a>
                        </div>
                        <div class="card-body p-0">
                            <!-- Mapa Leaflet contenedor -->
                            <div id="dashboardMap" style="height: 350px; width: 100%; border-bottom-left-radius: var(--border-radius-custom); border-bottom-right-radius: var(--border-radius-custom);"></div>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="card module-card h-100">
                        <div class="card-header bg-white border-0 py-3">
                            <h6 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-bolt me-2 text-warning"></i> Estado Rápido</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between border-bottom py-3">
                                <div>
                                    <h6 class="mb-0 fw-bold">Predios Visitados</h6>
                                    <small class="text-muted">Levantamiento de campo</small>
                                </div>
                                <div class="text-end">
                                    <h5 class="mb-0 text-success fw-bold"><?= $total ?></h5>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between border-bottom py-3">
                                <div>
                                    <h6 class="mb-0 fw-bold">Registros Completados Hoy</h6>
                                    <small class="text-muted">Carga al sistema</small>
                                </div>
                                <div class="text-end">
                                    <h5 class="mb-0 text-primary fw-bold"><?= $hoy ?></h5>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between py-3">
                                <div>
                                    <h6 class="mb-0 fw-bold">Alertas del Sistema</h6>
                                    <small class="text-muted">Pendientes de revisión</small>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-danger rounded-pill px-3 py-2">3</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            </div>

        </div>
    </div>
    <!-- /#page-content-wrapper -->
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
        // Timeout para asegurar que el mapa se renderiza bien después de la animación del sidebar
        setTimeout(function(){ 
            if(window.dashboardMap) {
                window.dashboardMap.invalidateSize(); 
            }
        }, 350);
    }

    document.addEventListener("DOMContentLoaded", function() {
        // Inicializar mapa (Centrado en un punto de ejemplo, e.g. Lima -12.0464, -77.0428)
        window.dashboardMap = L.map('dashboardMap').setView([-12.0464, -77.0428], 11);
        
        // CartoDB Positron basemap for a clean look matching a premium SaaS
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19
        }).addTo(window.dashboardMap);

        // Marcador de ejemplo
        var marker = L.marker([-12.0464, -77.0428]).addTo(window.dashboardMap)
            .bindPopup('<b>GeoRegistro</b><br>Centro de operaciones.')
            .openPopup();
            
        setTimeout(function(){ window.dashboardMap.invalidateSize(); }, 300);
    });
</script>
</body>
</html>