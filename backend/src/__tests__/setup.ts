/**
 * Vitest Setup File
 * 
 * Global test setup and configuration.
 * This file runs before all tests.
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import prisma from '../config/database.js';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-different';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Global teardown
afterAll(async () => {
  console.log('✅ Test suite completed');
  await prisma.$disconnect();
});
