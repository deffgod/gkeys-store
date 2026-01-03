# Quickstart: Test E-commerce Core Flows

**Feature**: 001-test-ecommerce-flows  
**Date**: 2024-12-30  
**Status**: Ready for Implementation

## Overview

This quickstart guide helps developers understand and implement comprehensive testing for e-commerce core flows: cart management, wishlist operations, and order creation. The guide covers test setup, test data creation, and test execution.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ database running (test database recommended)
- Redis (optional but recommended for cache tests)
- Environment variables set (see [ENVIRONMENT_VARIABLES.md](../../../ENVIRONMENT_VARIABLES.md))
- Test database configured with Prisma migrations

## Test Setup

### 1. Configure Test Database

Create a separate test database:

```bash
# Create test database
createdb gkeys_test

# Set test database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/gkeys_test"
export DIRECT_URL="postgresql://user:password@localhost:5432/gkeys_test"
```

### 2. Run Prisma Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 3. Install Test Dependencies

Test dependencies should already be installed. Verify:

```bash
cd backend
npm list vitest supertest
```

### 4. Configure Test Environment

Update `backend/src/__tests__/setup.ts` if needed:

```typescript
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://...';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
```

## Test Structure

### Unit Tests

**Location**: `backend/src/__tests__/unit/`

**Files to Create**:
- `cart.service.test.ts` - Test cart service functions
- `wishlist.service.test.ts` - Test wishlist service functions
- `order.service.test.ts` - Test order service functions

**Example Structure**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { addToCart, getCart } from '../../services/cart.service.js';
import { createTestUser, createTestGame, cleanupTestUser } from '../helpers/test-db.js';

describe('Cart Service', () => {
  let userId: string;
  let gameId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    const game = await createTestGame();
    userId = user.id;
    gameId = game.id;
  });

  afterEach(async () => {
    await cleanupTestUser(userId);
  });

  describe('addToCart', () => {
    it('should add game to cart', async () => {
      await addToCart(gameId, 1, userId);
      const cart = await getCart(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].gameId).toBe(gameId);
    });
  });
});
```

### Integration Tests

**Location**: `backend/tests/integration/`

**Files to Create**:
- `cart.test.ts` - Test cart API endpoints
- `wishlist.test.ts` - Test wishlist API endpoints
- `order.test.ts` - Test order API endpoints
- `ecommerce-flows.test.ts` - Test complete user flows

**Example Structure**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { createTestUser, authenticateUser, cleanupTestUser } from '../helpers/test-auth.js';

describe('Cart API', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    userToken = await authenticateUser(user);
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
  });

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      const game = await createTestGame();
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ gameId: game.id, quantity: 1 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### E2E Tests

**Location**: `src/__tests__/e2e/`

**Files to Create**:
- `cart.e2e.test.tsx` - Test cart UI interactions
- `wishlist.e2e.test.tsx` - Test wishlist UI interactions
- `checkout.e2e.test.tsx` - Test checkout flow

**Example Structure**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CartProvider } from '../../context/CartContext';
import GameCard from '../../components/game/GameCard';

describe('Cart E2E', () => {
  it('should add game to cart from game card', async () => {
    render(
      <CartProvider>
        <GameCard game={testGame} />
      </CartProvider>
    );

    const addButton = screen.getByText('Add to Cart');
    addButton.click();

    await waitFor(() => {
      expect(screen.getByText('Item added to cart')).toBeInTheDocument();
    });
  });
});
```

## Test Helpers

### Database Helpers (`backend/tests/helpers/test-db.ts`)

**Functions**:
- `createTestUser(options?)`: Create test user
- `createTestGame(options?)`: Create test game
- `createTestCart(userId, items)`: Create cart with items
- `createTestWishlist(userId, gameIds)`: Create wishlist with items
- `createTestOrder(userId, items, options?)`: Create order
- `createTestPromoCode(options?)`: Create promo code
- `cleanupTestUser(userId)`: Clean up all user test data
- `cleanupTestGame(gameId)`: Clean up game test data

### Authentication Helpers (`backend/tests/helpers/test-auth.ts`)

**Functions**:
- `authenticateUser(user)`: Generate JWT token for user
- `createTestSession(sessionId)`: Create test session
- `getAuthHeaders(token)`: Get authorization headers

### Cart Helpers (`backend/tests/helpers/test-cart.ts`)

**Functions**:
- `addItemToCart(userId, gameId, quantity)`: Add item to cart
- `getCartItems(userId)`: Get cart items
- `clearCartItems(userId)`: Clear cart
- `verifyCartTotal(userId, expectedTotal)`: Verify cart total

### Order Helpers (`backend/tests/helpers/test-order.ts`)

**Functions**:
- `createOrderFromCart(userId, promoCode?)`: Create order from cart
- `verifyOrderCreated(userId, orderId)`: Verify order exists
- `verifyBalanceDeducted(userId, amount)`: Verify balance deducted
- `verifyTransactionCreated(userId, orderId)`: Verify transaction created

## Test Execution

### Run All Tests

```bash
cd backend
npm test
```

### Run Specific Test File

