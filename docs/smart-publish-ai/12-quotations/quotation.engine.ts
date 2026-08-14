import fetch from 'node-fetch'; // Requiere 'node-fetch' si se corre en Node < 18, pero en nuestro caso usamos fetch nativo o mock

// Motor de Cotizaciones (SKILL-12)
export async function generateQuotation(serviceId: string, leadId: string): Promise<string> {
    try {
        // En un entorno real, hacemos fetch al SKILL-08 (Catálogo)
        // const response = await fetch(`http://localhost:3000/api/catalog/${serviceId}/price`);
        // const data = await response.json();
        
        // Mock rápido de la conexión interna por seguridad (evitar dependencias de red en tests unitarios)
        const mockCatalog: Record<string, { name: string, price: number, currency: string }> = {
            'serv_123': { name: 'Gestión de Redes Básica', price: 250, currency: 'USD' },
            'serv_456': { name: 'Campañas Ads Premium', price: 500, currency: 'USD' }
        };

        const service = mockCatalog[serviceId];

        if (!service) {
            return `Lo siento, no pude encontrar información de precios para el servicio solicitado.`;
        }

        // Aquí iría la lógica de guardar en la base de datos (Prisma) la cotización (SKILL-04)
        const quoteId = `QT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Construimos el mensaje de cotización formal
        const quotationText = `*Cotización Formal (${quoteId})*\n\nServicio: ${service.name}\nTotal: ${service.price} ${service.currency}\n\n¿Te gustaría proceder con el pago o tienes alguna duda?`;
        
        return quotationText;

    } catch (error) {
        console.error('Error generando cotización:', error);
        return 'Ocurrió un error al intentar generar tu cotización. Por favor, intenta de nuevo.';
    }
}
