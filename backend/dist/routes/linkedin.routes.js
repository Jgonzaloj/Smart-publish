"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkedinRoutes = void 0;
const express_1 = require("express");
const linkedin_controller_1 = require("../controllers/linkedin.controller");
const router = (0, express_1.Router)();
exports.linkedinRoutes = router;
router.get('/auth', linkedin_controller_1.login);
router.post('/callback', linkedin_controller_1.handleCallback);
