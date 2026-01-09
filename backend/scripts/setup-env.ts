#!/usr/bin/env tsx
/**
 * Environment Variables Setup Script
 * 
 * Генерирует полный список env переменных и помогает настроить .env файлы
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');
const backendDir = resolve(__dirname, '..');

const FRONTEND_ENV_EXAMPLE = `# ============================================
# Frontend Environment Variables
# ============================================
# Copy this file to .env and fill in your values

# Backend API base URL
# Development: http://localhost:3001/api
# Production: https://your-project.vercel.app/api
VITE_API_BASE_URL=http://localhost:3001/api
`;

const BACKEND_ENV_EXAMPLE = `# ============================================
# Backend Environment Variables
# ============================================
# Copy this file to .env and fill in your values

# ============================================
# Database Configuration (REQUIRED)
# ============================================
# PostgreSQL connection string
# For local development: postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public
# For production: Use your production database URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public

# Direct database connection (bypasses Prisma Accelerate)
# Usually same as DATABASE_URL, but required for Vercel/serverless deployments
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public

# ============================================
# Server Configuration (REQUIRED)
# ============================================
# Server port (default: 3001)
PORT=3001

# Frontend URL for CORS and redirects
# Development: http://localhost:5173
# Production: https://your-project.vercel.app
FRONTEND_URL=http://localhost:5173

# Node environment (development, production, test)
NODE_ENV=development

# ============================================
# JWT Authentication (REQUIRED)
# ============================================
# JWT Secret for access tokens (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secret-key-change-in-production-minimum-32-characters-long

# JWT Refresh Secret (minimum 32 characters, MUST be different from JWT_SECRET)
# Generate with: openssl rand -base64 32
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret-minimum-32-characters

# JWT Token Expiration (optional, defaults shown)
# JWT_EXPIRES_IN=7d
# JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# Redis Configuration (Optional but Recommended)
# ============================================
# Redis URL for caching and session management
# REDIS_URL=redis://localhost:6379
# REDIS_GKEYS_REDIS_URL=redis://default:password@host:port

# ============================================
# Email Configuration (Optional)
# ============================================
# SMTP settings for email notifications
# Can also be configured via admin panel at /admin/email-settings
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASS=your-smtp-password-or-api-key
# EMAIL_FROM=noreply@gkeys.store

# ============================================
# G2A Integration (Optional - only if using G2A)
# ============================================
# G2A API Base URL
# Sandbox: https://sandboxapi.g2a.com/v1
# Production: https://api.g2a.com/v1
# G2A_API_URL=https://sandboxapi.g2a.com/v1

# G2A API Key (Client ID)
# G2A_API_KEY=your-g2a-api-key

# G2A API Hash (Client Secret)
# G2A_API_HASH=your-g2a-api-hash

# G2A Environment (sandbox or live)
# G2A_ENV=sandbox

# G2A Email (for Export API)
# G2A_EMAIL=Welcome@nalytoo.com

# G2A Request Timeout in milliseconds (default: 8000)
# G2A_TIMEOUT_MS=8000

# G2A Max Retries (default: 2)
# G2A_RETRY_MAX=2

# ============================================
# Payment Gateways (Optional - only if using)
# ============================================
# Stripe
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal
# PAYPAL_CLIENT_ID=your_paypal_client_id
# PAYPAL_CLIENT_SECRET=your_paypal_client_secret
# PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
# PAYPAL_WEBHOOK_ID=your_webhook_id

# Mollie
# MOLLIE_API_KEY=test_your_mollie_api_key

# ============================================
# Advanced Configuration (Optional)
# ============================================
# Force direct database connection (bypass Accelerate)
# FORCE_DIRECT_DB=false

# CORS allowed origins (comma-separated, overrides FRONTEND_URL)
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Session Secret (for session middleware)
# SESSION_SECRET=your-session-secret-minimum-32-characters

# Rate Limiting (requests per minute per IP)
# RATE_LIMIT_MAX=100

# Request Timeout (milliseconds)
# REQUEST_TIMEOUT=30000

# Log Level (error, warn, info, debug)
# LOG_LEVEL=info

# Enable Request Logging
# ENABLE_REQUEST_LOGGING=true

# Enable API Documentation
# ENABLE_API_DOCS=true

# Test Mode (disables some validations)
# TEST_MODE=false

# Debug Mode
# DEBUG=false
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateJWTSecrets(): { jwtSecret: string; refreshSecret: string } {
  // Generate random secrets (simplified version - in real scenario use crypto)
  const jwtSecret = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  const refreshSecret = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  return { jwtSecret, refreshSecret };
}

async function main() {
  console.log('🔧 Environment Variables Setup\n');

  // Create frontend .env.example
  const frontendEnvExamplePath = resolve(rootDir, '.env.example');
  if (!existsSync(frontendEnvExamplePath)) {
    writeFileSync(frontendEnvExamplePath, FRONTEND_ENV_EXAMPLE);
    console.log('✅ Created .env.example in project root');
  } else {
    console.log('ℹ️  .env.example already exists in project root');
  }

  // Create backend .env.example
  const backendEnvExamplePath = resolve(backendDir, '.env.example');
  if (!existsSync(backendEnvExamplePath)) {
    writeFileSync(backendEnvExamplePath, BACKEND_ENV_EXAMPLE);
    console.log('✅ Created backend/.env.example');
  } else {
    console.log('ℹ️  backend/.env.example already exists');
  }

  // Check if .env files exist
  const frontendEnvPath = resolve(rootDir, '.env');
  const backendEnvPath = resolve(backendDir, '.env');

  if (!existsSync(frontendEnvPath)) {
    console.log('\n📝 Frontend .env file not found');
    console.log('   Run: cp .env.example .env');
    console.log('   Then edit .env with your values');
  } else {
    console.log('\n✅ Frontend .env file exists');
  }

  if (!existsSync(backendEnvPath)) {
    console.log('\n📝 Backend .env file not found');
    console.log('   Run: cp backend/.env.example backend/.env');
    console.log('   Then edit backend/.env with your values');
    
    // Offer to generate JWT secrets
    console.log('\n🔐 Generate JWT secrets? (recommended)');
    console.log('   Run: openssl rand -base64 32');
    console.log('   (run twice to get JWT_SECRET and JWT_REFRESH_SECRET)');
  } else {
    console.log('\n✅ Backend .env file exists');
    
    // Check if JWT secrets are set
    const envContent = readFileSync(backendEnvPath, 'utf-8');
    const hasJWTSecret = envContent.includes('JWT_SECRET=') && 
                        !envContent.includes('JWT_SECRET=your-secret-key');
    const hasRefreshSecret = envContent.includes('JWT_REFRESH_SECRET=') && 
                            !envContent.includes('JWT_REFRESH_SECRET=your-refresh-secret');
    
    if (!hasJWTSecret || !hasRefreshSecret) {
      console.log('\n⚠️  JWT secrets need to be configured');
      console.log('   Generate with: openssl rand -base64 32');
    }
  }

  console.log('\n📚 For complete documentation, see: docs/ENVIRONMENT_VARIABLES.md');
  console.log('✅ Setup complete!\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
