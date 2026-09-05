import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

export const crmRoutes = Router();

crmRoutes.use(authMiddleware, tenantMiddleware);

crmRoutes.get('/leads', CrmController.getLeads);
crmRoutes.post('/leads', CrmController.createLead);
crmRoutes.patch('/leads/:id/status', CrmController.updateLeadStatus);
