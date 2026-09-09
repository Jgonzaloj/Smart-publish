<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador', 'Operador']);

$db = Conexion::getConexion();

// 1. Consulta: Total de registros agrupados por Distrito
$query_distritos = $db->query("SELECT distrito, COUNT(*) as total FROM personas GROUP BY distrito ORDER BY total DESC")->fetchAll();
$labels_distritos = [];
$data_distritos = [];
foreach ($query_distritos as $rd) {
    $labels_distritos[] = $rd['distrito'];
    $data_distritos[] = (int)$rd['total'];
}

// 2. Consulta: Total de registros agrupados por el usuario que los registró
$query_usuarios = $db->query("SELECT u.nombre_completo, COUNT(*) as total FROM personas p JOIN usuarios u ON p.usuario_registro_id = u.id GROUP BY p.usuario_registro_id ORDER BY total DESC")->fetchAll();
$labels_usuarios = [];
$data_usuarios = [];
foreach ($query_usuarios as $ru) {
    $labels_usuarios[] = $ru['nombre_completo'];
    $data_usuarios[] = (int)$ru['total'];
}

// 3. Métricas rápidas generales
$total_registros = $db->query("SELECT COUNT(*) FROM personas")->fetchColumn();
$total_distritos = $db->query("SELECT COUNT(DISTINCT distrito) FROM personas")->fetchColumn();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Reportes Avanzados</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
</head>
<body class="bg-light">

<div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <?php include 'includes/sidebar.php'; ?>
    
    <!-- Page Content -->
    <div id="page-content-wrapper" class="w-100">
        <div class="container-fluid py-4 px-4 px-lg-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-primary d-md-none me-3 border-0" onclick="toggleMobileMenu()">
                        <i class="fa-solid fa-bars fs-5"></i>
                    </button>
                    <div>
                        <h4 class="fw-bold text-dark mb-1"><i class="fa-solid fa-chart-line text-primary me-2"></i> Reportes Estadísticos</h4>
                        <p class="text-muted small mb-0">Métricas dinámicas del Sistema Catastral de Inversiones Vawi</p>
                    </div>
                </div>
                <a href="listado.php" class="btn btn-outline-secondary btn-sm fw-bold"><i class="fa-solid fa-arrow-left me-1"></i> Volver al Padrón</a>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card module-card border-0 p-4 bg-white d-flex flex-row align-items-center justify-content-between h-100">
                        <div>
                            <h6 class="text-muted small fw-bold text-uppercase mb-2">Total General Registros</h6>
                            <h2 class="fw-bold text-dark mb-0"><?= $total_registros ?></h2>
                        </div>
                        <div class="bg-primary bg-opacity-10 text-primary p-3 rounded-4 fs-3">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card module-card border-0 p-4 bg-white d-flex flex-row align-items-center justify-content-between h-100">
                        <div>
                            <h6 class="text-muted small fw-bold text-uppercase mb-2">Sectores / Distritos Atendidos</h6>
                            <h2 class="fw-bold text-dark mb-0"><?= $total_distritos ?></h2>
                        </div>
                        <div class="bg-primary bg-opacity-10 text-primary p-3 rounded-4 fs-3">
                            <i class="fa-solid fa-map-location-dot"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-12 col-lg-6">
                    <div class="card module-card border-0 bg-white h-100">
                        <div class="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                            <h6 class="fw-bold text-dark mb-0"><i class="fa-solid fa-chart-bar text-primary me-2"></i> Censo de Registros por Distrito</h6>
                        </div>
                        <div class="card-body p-4 d-flex align-items-center justify-content-center">
                            <div style="position: relative; width: 100%; height: 320px;">
                                <canvas id="chartDistritos"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-6">
                    <div class="card module-card border-0 bg-white h-100">
                        <div class="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                            <h6 class="fw-bold text-dark mb-0"><i class="fa-solid fa-chart-pie text-warning me-2"></i> Productividad por Registrador</h6>
                        </div>
                        <div class="card-body p-4 d-flex align-items-center justify-content-center">
                            <div style="position: relative; width: 100%; height: 320px;">
                                <canvas id="chartUsuarios"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script>
        // Configuración Gráfico de Distritos (Barras)
        const ctxDistritos = document.getElementById('chartDistritos').getContext('2d');
        new Chart(ctxDistritos, {
            type: 'bar',
            data: {
                labels: <?= json_encode($labels_distritos) ?>,
                datasets: [{
                    label: 'Cantidad de Predios',
                    data: <?= json_encode($data_distritos) ?>,
                    backgroundColor: 'rgba(13, 110, 253, 0.75)',
                    borderColor: 'rgb(13, 110, 253)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });

        // Configuración Gráfico de Usuarios (Doughnut / Rosca)
        const ctxUsuarios = document.getElementById('chartUsuarios').getContext('2d');
        new Chart(ctxUsuarios, {
            type: 'doughnut',
            data: {
                labels: <?= json_encode($labels_usuarios) ?>,
                datasets: [{
                    data: <?= json_encode($data_usuarios) ?>,
                    backgroundColor: [
                        'rgba(25, 135, 84, 0.75)',
                        'rgba(255, 193, 7, 0.75)',
                        'rgba(220, 53, 69, 0.75)',
                        'rgba(13, 202, 240, 0.75)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    </script>
</body>
</html>