import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.sendgrid.net';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER || 'apikey';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gkeys.store';

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Load email templates
const loadTemplate = async (
  templateName: string,
  variables: Record<string, string>
): Promise<string> => {
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'emails',
      `${templateName}.html`
    );
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

  await transporter.sendMail({
    from: EMAIL_FROM,
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

  await transporter.sendMail({
    from: EMAIL_FROM,
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

  await transporter.sendMail({
    from: EMAIL_FROM,
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

  await transporter.sendMail({
    from: EMAIL_FROM,
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

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your GKEYS email address',
    html,
  });
};
