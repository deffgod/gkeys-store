import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth.js';
import { AppError } from '../middleware/errorHandler.js';

// Verify Prisma client is available (non-blocking check)
if (!prisma) {
  console.error('⚠️  Prisma client not initialized');
}

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  if (!prisma) {
    throw new AppError('Database connection not available', 503);
  }

  const { email, password, nickname, firstName, lastName } = data;

  // Normalize email to lowercase for consistency
  const normalizedEmail = email.toLowerCase().trim();

  // Use transaction to ensure atomicity of user creation and token generation
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // Check if user already exists (within transaction)
      let existingUser;
      try {
        existingUser = await tx.user.findUnique({
          where: { email: normalizedEmail },
        });
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        throw new AppError('Database connection error. Please try again later.', 503);
      }

      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      let passwordHash: string;
      try {
        passwordHash = await hashPassword(password);
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        throw new AppError('Password processing error. Please try again.', 500);
      }

      // Create user (within transaction)
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
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
  } catch (error) {
    // Re-throw AppError as-is
    if (error instanceof AppError) {
      throw error;
    }
    // Handle unexpected errors
    console.error('Unexpected error during registration:', error);
    throw new AppError('Registration failed. Please try again later.', 500);
  }

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
    throw new AppError('Database connection not available', 503);
  }

  const { email, password } = data;

  // Normalize email to lowercase
  const normalizedEmail = email?.toLowerCase().trim();

  // Find user
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  } catch (dbError) {
    console.error('Database error during login:', dbError);
    throw new AppError('Database connection error. Please try again later.', 503);
  }

  // Record failed login attempt if user not found or password invalid
  const recordFailedLogin = async (userId?: string) => {
    try {
      // Only record if we have a userId (user exists but password wrong)
      if (userId) {
        await prisma.loginHistory.create({
          data: {
            userId,
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: false,
          },
        });
      }
      // Note: We don't record failed logins for non-existent users to avoid information leakage
    } catch (loginHistoryError) {
      // Non-blocking - log but don't fail
      console.warn('Failed to record login history:', loginHistoryError);
    }
  };

  if (!user) {
    // Don't record failed login for non-existent users (security best practice)
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  let isValidPassword = false;
  try {
    isValidPassword = await comparePassword(password, user.passwordHash);
  } catch (compareError) {
    console.error('Password comparison error:', compareError);
    await recordFailedLogin(user.id);
    throw new AppError('Invalid email or password', 401);
  }

  if (!isValidPassword) {
    await recordFailedLogin(user.id);
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  let token: string;
  let refreshToken: string;
  try {
    token = generateAccessToken(tokenPayload);
    refreshToken = generateRefreshToken(tokenPayload);
  } catch (tokenError) {
    console.error('Token generation error:', tokenError);
    throw new AppError('Authentication error. Please try again.', 500);
  }

  // Record successful login history (non-blocking)
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

      console.log(
        `[Auth] Cart/wishlist migration triggered for session ${sessionId} to user ${user.id}`
      );
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

export const refreshToken = async (
  refreshTokenString: string
): Promise<{ token: string; refreshToken: string; expiresIn: number }> => {
  if (!prisma) {
    throw new AppError('Database connection not available', 503);
  }

  try {
    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refreshTokenString);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Find user to ensure they still exist
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
    } catch (dbError) {
      console.error('Database error during token refresh:', dbError);
      throw new AppError('Database connection error. Please try again later.', 503);
    }

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    let newToken: string;
    let newRefreshToken: string;
    try {
      newToken = generateAccessToken(tokenPayload);
      newRefreshToken = generateRefreshToken(tokenPayload);
    } catch (tokenError) {
      console.error('Token generation error during refresh:', tokenError);
      throw new AppError('Authentication error. Please try again.', 500);
    }

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Log unexpected errors for debugging
    console.error('Unexpected error during token refresh:', error);
    throw new AppError('Invalid refresh token', 401);
  }
};
