"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webhooks_controller_1 = require("../webhooks.controller");
const crypto_1 = __importDefault(require("crypto"));
describe('WebhooksController', () => {
    let mockReq;
    let mockRes;
    let sendMock;
    let sendStatusMock;
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
            webhooks_controller_1.WebhooksController.verifyMetaWebhook(mockReq, mockRes);
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
            webhooks_controller_1.WebhooksController.verifyMetaWebhook(mockReq, mockRes);
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
            await webhooks_controller_1.WebhooksController.handleMetaEvent(mockReq, mockRes);
            expect(sendStatusMock).toHaveBeenCalledWith(401);
        });
        it('debería procesar el evento si la firma es válida', async () => {
            process.env.FB_APP_SECRET = 'my_secret';
            const payload = { object: 'page', entry: [] };
            // Generar la firma correcta (como lo haría Meta)
            const expectedSignature = `sha256=${crypto_1.default
                .createHmac('sha256', 'my_secret')
                .update(JSON.stringify(payload))
                .digest('hex')}`;
            mockReq = {
                headers: {
                    'x-hub-signature-256': expectedSignature
                },
                body: payload
            };
            await webhooks_controller_1.WebhooksController.handleMetaEvent(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith('EVENT_RECEIVED');
        });
    });
});
