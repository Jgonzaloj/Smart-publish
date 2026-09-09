<?php
require_once 'config/conexion.php';
verificar_rol(['Administrador', 'Operador']);

// Función auxiliar para escaping HTML (Mitigación XSS)
function e($string) {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

// Verificar si es edición
$persona = null;
if (isset($_GET['id'])) {
    $stmt = Conexion::getConexion()->prepare("SELECT * FROM personas WHERE id = ?");
    $stmt->execute([filter_var($_GET['id'], FILTER_VALIDATE_INT)]);
    $persona = $stmt->fetch();
}

// Traer coordenadas existentes filtrando según el rol del usuario
$db = Conexion::getConexion();
$userId = $_SESSION['usuario_id'] ?? null;
$rolUsuario = $_SESSION['rol'] ?? 'Operador';

if ($rolUsuario === 'Administrador') {
    $sql_coordenadas = "SELECT id, nombre_completo, latitud, longitud FROM personas WHERE latitud IS NOT NULL AND longitud IS NOT NULL";
    $stmt_coords = $db->prepare($sql_coordenadas);
    $stmt_coords->execute();
} else {
    $sql_coordenadas = "SELECT id, nombre_completo, latitud, longitud FROM personas WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND usuario_registro_id = ?";
    $stmt_coords = $db->prepare($sql_coordenadas);
    $stmt_coords->execute([$userId]);
}

$predios_guardados = $stmt_coords->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $persona ? 'Editar' : 'Registrar' ?> Persona | Sistema Catastral</title>
    
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0d6efd">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link href="assets/css/custom.css?v=<?= time() ?>" rel="stylesheet">
</head>
<body class="bg-light">

<div class="d-flex" id="wrapper">
    <!-- Sidebar -->
    <?php include 'includes/sidebar.php'; ?>
    
    <div id="page-content-wrapper" class="w-100">
        <div class="container-fluid py-4 px-4 px-lg-5">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                <div class="d-flex flex-wrap align-items-center gap-2">
                    <button class="btn btn-outline-primary d-md-none border-0" onclick="toggleMobileMenu()">
                        <i class="fa-solid fa-bars fs-5"></i>
                    </button>
                    <h4 class="mb-0 fw-bold text-dark me-2">
                        <i class="fa-solid fa-user-plus text-primary me-2"></i><?= $persona ? 'Modificar Registro Existente' : 'Alta de Personas' ?>
                    </h4>
                    <div id="statusRed" class="badge rounded-pill bg-success fw-normal px-3 py-2 shadow-sm border border-success border-opacity-25 mt-2 mt-md-0">
                        <i class="fa-solid fa-wifi me-1"></i> Conectado a Internet (Sincronización Activa)
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button type="button" id="btnInstalarPWA" class="btn btn-warning fw-bold d-none">
                        <i class="fa-solid fa-download me-1"></i> Instalar App
                    </button>
                    <button type="button" id="btnSincronizarManual" class="btn btn-white fw-bold text-dark d-none border shadow-sm">
                        <i class="fa-solid fa-rotate me-1"></i> Sincronizar (<span id="countPendientes">0</span>)
                    </button>
                </div>
            </div>

            <div class="card module-card border-0">
                <div class="card-body p-4 p-lg-5">
                    <form id="formPersona" enctype="multipart/form-data">
                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token'] ?? '') ?>">
                        <?php if ($persona): ?>
                            <input type="hidden" name="id" value="<?= e($persona['id']) ?>">
                        <?php endif; ?>

                        <div class="row g-4">
                            <div class="col-md-6">
                                <h6 class="text-primary border-bottom pb-2"><i class="fa-solid fa-id-card me-2"></i>Información Personal</h6>
                                
                                <div class="mb-3">
                                    <label class="form-label text-muted small fw-bold">Nombre Completo *</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="nombre_completo" name="nombre_completo" required value="<?= e($persona['nombre_completo'] ?? '') ?>">
                                        <button type="button" class="btn btn-outline-secondary btn-dictar" data-target="nombre_completo" title="Dictar por voz">
                                            <i class="fa-solid fa-microphone"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted small fw-bold">DNI *</label>
                                        <input type="text" class="form-control" name="dni" maxlength="8" minlength="8" required value="<?= e($persona['dni'] ?? '') ?>">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label text-muted small fw-bold">N° Celular *</label>
                                        <input type="text" class="form-control" name="celular" maxlength="9" minlength="9" required value="<?= e($persona['celular'] ?? '') ?>">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label text-muted small fw-bold">Correo Electrónico (Opcional)</label>
                                    <input type="email" class="form-control" name="correo" value="<?= e($persona['correo'] ?? '') ?>">
                                </div>

                                <h6 class="text-primary border-bottom pb-2 mt-4"><i class="fa-solid fa-house-user me-2"></i>Ubicación Política</h6>
                                <div class="row">
                                    <div class="col-md-4 mb-3"><label class="form-label text-muted small fw-bold">Dep. *</label><input type="text" class="form-control" name="departamento" required value="<?= e($persona['departamento'] ?? 'Ica') ?>"></div>
                                    <div class="col-md-4 mb-3"><label class="form-label text-muted small fw-bold">Prov. *</label><input type="text" class="form-control" name="provincia" required value="<?= e($persona['provincia'] ?? 'Ica') ?>"></div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label text-muted small fw-bold">Dist. *</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" id="distrito" name="distrito" required value="<?= e($persona['distrito'] ?? '') ?>">
                                            <button type="button" class="btn btn-outline-secondary btn-dictar" data-target="distrito" title="Dictar por voz">
                                                <i class="fa-solid fa-microphone"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label text-muted small fw-bold">Dirección Completa *</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="direccion" name="direccion" required value="<?= e($persona['direccion'] ?? '') ?>">
                                        <button type="button" class="btn btn-outline-secondary btn-dictar" data-target="direccion" title="Dictar por voz">
                                            <i class="fa-solid fa-microphone"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label text-muted small fw-bold">Referencia Detallada *</label>
                                    <div class="input-group">
                                        <textarea class="form-control" id="referencia" name="referencia" rows="2" required><?= e($persona['referencia'] ?? '') ?></textarea>
                                        <button type="button" class="btn btn-outline-secondary btn-dictar" data-target="referencia" title="Dictar por voz">
                                            <i class="fa-solid fa-microphone"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <h6 class="text-primary border-bottom pb-2"><i class="fa-solid fa-map-location-dot me-2"></i>Geolocalización Referencial</h6>
                                <div class="d-flex gap-2 mb-2">
                                    <button type="button" class="btn btn-secondary btn-sm" id="btnGPS"><i class="fa-solid fa-location-crosshairs"></i> Obtener Ubicación GPS Actual</button>
                                </div>
                                <div id="map" class="rounded border mb-3" style="height: 250px;"></div>
                                
                                <div class="row">
                                    <div class="col-6 mb-3">
                                        <label class="form-label text-muted small fw-bold">Latitud</label>
                                        <input type="text" class="form-control" id="latitud" name="latitud" readonly value="<?= e($persona['latitud'] ?? '') ?>">
                                    </div>
                                    <div class="col-6 mb-3">
                                        <label class="form-label text-muted small fw-bold">Longitud</label>
                                        <input type="text" class="form-control" id="longitud" name="longitud" readonly value="<?= e($persona['longitud'] ?? '') ?>">
                                    </div>
                                </div>

                                <h6 class="text-primary border-bottom pb-2 mt-2"><i class="fa-solid fa-camera me-2"></i>Fotografía del Inmueble</h6>
                                <div class="dropzone-area p-3 border border-dashed rounded text-center bg-white mb-3" id="dropzone">
                                    <i class="fa-solid fa-cloud-arrow-up text-muted display-6 mb-2"></i>
                                    <p class="small text-muted mb-1">Arrastre o seleccione archivo (JPG, PNG, WEBP)</p>
                                    <input type="file" id="foto_domicilio" name="foto_domicilio" class="d-none" accept="image/*">
                                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="document.getElementById('foto_domicilio').click()">Examinar</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" id="btnCamara"><i class="fa-solid fa-camera"></i> Activar Cámara</button>
                                </div>
                                <div class="text-center">
                                    <video id="video" class="d-none border rounded mb-2 w-100" autoplay style="max-height: 200px;"></video>
                                    <button type="button" class="btn btn-danger btn-sm d-none mb-2" id="btnCapturar">Capturar Foto</button>
                                    <canvas id="canvas" class="d-none"></canvas>
                                    <div id="previewContainer">
                                        <?php if ($persona && !empty($persona['foto_domicilio'])): ?>
                                            <img src="assets/uploads/<?= e($persona['foto_domicilio']) ?>" class="img-thumbnail" style="max-height: 120px;">
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="text-end border-top pt-4 mt-4">
                            <button type="reset" class="btn btn-light px-4 me-2">Limpiar</button>
                            <button type="submit" class="btn btn-primary px-5"><i class="fa-solid fa-floppy-disk me-2"></i>Guardar Registro</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://code.jquery.com/jquery-3.7.0.js"></script>
<script src="assets/js/mapa.js"></script>
<script src="assets/js/main.js"></script>

<script>
    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
        setTimeout(function(){ 
            if(window.map) window.map.invalidateSize(); 
        }, 350);
    }
