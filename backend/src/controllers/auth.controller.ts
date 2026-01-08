import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { register, login, refreshToken } from '../services/auth.service.js';
import { RegisterRequest, LoginRequest } from '../types/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { getUserProfile } from '../services/user.service.js';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
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

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
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

export const refreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
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

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clear cookies if any
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserController = async (
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

    const profile = await getUserProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const { forgotPassword } = await import('../services/auth-email.service.js');
    await forgotPassword(email);

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset email has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const sendVerificationCodeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { sendVerificationCode } = await import('../services/auth-email.service.js');
    const code = await sendVerificationCode(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      // In production, don't return the code - it should only be in email
      // For development/testing, you might want to return it
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
    }

    const { verifyEmail } = await import('../services/auth-email.service.js');
    await verifyEmail(req.user.userId, code);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};
