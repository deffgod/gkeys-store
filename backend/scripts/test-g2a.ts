#!/usr/bin/env tsx
/**
 * Test G2A integration endpoints
 * Usage: tsx scripts/test-g2a.ts [admin_token]
 * 
 * Note: Requires admin JWT token for protected endpoints
 * Automatically fetches G2A OAuth2 token from G2A API
 */

import dotenv from 'dotenv';
import { loadG2AEnvVars } from '../src/lib/g2a/config/env.js';
console.log(`🔍 process.env.API_BASE_URL: ${process.env.API_BASE_URL}`);


dotenv.config();

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.argv[2] || process.env.ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.e30.jBrIDEb49OUZvDk2UfwaGf_cH5YSDzR1rdaoKqOVafk';
const G2A_API_KEY = process.env.G2A_API_KEY || 'DNvKyOKBjWTVBmEw';
const G2A_API_HASH = process.env.G2A_API_HASH || 'rksBZDeNuUHnDkOiPCyJEdDHZUnlhydS';
// const G2A_EMAIL = process.env.G2A_EMAIL || 'welcome@nalytoo.com'; // Reserved for future use
const G2A_API_URL = process.env.G2A_API_URL || 'https://api.g2a.com';
const G2A_ENV = process.env.G2A_ENV || 'live';


if (!ADMIN_TOKEN) {
  console.warn('⚠️  No admin token provided. Some tests will be skipped.');
  console.log('Usage: tsx scripts/test-g2a.ts <admin_token>');
  console.log('Or set ADMIN_TOKEN environment variable\n');
}

/**
 * Get G2A OAuth2 token from G2A API
 * Documentation: https://www.g2a.com/integration-api/documentation/import/#operation/getToken
 * 
 * For sandbox: GET /token with Authorization header "{hash}, {key}"
 * For production: GET /token with hash-based headers or POST /oauth/token with OAuth2
 */
async function getG2AToken(): Promise<string | null> {
  try {
    const g2aConfig = loadG2AEnvVars();
    const crypto = await import('crypto');
    
    const isSandbox = G2A_ENV === 'sandbox';
    
    // Determine token endpoint based on environment
    // For sandbox: use GET /token with hash-based auth
    // For production: try GET /token first, fallback to POST /oauth/token
    const baseUrl = isSandbox
      ? 'https://sandboxapi.g2a.com/v1'
      : 'https://api.g2a.com/v1';

    console.log(`\n🔐 Fetching G2A OAuth2 token from: ${baseUrl}/token`);
    console.log(`📋 Environment: ${g2aConfig.env}`);

    // Prepare headers based on environment
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (isSandbox) {
      // Sandbox: Use Authorization header format "{hash}, {key}"
      headers.Authorization = `${g2aConfig.apiHash}, ${g2aConfig.apiKey}`;
    } else {
      // Production: Use hash-based authentication
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const hash = crypto
        .createHash('sha256')
        .update(g2aConfig.apiHash + g2aConfig.apiKey + timestamp)
        .digest('hex');
      
      headers['X-API-HASH'] = g2aConfig.apiHash;
      headers['X-API-KEY'] = g2aConfig.apiKey;
      headers['X-G2A-Timestamp'] = timestamp;
      headers['X-G2A-Hash'] = hash;
    }

    // Try GET /token first (works for both sandbox and production)
    let response = await fetch(`${baseUrl}/token`, {
      method: 'GET',
      headers,
    });

    // If GET fails for production, try POST /oauth/token with OAuth2
    if (!response.ok && !isSandbox) {
      console.log(`   GET /token failed, trying POST /oauth/token...`);
      const oauthUrl = `${G2A_API_URL}/oauth/token`;
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: G2A_API_KEY,
        client_secret: G2A_API_HASH,
      });

      response = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `Failed to get G2A token: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
      );
    }

    const data = await response.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      throw new Error('No access_token in response');
    }

    console.log(`✅ G2A OAuth2 token obtained successfully`);
    console.log(`   Token Type: ${data.token_type || 'Bearer'}`);
    console.log(`   Expires In: ${data.expires_in || 'N/A'} seconds`);
    console.log(`   Token: ${accessToken.substring(0, 20)}...`);

    return accessToken;
  } catch (error) {
    console.warn(`⚠️  Failed to get G2A token: ${error instanceof Error ? error.message : String(error)}`);
    console.warn('   Some G2A API tests may be skipped\n');
    return null;
  }
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>, skip = false): Promise<void> {
  if (skip) {
    results.push({ name, status: 'skip', message: 'Skipped (no admin token)' });
    console.log(`⏭️  ${name} (skipped)`);
    return;
  }

  try {
    await fn();
    results.push({ name, status: 'pass', message: 'OK' });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'fail', message });
    console.error(`❌ ${name}: ${message}`);
  }
}

async function main() {
  console.log(`🧪 Testing G2A endpoints at ${API_BASE}\n`);

  // Get G2A OAuth2 token
  const g2aToken = await getG2AToken();

  // 1. Health Check (G2A status)
  await test('Health Check - G2A Status', async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.checks.g2a !== 'ok' && data.checks.g2a !== 'error') {
      throw new Error(`Unexpected G2A check status: ${data.checks.g2a}`);
    }
    console.log(`   G2A check: ${data.checks.g2a}`);
  });

  // 2. G2A Status (Admin)
  await test('G2A Status Endpoint', async () => {
    const res = await fetch(`${API_BASE}/api/admin/g2a/status`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized - need admin token');
      }
      throw new Error(`Status ${res.status}`);
    }
    const data = await res.json();
    console.log(`   Last sync: ${data.data.lastSync || 'Never'}`);
    console.log(`   Total products: ${data.data.totalProducts || 0}`);
  }, !ADMIN_TOKEN);

  // 3. G2A Metrics (Admin)
  await test('G2A Metrics Endpoint', async () => {
    const res = await fetch(`${API_BASE}/api/admin/g2a/metrics`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized - need admin token');
      }
      throw new Error(`Status ${res.status}`);
    }
    const data = await res.json();
    console.log(`   Requests: ${data.data.requests_total || 0} total`);
    console.log(`   Webhooks: ${data.data.webhook_total || 0} total`);
  }, !ADMIN_TOKEN);

  // 4. G2A Webhook Endpoint (Public)
  await test('G2A Webhook Endpoint (Invalid Request)', async () => {
    const res = await fetch(`${API_BASE}/api/g2a/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'invalid' }),
    });
    // Should return 400 for invalid webhook
    if (res.status !== 400 && res.status !== 401) {
      throw new Error(`Expected 400/401, got ${res.status}`);
    }
  });

  // 5. Test G2A Token (if obtained)
  if (g2aToken) {
    await test('G2A OAuth2 Token Validation', async () => {
      // Test that token is valid by checking its format
      if (!g2aToken || g2aToken.length < 10) {
        throw new Error('Invalid token format');
      }
      console.log(`   Token length: ${g2aToken.length} characters`);
      console.log(`   Token format: Valid`);
    });
  } else {
    results.push({ 
      name: 'G2A OAuth2 Token Validation', 
      status: 'skip', 
      message: 'Skipped (G2A token not obtained)' 
    });
    console.log(`⏭️  G2A OAuth2 Token Validation (skipped - token not obtained)`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }

  if (skipped > 0) {
    console.log('\n💡 Tip: Provide admin token to test protected endpoints:');
    console.log('   tsx scripts/test-g2a.ts <admin_token>');
  }

  console.log('\n✅ All tests passed!');
}

main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
