import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

export type G2AEnvironment = 'sandbox' | 'production';

export interface G2ASettingsData {
  clientId: string;
  email: string;
  clientSecret: string;
  apiKey?: string;
  environment?: G2AEnvironment;
  isActive?: boolean;
}

export interface G2ASettingsResponse {
  id: string;
  clientId: string;
  email: string;
  clientSecret: string;
  apiKey: string | null;
  environment: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface G2ATokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Generate G2A API Key
 * Formula: sha256(ClientId + Email + ClientSecret)
 */
export function generateG2AApiKey(clientId: string, email: string, clientSecret: string): string {
  return crypto
    .createHash('sha256')
    .update(clientId + email + clientSecret)
    .digest('hex');
}

/**
 * Get OAuth2 token for G2A API
 * @param settings - G2A settings to use for authentication
 * @returns Token response with access_token and expires_in
 */
export async function getG2AToken(settings: G2ASettingsResponse): Promise<G2ATokenResponse> {
  const isSandbox = settings.environment === 'sandbox';
  const baseUrl = isSandbox ? 'https://sandboxapi.g2a.com' : 'https://api.g2a.com';
  const tokenEndpoint = '/v1/token';

  const tokenHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSandbox) {
    // Sandbox uses simple Authorization header format: "hash, key"
    tokenHeaders.Authorization = `${settings.clientSecret}, ${settings.clientId}`;
  } else {
    // Production uses hash-based authentication
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hash = crypto
      .createHash('sha256')
      .update(settings.clientSecret + settings.clientId + timestamp)
      .digest('hex');

    tokenHeaders['X-API-HASH'] = settings.clientSecret;
    tokenHeaders['X-API-KEY'] = settings.clientId;
    tokenHeaders['X-G2A-Timestamp'] = timestamp;
    tokenHeaders['X-G2A-Hash'] = hash;
  }

  try {
    const response = await axios.get<G2ATokenResponse>(`${baseUrl}${tokenEndpoint}`, {
      headers: tokenHeaders,
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to obtain G2A token';
    const statusCode = error.response?.status || 500;
    throw new AppError(`G2A token error: ${errorMessage}`, statusCode);
  }
}

/**
 * Get current G2A settings
 */
export async function getG2ASettings(): Promise<G2ASettingsResponse | null> {
  const settings = await prisma.g2ASettings.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  return settings as G2ASettingsResponse | null;
}

/**
 * Get all G2A settings (including inactive)
 */
export async function getAllG2ASettings(): Promise<G2ASettingsResponse[]> {
  const settings = await prisma.g2ASettings.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  return settings as G2ASettingsResponse[];
}

/**
 * Create or update G2A settings
 */
export async function upsertG2ASettings(data: G2ASettingsData): Promise<G2ASettingsResponse> {
  // Generate API key if not provided
  const apiKey = data.apiKey || generateG2AApiKey(data.clientId, data.email, data.clientSecret);
  const environment = data.environment || 'sandbox';

  // Deactivate all existing settings if this one should be active
  if (data.isActive !== false) {
    await prisma.g2ASettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  // Check if settings with this clientId already exist
  const existing = await prisma.g2ASettings.findUnique({
    where: { clientId: data.clientId },
  });

  if (existing) {
    // Update existing settings
    const updated = await prisma.g2ASettings.update({
      where: { clientId: data.clientId },
      data: {
        email: data.email,
        clientSecret: data.clientSecret,
        apiKey,
        environment,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return updated as G2ASettingsResponse;
  } else {
    // Create new settings
    const created = await prisma.g2ASettings.create({
      data: {
        clientId: data.clientId,
        email: data.email,
        clientSecret: data.clientSecret,
        apiKey,
        environment,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return created as G2ASettingsResponse;
  }
}

/**
 * Update G2A settings by ID
 */
export async function updateG2ASettings(
  id: string,
  data: Partial<G2ASettingsData>
): Promise<G2ASettingsResponse> {
  const existing = await prisma.g2ASettings.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('G2A settings not found', 404);
  }

  // If clientId, email, or clientSecret is being updated, regenerate API key
  let apiKey = existing.apiKey;
  if (data.clientId || data.email || data.clientSecret) {
    const clientId = data.clientId || existing.clientId;
    const email = data.email || existing.email;
    const clientSecret = data.clientSecret || existing.clientSecret;
    apiKey = generateG2AApiKey(clientId, email, clientSecret);
  }

  // Deactivate all other settings if this one is being activated
  if (data.isActive === true) {
    await prisma.g2ASettings.updateMany({
      where: { isActive: true, id: { not: id } },
      data: { isActive: false },
    });
  }

  const updated = await prisma.g2ASettings.update({
    where: { id },
    data: {
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.email && { email: data.email }),
      ...(data.clientSecret && { clientSecret: data.clientSecret }),
      ...(apiKey && { apiKey }),
      ...(data.environment && { environment: data.environment }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated as G2ASettingsResponse;
}

/**
 * Delete G2A settings
 */
export async function deleteG2ASettings(id: string): Promise<void> {
  const existing = await prisma.g2ASettings.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('G2A settings not found', 404);
  }

  await prisma.g2ASettings.delete({
    where: { id },
  });
}
