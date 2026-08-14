"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceRepository = void 0;
const database_1 = require("../config/database");
class WorkspaceRepository {
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM workspaces WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findFirst() {
        const [rows] = await database_1.pool.query('SELECT * FROM workspaces LIMIT 1');
        return rows.length > 0 ? rows[0] : null;
    }
    async findByStripeCustomerId(customerId) {
        const [rows] = await database_1.pool.query('SELECT * FROM workspaces WHERE stripe_customer_id = ?', [customerId]);
        return rows.length > 0 ? rows[0] : null;
    }
    async create(workspace) {
        await database_1.pool.query('INSERT INTO workspaces (id, name) VALUES (?, ?)', [workspace.id, workspace.name]);
    }
    async updateStripeCustomer(workspaceId, customerId) {
        await database_1.pool.query('UPDATE workspaces SET stripe_customer_id = ? WHERE id = ?', [customerId, workspaceId]);
    }
    async updateSubscription(workspaceId, subscriptionId, priceId, status) {
        await database_1.pool.query('UPDATE workspaces SET stripe_subscription_id = ?, stripe_price_id = ?, plan_status = ? WHERE id = ?', [subscriptionId, priceId, status, workspaceId]);
    }
    async removeSubscription(workspaceId) {
        await database_1.pool.query('UPDATE workspaces SET stripe_subscription_id = NULL, stripe_price_id = NULL, plan_status = "free" WHERE id = ?', [workspaceId]);
    }
    async incrementAiUsage(workspaceId) {
        await database_1.pool.query('UPDATE workspaces SET ai_credits_used = ai_credits_used + 1 WHERE id = ?', [workspaceId]);
    }
    async incrementPostUsage(workspaceId) {
        await database_1.pool.query('UPDATE workspaces SET posts_used = posts_used + 1 WHERE id = ?', [workspaceId]);
    }
    async checkImageLimit(workspaceId) {
        // Al usar Pollinations AI (que es gratuito e ilimitado),
        // eliminamos completamente la restricción de 3 imágenes para todos los usuarios.
        return true;
    }
    async incrementImageUsage(workspaceId) {
        await database_1.pool.query('UPDATE workspaces SET ai_images_used = IFNULL(ai_images_used, 0) + 1 WHERE id = ?', [workspaceId]);
    }
}
exports.WorkspaceRepository = WorkspaceRepository;
