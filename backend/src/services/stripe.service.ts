import Stripe from 'stripe';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeClient) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY no está configurado en las variables de entorno.');
        }
        stripeClient = new Stripe(stripeSecretKey, {
            apiVersion: '2024-04-10' as any,
        });
    }
    return stripeClient;
}

const workspaceRepository = new WorkspaceRepository();

export class StripeService {
    
    // Create a customer if one doesn't exist for the workspace
    async getOrCreateCustomer(workspaceId: string, email: string, name: string): Promise<string> {
        const workspace = await workspaceRepository.findById(workspaceId);
        
        if (!workspace) throw new Error('Workspace not found');

        if (workspace.stripe_customer_id) {
            return workspace.stripe_customer_id;
        }

        const customer = await getStripe().customers.create({
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
    async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
        const session = await getStripe().checkout.sessions.create({
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

        return session.url!;
    }

    // Create a Customer Portal Session
    async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
        const session = await getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return session.url;
    }

    // Handle Webhook Events
    async handleWebhookEvent(signature: string, payload: Buffer): Promise<void> {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not set');
        }

        let event: Stripe.Event;

        try {
            event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed.', err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object as Stripe.Subscription;
                await this.handleSubscriptionUpdated(subscription);
                break;
            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object as Stripe.Subscription;
                await this.handleSubscriptionDeleted(deletedSubscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const workspace = await workspaceRepository.findByStripeCustomerId(customerId);

        if (!workspace) {
            console.error(`Workspace not found for customer ${customerId}`);
            return;
        }

        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;

        await workspaceRepository.updateSubscription(
            workspace.id,
            subscription.id,
            priceId,
            status
        );
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const workspace = await workspaceRepository.findByStripeCustomerId(customerId);

        if (workspace) {
            await workspaceRepository.removeSubscription(workspace.id);
        }
    }
}
