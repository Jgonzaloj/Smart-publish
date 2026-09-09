<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador', 'Operador']);

// Ya no cargamos todos los predios de golpe.
// Dejamos una variable base para inicialización.
$total_predios = 0;
$db = Conexion::getConexion();
if ($_SESSION['rol'] === 'Administrador') {
    $total_predios = $db->query("SELECT COUNT(*) FROM personas WHERE latitud IS NOT NULL")->fetchColumn();
} else {
    $stmt = $db->prepare("SELECT COUNT(*) FROM personas WHERE usuario_registro_id = ? AND latitud IS NOT NULL");
    $stmt->execute([$_SESSION['usuario_id']]);
    $total_predios = $stmt->fetchColumn();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa General de Predios | Sistema Catastral</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .popup-foto {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: transform 0.2s ease-in-out;
        }
        .popup-foto:hover {
            transform: scale(1.02);
            filter: brightness(0.95);
        }
    </style>
</head>
<body class="bg-light">

<div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <?php include 'includes/sidebar.php'; ?>
    
    <!-- Page Content -->
    <div id="page-content-wrapper" class="w-100 d-flex flex-column" style="height: 100vh; overflow: hidden;">
        <div class="container-fluid py-4 px-4 px-lg-5 flex-grow-1 d-flex flex-column">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-primary d-md-none me-3 border-0" onclick="toggleMobileMenu()">
                        <i class="fa-solid fa-bars fs-5"></i>
                    </button>
                    <div>
                        <h4 class="fw-bold text-dark mb-1"><i class="fa-solid fa-map-location-dot text-primary me-2"></i> Cobertura Catastral en Vivo</h4>
                        <p class="text-muted small mb-0">Vista geográfica de todos los predios empadronados</p>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fs-6 me-2 px-3 py-2 rounded-pill" id="badgeTotalMapeados">
                        Cargando...
                    </span>
                    <a href="listado.php" class="btn btn-outline-secondary fw-bold btn-sm"><i class="fa-solid fa-table-list me-1"></i> Ver Tabla</a>
                </div>
            </div>

            <div class="card module-card border-0 flex-grow-1 d-flex flex-column overflow-hidden">
                <div class="card-body p-2 d-flex flex-column h-100">
                    <div id="mapaGeneral" class="flex-grow-1" style="border-radius: 12px; min-height: 50vh;"></div>
                </div>
            </div>
        </div>
    </div>
</div>

    <!-- MODAL PARA VISUALIZACIÓN DE FOTO EN TAMAÑO COMPLETO -->
    <div class="modal fade" id="modalFotoGrande" tabindex="-1" aria-labelledby="modalFotoGrandeLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg" style="background-color: rgba(255,255,255,0.98); border-radius: 12px;">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold text-dark" id="modalFotoGrandeLabel">
                <i class="fa-solid fa-house text-primary me-2"></i> Fotografía del Domicilio
            </h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-2 pb-4">
            <img id="imgFotoModal" src="" alt="Vista ampliada" class="img-fluid rounded shadow-sm" style="max-height: 75vh; object-fit: contain; width: 100%;">
          </div>
        </div>
      </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('collapsed');
            setTimeout(function(){ 
                if(window.map) window.map.invalidateSize(); 
            }, 350);
        }

        // Función global para abrir la imagen ampliada en el modal
        function abrirModalFoto(url) {
            $('#imgFotoModal').attr('src', url);
            var modal = new bootstrap.Modal(document.getElementById('modalFotoGrande'));
            modal.show();
        }

        $(document).ready(function() {
            window.map = L.map('mapaGeneral').setView([-14.0678, -75.7286], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© Inversiones Vawi - Sistema Catastral'
            }).addTo(window.map);

            const markers = L.markerClusterGroup({
                chunkedLoading: true // Optimiza carga masiva
            });
            window.map.addLayer(markers);

            // Variable para almacenar el total estático
            const totalPrediosGlobal = <?= json_encode($total_predios) ?>;

            function cargarMarcadores() {
                const bounds = window.map.getBounds();
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();

                $.ajax({
                    url: 'api/get_markers.php',
                    type: 'GET',
                    data: {
                        ne_lat: ne.lat,
                        ne_lng: ne.lng,
                        sw_lat: sw.lat,
                        sw_lng: sw.lng
                    },
                    dataType: 'json',
                    success: function(response) {
                        if(response.status === 'success') {
                            markers.clearLayers(); // Limpiar marcadores anteriores
                            const predios = response.data;
                            
                            // Actualizar badge superior
                            $('#badgeTotalMapeados').html(`${predios.length} Predios en esta zona (Total: ${totalPrediosGlobal})`);

                            const newMarkers = [];
                            predios.forEach(p => {
                                const lat = parseFloat(p.latitud);
                                const lng = parseFloat(p.longitud);

                                let fotoUrl = 'assets/img/sin-foto.jpg';
                                if (p.foto_domicilio) {
                                    fotoUrl = p.foto_domicilio.startsWith('http') ? p.foto_domicilio : `assets/uploads/${p.foto_domicilio}`;
                                }

                                const popupHTML = `
                                    <div style="width: 210px;" class="text-center">
                                        <img src="${fotoUrl}" 
                                             class="popup-foto shadow-sm" 
                                             alt="Foto predio" 
                                             title="Haz clic para ver en grande 🔍"
                                             onclick="abrirModalFoto('${fotoUrl}')"
                                             onerror="this.src='https://via.placeholder.com/200x110?text=Sin+Foto'">
                                        <h6 class="fw-bold mb-1 text-dark" style="font-size:14px;">${p.nombre_completo}</h6>
                                        <p class="mb-1 text-muted small"><i class="fa-solid fa-id-card me-1"></i><b>DNI:</b> ${p.dni}</p>
                                        <p class="mb-1 text-muted small"><i class="fa-solid fa-location-dot me-1"></i>${p.distrito}</p>
                                        <p class="mb-2 text-muted small text-truncate"><i class="fa-solid fa-house me-1"></i>${p.direccion}</p>
                                        <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="btn btn-primary btn-sm w-100 text-white fw-bold" style="font-size:11px;">
                                            <i class="fa-solid fa-diamond-turn-right me-1"></i> Ir con GPS
                                        </a>
                                    </div>
                                `;

                                const marker = L.marker([lat, lng]).bindPopup(popupHTML);
                                newMarkers.push(marker);
                            });
                            
                            markers.addLayers(newMarkers);
                        }
                    },
                    error: function() {
                        console.error('Error al cargar los marcadores');
                    }
                });
            }

            // Eventos del mapa
            window.map.on('moveend', cargarMarcadores); // Se dispara al mover o hacer zoom
            
            // Carga inicial
            cargarMarcadores();
        });
    </script>
</body>
</html>