#!/usr/bin/env tsx
/**
 * Test G2A integration endpoints
 * Usage: tsx scripts/test-g2a.ts [admin_token]
 * 
 * Note: Requires admin JWT token for protected endpoints
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.argv[2] || process.env.ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.e30.jBrIDEb49OUZvDk2UfwaGf_cH5YSDzR1rdaoKqOVafk';

if (!ADMIN_TOKEN) {
  console.warn('⚠️  No admin token provided. Some tests will be skipped.');
  console.log('Usage: tsx scripts/test-g2a.ts <admin_token>');
  console.log('Or set ADMIN_TOKEN environment variable\n');
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
