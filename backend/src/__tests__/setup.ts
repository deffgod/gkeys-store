import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Global teardown
afterAll(() => {
  console.log('✅ Test suite completed');
});
