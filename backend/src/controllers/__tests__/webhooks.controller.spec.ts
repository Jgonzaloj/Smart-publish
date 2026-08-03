import { WebhooksController } from '../webhooks.controller';
import { Request, Response } from 'express';
import crypto from 'crypto';

describe('WebhooksController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let sendMock: jest.Mock;
    let sendStatusMock: jest.Mock;

    beforeEach(() => {
        sendMock = jest.fn();
        sendStatusMock = jest.fn();

        mockRes = {
            status: jest.fn().mockReturnValue({ send: sendMock }),
            sendStatus: sendStatusMock,
            send: sendMock
        };
    });

    describe('verifyMetaWebhook (GET)', () => {
        it('debería retornar el challenge si el token es correcto', () => {
            process.env.META_WEBHOOK_VERIFY_TOKEN = 'test_token';
            mockReq = {
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'test_token',
                    'hub.challenge': '12345'
                }
            };

            WebhooksController.verifyMetaWebhook(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith('12345');
        });

        it('debería retornar 403 si el token es incorrecto', () => {
            process.env.META_WEBHOOK_VERIFY_TOKEN = 'test_token';
            mockReq = {
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'wrong_token',
                    'hub.challenge': '12345'
                }
            };

            WebhooksController.verifyMetaWebhook(mockReq as Request, mockRes as Response);

            expect(sendStatusMock).toHaveBeenCalledWith(403);
        });
    });

    describe('handleMetaEvent (POST) - Seguridad', () => {
        it('debería rechazar un payload con firma inválida', async () => {
            process.env.FB_APP_SECRET = 'my_secret';
            
            mockReq = {
                headers: {
                    'x-hub-signature-256': 'sha256=invalid_signature'
                },
                body: { object: 'page', entry: [] }
            };

            await WebhooksController.handleMetaEvent(mockReq as Request, mockRes as Response);

            expect(sendStatusMock).toHaveBeenCalledWith(401);
        });

        it('debería procesar el evento si la firma es válida', async () => {
            process.env.FB_APP_SECRET = 'my_secret';
            const payload = { object: 'page', entry: [] };
            
            // Generar la firma correcta (como lo haría Meta)
            const expectedSignature = `sha256=${crypto
                .createHmac('sha256', 'my_secret')
                .update(JSON.stringify(payload))
                .digest('hex')}`;

            mockReq = {
                headers: {
                    'x-hub-signature-256': expectedSignature
                },
                body: payload
            };

            await WebhooksController.handleMetaEvent(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith('EVENT_RECEIVED');
        });
    });
});
