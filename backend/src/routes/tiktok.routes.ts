import { Router } from 'express';
import { login, handleCallback } from '../controllers/tiktok.controller';

const router = Router();

router.get('/auth', login);
router.post('/callback', handleCallback);

export { router as tiktokRoutes };
