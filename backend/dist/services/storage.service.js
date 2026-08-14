"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
// Crear directorio temporal si no existe
const tempDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(tempDir)) {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
// Configuración de almacenamiento local temporal
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    }
});
// Filtro de archivos
const fileFilter = (req, file, cb) => {
    // Aceptamos imágenes y videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten archivos de imagen y video'));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB límite (Skill 11 - Validación)
});
/**
 * Storage Service
 * Prepara la estructura para futuras integraciones con AWS S3 o Cloudinary.
 */
class StorageService {
    /**
     * Sube un archivo al almacenamiento (actualmente Local, preparado para S3)
     */
    static async uploadFile(file) {
        // En MVP: Retornar ruta local o URL de servidor
        // En Producción: Aquí iría el código de s3.upload() o cloudinary.uploader.upload()
        console.log(`[StorageService] Archivo guardado temporalmente en: ${file.path}`);
        return file.filename;
    }
    /**
     * Elimina un archivo
     */
    static async deleteFile(filename) {
        const filePath = path_1.default.join(tempDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log(`[StorageService] Archivo eliminado: ${filePath}`);
        }
    }
}
exports.StorageService = StorageService;
