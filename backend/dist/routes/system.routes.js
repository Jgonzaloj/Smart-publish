"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemRoutes = void 0;
const express_1 = require("express");
const system_controller_1 = require("../controllers/system.controller");
exports.systemRoutes = (0, express_1.Router)();
exports.systemRoutes.get('/status', system_controller_1.SystemController.getDashboardStatus);
