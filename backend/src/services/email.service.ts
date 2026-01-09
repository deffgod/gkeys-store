import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getActiveEmailSettings } from './email-settings.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fallback to environment variables if no DB settings
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.sendgrid.net';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER || 'apikey';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gkeys.store';

// Create transporter from settings
const createTransporter = async (): Promise<Transporter> => {
  const settings = await getActiveEmailSettings();

  if (settings) {
    return nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.password,
      },
    });
  }

  // Fallback to env vars
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

// Get from email from settings
const getFromEmail = async (): Promise<string> => {
  const settings = await getActiveEmailSettings();
  if (settings) {
    return settings.fromName ? `${settings.fromName} <${settings.fromEmail}>` : settings.fromEmail;
  }
  return EMAIL_FROM;
};

// Load email templates
const loadTemplate = async (
  templateName: string,
  variables: Record<string, string>
): Promise<string> => {
  // Try multiple paths for dev and production
  const possiblePaths = [
    path.join(__dirname, '..', 'templates', 'emails'), // dist/templates/emails (production)
    path.join(process.cwd(), 'src', 'templates', 'emails'), // src/templates/emails (dev)
    path.join(process.cwd(), 'backend', 'src', 'templates', 'emails'), // backend/src/templates/emails (from root)
  ];

  let templatePath: string | null = null;
  for (const dirPath of possiblePaths) {
    const testPath = path.join(dirPath, `${templateName}.html`);
    try {
      await fs.access(testPath);
      templatePath = testPath;
      break;
    } catch {
      // Try next path
    }
  }

  if (!templatePath) {
    console.error(`Template ${templateName}.html not found. Tried paths:`, possiblePaths);
    throw new Error(`Template ${templateName} not found`);
  }

  try {
    let template = await fs.readFile(templatePath, 'utf-8');

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return template;
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    // Return basic HTML as fallback
    return `
      <html>
        <body>
          <h1>${variables.title || 'GKEYS Store'}</h1>
          <p>${variables.content || ''}</p>
        </body>
      </html>
    `;
  }
};

export const sendRegistrationEmail = async (
  email: string,
  data: { username: string }
): Promise<void> => {
  const html = await loadTemplate('registration', {
    username: data.username,
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: 'Welcome to GKEYS Store!',
    html,
  });
};

export const sendBalanceTopUpEmail = async (
  email: string,
  data: { amount: number; currency: string; balance: number; paymentMethod?: string }
): Promise<void> => {
  const html = await loadTemplate('balance-topup', {
    amount: data.amount.toString(),
    currency: data.currency,
    balance: data.balance.toString(),
    date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
    paymentMethod: data.paymentMethod || 'Trustly',
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: 'Balance Top-up Successful',
    html,
  });
};

export const sendGameKeyEmail = async (
  email: string,
  data: { gameTitle: string; key: string; platform: string }
): Promise<void> => {
  const html = await loadTemplate('game-key', {
    gameTitle: data.gameTitle,
    key: data.key,
    platform: data.platform,
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: `Your Game Key: ${data.gameTitle}`,
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  data: { newPassword: string }
): Promise<void> => {
  const html = await loadTemplate('password-reset', {
    newPassword: data.newPassword,
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: 'Password Reset Request',
    html,
  });
};

export const sendEmailVerificationEmail = async (
  email: string,
  data: { verificationCode: string }
): Promise<void> => {
  const html = await loadTemplate('email-verification', {
    verificationCode: data.verificationCode,
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: 'Verify your GKEYS email address',
    html,
  });
};

export const sendTestEmail = async (
  templateName: string,
  email: string,
  variables: Record<string, string> = {}
): Promise<void> => {
  const { getEmailTemplate } = await import('./email-template.service.js');
  const template = await getEmailTemplate(templateName);

  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  // Replace variables in content
  let html = template.content || '';
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Replace variables in subject
  let subject = template.subject || '';
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: subject || 'Test Email from GKEYS Store',
    html,
  });
};

/**
 * Send bulk emails (newsletter/mass mailing)
 */
export const sendBulkEmails = async (
  emails: string[],
  templateName: string,
  variables: Record<string, string> = {},
  batchSize: number = 10
): Promise<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> }> => {
  const { getEmailTemplate } = await import('./email-template.service.js');
  const template = await getEmailTemplate(templateName);

  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  // Replace variables in content
  let html = template.content || '';
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Replace variables in subject
  let subject = template.subject || '';
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  const transporter = await createTransporter();
  const fromEmail = await getFromEmail();

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  // Send in batches to avoid overwhelming the SMTP server
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: subject || 'Email from GKEYS Store',
            html,
          });
          sent++;
        } catch (error: any) {
          failed++;
          errors.push({
            email,
            error: error.message || 'Unknown error',
          });
        }
      })
    );

    // Small delay between batches
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed, errors };
};
