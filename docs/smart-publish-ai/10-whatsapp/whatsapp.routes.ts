import { Router, Request, Response } from 'express';
import { handleIncomingMessage } from '../09-conversations/conversation.service';

const router = Router();

// Endpoint de verificación (requerido por Meta Cloud API)
router.get('/webhook', (req: Request, res: Response): void => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Endpoint para recibir los mensajes
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body.entry[0].changes[0].value.messages[0].from; // sender's number
            const msgBody = body.entry[0].changes[0].value.messages[0].text.body; // text content
            
            // Enviamos el mensaje al motor conversacional (SKILL-09)
            // IMPORTANTE: Devolvemos 200 rápido a WhatsApp para que no bloquee,
            // mientras el motor de IA procesa la respuesta.
            res.sendStatus(200);

            try {
                await handleIncomingMessage({
                    channel: 'whatsapp',
                    from,
                    phoneNumberId,
                    text: msgBody
                });
            } catch (error) {
                console.error('Error al procesar mensaje en SKILL-09:', error);
            }
            return;
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

export default router;
