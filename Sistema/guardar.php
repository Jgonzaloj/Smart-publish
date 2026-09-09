<?php
// Limpiar búfer de salida para garantizar un JSON 100% puro
ob_start();

require_once 'config/config.php';
require_once 'config/conexion.php';

verificar_rol(['Administrador', 'Operador']);

header('Content-Type: application/json; charset=utf-8');

// 1. Validar Método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

// 2. Validar Token CSRF de Seguridad
if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'Sesión o token de seguridad expirado. Por favor, vuelva a cargar la página.']);
    exit();
}

// 3. Validar Sesión de Usuario Activa
$usuario_id = $_SESSION['usuario_id'] ?? null;
if (!$usuario_id) {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'La sesión del usuario ha caducado. Inicie sesión nuevamente.']);
    exit();
}

$db = Conexion::getConexion();

// 4. Recibir y sanitizar datos de entrada
$nombre      = sanitize($_POST['nombre_completo'] ?? '');
$dni         = sanitize($_POST['dni'] ?? '');
$direccion   = sanitize($_POST['direccion'] ?? '');
$dep         = sanitize($_POST['departamento'] ?? '');
$prov        = sanitize($_POST['provincia'] ?? '');
$dist        = sanitize($_POST['distrito'] ?? '');
$referencia  = sanitize($_POST['referencia'] ?? '');
$celular     = sanitize($_POST['celular'] ?? '');
$correo      = sanitize($_POST['correo'] ?? null);
$latitud     = filter_var($_POST['latitud'] ?? null, FILTER_VALIDATE_FLOAT);
$longitud    = filter_var($_POST['longitud'] ?? null, FILTER_VALIDATE_FLOAT);
$id_persona  = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);

// 5. Validaciones de negocio
if (strlen($dni) !== 8 || !ctype_digit($dni)) {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'El DNI debe contener exactamente 8 dígitos numéricos.']);
    exit();
}

if (strlen($celular) !== 9 || !ctype_digit($celular)) {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'El número de celular debe contener exactamente 9 dígitos.']);
    exit();
}

if ($latitud === false || $longitud === false) {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'Debe marcar la ubicación GPS en el mapa antes de guardar.']);
    exit();
}

// 6. Verificación de DNI único
$sql_check = "SELECT id FROM personas WHERE dni = ? " . ($id_persona ? "AND id != ?" : "");
$stmt_check = $db->prepare($sql_check);

if ($id_persona) {
    $stmt_check->execute([$dni, $id_persona]);
} else {
    $stmt_check->execute([$dni]);
}

if ($stmt_check->fetch()) {
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'Este número de DNI ya está registrado en la base de datos.']);
    exit();
}

// 7. Manejo de archivo/fotografía
$nombre_imagen = null;
if (isset($_FILES['foto_domicilio']) && $_FILES['foto_domicilio']['error'] === UPLOAD_ERR_OK) {
    $file_tmp  = $_FILES['foto_domicilio']['tmp_name'];
    
    $ext = strtolower(pathinfo($_FILES['foto_domicilio']['name'], PATHINFO_EXTENSION));
    if (empty($ext)) {
        $ext = 'jpg';
    }
    
    $nombre_base = "DOM_" . bin2hex(random_bytes(8)) . "_" . time() . "." . $ext;
    $nombre_imagen = $nombre_base; // Por defecto es solo el nombre para guardado local
    
    $s3_subido = false;
    
    // Si la configuración S3 está activada en config.php
    if (defined('USE_S3') && USE_S3 === true) {
        $autoload_path = __DIR__ . '/vendor/autoload.php';
        if (file_exists($autoload_path)) {
            require_once $autoload_path;
            try {
                $s3Client = new \Aws\S3\S3Client([
                    'version' => 'latest',
                    'region'  => S3_REGION,
                    'credentials' => [
                        'key'    => S3_KEY,
                        'secret' => S3_SECRET,
                    ]
                ]);
                $result = $s3Client->putObject([
                    'Bucket' => S3_BUCKET,
                    'Key'    => 'uploads/' . $nombre_base,
                    'SourceFile' => $file_tmp,
                    'ACL'    => 'public-read'
                ]);
                
                // Si sube a S3, guardamos la URL pública directa en la BD en lugar de solo el nombre
                $nombre_imagen = $result['ObjectURL']; 
                $s3_subido = true;
                
            } catch (Exception $e) {
                // Fallback silencioso a almacenamiento local
                error_log("Error subiendo a S3: " . $e->getMessage() . ". Se usará almacenamiento local.");
            }
        } else {
            error_log("ATENCIÓN: S3 está activado pero no se encontró vendor/autoload.php. Ejecute 'composer require aws/aws-sdk-php'. Se usará almacenamiento local.");
        }
    }
    
    // Si S3 falló o está desactivado, guardamos localmente
    if (!$s3_subido) {
        if (!move_uploaded_file($file_tmp, UPLOAD_DIR . $nombre_base)) {
            ob_end_clean();
            echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar la foto en el servidor. Revise los permisos de la carpeta uploads.']);
            exit();
        }
        $nombre_imagen = $nombre_base; // Solo el nombre
    }
}

