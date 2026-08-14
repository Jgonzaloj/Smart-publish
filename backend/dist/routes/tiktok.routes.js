"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokRoutes = void 0;
const express_1 = require("express");
const tiktok_controller_1 = require("../controllers/tiktok.controller");
const router = (0, express_1.Router)();
exports.tiktokRoutes = router;
router.get('/auth', tiktok_controller_1.login);
router.post('/callback', tiktok_controller_1.handleCallback);
