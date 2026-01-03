# Data Model: Test E-commerce Core Flows

**Feature**: 001-test-ecommerce-flows  
**Date**: 2024-12-30  
**Status**: Complete

## Overview

This document describes the test data model for e-commerce core flows testing. It defines entities, relationships, and test data requirements for cart, wishlist, and order functionality testing.

## Test Entities

### Test User

Represents a user account for testing authentication and user-specific operations.

**Required Fields for Testing**:
- `id`: UUID (auto-generated)
- `email`: Unique test email (e.g., `test-{timestamp}@example.com`)
- `passwordHash`: Bcrypt hash of test password
- `nickname`: Test display name
- `balance`: Decimal (configurable for balance tests)
- `role`: USER or ADMIN (for permission tests)
- `emailVerified`: Boolean (default: true for test users)

**Test Scenarios**:
- User with sufficient balance (default: 100.00 EUR)
- User with insufficient balance (0.00 EUR or less than order total)
- User with exact balance (balance equals order total)
- Admin user (for admin-specific tests)

**Test Data Factory**:
```typescript
createTestUser(options?: {
  email?: string;
  balance?: number;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
}): Promise<User>
```

### Test Game

Represents a game/product for testing cart, wishlist, and order operations.

**Required Fields for Testing**:
- `id`: UUID (auto-generated)
- `title`: Test game title
- `slug`: URL-friendly identifier
- `price`: Decimal (configurable for price tests)
- `inStock`: Boolean (for stock validation tests)
- `g2aProductId`: String? (for G2A integration tests)
- `g2aStock`: Boolean (for G2A stock tests)

**Test Scenarios**:
- In-stock game (default)
- Out-of-stock game (`inStock: false`)
- G2A-sourced game (`g2aProductId` set, `g2aStock: true`)
- G2A-sourced out-of-stock game (`g2aProductId` set, `g2aStock: false`)
- Game with various prices (for total calculation tests)

**Test Data Factory**:
```typescript
createTestGame(options?: {
  title?: string;
  price?: number;
  inStock?: boolean;
  g2aProductId?: string;
  g2aStock?: boolean;
}): Promise<Game>
```

### Test Cart Item

Represents an item in a user's or guest's shopping cart.

**Required Fields for Testing**:
- `userId`: String (user ID or session ID for guests)
- `gameId`: String (reference to game)
- `quantity`: Integer (for quantity update tests)

**Test Scenarios**:
- Single item in cart (quantity: 1)
- Multiple items in cart (different games)
- Same game with quantity > 1
- Empty cart (no items)

**Test Data Factory**:
```typescript
createTestCart(userId: string, items: Array<{gameId: string, quantity: number}>): Promise<CartItem[]>
```

### Test Wishlist Item

Represents an item in a user's or guest's wishlist.

**Required Fields for Testing**:
- `userId`: String (user ID or session ID for guests)
- `gameId`: String (reference to game)
- `addedAt`: DateTime (timestamp when added)

**Test Scenarios**:
- Single item in wishlist
- Multiple items in wishlist
- Empty wishlist (no items)
- Duplicate prevention (same game added twice)

**Test Data Factory**:
```typescript
createTestWishlist(userId: string, gameIds: string[]): Promise<WishlistItem[]>
```

### Test Order

Represents a completed purchase order.

