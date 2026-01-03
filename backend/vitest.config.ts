import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/types/**',
        'src/config/**',
        'src/templates/**',
        'src/index.ts',
      ],
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30000, // Increased for integration tests
  },
});

