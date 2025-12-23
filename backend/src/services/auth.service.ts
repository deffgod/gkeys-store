import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  if (!prisma) {
    const error: AppError = new Error('Database not available');
    error.statusCode = 503;
    throw error;
  }

  const { email, password, nickname, firstName, lastName } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname: nickname || 'Newbie Guy',
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      nickname: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
    },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Send registration email
  try {
    const { sendRegistrationEmail } = await import('./email.service.js');
    await sendRegistrationEmail(user.email, { username: user.nickname || 'User' });
  } catch (error) {
    console.error('Failed to send registration email:', error);
    // Don't fail registration if email fails
  }

  return {
    user,
    token,
    refreshToken,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  if (!prisma) {
    const error: AppError = new Error('Database not available');
    error.statusCode = 503;
    throw error;
  }

  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname || 'Newbie Guy',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      avatar: user.avatar || undefined,
      role: user.role,
    },
    token,
    refreshToken,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
};

export const refreshToken = async (refreshTokenString: string): Promise<{ token: string; refreshToken: string; expiresIn: number }> => {
  try {
    // Verify refresh token
    const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(refreshTokenString);

    // Find user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid refresh token', 401);
  }
};

