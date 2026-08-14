import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Mock temporal hasta conectar Prisma
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    
    // Aquí (SKILL-05) validaremos con la DB creada en SKILL-04
    if (email === 'admin@smartpublish.ai' && password === 'admin123') {
        const payload = {
            userId: '1',
            role: 'SUPER_ADMIN',
            tenantId: 'tenant_1'
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        res.json({ token, message: 'Autenticación exitosa' });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

export default router;
