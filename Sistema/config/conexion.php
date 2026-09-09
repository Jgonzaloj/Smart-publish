<?php
require_once __DIR__ . '/config.php';

if (!class_exists('Conexion')) {
    class Conexion {
        private static $instancia = null;
        private $pdo;

        private function __construct() {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                $opciones = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];
                $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $opciones);
            } catch (PDOException $e) {
                error_log($e->getMessage());
                die("Error crítico de conexión a la base de datos.");
            }
        }

        public static function getConexion() {
            if (self::$instancia === null) {
                self::$instancia = new self();
            }
            return self::$instancia->pdo;
        }
    }
}
?>