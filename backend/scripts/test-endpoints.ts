#!/usr/bin/env tsx
/**
 * Test all backend endpoints
 * Usage: tsx scripts/test-endpoints.ts
 */

const API_BASE = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, status: 'pass', message: 'OK', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'fail', message, duration });
    console.error(`❌ ${name}: ${message}`);
  }
}

async function main() {
  console.log(`🧪 Testing endpoints at ${API_BASE}\n`);

  // 1. Health Check
  await test('Health Check', async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Health check failed');
    if (data.checks.database !== 'ok') throw new Error('Database check failed');
  });

  // 2. Registration
  const testEmail = `test${Date.now()}@example.com`;
  let testToken = '';
  
  await test('User Registration', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test1234',
        nickname: 'TestUser',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Status ${res.status}: ${err.message || res.statusText}`);
    }
    const data = await res.json();
    if (!data.success || !data.data.token) throw new Error('Registration failed');
    testToken = data.data.token;
  });

  // 3. Login
  await test('User Login', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test1234',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Status ${res.status}: ${err.message || res.statusText}`);
    }
    const data = await res.json();
    if (!data.success || !data.data.token) throw new Error('Login failed');
    testToken = data.data.token;
  });

  // 4. Protected Route (User Profile)
  await test('Get User Profile', async () => {
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Status ${res.status}: ${err.message || res.statusText}`);
    }
    const data = await res.json();
    if (!data.success || !data.data.email) throw new Error('Profile fetch failed');
  });

  // 5. Games List
  await test('Get Games List', async () => {
    const res = await fetch(`${API_BASE}/api/games?page=1&pageSize=10`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    // Response can be {success: true, data: {data: [...], total, page}} or {data: [...]}
    const games = data.data?.data || data.data || data;
    if (!Array.isArray(games)) throw new Error('Invalid games response - not an array');
  });

  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }

  console.log('\n✅ All tests passed!');
}

main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
