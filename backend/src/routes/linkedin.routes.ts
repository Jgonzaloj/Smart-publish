import { Router } from 'express';
import { login, handleCallback } from '../controllers/linkedin.controller';

const router = Router();

router.get('/auth', login);
router.post('/callback', handleCallback);

export { router as linkedinRoutes };
