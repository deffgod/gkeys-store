import { Router } from 'express';
import { g2aWebhookController } from '../controllers/g2a-webhook.controller.js';

const router = Router();

// G2A webhook endpoint (public, no auth required - signature validation handles security)
router.post('/webhook', g2aWebhookController);

export default router;
