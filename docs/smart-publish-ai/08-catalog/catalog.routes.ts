import { Router, Request, Response } from 'express';

const router = Router();

// Mock en memoria temporal (esto vendrá de Prisma en la base de datos de DigitalOcean)
let mockServices = [
    {
        id: 'serv_123',
        name: 'Gestión de Redes Básica',
        description: 'Manejo de Facebook e Instagram, 3 posts semanales',
        price: 250,
        currency: 'USD'
    },
    {
        id: 'serv_456',
        name: 'Campañas Ads Premium',
        description: 'Meta Ads y TikTok Ads gestionados por IA',
        price: 500,
        currency: 'USD'
    }
];

// Obtener catálogo completo para mostrárselo a los clientes o para que la IA decida
router.get('/', async (req: Request, res: Response) => {
    // Aquí (SKILL-08) filtramos por Tenant para no mezclar servicios
    res.json(mockServices);
});

// Endpoint exclusivo para uso interno (SKILL-12 Quotation o SKILL-09 IA)
router.get('/:id/price', async (req: Request, res: Response): Promise<void> => {
    const service = mockServices.find(s => s.id === req.params.id);
    if (!service) {
        res.status(404).json({ error: 'Servicio no encontrado' });
        return;
    }
    res.json({ price: service.price, currency: service.currency });
});

export default router;
