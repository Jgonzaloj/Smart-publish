import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const teamRoutes = Router();

// Public route to accept invite
teamRoutes.post('/accept-invite', TeamController.acceptInvite);

// Private routes for team management
teamRoutes.get('/', authMiddleware, TeamController.getMembers);
teamRoutes.post('/invite', authMiddleware, TeamController.inviteMember);
teamRoutes.delete('/member/:userId', authMiddleware, TeamController.removeMember);
