import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  if (!prisma) {
    throw new AppError('Database not available', 503);
  }

  const { email, password, nickname, firstName, lastName } = data;

  // Use transaction to ensure atomicity of user creation and token generation
  const result = await prisma.$transaction(async (tx) => {
    // Check if user already exists (within transaction)
    const existingUser = await tx.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (within transaction)
    const user = await tx.user.create({
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

    // Generate tokens (synchronous, fast operation - safe to include in transaction context)
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { user, token, refreshToken };
  });

  // Send registration email (non-blocking, fire-and-forget)
  // Email failures should not block registration
  try {
    const { sendRegistrationEmail } = await import('./email.service.js');
    await sendRegistrationEmail(result.user.email, { username: result.user.nickname || 'User' });
  } catch (error) {
    console.error('Failed to send registration email:', error);
    // Don't fail registration if email fails - already logged
  }

  return {
    user: result.user,
    token: result.token,
    refreshToken: result.refreshToken,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
  };
};

export const login = async (
  data: LoginRequest, 
  sessionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse> => {
  if (!prisma) {
    throw new AppError('Database not available', 503);
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

  // Record login history (non-blocking)
  try {
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        success: true,
      },
    });
  } catch (loginHistoryError) {
    // Non-blocking - log but don't fail login
    console.warn('Failed to record login history:', loginHistoryError);
  }

  // Trigger cart/wishlist migration if guest session exists
  // This is non-blocking - migration failures should not prevent login
  if (sessionId) {
    try {
      const { migrateSessionCartToUser } = await import('./cart.service.js');
      const { migrateSessionWishlistToUser } = await import('./wishlist.service.js');
      
      // Migrate cart and wishlist in parallel (non-blocking)
      await Promise.allSettled([
        migrateSessionCartToUser(sessionId, user.id),
        migrateSessionWishlistToUser(sessionId, user.id),
      ]);
      
      console.log(`[Auth] Cart/wishlist migration triggered for session ${sessionId} to user ${user.id}`);
    } catch (migrationError) {
      // Non-blocking - log but don't fail login
      console.warn('Failed to trigger cart/wishlist migration during login:', migrationError);
    }
  }

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
    const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = await import('../utils/jwt.js');
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

