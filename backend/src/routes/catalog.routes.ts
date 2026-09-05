import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

export const catalogRoutes = Router();

catalogRoutes.use(authMiddleware, tenantMiddleware);

catalogRoutes.get('/', CatalogController.getCatalog);
catalogRoutes.post('/', CatalogController.createService);
catalogRoutes.get('/:serviceId/price', CatalogController.getPrice);
