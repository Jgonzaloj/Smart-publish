import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createLeadSchema, updateLeadStatusSchema } from '../schemas/crm.schemas';

export const crmRoutes = Router();

crmRoutes.use(authMiddleware, tenantMiddleware);

crmRoutes.get('/leads', CrmController.getLeads);
crmRoutes.post('/leads', validate(createLeadSchema), CrmController.createLead);
crmRoutes.patch('/leads/:id/status', validate(updateLeadStatusSchema), CrmController.updateLeadStatus);
