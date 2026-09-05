"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesController = void 0;
const crypto_1 = __importDefault(require("crypto"));
class QuotesController {
    static async getQuotes(req, res) {
        res.json({
            success: true,
            quotes: [
                {
                    id: 'qt-101',
                    quote_number: 'QT-2026-001',
                    customer_name: 'Tech Solutions SAC',
                    total_amount: 1200.00,
                    currency: 'USD',
                    status: 'SENT',
                    valid_until: '2026-09-01T00:00:00.000Z',
                    items: [
                        { service_name: 'Desarrollo Web Landing Page', quantity: 1, unit_price: 350.00, total: 350.00 },
                        { service_name: 'Campaña Meta & TikTok Ads', quantity: 1, unit_price: 450.00, total: 450.00 },
                        { service_name: 'Bot IA WhatsApp Automatizado', quantity: 2, unit_price: 200.00, total: 400.00 }
                    ],
                    created_at: '2026-08-15T10:00:00.000Z'
                },
                {
                    id: 'qt-102',
                    quote_number: 'QT-2026-002',
                    customer_name: 'Mariana López (Boutique)',
                    total_amount: 450.00,
                    currency: 'USD',
                    status: 'ACCEPTED',
                    valid_until: '2026-08-30T00:00:00.000Z',
                    items: [
                        { service_name: 'Gestión Redes Sociales Pro', quantity: 1, unit_price: 250.00, total: 250.00 },
                        { service_name: 'Bot IA WhatsApp Automatizado', quantity: 1, unit_price: 200.00, total: 200.00 }
                    ],
                    created_at: '2026-08-16T14:30:00.000Z'
                }
            ]
        });
    }
    static async generateQuote(req, res) {
        const { customerName, items, currency, notes, validDays } = req.body;
        if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ success: false, message: 'Cliente y al menos un ítem son obligatorios' });
            return;
        }
        const quoteNum = `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        const total = items.reduce((acc, item) => acc + (Number(item.unit_price || 0) * Number(item.quantity || 1)), 0);
        const newQuote = {
            id: crypto_1.default.randomUUID(),
            quote_number: quoteNum,
            customer_name: customerName,
            total_amount: total,
            currency: currency || 'USD',
            status: 'SENT',
            valid_until: new Date(Date.now() + (validDays || 15) * 86400000).toISOString(),
            items,
            notes: notes || '',
            created_at: new Date().toISOString()
        };
        res.status(201).json({ success: true, quote: newQuote });
    }
}
exports.QuotesController = QuotesController;