**Required Fields for Testing**:
- `id`: UUID (auto-generated)
- `userId`: String (reference to user)
- `status`: OrderStatus (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `subtotal`: Decimal (sum of item prices)
- `discount`: Decimal (promo code discount, if applicable)
- `total`: Decimal (subtotal - discount)
- `paymentStatus`: PaymentStatus (PENDING, COMPLETED, FAILED)
- `items`: Array of OrderItem

**Test Scenarios**:
- Order with single item
- Order with multiple items
- Order with promo code (discount applied)
- Order without promo code
- Order in PENDING status
- Order in PROCESSING status
- Order in COMPLETED status
- Order with G2A-sourced games
- Order with non-G2A games

**Test Data Factory**:
```typescript
createTestOrder(userId: string, items: Array<{gameId: string, quantity: number}>, options?: {
  promoCode?: string;
  status?: OrderStatus;
}): Promise<Order>
```

### Test Order Item

Represents an individual game in an order.

**Required Fields for Testing**:
- `orderId`: String (reference to order)
- `gameId`: String (reference to game)
- `quantity`: Integer
- `price`: Decimal (price at time of purchase)

**Relationships**:
- Belongs to Order
- References Game

### Test Transaction

Represents a financial transaction record.

**Required Fields for Testing**:
- `id`: UUID (auto-generated)
- `userId`: String (reference to user)
- `orderId`: String? (reference to order, if order-related)
- `type`: TransactionType (PURCHASE, TOP_UP, REFUND)
- `amount`: Decimal (negative for purchases, positive for top-ups)
- `status`: PaymentStatus (COMPLETED, PENDING, FAILED)
- `description`: String

**Test Scenarios**:
- Purchase transaction (negative amount, linked to order)
- Top-up transaction (positive amount, no order)
- Completed transaction
- Pending transaction

### Test Promo Code

Represents a promotional code for discounts.

**Required Fields for Testing**:
- `id`: UUID (auto-generated)
- `code`: String (unique promo code)
- `discount`: Decimal (discount percentage or amount)
- `maxUses`: Integer? (maximum uses, if limited)
- `usedCount`: Integer (current usage count)
- `validFrom`: DateTime (start date)
- `validUntil`: DateTime (end date)
- `active`: Boolean (whether code is active)

**Test Scenarios**:
- Valid active promo code
- Expired promo code (`validUntil` in past)
- Inactive promo code (`active: false`)
- Promo code at max uses (`usedCount >= maxUses`)
- Promo code not yet valid (`validFrom` in future)

**Test Data Factory**:
```typescript
createTestPromoCode(options?: {
  code?: string;
  discount?: number;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  active?: boolean;
}): Promise<PromoCode>
```

## Test Data Relationships

### User → Cart Items
- One user can have multiple cart items
- Cart items are user-specific (or session-specific for guests)
- Cart items reference games

### User → Wishlist Items
- One user can have multiple wishlist items
- Wishlist items are user-specific (or session-specific for guests)
- Wishlist items reference games

### User → Orders
- One user can have multiple orders
- Orders are user-specific
- Orders contain order items

### Order → Order Items
- One order contains multiple order items
- Order items reference games
- Order items store price at time of purchase

### User → Transactions
- One user can have multiple transactions
- Transactions can be linked to orders (for purchases)
- Transactions track balance changes

## Test Data Setup Patterns

### Pattern 1: Basic Test Setup
```typescript
// Create test user with balance
const user = await createTestUser({ balance: 100.00 });

// Create test games
const game1 = await createTestGame({ price: 19.99, inStock: true });
const game2 = await createTestGame({ price: 29.99, inStock: true });

// Create test cart
await createTestCart(user.id, [
  { gameId: game1.id, quantity: 1 },
  { gameId: game2.id, quantity: 2 }
]);
```

### Pattern 2: Stock Validation Test Setup
```typescript
// Create in-stock and out-of-stock games
const inStockGame = await createTestGame({ inStock: true });
const outOfStockGame = await createTestGame({ inStock: false });

// Attempt to add out-of-stock game should fail
```

### Pattern 3: Balance Validation Test Setup
```typescript
// Create user with insufficient balance
const user = await createTestUser({ balance: 10.00 });
const expensiveGame = await createTestGame({ price: 50.00 });

// Attempt to create order should fail
```

### Pattern 4: G2A Integration Test Setup
```typescript
// Create G2A-sourced game
const g2aGame = await createTestGame({
  g2aProductId: 'test-g2a-product-id',
  g2aStock: true
});

// Mock G2A API responses
vi.mock('../services/g2a.service', () => ({
  validateGameStock: vi.fn().mockResolvedValue({ available: true, stock: 10 }),
  purchaseGameKey: vi.fn().mockResolvedValue({ key: 'TEST-KEY-123' })
}));
```

### Pattern 5: Migration Test Setup
```typescript
// Create guest session with cart/wishlist
const sessionId = 'test-session-' + Date.now();
await createTestCart(sessionId, [{ gameId: game1.id, quantity: 1 }]);
await createTestWishlist(sessionId, [game1.id]);

// Create user and authenticate
const user = await createTestUser();
const token = await authenticateUser(user);

// Migration should happen automatically on login
```

## Test Data Cleanup

### Cleanup Strategy

**After Each Test**:
- Delete test cart items
- Delete test wishlist items
- Delete test orders and order items
- Delete test transactions
- Delete test users (optional - can reuse)
- Delete test games (optional - can reuse)
- Delete test promo codes

**After Test Suite**:
- Truncate test tables (if using separate test database)
- Reset sequences
- Clear Redis cache (if used)

### Cleanup Helpers

```typescript
// Clean up user's cart
async function cleanupUserCart(userId: string): Promise<void>

// Clean up user's wishlist
async function cleanupUserWishlist(userId: string): Promise<void>

// Clean up user's orders
async function cleanupUserOrders(userId: string): Promise<void>

// Clean up all test data for user
async function cleanupTestUser(userId: string): Promise<void>
```

## Cache Keys for Testing

### Cart Cache Keys
- `cart:{userId}` - User cart cache
- `cart:{sessionId}` - Guest cart cache

### Wishlist Cache Keys
- `wishlist:{userId}` - User wishlist cache
- `wishlist:{sessionId}` - Guest wishlist cache

### Test Cache Invalidation
- Verify cache cleared after mutations
- Verify cache populated after reads
- Test cache behavior with Redis unavailable

## Test Data Validation Rules

### Cart Item Validation
- Quantity must be > 0
- Game must exist
- Game must be in stock (for add operations)
- User/session must exist

### Wishlist Item Validation
- Game must exist
- No duplicates allowed (same game, same user/session)
- User/session must exist

### Order Validation
- User must exist
- All games must exist
- All games must be in stock
- User must have sufficient balance
- Promo code must be valid (if provided)
- Items must not be empty

### Transaction Validation
- User must exist
- Amount must match order total (for purchases)
- Status must be valid
- Order must exist (if order-related)

## Performance Test Data

### Large Cart Test
- 50+ items in cart
- Test cart retrieval performance
- Test cart total calculation performance

### Large Wishlist Test
- 100+ items in wishlist
- Test wishlist retrieval performance

### Multiple Orders Test
- User with 20+ orders
- Test order history retrieval performance
- Test order filtering performance
