import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailSettingsData {
  name?: string;
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName?: string;
  isActive?: boolean;
}

export interface EmailSettingsResponse {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get active email settings
 */
export async function getActiveEmailSettings(): Promise<EmailSettingsResponse | null> {
  const settings = await prisma.emailSettings.findFirst({
    where: { isActive: true },
  });

  return settings;
}

/**
 * Get email settings by name
 */
export async function getEmailSettingsByName(name: string): Promise<EmailSettingsResponse | null> {
  const settings = await prisma.emailSettings.findUnique({
    where: { name },
  });

  return settings;
}

/**
 * Get all email settings
 */
export async function getAllEmailSettings(): Promise<EmailSettingsResponse[]> {
  const settings = await prisma.emailSettings.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return settings;
}

/**
 * Get email settings by ID
 */
export async function getEmailSettingsById(id: string): Promise<EmailSettingsResponse | null> {
  const settings = await prisma.emailSettings.findUnique({
    where: { id },
  });

  return settings;
}

/**
 * Create or update email settings
 */
export async function upsertEmailSettings(data: EmailSettingsData): Promise<EmailSettingsResponse> {
  const name = data.name || 'default';

  // Deactivate all existing settings if this one should be active
  if (data.isActive !== false) {
    await prisma.emailSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  // Check if settings with this name already exist
  const existing = await prisma.emailSettings.findUnique({
    where: { name },
  });

  if (existing) {
    // Update existing settings
    const updated = await prisma.emailSettings.update({
      where: { name },
      data: {
        host: data.host,
        port: data.port,
        secure: data.secure !== undefined ? data.secure : false,
        user: data.user,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return updated;
  } else {
    // Create new settings
    const created = await prisma.emailSettings.create({
      data: {
        name,
        host: data.host,
        port: data.port,
        secure: data.secure !== undefined ? data.secure : false,
        user: data.user,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return created;
  }
}

/**
 * Update email settings by ID
 */
export async function updateEmailSettings(
  id: string,
  data: Partial<EmailSettingsData>
): Promise<EmailSettingsResponse> {
  // If setting this as active, deactivate all others
  if (data.isActive === true) {
    await prisma.emailSettings.updateMany({
      where: { isActive: true, id: { not: id } },
      data: { isActive: false },
    });
  }

  // Build update data, only include password if it's provided and not empty
  const updateData: any = {
    ...(data.host !== undefined && { host: data.host }),
    ...(data.port !== undefined && { port: data.port }),
    ...(data.secure !== undefined && { secure: data.secure }),
    ...(data.user !== undefined && { user: data.user }),
    ...(data.fromEmail !== undefined && { fromEmail: data.fromEmail }),
    ...(data.fromName !== undefined && { fromName: data.fromName || null }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  };

  // Only update password if it's provided and not empty
  if (data.password !== undefined && data.password.trim() !== '') {
    updateData.password = data.password;
  }

  const updated = await prisma.emailSettings.update({
    where: { id },
    data: updateData,
  });

  return updated;
}

/**
 * Delete email settings
 */
export async function deleteEmailSettings(id: string): Promise<void> {
  await prisma.emailSettings.delete({
    where: { id },
  });
}

/**
 * Test email settings connection
 */
export async function testEmailSettings(settings: EmailSettingsResponse): Promise<boolean> {
  try {
    const nodemailer = await import('nodemailer');
    const testTransporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.password,
      },
    });

    await testTransporter.verify();
    return true;
  } catch (error) {
    console.error('Email settings test failed:', error);
    return false;
  }
}
