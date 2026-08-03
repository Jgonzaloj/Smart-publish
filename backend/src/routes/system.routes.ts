import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';

export const systemRoutes = Router();

systemRoutes.get('/status', SystemController.getDashboardStatus);
