import { Router, Request, Response } from 'express';

const router = Router();

// Mock temporal en memoria hasta conectar base de datos
let mockLeads: any[] = [];

// Obtener todos los leads (simulando filtro por tenant_id si hubiera middleware de auth)
router.get('/leads', async (req: Request, res: Response) => {
    res.json(mockLeads);
});

// Crear un nuevo Lead (Triage/CRM)
router.post('/leads', async (req: Request, res: Response): Promise<void> => {
    const { name, phone, email } = req.body;
    
    if (!name || (!phone && !email)) {
        res.status(400).json({ error: 'Faltan datos obligatorios (name y al menos phone o email)' });
        return;
    }

    const newLead = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        phone,
        email,
        status: 'NEW',
        score: 0,
        createdAt: new Date().toISOString()
    };
    
    mockLeads.push(newLead);
    res.status(201).json(newLead);
});

export default router;
