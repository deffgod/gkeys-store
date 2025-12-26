# API Contracts: System Integration Enhancement

**Feature**: 001-system-integration-enhancement  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This document defines API contracts for system integration enhancement, focusing on authentication, cart/wishlist management, admin operations, and G2A synchronization. All endpoints follow RESTful conventions.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-project.vercel.app/api`

## Authentication

All authenticated endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <access-token>
```

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "nickname": "UserNickname",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "UserNickname",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already registered

**Cache Impact**: None

---

### POST /api/auth/login

Authenticate user and receive tokens. Automatically triggers cart/wishlist migration if guest session exists.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "UserNickname",
      "role": "USER"
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials

**Cache Impact**:
- Invalidates `session:{sessionId}:cart` and `session:{sessionId}:wishlist` after migration
- Creates `user:{id}:cart` and `user:{id}:wishlist` cache entries

**Behavior**:
- If guest session exists (sessionId cookie), triggers cart/wishlist migration
- Migration runs in background (non-blocking)
- Returns tokens immediately

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token",
    "expiresIn": 3600
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid refresh token
- `401 Unauthorized`: Refresh token expired or invalid

**Cache Impact**: None

---

## Cart Endpoints

All cart endpoints support both authenticated users and guest sessions (via sessionId cookie).

### GET /api/cart

Get user's or guest's shopping cart.

**Authentication**: Optional (supports both authenticated and guest)

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
          "slug": "game-title",
          "image": "https://...",
          "price": 29.99,
          "inStock": true
        }
      }
    ],
    "total": 59.98
  }
}
```

**Cache Impact**: Reads from `user:{id}:cart` or `session:{id}:cart` cache

---

### POST /api/cart

Add item to cart.

**Authentication**: Optional (supports both authenticated and guest)

**Request**:
```json
{
  "gameId": "uuid",
  "quantity": 1
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 29.99
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid gameId or quantity
- `404 Not Found`: Game not found
- `400 Bad Request`: Game out of stock

**Cache Impact**: Invalidates `user:{id}:cart` or `session:{id}:cart`

---

### PUT /api/cart/:gameId

Update cart item quantity.

**Authentication**: Optional (supports both authenticated and guest)

**Request**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK): Same as GET /api/cart

**Errors**:
- `400 Bad Request`: Invalid quantity
- `404 Not Found`: Item not in cart

**Cache Impact**: Invalidates `user:{id}:cart` or `session:{id}:cart`

---

### DELETE /api/cart/:gameId

Remove item from cart.

**Authentication**: Optional (supports both authenticated and guest)

**Response** (200 OK): Same as GET /api/cart

**Errors**:
- `404 Not Found`: Item not in cart

**Cache Impact**: Invalidates `user:{id}:cart` or `session:{id}:cart`

---

### DELETE /api/cart

Clear entire cart.

**Authentication**: Optional (supports both authenticated and guest)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

**Cache Impact**: Invalidates `user:{id}:cart` or `session:{id}:cart`

---

### POST /api/cart/migrate

Migrate guest cart to user cart (called automatically on login, but can be called manually).

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart migrated successfully"
}
```

**Errors**:
- `400 Bad Request`: No session ID or user ID
- `500 Internal Server Error`: Migration failed

**Cache Impact**:
- Invalidates `session:{sessionId}:cart`
- Invalidates `user:{userId}:cart`

**Behavior**:
- Runs in Prisma transaction (atomic)
- Validates game existence and stock
- Merges quantities for duplicate items
- Removes out-of-stock items

---

## Wishlist Endpoints

All wishlist endpoints support both authenticated users and guest sessions (via sessionId cookie).

### GET /api/wishlist

Get user's or guest's wishlist.

**Authentication**: Optional (supports both authenticated and guest)

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
          "slug": "game-title",
          "image": "https://...",
          "price": 29.99,
          "inStock": true
        },
        "addedAt": "2024-12-23T10:00:00Z"
      }
    ]
  }
}
```