</script>

<script>
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('PWA Service Worker registrado:', reg.scope))
            .catch(err => console.warn('Error al registrar Service Worker:', err));
    });
}

let deferredPrompt;
const btnInstalar = document.getElementById('btnInstalarPWA');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstalar) {
        btnInstalar.classList.remove('d-none');
    }
});

if (btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            btnInstalar.classList.add('d-none');
        }
    });
}
</script>

<script>
let dbOffline;

const request = indexedDB.open("CatastroVawiOfflineDB", 1);

request.onupgradeneeded = function(e) {
    dbOffline = e.target.result;
    if (!dbOffline.objectStoreNames.contains("registros_pendientes")) {
        dbOffline.createObjectStore("registros_pendientes", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = function(e) {
    dbOffline = e.target.result;
    comprobarPendientes();
};

function actualizarEstadoRed() {
    const statusDiv = $('#statusRed');
    if (navigator.onLine) {
        statusDiv.removeClass('bg-warning text-dark').addClass('bg-success text-white')
                 .html('<i class="fa-solid fa-wifi me-1"></i> Conectado a Internet (Sincronización Activa)');
        sincronizarDatosPendientes();
    } else {
        statusDiv.removeClass('bg-success text-white').addClass('bg-warning text-dark')
                 .html('<i class="fa-solid fa-plane me-1"></i> Modo Offline Activo (Los datos se guardarán localmente)');
    }
}

window.addEventListener('online', actualizarEstadoRed);
window.addEventListener('offline', actualizarEstadoRed);
$(document).ready(actualizarEstadoRed);

// SUBMIT CORREGIDO SIN "ERROR OPERACIONAL"
$('#formPersona').on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    if (!navigator.onLine) {
        guardarEnIndexedDB(formData);
    } else {
        $.ajax({
            url: 'guardar.php',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            success: function(response) {
                if (response && response.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Guardado Exitoso!',
                        text: response.message,
                        confirmButtonColor: '#0d6efd'
                    }).then(() => location.reload());
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Validación del Registro',
                        text: response ? response.message : 'Atención con los datos ingresados.',
                        confirmButtonColor: '#0d6efd'
                    });
                }
            },
            error: function(jqXHR) {
                let resJson = null;
                try {
                    resJson = JSON.parse(jqXHR.responseText);
                } catch (err) {
                    resJson = null;
                }

                if (resJson && resJson.message) {
                    // Muestra la alerta de advertencia con el mensaje exacto del backend
                    Swal.fire({
                        icon: 'warning',
                        title: 'Validación del Registro',
                        text: resJson.message,
                        confirmButtonColor: '#0d6efd'
                    });
                } else if (!navigator.onLine) {
                    guardarEnIndexedDB(formData);
                } else {
                    console.error("Respuesta cruda del servidor:", jqXHR.responseText);
                    Swal.fire({
                        icon: 'error',
                        title: 'Detalle del Servidor',
                        text: jqXHR.responseText ? jqXHR.responseText.substring(0, 150) : 'No se pudo conectar con el servidor.',
                        confirmButtonColor: '#0d6efd'
                    });
                }
            }
        });
    }
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
        reader.onerror = error => reject(error);
    });
}

