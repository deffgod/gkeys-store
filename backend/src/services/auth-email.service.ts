import prisma from '../config/database.js';
import { hashPassword } from '../utils/bcrypt.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from './email.service.js';
import crypto from 'crypto';

/**
 * Forgot password - send reset email
 */
export const forgotPassword = async (email: string): Promise<void> => {
  if (!prisma) {
    throw new AppError('Database connection not available', 503);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Don't reveal if user exists (security best practice)
    // Just return success silently
    return;
  }

  // Generate new password
  const newPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Send password reset email
  try {
    await sendPasswordResetEmail(user.email, { newPassword });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't fail the operation if email fails
  }
};

/**
 * Send email verification code
 */
export const sendVerificationCode = async (userId: string): Promise<string> => {
  if (!prisma) {
    throw new AppError('Database connection not available', 503);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.emailVerified) {
    throw new AppError('Email already verified', 400);
  }

  // Generate verification code (6 digits)
  const verificationCode = crypto.randomInt(100000, 999999).toString();

  // Store verification code in user's session or temporary storage
  // For now, we'll just send it. In production, you might want to store it in Redis
  // with expiration (e.g., 15 minutes)

  // Send verification email
  try {
    await sendEmailVerificationEmail(user.email, { verificationCode });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new AppError('Failed to send verification email', 500);
  }

  return verificationCode;
};

/**
 * Verify email with code
 */
export const verifyEmail = async (userId: string, _code: string): Promise<void> => {
  if (!prisma) {
    throw new AppError('Database connection not available', 503);
  }

  // In production, you would verify the code from Redis/cache
  // For now, this is a placeholder - you'll need to implement code storage/verification
  // This is just the structure

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.emailVerified) {
    throw new AppError('Email already verified', 400);
  }

  // TODO: Verify code from cache/Redis
  // For now, we'll just mark as verified (not secure, but shows structure)
  // In production, implement proper code verification

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
};
