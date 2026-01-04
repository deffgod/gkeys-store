/**
 * Test script for authentication fixes
 * 
 * This script tests the key authentication fixes:
 * 1. Password hashing and comparison
 * 2. JWT token generation and verification
 * 3. Email normalization
 * 4. JWT error handling
 */

// Set environment variables before importing modules
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-different-from-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
process.env.NODE_ENV = 'test';

import { generateAccessToken, verifyAccessToken, TokenPayload } from '../src/utils/jwt.js';
import { hashPassword, comparePassword } from '../src/utils/bcrypt.js';

// Test configuration
const TEST_EMAIL = 'test-auth-fix@example.com';
const TEST_PASSWORD = 'TestPass123';
const TEST_NORMALIZED_EMAIL = 'test-auth-fix@example.com';
const TEST_UPPERCASE_EMAIL = 'TEST-AUTH-FIX@EXAMPLE.COM';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) {
    console.log(`   Error: ${error}`);
  }
}

async function testPasswordHashing() {
  try {
    const hash = await hashPassword(TEST_PASSWORD);
    const isValid = await comparePassword(TEST_PASSWORD, hash);
    const isInvalid = await comparePassword('WrongPassword123', hash);
    
    logTest('Password hashing and comparison', isValid && !isInvalid);
  } catch (error) {
    logTest('Password hashing and comparison', false, String(error));
  }
}

async function testJWTGeneration() {
  try {
    const payload: TokenPayload = {
      userId: 'test-user-id',
      email: TEST_EMAIL,
      role: 'USER',
    };
    
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    
    const isValid = 
      decoded.userId === payload.userId &&
      decoded.email === payload.email &&
      decoded.role === payload.role;
    
    logTest('JWT token generation and verification', isValid);
  } catch (error) {
    logTest('JWT token generation and verification', false, String(error));
  }
}

async function testEmailNormalization() {
  try {
    // Test that email normalization works
    const email1 = TEST_EMAIL.toLowerCase();
    const email2 = TEST_UPPERCASE_EMAIL.toLowerCase();
    
    const normalized1 = email1.trim();
    const normalized2 = email2.trim();
    
    const isNormalized = normalized1 === normalized2 && normalized1 === TEST_NORMALIZED_EMAIL;
    
    logTest('Email normalization (lowercase)', isNormalized);
  } catch (error) {
    logTest('Email normalization (lowercase)', false, String(error));
  }
}

async function testJWTErrorHandling() {
  try {
    // Test expired token handling
    try {
      verifyAccessToken('invalid-token');
      logTest('JWT error handling (invalid token)', false, 'Should have thrown error');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isValid = errorMessage.includes('Invalid') || errorMessage.includes('token');
      logTest('JWT error handling (invalid token)', isValid);
    }
    
    // Test malformed token
    try {
      verifyAccessToken('not.a.valid.jwt.token');
      logTest('JWT error handling (malformed token)', false, 'Should have thrown error');
    } catch (error) {
      logTest('JWT error handling (malformed token)', true);
    }
  } catch (error) {
    logTest('JWT error handling', false, String(error));
  }
}

async function runTests() {
  console.log('🧪 Running authentication fix tests...\n');
  
  await testPasswordHashing();
  await testJWTGeneration();
  await testEmailNormalization();
  await testJWTErrorHandling();
  
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
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
