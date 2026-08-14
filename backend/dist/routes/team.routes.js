"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamRoutes = void 0;
const express_1 = require("express");
const team_controller_1 = require("../controllers/team.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.teamRoutes = (0, express_1.Router)();
// Public route to accept invite
exports.teamRoutes.post('/accept-invite', team_controller_1.TeamController.acceptInvite);
// Private routes for team management
exports.teamRoutes.get('/', auth_middleware_1.authMiddleware, team_controller_1.TeamController.getMembers);
exports.teamRoutes.post('/invite', auth_middleware_1.authMiddleware, team_controller_1.TeamController.inviteMember);
exports.teamRoutes.delete('/member/:userId', auth_middleware_1.authMiddleware, team_controller_1.TeamController.removeMember);
