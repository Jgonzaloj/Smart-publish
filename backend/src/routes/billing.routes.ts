import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import express from 'express';

const router = Router();
const billingController = new BillingController();

// We need raw body for the webhook
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook.bind(billingController));

// These require authentication and JSON body parsing
router.post('/create-checkout-session', express.json(), authMiddleware, billingController.createCheckoutSession.bind(billingController));
router.post('/create-portal-session', express.json(), authMiddleware, billingController.createPortalSession.bind(billingController));

export default router;
