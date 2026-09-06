"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadStatusSchema = exports.createLeadSchema = void 0;
const zod_1 = require("zod");
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'El nombre del cliente es obligatorio'),
    phone: zod_1.z.string().trim().optional(),
    email: zod_1.z.string().trim().email('Formato de correo inválido').optional().or(zod_1.z.literal('')),
    source: zod_1.z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'WEB', 'MANUAL']).optional().default('MANUAL'),
    estimatedValue: zod_1.z.number().nonnegative().optional().default(0),
    notes: zod_1.z.string().optional().default('')
});
exports.updateLeadStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'QUOTED', 'WON', 'LOST'])
});
