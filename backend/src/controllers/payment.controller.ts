import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  createBalanceTopUpIntent,
  processPaymentWebhook,
  processTerminalWebhook,
} from '../services/payment.service.js';
import { BalanceTopUpRequest, PaymentWebhook, TerminalWebhook } from '../types/payment.js';

export const createBalanceTopUpController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const data: BalanceTopUpRequest = req.body;
    const intent = await createBalanceTopUpIntent(req.user.userId, data);

    res.status(200).json({
      success: true,
      data: intent,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as unknown as PaymentWebhook;
    
    // Verify webhook signature in production
    // For now, we'll process it directly
    
    await processPaymentWebhook(data);

    res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    next(error);
  }
};

export const terminalWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as unknown as TerminalWebhook;
    
    // Verify webhook signature in production
    // For now, we'll process it directly
    
    await processTerminalWebhook(data);

    res.status(200).json({
      success: true,
      message: 'Terminal webhook processed',
    });
  } catch (error) {
    next(error);
  }
};