**Cache Impact**: Reads from `user:{id}:wishlist` or `session:{id}:wishlist` cache

---

### POST /api/wishlist

Add game to wishlist.

**Authentication**: Optional (supports both authenticated and guest)

**Request**:
```json
{
  "gameId": "uuid"
}
```

**Response** (200 OK): Same as GET /api/wishlist

**Errors**:
- `400 Bad Request`: Invalid gameId
- `404 Not Found`: Game not found
- `409 Conflict`: Game already in wishlist

**Cache Impact**: Invalidates `user:{id}:wishlist` or `session:{id}:wishlist`

---

### DELETE /api/wishlist/:gameId

Remove game from wishlist.

**Authentication**: Optional (supports both authenticated and guest)

**Response** (200 OK): Same as GET /api/wishlist

**Errors**:
- `404 Not Found`: Game not in wishlist

**Cache Impact**: Invalidates `user:{id}:wishlist` or `session:{id}:wishlist`

---

### GET /api/wishlist/:gameId/check

Check if game is in wishlist.

**Authentication**: Optional (supports both authenticated and guest)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "inWishlist": true
  }
}
```

**Cache Impact**: None (direct database query)

---

### POST /api/wishlist/migrate

Migrate guest wishlist to user wishlist (called automatically on login, but can be called manually).

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Wishlist migrated successfully"
}
```

**Errors**:
- `400 Bad Request`: No session ID or user ID
- `500 Internal Server Error`: Migration failed

**Cache Impact**:
- Invalidates `session:{sessionId}:wishlist`
- Invalidates `user:{userId}:wishlist`

**Behavior**:
- Runs in Prisma transaction (atomic)
- Validates game existence
- Skips duplicate items (user already has item)
- Removes items for non-existent games

---

## Admin Endpoints

All admin endpoints require authentication and ADMIN role.

### GET /api/admin/dashboard

Get dashboard statistics.

**Authentication**: Required (ADMIN role)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalOrders": 500,
    "totalRevenue": 50000.00,
    "pendingOrders": 10
  }
}
```

**Cache Impact**: None

---

### GET /api/admin/users

Search users.

**Authentication**: Required (ADMIN role)

**Query Parameters**:
- `search` (string, optional): Search by email or nickname
- `page` (number, default: 1): Page number
- `pageSize` (number, default: 20): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**Cache Impact**: None

---

### GET /api/admin/users/:id

Get user details.

**Authentication**: Required (ADMIN role)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "UserNickname",
    "role": "USER",
    "balance": 100.00,
    "orders": [...],
    "transactions": [...]
  }
}
```

**Cache Impact**: None

---

### PUT /api/admin/users/:id

Update user information.

**Authentication**: Required (ADMIN role)

**Request**:
```json
{
  "nickname": "NewNickname",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ADMIN",
  "balance": 200.00
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "NewNickname",
    ...
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid input data
- `404 Not Found`: User not found

**Cache Impact**: None

---

### GET /api/admin/games

Get list of games (with pagination and filters).

**Authentication**: Required (ADMIN role)

**Query Parameters**:
- `search` (string, optional): Search by title
- `page` (number, default: 1)
- `pageSize` (number, default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "games": [...],
    "total": 500,
    "page": 1,
    "pageSize": 20,
    "totalPages": 25
  }
}
```

**Cache Impact**: None

---

### PUT /api/admin/games/:id

Update game (all fields including relationships).

**Authentication**: Required (ADMIN role)

**Request**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "price": 39.99,
  "categories": ["category-id-1", "category-id-2"],
  "genres": ["genre-id-1"],
  "platforms": ["platform-id-1"],
  "tags": ["tag-id-1"],
  "isBestSeller": true,
  "isNew": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Game not found

**Cache Impact**:
- Invalidates `game:{slug}`
- Invalidates `home:*`
- Invalidates `catalog:*`

---

### GET /api/admin/orders

