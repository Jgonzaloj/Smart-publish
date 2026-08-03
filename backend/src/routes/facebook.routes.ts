import { Router } from 'express';
import { FacebookController } from '../controllers/facebook.controller';
import multer from 'multer';

// Configurar multer para guardar archivos temporalmente en memoria
const upload = multer({ storage: multer.memoryStorage() });

export const facebookRoutes = Router();

// Endpoint para obtener la URL de login
facebookRoutes.get('/auth-url', FacebookController.getAuthUrl);

// Endpoint que Facebook llamará de regreso con el código
facebookRoutes.get('/callback', FacebookController.handleCallback);

// Endpoint para publicar un post en Facebook (acepta un archivo 'image')
facebookRoutes.post('/publish', upload.single('image'), FacebookController.publishPost);
