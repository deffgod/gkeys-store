import { Router } from 'express';
import {
  createBalanceTopUpController,
  paymentWebhookController,
  terminalWebhookController,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Balance top-up requires authentication
router.post('/balance-top-up', authenticate, createBalanceTopUpController);

// Webhooks don't require authentication (they use signature verification)
router.post('/webhook', paymentWebhookController as any);
router.post('/terminal-webhook', terminalWebhookController as any);

export default router;