function base64ToFile(base64Data, filename, contentType) {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: contentType || mime });
}

async function guardarEnIndexedDB(formData) {
    const objetoGuardar = {};
    
    for (let [key, value] of formData.entries()) {
        if (key === 'foto_domicilio' && value instanceof File && value.size > 0) {
            objetoGuardar[key] = await fileToBase64(value);
        } else {
            objetoGuardar[key] = value;
        }
    }
    objetoGuardar['fecha_captura_local'] = new Date().toLocaleString();

    const transaction = dbOffline.transaction(["registros_pendientes"], "readwrite");
    const store = transaction.objectStore("registros_pendientes");
    store.add(objetoGuardar);

    transaction.oncomplete = function() {
        Swal.fire({
            icon: 'info',
            title: '¡Guardado Localmente!',
            text: 'Te encuentras sin señal. El registro se ha almacenado de forma segura en tu teléfono y se enviará al servidor automáticamente al recuperar internet.',
            confirmButtonColor: '#ffc107',
            confirmButtonText: 'Entendido'
        }).then(() => {
            $('#formPersona')[0].reset();
            comprobarPendientes();
        });
    };
}

function comprobarPendientes() {
    if (!dbOffline) return;
    const transaction = dbOffline.transaction(["registros_pendientes"], "readonly");
    const store = transaction.objectStore("registros_pendientes");
    const countRequest = store.count();

    countRequest.onsuccess = function() {
        const count = countRequest.result;
        if (count > 0) {
            $('#countPendientes').text(count);
            $('#btnSincronizarManual').removeClass('d-none');
        } else {
            $('#btnSincronizarManual').addClass('d-none');
        }
    };
}

