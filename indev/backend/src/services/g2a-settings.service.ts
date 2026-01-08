import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../lib/errors/AppError.js';

const prisma = new PrismaClient();

export interface G2ASettingsData {
  clientId: string;
  email: string;
  clientSecret: string;
  apiKey?: string;
  isActive?: boolean;
}

export interface G2ASettingsResponse {
  id: string;
  clientId: string;
  email: string;
  clientSecret: string;
  apiKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate G2A API Key
 * Formula: sha256(ClientId + Email + ClientSecret)
 */
export function generateG2AApiKey(
  clientId: string,
  email: string,
  clientSecret: string
): string {
  return crypto
    .createHash('sha256')
    .update(clientId + email + clientSecret)
    .digest('hex');
}

/**
 * Get current G2A settings
 */
export async function getG2ASettings(): Promise<G2ASettingsResponse | null> {
  const settings = await prisma.g2ASettings.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  return settings;
}

/**
 * Get all G2A settings (including inactive)
 */
export async function getAllG2ASettings(): Promise<G2ASettingsResponse[]> {
  const settings = await prisma.g2ASettings.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  return settings;
}

/**
 * Create or update G2A settings
 */
export async function upsertG2ASettings(
  data: G2ASettingsData
): Promise<G2ASettingsResponse> {
  // Generate API key if not provided
  const apiKey = data.apiKey || generateG2AApiKey(data.clientId, data.email, data.clientSecret);

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
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return updated;
  } else {
    // Create new settings
    const created = await prisma.g2ASettings.create({
      data: {
        clientId: data.clientId,
        email: data.email,
        clientSecret: data.clientSecret,
        apiKey,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return created;
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
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated;
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
