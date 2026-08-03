import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Crear directorio temporal si no existe
const tempDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configuración de almacenamiento local temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Aceptamos imágenes y videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen y video'));
    }
};

export const uploadMiddleware = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB límite (Skill 11 - Validación)
});

/**
 * Storage Service
 * Prepara la estructura para futuras integraciones con AWS S3 o Cloudinary.
 */
export class StorageService {
    /**
     * Sube un archivo al almacenamiento (actualmente Local, preparado para S3)
     */
    static async uploadFile(file: Express.Multer.File): Promise<string> {
        // En MVP: Retornar ruta local o URL de servidor
        // En Producción: Aquí iría el código de s3.upload() o cloudinary.uploader.upload()
        console.log(`[StorageService] Archivo guardado temporalmente en: ${file.path}`);
        return file.filename;
    }

    /**
     * Elimina un archivo
     */
    static async deleteFile(filename: string): Promise<void> {
        const filePath = path.join(tempDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[StorageService] Archivo eliminado: ${filePath}`);
        }
    }
}
