<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador', 'Operador']);

$db = Conexion::getConexion();

// Garantizar que la variable de sesión contenga el ID del usuario
$idUsuarioLogueado = $_SESSION['usuario_id'] ?? null;

if (!$idUsuarioLogueado) {
    header("Location: auth/login.php");
    exit();
}

// FILTRO ESTRICTO: Cada usuario solo verá sus propios registros (independiente de su rol)
$sql = "SELECT p.*, u.nombre_completo AS registrador 
        FROM personas p 
        LEFT JOIN usuarios u ON p.usuario_registro_id = u.id 
        WHERE p.usuario_registro_id = ? 
        ORDER BY p.id DESC";

$stmt = $db->prepare($sql);
$stmt->execute([$idUsuarioLogueado]);
$personas = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Padrón y Filtros Avanzados</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/buttons/2.4.2/css/buttons.bootstrap5.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
</head>
<body class="bg-light">

<div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <?php include 'includes/sidebar.php'; ?>
    
    <!-- Page Content -->
    <div id="page-content-wrapper" class="w-100">
        <div class="container-fluid py-4 px-4 px-lg-5">
            
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-primary d-md-none me-3 border-0" onclick="toggleMobileMenu()">
                        <i class="fa-solid fa-bars fs-5"></i>
                    </button>
                    <h4 class="mb-0 fw-bold text-dark"><i class="fa-solid fa-table-list text-primary me-2"></i>Mis Registros</h4>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm me-2" data-bs-toggle="modal" data-bs-target="#perfilModal">
                        <i class="fa-solid fa-user-gear me-1"></i> Mi Perfil
                    </button>
                    <a href="reportes.php" class="btn btn-primary btn-sm"><i class="fa-solid fa-chart-pie me-1"></i> Ver Reportes</a>
                </div>
            </div>

            <div class="card border-0 shadow-sm module-card mb-4">
                <div class="card-body p-4">
                    <h6 class="text-muted fw-bold mb-3 small text-uppercase"><i class="fa-solid fa-filter me-2"></i>Filtros Avanzados (<?= htmlspecialchars($_SESSION['rol'] ?? 'Operador') ?>)</h6>
                    <div class="row g-3">
                        <div class="col-12 col-md-4">
                            <label class="form-label small fw-bold text-muted">Desde la Fecha:</label>
                            <input type="date" id="fechaDesde" class="form-control bg-light border-0">
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label small fw-bold text-muted">Hasta la Fecha:</label>
                            <input type="date" id="fechaHasta" class="form-control bg-light border-0">
                        </div>
                        <div class="col-12 col-md-4 d-flex align-items-end">
                            <button type="button" id="btnLimpiarFiltros" class="btn btn-light w-100 fw-bold text-muted border"><i class="fa-solid fa-eraser me-1"></i> Limpiar Filtros</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm module-card">
                <div class="card-body p-4">
                    <div class="table-responsive">
                        <table id="tablaPersonas" class="table table-hover align-middle w-100 border-0">
                            <thead class="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th class="text-center rounded-start border-0" style="width: 5%;">N°</th>
                                    <th class="border-0">Nombre Completo</th>
                                    <th class="border-0">DNI</th>
                                    <th class="border-0">Celular</th>
                                    <th class="border-0">Ubicación (Distrito)</th>
                                    <th class="border-0">Foto</th>
                                    <th class="border-0">Fecha Reg.</th>
                                    <th class="text-center rounded-end border-0">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="border-top-0">
                                <?php 
                                $item = 1;
                                foreach ($personas as $p): 
                                ?>
                                <tr id="fila-<?= $p['id'] ?>">
                                    <td class="text-center fw-bold text-muted"><?= $item++; ?></td>
                                    <td class="fw-bold text-dark"><?= htmlspecialchars($p['nombre_completo']) ?></td>
                                    <td><span class="badge bg-light text-dark border px-2 py-1 fs-6"><?= htmlspecialchars($p['dni']) ?></span></td>
                                    <td class="text-muted"><?= htmlspecialchars($p['celular']) ?></td>
                                    <td class="text-muted"><?= htmlspecialchars($p['distrito']) ?> (<?= htmlspecialchars($p['departamento']) ?>)</td>
                                    <td class="text-center">
                                        <?php if (!empty($p['foto_domicilio']) && file_exists('assets/uploads/' . $p['foto_domicilio'])): ?>
                                            <img src="assets/uploads/<?= htmlspecialchars($p['foto_domicilio']) ?>" 
                                                 class="img-thumbnail btn-ver-foto border-0 shadow-sm" 
                                                 data-foto="assets/uploads/<?= htmlspecialchars($p['foto_domicilio']) ?>"
                                                 style="width: 45px; height: 45px; object-fit: cover; cursor: pointer; border-radius: 8px;"
                                                 alt="Miniatura">
                                        <?php else: ?>
                                            <span class="text-muted small"><i class="fa-solid fa-image-slash"></i></span>
                                        <?php endif; ?>
                                    </td>
                                    <td data-order="<?= $p['fecha_registro'] ?>" class="small text-muted">
                                        <?= date('d/m/Y H:i', strtotime($p['fecha_registro'])) ?>
                                    </td>
                                    <td class="text-center">
                                        <div class="btn-group" role="group">
                                            <a href="https://maps.google.com/?q=<?= $p['latitud'] ?>,<?= $p['longitud'] ?>" target="_blank" class="btn btn-sm btn-light border text-primary" title="Ver en Google Maps"><i class="fa-solid fa-map-pin"></i></a>
                                            <a href="registro.php?id=<?= $p['id'] ?>" class="btn btn-sm btn-light border text-warning" title="Editar"><i class="fa-solid fa-pen-to-square"></i></a>
                                            <button type="button" class="btn btn-sm btn-light border text-danger btn-eliminar" data-id="<?= $p['id'] ?>" data-nombre="<?= htmlspecialchars($p['nombre_completo']) ?>" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                                        </div>
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

    <!-- MODAL DE VISUALIZACIÓN DE FOTO EN TAMAÑO REAL -->
    <div class="modal fade" id="fotoModal" tabindex="-1" aria-labelledby="fotoModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" style="background-color: rgba(255,255,255,0.98); border-radius: 12px;">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-dark" id="fotoModalLabel"><i class="fa-solid fa-image text-primary me-2"></i>Visualización del Predio</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-2 pb-4">
            <img id="fotoGrande" src="" alt="Foto en grande" class="img-fluid rounded shadow-sm" style="max-height: 70vh; object-fit: contain; width: 100%;">
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE CAMBIO DE CONTRASEÑA -->
    <div class="modal fade" id="perfilModal" tabindex="-1" aria-labelledby="perfilModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-0 pb-0">
            <h5 class="modal-title fw-bold text-dark" id="perfilModalLabel"><i class="fa-solid fa-user-shield text-primary me-2"></i>Seguridad de la Cuenta</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="formCambiarClave">
              <div class="modal-body">
                  <div class="mb-3">
                      <label class="form-label fw-bold text-muted small">Nombre de Usuario Actual</label>
                      <input type="text" class="form-control bg-light border-0" value="<?= htmlspecialchars($_SESSION['username'] ?? $_SESSION['nombre'] ?? '') ?>" disabled>
                  </div>
                  <div class="mb-3">
                      <label class="form-label fw-bold text-muted small">Nueva Contraseña *</label>
                      <input type="password" name="password_nueva" id="password_nueva" class="form-control bg-light border-0" required placeholder="Mínimo 6 caracteres" minlength="6">
                  </div>
              </div>
              <div class="modal-footer border-0 pt-0">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary fw-bold"><i class="fa-solid fa-key me-1"></i> Actualizar</button>
              </div>
          </form>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
    <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.bootstrap5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.html5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.print.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('collapsed');
        }

        $(document).ready(function() {
            var table = $('#tablaPersonas').DataTable({
                dom: 'Bfrtip',
                buttons: [
                    { extend: 'excelHtml5', text: '<i class="fa-solid fa-file-excel me-1"></i> Excel', className: 'btn btn-light border btn-sm text-success fw-bold me-1' },
                    { extend: 'pdfHtml5', text: '<i class="fa-solid fa-file-pdf me-1"></i> PDF', className: 'btn btn-light border btn-sm text-danger fw-bold me-1' },
                    { extend: 'print', text: '<i class="fa-solid fa-print me-1"></i> Imprimir', className: 'btn btn-light border btn-sm text-dark fw-bold' }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
                order: [[ 6, 'desc' ]]
            });

            // FILTRO AVANZADO DE RANGOS DE FECHA
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    var desde = $('#fechaDesde').val();
                    var hasta = $('#fechaHasta').val();
                    
                    var cellNode = table.cell(dataIndex, 6).node();
                    var fechaRowStr = $(cellNode).attr('data-order');
                    
                    if (!fechaRowStr) return true;
                    var fechaRow = fechaRowStr.substring(0, 10);

                    if ((desde === "" && hasta === "") ||
                        (desde === "" && fechaRow <= hasta) ||
                        (desde <= fechaRow && hasta === "") ||
                        (desde <= fechaRow && fechaRow <= hasta)) {
                        return true;
                    }
                    return false;
                }
            );

            $('#fechaDesde, #fechaHasta').on('change', function() {
                table.draw();
            });

            $('#btnLimpiarFiltros').on('click', function() {
                $('#fechaDesde').val('');
                $('#fechaHasta').val('');
                table.draw();
            });

            // Visualización dinámica de la foto
            $('#tablaPersonas').on('click', '.btn-ver-foto', function() {
                var srcFoto = $(this).attr('data-foto');
                $('#fotoGrande').attr('src', srcFoto);
                var miModal = new bootstrap.Modal(document.getElementById('fotoModal'));
                miModal.show();
            });

            // Cambio de clave de usuario vía AJAX
            $('#formCambiarClave').on('submit', function(e) {
                e.preventDefault();
                $.ajax({
                    url: 'cambiar_clave.php',
                    type: 'POST',
                    data: $(this).serialize(),
                    dataType: 'json',
                    success: function(response) {
                        if (response.status === 'success') {
                            Swal.fire('¡Éxito!', response.message, 'success').then(() => {
                                $('#formCambiarClave')[0].reset();
                                bootstrap.Modal.getInstance(document.getElementById('perfilModal')).hide();
                            });
                        } else {
                            Swal.fire('Error', response.message, 'error');
                        }
                    },
                    error: function() {
                        Swal.fire('Error', 'Hubo un fallo de comunicación con el servidor.', 'error');
                    }
                });
            });

            // Eliminar registro vía AJAX
            $('#tablaPersonas').on('click', '.btn-eliminar', function() {
                var id = $(this).data('id');
                var nombre = $(this).data('nombre');
                var fila = $(this).closest('tr');

                Swal.fire({
                    title: '¿Está seguro de eliminar?',
                    text: "Se eliminará permanentemente a: " + nombre,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: '<i class="fa-solid fa-trash me-1"></i> Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        $.ajax({
                            url: 'eliminar.php',
                            type: 'POST',
                            data: { id: id },
                            dataType: 'json',
                            success: function(response) {
                                if (response.status === 'success') {
                                    Swal.fire({ title: '¡Eliminado!', text: response.message, icon: 'success', timer: 2000, showConfirmButton: false });
                                    table.row(fila).remove().draw(false);
                                } else {
                                    Swal.fire('Error', response.message, 'error');
                                }
                            },
                            error: function() { Swal.fire('Error', 'No se pudo procesar la solicitud en el servidor.', 'error'); }
                        });
                    }
                });
            });
        });
    </script>
</body>
</html>