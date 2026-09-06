import { z } from 'zod';

export const createLeadSchema = z.object({
    name: z.string().trim().min(1, 'El nombre del cliente es obligatorio'),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('Formato de correo inválido').optional().or(z.literal('')),
    source: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'WEB', 'MANUAL']).optional().default('MANUAL'),
    estimatedValue: z.number().nonnegative().optional().default(0),
    notes: z.string().optional().default('')
});

export const updateLeadStatusSchema = z.object({
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'QUOTED', 'WON', 'LOST'])
});
