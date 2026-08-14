"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const stripe_service_1 = require("../services/stripe.service");
const stripeService = new stripe_service_1.StripeService();
class BillingController {
    async createCheckoutSession(req, res) {
        try {
            // Assume AuthMiddleware sets req.user (which includes workspace_id and email)
            const workspaceId = req.user.workspace_id;
            const email = req.user.email;
            const { priceId } = req.body;
            if (!priceId) {
                res.status(400).json({ error: 'priceId is required' });
                return;
            }
            // In production, these should be environment variables
            const successUrl = `${process.env.FRONTEND_URL}/billing?success=true`;
            const cancelUrl = `${process.env.FRONTEND_URL}/billing?canceled=true`;
            const customerId = await stripeService.getOrCreateCustomer(workspaceId, email, `Workspace ${workspaceId}`);
            const sessionUrl = await stripeService.createCheckoutSession(customerId, priceId, successUrl, cancelUrl);
            res.json({ url: sessionUrl });
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            res.status(500).json({ error: 'Failed to create checkout session' });
        }
    }
    async createPortalSession(req, res) {
        try {
            const workspaceId = req.user.workspace_id;
            const email = req.user.email;
            const returnUrl = `${process.env.FRONTEND_URL}/billing`;
            const customerId = await stripeService.getOrCreateCustomer(workspaceId, email, `Workspace ${workspaceId}`);
            const sessionUrl = await stripeService.createPortalSession(customerId, returnUrl);
            res.json({ url: sessionUrl });
        }
        catch (error) {
            console.error('Error creating portal session:', error);
            res.status(500).json({ error: 'Failed to create portal session' });
        }
    }
    async handleWebhook(req, res) {
        const signature = req.headers['stripe-signature'];
        try {
            // The webhook endpoint needs the raw body buffer, not JSON
            await stripeService.handleWebhookEvent(signature, req.body);
            res.send(); // 200 OK to acknowledge receipt
        }
        catch (error) {
            console.error('Webhook Error:', error.message);
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }
}
exports.BillingController = BillingController;
