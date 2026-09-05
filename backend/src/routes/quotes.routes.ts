import { Router } from 'express';
import { QuotesController } from '../controllers/quotes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

export const quotesRoutes = Router();

quotesRoutes.use(authMiddleware, tenantMiddleware);

quotesRoutes.get('/', QuotesController.getQuotes);
quotesRoutes.post('/', QuotesController.generateQuote);
