import { Request, Response, NextFunction } from 'express';
import { processG2AWebhook } from '../services/g2a-webhook.service.js';
import { G2AWebhookEvent } from '../types/g2a.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * G2A Webhook Controller
 * Handles incoming webhook events from G2A API
 */
export const g2aWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as G2AWebhookEvent;
    const headers = req.headers as Record<string, string>;
    
    // Extract signature, nonce, timestamp from headers (G2A may send these in headers)
    const signature = headers['x-g2a-signature'] || headers.signature || body.signature || '';
    const nonce = headers['x-g2a-nonce'] || headers.nonce || body.nonce || '';
    const timestamp = Number(headers['x-g2a-timestamp'] || headers.timestamp || body.timestamp || Date.now());
    
    // Ensure signature, nonce, timestamp are in the event object
    const event: G2AWebhookEvent = {
      ...body,
      signature: signature || body.signature,
      nonce: nonce || body.nonce,
      timestamp: timestamp || body.timestamp || Date.now(),
    };
    
    const result = await processG2AWebhook(event, headers);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
