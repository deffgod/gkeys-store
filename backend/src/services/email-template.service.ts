import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  registration: {
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

  // Try multiple paths
  const possiblePaths = [
    path.join(__dirname, '..', 'templates', 'emails'), // dist/templates/emails (production)
    path.join(process.cwd(), 'src', 'templates', 'emails'), // src/templates/emails (dev)
    path.join(process.cwd(), 'backend', 'src', 'templates', 'emails'), // backend/src/templates/emails (from root)
  ];

  let templatesDir: string | null = null;
  for (const dirPath of possiblePaths) {
    try {
      await fs.access(dirPath);
      templatesDir = dirPath;
      break;
    } catch {
      // Path doesn't exist, try next
    }
  }

  if (!templatesDir) {
    console.error('Templates directory not found. Tried:', possiblePaths);
    return templates;
  }

  for (const [key, metadata] of Object.entries(TEMPLATE_METADATA)) {
    try {
      const filePath = path.join(templatesDir, metadata.filename);
      const content = await fs.readFile(filePath, 'utf-8');

      templates.push({
        ...metadata,
        content,
      });
    } catch (error) {
      console.error(`Failed to load template ${key} from ${templatesDir}:`, error);
    }
  }

  return templates;
};

export const getEmailTemplate = async (
  templateName: string
): Promise<(EmailTemplate & { content: string }) | null> => {
  const metadata = TEMPLATE_METADATA[templateName];
  if (!metadata) {
    return null;
  }

  // Try multiple paths
  const possiblePaths = [
    path.join(__dirname, '..', 'templates', 'emails'), // dist/templates/emails (production)
    path.join(process.cwd(), 'src', 'templates', 'emails'), // src/templates/emails (dev)
    path.join(process.cwd(), 'backend', 'src', 'templates', 'emails'), // backend/src/templates/emails (from root)
  ];

  for (const dirPath of possiblePaths) {
    try {
      const filePath = path.join(dirPath, metadata.filename);
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        ...metadata,
        content,
      };
    } catch {
      // Try next path
    }
  }

  console.error(`Failed to load template ${templateName}. Tried paths:`, possiblePaths);
  return null;
};

export const updateEmailTemplate = async (
  templateName: string,
  content: string
): Promise<boolean> => {
  const metadata = TEMPLATE_METADATA[templateName];
  if (!metadata) {
    throw new Error(`Template ${templateName} not found`);
  }

  // Try multiple paths - use the first one that exists
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'templates', 'emails'), // src/templates/emails (dev - writable)
    path.join(process.cwd(), 'backend', 'src', 'templates', 'emails'), // backend/src/templates/emails (from root)
    path.join(__dirname, '..', 'templates', 'emails'), // dist/templates/emails (production - may not be writable)
  ];

  for (const dirPath of possiblePaths) {
    try {
      const filePath = path.join(dirPath, metadata.filename);
      await fs.access(dirPath);
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch {
      // Try next path
    }
  }

  // If no path worked, try to write to the first path anyway (create if needed)
  const firstPath = possiblePaths[0];
  try {
    await fs.mkdir(path.dirname(path.join(firstPath, metadata.filename)), { recursive: true });
    await fs.writeFile(path.join(firstPath, metadata.filename), content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to update template ${templateName}:`, error);
    throw error;
  }
};

export const getTemplateMetadata = (): Record<string, Omit<EmailTemplate, 'content'>> => {
  return TEMPLATE_METADATA;
};