```bash
npm test -- cart.service.test.ts
npm test -- cart.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

## Test Scenarios by Feature

### Cart Tests

**Unit Tests** (`cart.service.test.ts`):
- ✅ Add item to cart (authenticated user)
- ✅ Add item to cart (guest session)
- ✅ Update cart item quantity
- ✅ Remove item from cart
- ✅ Clear cart
- ✅ Get cart with correct total calculation
- ✅ Prevent adding out-of-stock game
- ✅ Merge quantities when adding same game
- ✅ Migrate session cart to user cart
- ✅ Handle Redis unavailability

**Integration Tests** (`cart.test.ts`):
- ✅ POST /api/cart - Add item
- ✅ PUT /api/cart/:gameId - Update quantity
- ✅ DELETE /api/cart/:gameId - Remove item
- ✅ DELETE /api/cart - Clear cart
- ✅ GET /api/cart - Get cart
- ✅ POST /api/cart/migrate - Migrate cart
- ✅ Error handling for invalid requests
- ✅ Authentication required for migration

### Wishlist Tests

**Unit Tests** (`wishlist.service.test.ts`):
- ✅ Add game to wishlist (authenticated user)
- ✅ Add game to wishlist (guest session)
- ✅ Remove game from wishlist
- ✅ Check if game in wishlist
- ✅ Prevent duplicate entries
- ✅ Get wishlist with correct items
- ✅ Migrate session wishlist to user wishlist
- ✅ Handle Redis unavailability

**Integration Tests** (`wishlist.test.ts`):
- ✅ POST /api/wishlist - Add game
- ✅ DELETE /api/wishlist/:gameId - Remove game
- ✅ GET /api/wishlist/:gameId/check - Check if in wishlist
- ✅ GET /api/wishlist - Get wishlist
- ✅ POST /api/wishlist/migrate - Migrate wishlist
- ✅ Error handling for invalid requests
- ✅ Authentication required for migration

### Order Tests

**Unit Tests** (`order.service.test.ts`):
- ✅ Create order from cart items
- ✅ Validate stock before order creation
- ✅ Validate balance before order creation
- ✅ Apply promo code discount
- ✅ Deduct balance on order creation
- ✅ Create transaction record
- ✅ Prevent duplicate orders (idempotency)
- ✅ Retrieve G2A keys for G2A-sourced games
- ✅ Handle G2A API failures gracefully
- ✅ Update order status correctly

**Integration Tests** (`order.test.ts`):
- ✅ POST /api/orders - Create order
- ✅ GET /api/orders - Get user orders
- ✅ GET /api/orders/:id - Get order details
- ✅ Error handling for out-of-stock games
- ✅ Error handling for insufficient balance
- ✅ Error handling for invalid promo codes
- ✅ Authentication required for all endpoints

### E2E Flow Tests

**Complete User Flows** (`ecommerce-flows.test.tsx`):
- ✅ Browse games → Add to cart → View cart → Checkout → Create order
- ✅ Browse games → Add to wishlist → View wishlist → Add to cart from wishlist
- ✅ Guest: Add to cart → Login → Cart migrated → Checkout
- ✅ Guest: Add to wishlist → Login → Wishlist migrated
- ✅ Apply promo code → Verify discount → Create order
- ✅ Out-of-stock game → Error message displayed
- ✅ Insufficient balance → Error message displayed

## Performance Testing

### Add Performance Assertions

```typescript
it('should add game to cart in under 2 seconds', async () => {
  const startTime = Date.now();
  await addToCart(gameId, 1, userId);
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(2000); // SC-001
});
```

### Test Large Datasets

```typescript
it('should handle cart with 50+ items', async () => {
  const games = await Promise.all(
    Array.from({ length: 50 }, () => createTestGame())
  );
  
  for (const game of games) {
    await addToCart(game.id, 1, userId);
  }
  
  const cart = await getCart(userId);
  expect(cart.items).toHaveLength(50);
  expect(cart.total).toBeGreaterThan(0);
});
```

## Mocking External Services

### Mock G2A Service

```typescript
import { vi } from 'vitest';
import * as g2aService from '../../services/g2a.service.js';

vi.mock('../../services/g2a.service.js', () => ({
  validateGameStock: vi.fn(),
  purchaseGameKey: vi.fn(),
}));

// In test
(g2aService.validateGameStock as any).mockResolvedValue({
  available: true,
  stock: 10
});

(g2aService.purchaseGameKey as any).mockResolvedValue({
  key: 'TEST-KEY-123'
});
```

### Mock Email Service

```typescript
import { vi } from 'vitest';
import * as emailService from '../../services/email.service.js';

vi.mock('../../services/email.service.js', () => ({
  sendGameKeyEmail: vi.fn().mockResolvedValue(undefined),
}));
```

## Test Data Cleanup

### Automatic Cleanup

```typescript
afterEach(async () => {
  // Clean up test data
  await cleanupTestUser(userId);
  await cleanupTestGame(gameId);
});
```

### Transaction-Based Cleanup

```typescript
it('should create order', async () => {
  await prisma.$transaction(async (tx) => {
    // Test operations
    const order = await createOrder(userId, orderData);
    
    // Verify
    expect(order).toBeDefined();
    
    // Rollback automatically
  });
});
```

## Debugging Tests

### Enable Verbose Logging

```typescript
// In test file
import { vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
```

### Inspect Test Data

```typescript
it('should add item to cart', async () => {
  await addToCart(gameId, 1, userId);
  const cart = await getCart(userId);
  
  console.log('Cart:', JSON.stringify(cart, null, 2));
  // Debug output
});
```

## Common Issues and Solutions

### Issue: Tests failing due to database state

**Solution**: Ensure proper cleanup in `afterEach` hooks. Use transactions where possible.

### Issue: Redis connection errors in tests

**Solution**: Tests should handle Redis unavailability gracefully. Use try/catch around Redis operations.

### Issue: Authentication token expiration

**Solution**: Generate fresh tokens in `beforeEach` or `beforeAll` hooks for each test.

### Issue: Test data conflicts

**Solution**: Use unique identifiers (timestamps, UUIDs) for test data. Clean up after each test.

## Next Steps

1. Create test helper files
2. Implement unit tests for services
3. Implement integration tests for API endpoints
4. Implement E2E tests for user flows
5. Add performance assertions
6. Run test suite and verify coverage
7. Document test execution results