// 8. Transacción en Base de Datos
try {
    $db->beginTransaction();

    if ($id_persona) {
        if ($nombre_imagen) {
            $sql = "UPDATE personas SET nombre_completo=?, dni=?, direccion=?, departamento=?, provincia=?, distrito=?, referencia=?, celular=?, correo=?, latitud=?, longitud=?, foto_domicilio=? WHERE id=?";
            $params = [$nombre, $dni, $direccion, $dep, $prov, $dist, $referencia, $celular, $correo, $latitud, $longitud, $nombre_imagen, $id_persona];
        } else {
            $sql = "UPDATE personas SET nombre_completo=?, dni=?, direccion=?, departamento=?, provincia=?, distrito=?, referencia=?, celular=?, correo=?, latitud=?, longitud=? WHERE id=?";
            $params = [$nombre, $dni, $direccion, $dep, $prov, $dist, $referencia, $celular, $correo, $latitud, $longitud, $id_persona];
        }
        $accion = 'UPDATE';
    } else {
        if (!$nombre_imagen) {
            ob_end_clean();
            echo json_encode(['status' => 'error', 'message' => 'Debe adjuntar la foto obligatoria para un nuevo registro.']);
            $db->rollBack();
            exit();
        }
        $sql = "INSERT INTO personas (nombre_completo, dni, direccion, departamento, provincia, distrito, referencia, celular, correo, latitud, longitud, foto_domicilio, fecha_registro, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)";
        $params = [$nombre, $dni, $direccion, $dep, $prov, $dist, $referencia, $celular, $correo, $latitud, $longitud, $nombre_imagen, $usuario_id];
        $accion = 'INSERT';
    }

    $stmt = $db->prepare($sql);
    
    // Mitigación de Race Condition: Intentar ejecutar y atrapar error de duplicidad de la Base de Datos
    try {
        $stmt->execute($params);
    } catch (PDOException $e) {
        $db->rollBack();
        // 23000 es el código SQLSTATE para violaciones de integridad (como UNIQUE)
        if ($e->getCode() == '23000' || strpos($e->getMessage(), 'Duplicate entry') !== false) {
            ob_end_clean();
            echo json_encode(['status' => 'error', 'message' => 'Error de concurrencia: Ya se registró una persona con este DNI casi al mismo tiempo.']);
            exit();
        } else {
            throw $e; // Relanzar si es otro error de base de datos
        }
    }
    
    $actual_id = $id_persona ?? $db->lastInsertId();

    // Auditoría
    $audit_persona_id = (!empty($actual_id)) ? intval($actual_id) : null;
    $audit_usuario_id = intval($usuario_id);

    $stmt_audit = $db->prepare("INSERT INTO auditoria (persona_id, usuario_id, accion, detalles) VALUES (?, ?, ?, ?)");
    $detalles_audit = "DNI: $dni | IP: " . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
    $stmt_audit->execute([$audit_persona_id, $audit_usuario_id, $accion, $detalles_audit]);

    $db->commit();
    
    ob_end_clean();
    echo json_encode(['status' => 'success', 'message' => 'Información guardada con éxito.']);
    exit();

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    if ($nombre_imagen) {
        // Solo intentamos borrar local si no es una URL de S3
        if (!str_starts_with($nombre_imagen, 'http') && file_exists(UPLOAD_DIR . $nombre_imagen)) {
            @unlink(UPLOAD_DIR . $nombre_imagen);
        }
    }
    ob_end_clean();
    echo json_encode(['status' => 'error', 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
    exit();
}
?>