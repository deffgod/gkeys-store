import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Validate JWT secrets on module initialization - fail fast if invalid
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. Please set it to a secure random string of at least 32 characters.'
  );
}
if (JWT_SECRET.length < 32) {
  throw new Error(
    `JWT_SECRET must be at least 32 characters long. Current length: ${JWT_SECRET.length}. Please set a longer secret in environment variables.`
  );
}

if (!JWT_REFRESH_SECRET) {
  throw new Error(
    'JWT_REFRESH_SECRET environment variable is required. Please set it to a secure random string of at least 32 characters (different from JWT_SECRET).'
  );
}
if (JWT_REFRESH_SECRET.length < 32) {
  throw new Error(
    `JWT_REFRESH_SECRET must be at least 32 characters long. Current length: ${JWT_REFRESH_SECRET.length}. Please set a longer secret in environment variables.`
  );
}

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error(
    'JWT_SECRET and JWT_REFRESH_SECRET must be different. Please set different secrets in environment variables.'
  );
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Validate payload structure
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload: missing required fields');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active yet');
    }
    // Re-throw if it's our custom error or unknown error
    throw error;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;

    // Validate payload structure
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload: missing required fields');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Refresh token not active yet');
    }
    // Re-throw if it's our custom error or unknown error
    throw error;
  }
};
