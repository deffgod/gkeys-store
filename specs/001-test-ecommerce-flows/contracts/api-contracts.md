# API Contracts: E-commerce Core Flows Testing

**Feature**: 001-test-ecommerce-flows  
**Date**: 2024-12-30  
**Status**: Complete

## Overview

This document defines API contracts for e-commerce core flows (cart, wishlist, orders) that need to be tested. All endpoints follow RESTful conventions and return consistent response formats.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-project.vercel.app/api`

## Authentication

Most endpoints support both authenticated users and guest sessions:
- **Authenticated**: Include JWT token in `Authorization` header: `Authorization: Bearer <token>`
- **Guest**: Session ID managed via cookies (handled by session middleware)

**Order endpoints require authentication** - guest access is not supported.

## Cart Endpoints

### GET /api/cart

Get user's or guest's shopping cart.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "gameId": "uuid",
        "quantity": 2,
        "game": {
          "id": "uuid",
          "title": "Game Title",
          "slug": "game-slug",
          "image": "https://...",
          "price": 19.99,
          "inStock": true
        }
      }
    ],
    "total": 39.98
  }
}
```

**Errors**:
- `400 Bad Request`: Missing user ID or session ID
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Get cart for authenticated user
- ✅ Get cart for guest session
- ✅ Get empty cart
- ✅ Get cart with multiple items
- ✅ Verify total calculation accuracy

---

### POST /api/cart

Add item to cart.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**:
```json
{
  "gameId": "uuid",
  "quantity": 1
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Item added to cart"
}
```

**Errors**:
- `400 Bad Request`: Missing gameId, invalid quantity, game out of stock
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Add item to cart (authenticated user)
- ✅ Add item to cart (guest session)
- ✅ Add same item again (quantity increases)
- ✅ Add out-of-stock game (error)
- ✅ Add non-existent game (error)
- ✅ Add with invalid quantity (error)
- ✅ Verify cache invalidation

---

### PUT /api/cart/:gameId

Update cart item quantity.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart item updated"
}
```

**Errors**:
- `400 Bad Request`: Invalid quantity, quantity <= 0
- `404 Not Found`: Cart item not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Update quantity to valid value
- ✅ Update quantity to 0 (removes item)
- ✅ Update non-existent item (error)
- ✅ Update with invalid quantity (error)
- ✅ Verify total recalculates

---

### DELETE /api/cart/:gameId

Remove item from cart.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

**Errors**:
- `404 Not Found`: Cart item not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Remove existing item
- ✅ Remove non-existent item (error)
- ✅ Verify total recalculates
- ✅ Verify other items remain

---

### DELETE /api/cart

Clear entire cart.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

**Errors**:
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Clear cart with items
- ✅ Clear empty cart (no error)
- ✅ Verify cart is empty after clear

---

### POST /api/cart/migrate

Migrate session cart to user cart (after login).

**Authentication**: Required

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart migrated successfully"
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Migrate guest cart to user cart
- ✅ Merge quantities when user already has item
- ✅ Skip out-of-stock items during migration
- ✅ Verify guest cart cleared after migration
- ✅ Verify cache invalidated

---

## Wishlist Endpoints

### GET /api/wishlist

Get user's or guest's wishlist.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "gameId": "uuid",
        "game": {
          "id": "uuid",
          "title": "Game Title",
          "slug": "game-slug",
          "image": "https://...",
          "price": 19.99,
          "inStock": true
        },
        "addedAt": "2024-12-30T10:00:00Z"
      }
    ]
  }
}
```

**Errors**:
- `400 Bad Request`: Missing user ID or session ID
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Get wishlist for authenticated user
- ✅ Get wishlist for guest session
- ✅ Get empty wishlist
- ✅ Get wishlist with multiple items
- ✅ Verify items sorted by addedAt

---

### POST /api/wishlist

Add game to wishlist.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**:
```json
{
  "gameId": "uuid"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Game added to wishlist"
}
```

**Errors**:
- `400 Bad Request`: Missing gameId
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Add game to wishlist (authenticated user)
- ✅ Add game to wishlist (guest session)
- ✅ Add same game again (no duplicate, graceful handling)
- ✅ Add non-existent game (error)
- ✅ Verify cache invalidation

---

### DELETE /api/wishlist/:gameId

Remove game from wishlist.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Game removed from wishlist"
}
```

**Errors**:
- `404 Not Found`: Wishlist item not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Remove existing game
- ✅ Remove non-existent game (error)
- ✅ Verify game removed from wishlist

---

### GET /api/wishlist/:gameId/check

Check if game is in wishlist.

**Authentication**: Optional (works for both authenticated users and guests)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "inWishlist": true
  }
}
```

**Errors**:
- `400 Bad Request`: Missing user ID or session ID
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Check game in wishlist (returns true)
- ✅ Check game not in wishlist (returns false)
- ✅ Check for authenticated user
- ✅ Check for guest session

---

### POST /api/wishlist/migrate

Migrate session wishlist to user wishlist (after login).

**Authentication**: Required

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Wishlist migrated successfully"
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Migrate guest wishlist to user wishlist
- ✅ Prevent duplicates when user already has item
- ✅ Skip non-existent games during migration
- ✅ Verify guest wishlist cleared after migration
- ✅ Verify cache invalidated

---

## Order Endpoints

### POST /api/orders

Create order from cart items.

**Authentication**: Required

