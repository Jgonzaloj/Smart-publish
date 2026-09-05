import { Request, Response } from 'express';
import crypto from 'crypto';

export class ConversationsController {
    static async getConversations(req: Request, res: Response): Promise<void> {
        res.json({
            success: true,
            conversations: [
                {
                    id: 'conv-1',
                    customer_name: 'Carlos Mendoza',
                    customer_phone: '+51 987 654 321',
                    channel: 'WHATSAPP',
                    status: 'AI_HANDLED',
                    last_message: '¿Cuánto cuesta el plan para 3 marcas?',
                    last_message_at: '2026-08-17T14:30:00.000Z',
                    unread_count: 0,
                    messages: [
                        { id: 'm1', sender: 'CUSTOMER', text: 'Hola, buenos días. Quisiera información de sus servicios.', time: '14:25' },
                        { id: 'm2', sender: 'BOT', text: '¡Hola Carlos! Con gusto te ayudo. Ofrecemos gestión de redes, publicidad en Meta/TikTok y desarrollo de chatbots.', time: '14:26' },
                        { id: 'm3', sender: 'CUSTOMER', text: '¿Cuánto cuesta el plan para 3 marcas?', time: '14:30' },
                        { id: 'm4', sender: 'BOT', text: 'Para 3 marcas nuestro Plan Pro tiene un precio oficial de 450 USD/mes con descuento por paquete. ¿Te gustaría recibir la cotización formal?', time: '14:30' }
                    ]
                },
                {
                    id: 'conv-2',
                    customer_name: 'Mariana López',
                    customer_phone: '+51 912 345 678',
                    channel: 'WHATSAPP',
                    status: 'HUMAN_NEEDED',
                    last_message: 'Quisiera coordinar una reunión presencial con el director',
                    last_message_at: '2026-08-17T13:45:00.000Z',
                    unread_count: 1,
                    messages: [
                        { id: 'm21', sender: 'CUSTOMER', text: 'Hola, ya vi la cotización QT-2026-002.', time: '13:40' },
                        { id: 'm22', sender: 'BOT', text: 'Excelente Mariana, ¿tienes alguna duda específica sobre los ítems cotizados?', time: '13:41' },
                        { id: 'm23', sender: 'CUSTOMER', text: 'Quisiera coordinar una reunión presencial con el director para firmar el contrato.', time: '13:45' }
                    ]
                },
                {
                    id: 'conv-3',
                    customer_name: 'Jorge Benavides',
                    customer_phone: '+51 999 111 222',
                    channel: 'INSTAGRAM',
                    status: 'AI_HANDLED',
                    last_message: 'Gracias por la información, lo reviso con mi socio',
                    last_message_at: '2026-08-17T11:15:00.000Z',
                    unread_count: 0,
                    messages: [
                        { id: 'm31', sender: 'CUSTOMER', text: 'Vi su anuncio en Instagram. ¿Hacen diseño de tiendas online?', time: '11:10' },
                        { id: 'm32', sender: 'BOT', text: '¡Hola Jorge! Sí, implementamos tiendas virtuales completas con pasarela de pagos integrada desde 350 USD.', time: '11:11' },
                        { id: 'm33', sender: 'CUSTOMER', text: 'Gracias por la información, lo reviso con mi socio', time: '11:15' }
                    ]
                }
            ]
        });
    }

    static async sendMessage(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { text, sender } = req.body;

        res.status(201).json({
            success: true,
            message: {
                id: crypto.randomUUID(),
                conversation_id: id,
                sender: sender || 'USER',
                text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        });
    }

    static async toggleAiMode(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { status } = req.body; // AI_HANDLED | HUMAN_NEEDED

        res.json({ success: true, conversation_id: id, status });
    }
}
