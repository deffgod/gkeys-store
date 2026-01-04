/**
 * Integration test script for authentication fixes
 * 
 * Tests authentication with real database operations:
 * 1. User registration
 * 2. User login
 * 3. Token refresh
 * 4. Email normalization
 * 5. Failed login recording
 */

// Set environment variables before importing modules
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-different-from-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
process.env.NODE_ENV = 'test';

import { register, login, refreshToken } from '../src/services/auth.service.js';
import prisma from '../src/config/database.js';
import { verifyAccessToken } from '../src/utils/jwt.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
const TEST_EMAIL = `test-auth-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123';
const TEST_UPPERCASE_EMAIL = TEST_EMAIL.toUpperCase();
let createdUserId: string | null = null;
let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) {
    console.log(`   Error: ${error}`);
  }
}

async function cleanup() {
  if (createdUserId) {
    try {
      // Delete login history first (foreign key constraint)
      await prisma.loginHistory.deleteMany({
        where: { userId: createdUserId },
      });
      
      // Delete user
      await prisma.user.delete({
        where: { id: createdUserId },
      });
      
      console.log('🧹 Cleaned up test user');
    } catch (error) {
      console.warn('⚠️  Failed to cleanup test user:', error);
    }
  }
}

async function testUserRegistration() {
  try {
    const result = await register({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      nickname: 'Test User',
    });
    
    const isValid = 
      result.user &&
      result.user.email === TEST_EMAIL.toLowerCase() &&
      result.token &&
      result.refreshToken &&
      result.expiresIn > 0;
    
    if (isValid && result.user) {
      createdUserId = result.user.id;
      accessToken = result.token;
      refreshTokenValue = result.refreshToken;
    }
    
    logTest('User registration with email normalization', isValid);
  } catch (error) {
    logTest('User registration with email normalization', false, String(error));
  }
}

async function testDuplicateEmailRegistration() {
  try {
    await register({
      email: TEST_EMAIL, // Same email
      password: 'AnotherPass123',
      nickname: 'Another User',
    });
    
    logTest('Duplicate email registration rejection', false, 'Should have thrown error');
  } catch (error: any) {
    const isRejected = 
      error.message?.includes('already exists') ||
      error.statusCode === 409;
    
    logTest('Duplicate email registration rejection', isRejected);
  }
}

async function testLoginWithValidCredentials() {
  try {
    const result = await login({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    const isValid = 
      result.user &&
      result.user.email === TEST_EMAIL.toLowerCase() &&
      result.token &&
      result.refreshToken;
    
    if (isValid) {
      accessToken = result.token;
      refreshTokenValue = result.refreshToken;
    }
    
    logTest('Login with valid credentials', isValid);
  } catch (error) {
    logTest('Login with valid credentials', false, String(error));
  }
}

async function testLoginWithUppercaseEmail() {
  try {
    const result = await login({
      email: TEST_UPPERCASE_EMAIL, // Uppercase email
      password: TEST_PASSWORD,
    });
    
    const isValid = 
      result.user &&
      result.user.email === TEST_EMAIL.toLowerCase() && // Should be normalized
      result.token &&
      result.refreshToken;
    
    logTest('Login with uppercase email (normalization)', isValid);
  } catch (error) {
    logTest('Login with uppercase email (normalization)', false, String(error));
  }
}

async function testLoginWithInvalidPassword() {
  try {
    await login({
      email: TEST_EMAIL,
      password: 'WrongPassword123',
    });
    
    logTest('Login with invalid password rejection', false, 'Should have thrown error');
  } catch (error: any) {
    const isRejected = 
      error.message?.includes('Invalid email or password') ||
      error.statusCode === 401;
    
    logTest('Login with invalid password rejection', isRejected);
  }
}

async function testLoginWithInvalidEmail() {
  try {
    await login({
      email: 'nonexistent@example.com',
      password: TEST_PASSWORD,
    });
    
    logTest('Login with invalid email rejection', false, 'Should have thrown error');
  } catch (error: any) {
    const isRejected = 
      error.message?.includes('Invalid email or password') ||
      error.statusCode === 401;
    
    logTest('Login with invalid email rejection', isRejected);
  }
}

async function testTokenRefresh() {
  if (!refreshTokenValue) {
    logTest('Token refresh', false, 'No refresh token available');
    return;
  }
  
  try {
    const result = await refreshToken(refreshTokenValue);
    
    const isValid = 
      result.token &&
      result.refreshToken &&
      result.expiresIn > 0 &&
      result.token !== accessToken; // Should be a new token
    
    if (isValid) {
      accessToken = result.token;
      refreshTokenValue = result.refreshToken;
    }
    
    logTest('Token refresh with valid refresh token', isValid);
  } catch (error) {
    logTest('Token refresh with valid refresh token', false, String(error));
  }
}

async function testTokenValidation() {
  if (!accessToken) {
    logTest('Token validation', false, 'No access token available');
    return;
  }
  
  try {
    const decoded = verifyAccessToken(accessToken);
    
    const isValid = 
      decoded.userId === createdUserId &&
      decoded.email === TEST_EMAIL.toLowerCase() &&
      decoded.role === 'USER';
    
    logTest('Access token validation', isValid);
  } catch (error) {
    logTest('Access token validation', false, String(error));
  }
}

async function testFailedLoginRecording() {
  if (!createdUserId) {
    logTest('Failed login recording', false, 'No user ID available');
    return;
  }
  
  try {
    // Attempt login with wrong password
    try {
      await login({
        email: TEST_EMAIL,
        password: 'WrongPassword123',
      });
    } catch {
      // Expected to fail
    }
    
    // Check if failed login was recorded
    const loginHistory = await prisma.loginHistory.findFirst({
      where: {
        userId: createdUserId,
        success: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    logTest('Failed login attempt recording', !!loginHistory);
  } catch (error) {
    logTest('Failed login attempt recording', false, String(error));
  }
}

async function testSuccessfulLoginRecording() {
  if (!createdUserId) {
    logTest('Successful login recording', false, 'No user ID available');
    return;
  }
  
  try {
    // Perform successful login
    await login({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    // Check if successful login was recorded
    const loginHistory = await prisma.loginHistory.findFirst({
      where: {
        userId: createdUserId,
        success: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    logTest('Successful login attempt recording', !!loginHistory);
  } catch (error) {
    logTest('Successful login attempt recording', false, String(error));
  }
}

async function runTests() {
  console.log('🧪 Running authentication integration tests...\n');
  console.log(`📧 Test email: ${TEST_EMAIL}\n`);
  
  try {
    await testUserRegistration();
    await testDuplicateEmailRegistration();
    await testLoginWithValidCredentials();
    await testLoginWithUppercaseEmail();
    await testLoginWithInvalidPassword();
    await testLoginWithInvalidEmail();
    await testTokenRefresh();
    await testTokenValidation();
    await testFailedLoginRecording();
    await testSuccessfulLoginRecording();
  } finally {
    await cleanup();
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log('='.repeat(50));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All integration tests passed!');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

// Run tests
runTests().catch(async (error) => {
  console.error('❌ Test execution failed:', error);
  await cleanup();
  process.exit(1);
});