function sincronizarDatosPendientes() {
    if (!dbOffline || !navigator.onLine) return;

    const transaction = dbOffline.transaction(["registros_pendientes"], "readonly");
    const store = transaction.objectStore("registros_pendientes");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = function() {
        const pendientes = getAllRequest.result;
        if (pendientes.length === 0) return;

        let enviados = 0;
        pendientes.forEach(item => {
            const formData = new FormData();
            for (let key in item) {
                if (key !== 'id' && key !== 'fecha_captura_local') {
                    if (key === 'foto_domicilio' && item[key] && item[key].data) {
                        const file = base64ToFile(item[key].data, item[key].name, item[key].type);
                        formData.append(key, file);
                    } else {
                        formData.append(key, item[key]);
                    }
                }
            }

            $.ajax({
                url: 'guardar.php',
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                dataType: 'json',
                success: function(response) {
                    if (response && response.status === 'success') {
                        const delTransaction = dbOffline.transaction(["registros_pendientes"], "readwrite");
                        const delStore = delTransaction.objectStore("registros_pendientes");
                        delStore.delete(item.id);
                        
                        enviados++;
                        comprobarPendientes();

                        if (enviados === pendientes.length) {
                            Swal.fire('¡Sincronización Exitosa!', `Se han subido ${enviados} registros pendientes al servidor automáticamente.`, 'success');
                        }
                    }
                }
            });
        });
    };
}

$('#btnSincronizarManual').on('click', sincronizarDatosPendientes);
</script>

<script>
$(document).ready(function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        $('.btn-dictar').addClass('d-none');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = false;

    let targetInputId = null;
    let currentBtn = null;

    $('.btn-dictar').on('click', function() {
        targetInputId = $(this).data('target');
        currentBtn = $(this);

        if (currentBtn.hasClass('btn-danger')) {
            recognition.stop();
            return;
        }

        $('.btn-dictar').removeClass('btn-danger text-white').addClass('btn-outline-secondary');
        currentBtn.removeClass('btn-outline-secondary').addClass('btn-danger text-white');
        
        try {
            recognition.start();
        } catch (err) {
            recognition.stop();
        }
    });

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        const targetInput = $('#' + targetInputId);
        
        const valorActual = targetInput.val().trim();
        targetInput.val(valorActual ? valorActual + ' ' + transcript : transcript);
    };

    recognition.onend = function() {
        if (currentBtn) {
            currentBtn.removeClass('btn-danger text-white').addClass('btn-outline-secondary');
        }
    };

    recognition.onerror = function(event) {
        if (currentBtn) {
            currentBtn.removeClass('btn-danger text-white').addClass('btn-outline-secondary');
        }
    };
});
</script>

<script>
$(document).ready(function() {
    const prediosExistentes = <?= json_encode($predios_guardados); ?>;
    let alertasEmitidas = {};

    function obtenerDistanciaMetros(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            function(position) {
                const operadorLat = position.coords.latitude;
                const operadorLon = position.coords.longitude;

                prediosExistentes.forEach(function(predio) {
                    if (!predio.latitud || !predio.longitud) return;

                    const pLat = parseFloat(predio.latitud);
                    const pLon = parseFloat(predio.longitud);
                    const distancia = obtenerDistanciaMetros(operadorLat, operadorLon, pLat, pLon);

                    if (distancia <= 40) {
                        if (!alertasEmitidas[predio.id]) {
                            if (window.navigator && window.navigator.vibrate) {
                                window.navigator.vibrate([300, 150, 300]);
                            }

                            alertasEmitidas[predio.id] = true;

                            Swal.fire({
                                icon: 'warning',
                                title: '¡PREDIO EXISTENTE DETECTADO!',
                                html: `Te encuentras a solo <b>${Math.round(distancia)} metros</b> de una ubicación guardada.<br><br>` +
                                      `👤 <b>Titular:</b> ${predio.nombre_completo}<br>` +
                                      `⚠️ Por favor, valida la zona para evitar duplicar el padrón catastral.`,
                                confirmButtonColor: '#0d6efd',
                                confirmButtonText: '<i class="fa-solid fa-eye me-1"></i> Entendido',
                                allowOutsideClick: false
                            });
                        }
                    } else {
                        if (distancia > 60 && alertasEmitidas[predio.id]) {
                            delete alertasEmitidas[predio.id];
                        }
                    }
                });
            },
            function(error) {},
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }
});
</script>
</body>
</html>