**Request**:
```json
{
  "items": [
    {
      "gameId": "uuid",
      "quantity": 1
    }
  ],
  "promoCode": "DISCOUNT10"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "PENDING",
    "subtotal": 19.99,
    "discount": 1.99,
    "total": 18.00,
    "paymentStatus": "PENDING",
    "promoCode": "DISCOUNT10",
    "items": [
      {
        "gameId": "uuid",
        "quantity": 1,
        "price": 19.99,
        "game": {
          "id": "uuid",
          "title": "Game Title",
          "slug": "game-slug",
          "image": "https://...",
          "g2aProductId": "g2a-product-id"
        }
      }
    ],
    "keys": [],
    "createdAt": "2024-12-30T10:00:00Z",
    "updatedAt": "2024-12-30T10:00:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid items, out of stock, insufficient balance, invalid promo code
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Game not found, user not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Create order with single item
- ✅ Create order with multiple items
- ✅ Create order with promo code
- ✅ Create order without promo code
- ✅ Create order with out-of-stock game (error)
- ✅ Create order with insufficient balance (error)
- ✅ Create order with invalid promo code (error)
- ✅ Create order with G2A-sourced games
- ✅ Verify balance deducted
- ✅ Verify transaction created
- ✅ Verify idempotency (duplicate order returns existing)
- ✅ Verify order status updates

---

### GET /api/orders

Get user's order history.

**Authentication**: Required

**Request**: Query parameters (optional):
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)
- `status`: Filter by status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "status": "COMPLETED",
        "total": 18.00,
        "createdAt": "2024-12-30T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Get orders for authenticated user
- ✅ Get empty order history
- ✅ Get orders with pagination
- ✅ Get orders filtered by status
- ✅ Verify orders sorted by createdAt (desc)

---

### GET /api/orders/:id

Get individual order details.

**Authentication**: Required

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "COMPLETED",
    "subtotal": 19.99,
    "discount": 1.99,
    "total": 18.00,
    "paymentStatus": "COMPLETED",
    "promoCode": "DISCOUNT10",
    "items": [
      {
        "gameId": "uuid",
        "quantity": 1,
        "price": 19.99,
        "game": {
          "id": "uuid",
          "title": "Game Title",
          "slug": "game-slug",
          "image": "https://...",
          "g2aProductId": "g2a-product-id"
        }
      }
    ],
    "keys": [
      {
        "id": "uuid",
        "key": "GAME-KEY-123",
        "gameId": "uuid",
        "orderId": "uuid"
      }
    ],
    "createdAt": "2024-12-30T10:00:00Z",
    "updatedAt": "2024-12-30T10:00:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Order belongs to different user
- `404 Not Found`: Order not found
- `500 Internal Server Error`: Server error

**Test Scenarios**:
- ✅ Get order details for user's own order
- ✅ Get order details for different user's order (error)
- ✅ Get non-existent order (error)
- ✅ Verify all order fields present
- ✅ Verify game keys included for completed orders

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `OUT_OF_STOCK`: Game is out of stock
- `INSUFFICIENT_BALANCE`: User has insufficient balance
- `INVALID_PROMO_CODE`: Promo code is invalid or expired
- `G2A_API_ERROR`: G2A API call failed
- `INTERNAL_ERROR`: Server error

## Performance Requirements

Based on Success Criteria:

- **SC-001**: Cart operations must complete in < 2 seconds
- **SC-004**: Wishlist operations must complete in < 2 seconds
- **SC-006**: Order creation must complete in < 30 seconds
- **SC-002**: Cart total calculation must be 100% accurate
- **SC-005**: Wishlist operations must succeed 99% of the time
- **SC-007**: Order creation must succeed 98% of the time (when conditions met)

## Cache Behavior

### Cart Cache
- **Key Pattern**: `cart:{userId}` or `cart:{sessionId}`
- **TTL**: 15 minutes
- **Invalidation**: After any cart mutation (add, update, remove, clear, migrate)

### Wishlist Cache
- **Key Pattern**: `wishlist:{userId}` or `wishlist:{sessionId}`
- **TTL**: 30 minutes
- **Invalidation**: After any wishlist mutation (add, remove, migrate)

### Cache Graceful Degradation
- All endpoints must work without Redis
- Cache failures should be logged but not block operations
- Tests should verify behavior with and without Redis

## Test Data Requirements

### For Cart Tests
- Test user with various balance amounts
- Test games with various prices and stock status
- Test cart with 0, 1, and multiple items
- Test guest session with cart items

### For Wishlist Tests
- Test user account
- Test games
- Test wishlist with 0, 1, and multiple items
- Test guest session with wishlist items

### For Order Tests
- Test user with sufficient balance
- Test user with insufficient balance
- Test user with exact balance
- Test games (in-stock, out-of-stock, G2A-sourced)
- Test promo codes (valid, expired, inactive, max uses reached)
- Test orders in various statuses

## Idempotency

### Order Creation
- Creating an order with the same items within a short time window should return the existing order
- Prevents duplicate orders from retries or double-clicks
- Idempotency key: combination of userId + sorted gameIds + timestamp window

## G2A Integration

### Stock Validation
- For G2A-sourced games, validate stock via G2A API before order creation
- If G2A API fails, log warning but proceed with local stock check (graceful degradation)
- Tests should mock G2A API responses

### Key Retrieval
- For G2A-sourced games, retrieve keys from G2A API during order processing
- If G2A API fails, order status should reflect failure
- Tests should mock G2A key retrieval

## Session Management

### Guest Sessions
- Guest sessions use sessionId as userId (temporary workaround)
- Session data stored in database (CartItem, Wishlist with userId = sessionId)
- Sessions can be migrated to user accounts on login

### Session Migration
- Automatic migration on login
- Atomic transaction ensures data consistency
- Merges quantities for cart items
- Prevents duplicates for wishlist items