Get list of orders.

**Authentication**: Required (ADMIN role)

**Query Parameters**:
- `status` (string, optional): Filter by status
- `page` (number, default: 1)
- `pageSize` (number, default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**Cache Impact**: None

---

### PUT /api/admin/orders/:id/status

Update order status.

**Authentication**: Required (ADMIN role)

**Request**:
```json
{
  "status": "COMPLETED",
  "paymentStatus": "COMPLETED"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    ...
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid status
- `404 Not Found`: Order not found

**Cache Impact**: None

---

### GET /api/admin/blog

Get list of blog posts.

**Authentication**: Required (ADMIN role)

**Query Parameters**:
- `search` (string, optional): Search by title
- `status` (string, optional): Filter by published status
- `page` (number, default: 1)
- `pageSize` (number, default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

**Cache Impact**: None

---

### GET /api/admin/blog/:id

Get blog post details (for editing).

**Authentication**: Required (ADMIN role)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "post-slug",
    "title": "Post Title",
    "content": "Full content...",
    "coverImage": "https://...",
    "tags": ["tag1", "tag2"],
    "published": true,
    "publishedAt": "2024-12-23T10:00:00Z",
    "readTime": 5
  }
}
```

**Cache Impact**: None

---

### PUT /api/admin/blog/:id

Update blog post.

**Authentication**: Required (ADMIN role)

**Request**:
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "coverImage": "https://...",
  "tags": ["tag1", "tag2"],
  "published": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "readTime": 5,
    ...
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Post not found

**Cache Impact**:
- Invalidates `blog:{slug}`
- Invalidates `blog:category:{category}`
- Invalidates `blog:recent`

**Behavior**:
- Automatically calculates `readTime` from content word count
- Sets `publishedAt` when publishing, clears when unpublishing

---

### POST /api/admin/g2a/sync

Trigger G2A catalog synchronization.

**Authentication**: Required (ADMIN role)

**Request**:
```json
{
  "fullSync": true,
  "categories": ["category-id-1"],
  "createRelationships": true
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Synchronization started",
  "data": {
    "syncId": "sync-uuid"
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid parameters
- `409 Conflict`: Sync already in progress

**Cache Impact**:
- After sync completes: Invalidates `home:*`, `game:*`, `catalog:*`

**Behavior**:
- Runs asynchronously
- Progress tracked in Redis: `g2a:sync:progress`
- Updates `g2aProductId`, `g2aStock`, `g2aLastSync` on games

---

### GET /api/admin/g2a/sync-progress

Get G2A synchronization progress.

**Authentication**: Required (ADMIN role)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "inProgress": true,
    "currentPage": 5,
    "totalPages": 10,
    "productsProcessed": 500,
    "productsTotal": 1000,
    "startedAt": "2024-12-23T10:00:00Z",
    "estimatedCompletion": "2024-12-23T10:30:00Z"
  }
}
```

**Cache Impact**: Reads from `g2a:sync:progress` cache

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Common Error Codes

- `AUTH001`: Authentication required
- `AUTH002`: Invalid credentials
- `AUTH003`: Token expired
- `AUTH004`: Invalid token
- `AUTH005`: Insufficient permissions (requires ADMIN)
- `VAL001`: Validation error
- `NOTFOUND001`: Resource not found
- `CONFLICT001`: Resource already exists
- `CONFLICT002`: Email already registered
- `CONFLICT003`: Game already in cart
- `CONFLICT004`: Game already in wishlist
- `BIZ001`: Business logic error
- `BIZ002`: Game out of stock
- `SERVER001`: Internal server error

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Cart/Wishlist endpoints: 60 requests per minute per user/session
- Admin endpoints: 100 requests per minute per admin
- G2A sync: 1 request per 5 minutes per admin

## Cache Headers

Responses include cache control headers:
- `Cache-Control: public, max-age=3600` for cached responses
- `Cache-Control: no-cache` for dynamic responses

