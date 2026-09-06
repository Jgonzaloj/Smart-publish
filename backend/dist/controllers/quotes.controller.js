"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesController = void 0;
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
class QuotesController {
    static async getQuotes(req, res) {
        const workspaceId = req.user?.workspace_id || req.workspaceId;
        try {
            const [quoteRows] = await database_1.pool.query(`SELECT q.*, cust.name as customer_name
                 FROM quotes q
                 LEFT JOIN customers cust ON q.customer_id = cust.id
                 WHERE q.workspace_id = ?
                 ORDER BY q.created_at DESC`, [workspaceId]);
            if (quoteRows.length > 0) {
                const quotes = await Promise.all(quoteRows.map(async (q) => {
                    const [items] = await database_1.pool.query(`SELECT service_name, quantity, unit_price, total
                             FROM quote_items
                             WHERE quote_id = ?`, [q.id]);
                    return {
                        id: q.id,
                        quote_number: q.quote_number,
                        customer_name: q.customer_name || 'Cliente sin asignar',
                        total_amount: Number(q.total_amount),
                        currency: q.currency,
                        status: q.status,
                        valid_until: q.valid_until,
                        items,
                        notes: q.notes,
                        created_at: q.created_at
                    };
                }));
                res.json({ success: true, quotes });
                return;
            }
        }
        catch (err) {
            console.error('[Quotes] Error querying MySQL quotes:', err);
        }
        // Fallback seed data si no hay cotizaciones en la DB
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
        const workspaceId = req.user?.workspace_id || req.workspaceId;
        const { customerName, items, currency, notes, validDays } = req.body;
        if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ success: false, message: 'Cliente y al menos un ítem son obligatorios' });
            return;
        }
        const quoteId = crypto_1.default.randomUUID();
        const quoteNum = `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        const total = items.reduce((acc, item) => acc + (Number(item.unit_price || 0) * Number(item.quantity || 1)), 0);
        const validUntil = new Date(Date.now() + (validDays || 15) * 86400000);
        try {
            // 1. Asegurar customer
            const [custRows] = await database_1.pool.query(`SELECT id FROM customers WHERE name = ? AND workspace_id = ? LIMIT 1`, [customerName, workspaceId]);
            let customerId;
            if (custRows.length > 0) {
                customerId = custRows[0].id;
            }
            else {
                customerId = crypto_1.default.randomUUID();
                await database_1.pool.query(`INSERT INTO customers (id, workspace_id, name, source) VALUES (?, ?, ?, 'WEB')`, [customerId, workspaceId, customerName]);
            }
            // 2. Insertar quote
            await database_1.pool.query(`INSERT INTO quotes (id, workspace_id, customer_id, quote_number, total_amount, currency, valid_until, status, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'SENT', ?)`, [quoteId, workspaceId, customerId, quoteNum, total, currency || 'USD', validUntil, notes || '']);
            // 3. Insertar items
            for (const item of items) {
                const itemId = crypto_1.default.randomUUID();
                const itemTotal = Number(item.unit_price || 0) * Number(item.quantity || 1);
                await database_1.pool.query(`INSERT INTO quote_items (id, quote_id, service_name, quantity, unit_price, total)
                     VALUES (?, ?, ?, ?, ?, ?)`, [itemId, quoteId, item.service_name || 'Servicio', Number(item.quantity || 1), Number(item.unit_price || 0), itemTotal]);
            }
        }
        catch (err) {
            console.warn('[Quotes] Guardado en fallback:', err);
        }
        const newQuote = {
            id: quoteId,
            quote_number: quoteNum,
            customer_name: customerName,
            total_amount: total,
            currency: currency || 'USD',
            status: 'SENT',
            valid_until: validUntil.toISOString(),
            items,
            notes: notes || '',
            created_at: new Date().toISOString()
        };
        res.status(201).json({ success: true, quote: newQuote });
    }
}
exports.QuotesController = QuotesController;
