import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { register, login, refreshToken } from '../services/auth.service.js';
import { RegisterRequest, LoginRequest } from '../types/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const data: RegisterRequest = req.body;
    const result = await register(data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const data: LoginRequest = req.body;
    // Get sessionId from cookies or headers for cart/wishlist migration
    const sessionId = (req.cookies?.sessionId as string) || (req.headers['x-session-id'] as string);
    // Get IP address and user agent for login history
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;
    const result = await login(data, sessionId, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { refreshToken: refreshTokenString } = req.body;
    const result = await refreshToken(refreshTokenString);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

