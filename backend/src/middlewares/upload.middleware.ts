import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurar que la carpeta exista
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento en memoria (para procesarlo con sharp luego)
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB límite
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});
