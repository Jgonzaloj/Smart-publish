"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: STRIPE_SECRET_KEY no está configurado en las variables de entorno.');
}
const stripe = new stripe_1.default(stripeSecretKey || '', {
    apiVersion: '2024-04-10',
});
const workspaceRepository = new WorkspaceRepository_1.WorkspaceRepository();
class StripeService {
    // Create a customer if one doesn't exist for the workspace
    async getOrCreateCustomer(workspaceId, email, name) {
        const workspace = await workspaceRepository.findById(workspaceId);
        if (!workspace)
            throw new Error('Workspace not found');
        if (workspace.stripe_customer_id) {
            return workspace.stripe_customer_id;
        }
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                workspaceId
            }
        });
        await workspaceRepository.updateStripeCustomer(workspaceId, customer.id);
        return customer.id;
    }
    // Create a Checkout Session
    async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        return session.url;
    }
    // Create a Customer Portal Session
    async createPortalSession(customerId, returnUrl) {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        return session.url;
    }
    // Handle Webhook Events
    async handleWebhookEvent(signature, payload) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not set');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            console.error('Webhook signature verification failed.', err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                await this.handleSubscriptionUpdated(subscription);
                break;
            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object;
                await this.handleSubscriptionDeleted(deletedSubscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    }
    async handleSubscriptionUpdated(subscription) {
        const customerId = subscription.customer;
        const workspace = await workspaceRepository.findByStripeCustomerId(customerId);
        if (!workspace) {
            console.error(`Workspace not found for customer ${customerId}`);
            return;
        }
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;
        await workspaceRepository.updateSubscription(workspace.id, subscription.id, priceId, status);
    }
    async handleSubscriptionDeleted(subscription) {
        const customerId = subscription.customer;
        const workspace = await workspaceRepository.findByStripeCustomerId(customerId);
        if (workspace) {
            await workspaceRepository.removeSubscription(workspace.id);
        }
    }
}
exports.StripeService = StripeService;
