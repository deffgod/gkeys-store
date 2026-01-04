import fs from 'fs/promises';
import path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates', 'emails');

export interface EmailTemplate {
  name: string;
  filename: string;
  description: string;
  variables: string[];
  subject: string;
  content?: string;
}

// Template metadata
const TEMPLATE_METADATA: Record<string, Omit<EmailTemplate, 'content'>> = {
  'registration': {
    name: 'Registration',
    filename: 'registration.html',
    description: 'Welcome email sent to new users after registration',
    variables: ['username'],
    subject: 'Welcome to GKEYS Store!',
  },
  'game-key': {
    name: 'Game Key',
    filename: 'game-key.html',
    description: 'Email sent when a game key is delivered to the user',
    variables: ['gameTitle', 'key', 'platform'],
    subject: 'Your Game Key: {{gameTitle}}',
  },
  'balance-topup': {
    name: 'Balance Top-up',
    filename: 'balance-topup.html',
    description: 'Email sent when user successfully tops up their balance',
    variables: ['amount', 'newBalance'],
    subject: 'Balance Top-up Successful',
  },
  'password-reset': {
    name: 'Password Reset',
    filename: 'password-reset.html',
    description: 'Email sent when user requests password reset',
    variables: ['newPassword'],
    subject: 'Password Reset Request',
  },
  'email-verification': {
    name: 'Email Verification',
    filename: 'email-verification.html',
    description: 'Email sent for email address verification',
    variables: ['verificationCode'],
    subject: 'Verify your GKEYS email address',
  },
};

export const getEmailTemplates = async (): Promise<(EmailTemplate & { content: string })[]> => {
  const templates: (EmailTemplate & { content: string })[] = [];

  for (const [key, metadata] of Object.entries(TEMPLATE_METADATA)) {
    try {
      const filePath = path.join(TEMPLATES_DIR, metadata.filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      templates.push({
        ...metadata,
        content,
      });
    } catch (error) {
      console.error(`Failed to load template ${key}:`, error);
    }
  }

  return templates;
};

export const getEmailTemplate = async (templateName: string): Promise<(EmailTemplate & { content: string }) | null> => {
  const metadata = TEMPLATE_METADATA[templateName];
  if (!metadata) {
    return null;
  }

  try {
    const filePath = path.join(TEMPLATES_DIR, metadata.filename);
    const content = await fs.readFile(filePath, 'utf-8');

    return {
      ...metadata,
      content,
    };
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    return null;
  }
};

export const updateEmailTemplate = async (
  templateName: string,
  content: string
): Promise<boolean> => {
  const metadata = TEMPLATE_METADATA[templateName];
  if (!metadata) {
    throw new Error(`Template ${templateName} not found`);
  }

  try {
    const filePath = path.join(TEMPLATES_DIR, metadata.filename);
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to update template ${templateName}:`, error);
    throw error;
  }
};

export const getTemplateMetadata = (): Record<string, Omit<EmailTemplate, 'content'>> => {
  return TEMPLATE_METADATA;
};
