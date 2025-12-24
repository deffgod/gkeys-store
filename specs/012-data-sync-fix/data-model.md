# Data Model: Data Synchronization & System Integration Fix

**Feature**: 012-data-sync-fix  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This document describes the data entities involved in the data synchronization feature. All entities are defined in the Prisma schema (`backend/prisma/schema.prisma`). This feature focuses on ensuring data consistency between Prisma database, Redis cache, and G2A API.

## Core Entities

### User

**Purpose**: Represents authenticated user account with profile, authentication, and financial data.

**Fields**:
- `id` (String, UUID, Primary Key): Unique user identifier
- `email` (String, Unique, Required): User email address (used for login)
- `passwordHash` (String, Required): Bcrypt-hashed password
- `nickname` (String, Optional, Default: "Newbie Guy"): Display name
- `firstName` (String, Optional): User's first name
- `lastName` (String, Optional): User's last name
- `avatar` (String, Optional): Avatar image URL
- `balance` (Decimal, Default: 0): User account balance in EUR
- `role` (Role enum, Default: USER): User role (USER or ADMIN)
- `emailVerified` (Boolean, Default: false): Email verification status
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `orders`: One-to-many with Order
- `transactions`: One-to-many with Transaction
- `wishlist`: One-to-many with Wishlist
- `cart`: One-to-many with CartItem

**Validation Rules**:
- Email must be unique across all users
- Email must be valid format (validated on registration)
- Password must be hashed with bcrypt before storage
- Balance cannot be negative (enforced by application logic)

**State Transitions**:
- Registration: User created with default values → email sent → user can login
- Login: Credentials validated → tokens generated → user authenticated
- Email verification: `emailVerified` changes from false to true

**Cache Keys**:
- User profile: `user:{id}:profile` (TTL: 1 hour)
- User cart: `user:{id}:cart` (TTL: 30 minutes)
- User wishlist: `user:{id}:wishlist` (TTL: 1 hour)

**Synchronization Requirements**:
- User data is source of truth in Prisma database
- Cache is invalidated on profile updates
- No external sync required (internal entity)

---

### Game

**Purpose**: Represents game product with G2A integration, pricing, stock, and metadata.

**Fields**:
- `id` (String, UUID, Primary Key): Unique game identifier
- `title` (String, Required): Game title
- `slug` (String, Unique, Required): URL-friendly identifier
- `description` (String, Text, Required): Full game description
- `shortDescription` (String, Optional): Brief description
- `price` (Decimal, Required): Current price in EUR (with 2% markup from G2A)
- `originalPrice` (Decimal, Optional): Original price before discount
- `discount` (Int, Optional, Default: 0): Discount percentage
- `currency` (String, Default: "EUR"): Price currency
- `image` (String, Required): Primary image URL
- `images` (String[], Required): Array of image URLs
- `inStock` (Boolean, Default: true): Local stock status
- `g2aProductId` (String, Optional): G2A product identifier (for sync)
- `g2aStock` (Boolean, Default: false): G2A stock status
- `g2aLastSync` (DateTime, Optional): Last G2A synchronization timestamp
- `releaseDate` (DateTime, Required): Game release date
- `metacriticScore` (Int, Optional): Metacritic rating (0-100)
- `userRating` (Decimal, Optional): User rating (0-5)
- `ageRating` (String, Optional): Age rating (PEGI, ESRB, etc.)
- `multiplayer` (Boolean, Default: false): Multiplayer support
- `activationService` (String, Optional): Key activation service (Steam, Epic, etc.)
- `region` (String, Optional): Region restriction
- `publisher` (String, Optional): Game publisher
- `isBestSeller` (Boolean, Default: false): Best seller flag
- `isNew` (Boolean, Default: false): New game flag
- `isPreorder` (Boolean, Default: false): Preorder flag
- `ratingCritic` (Int, Optional): Critic rating (0-100)
- `ratingUser` (Int, Optional): User rating (0-100)
- `languages` (String[]): Supported language codes (ISO 639-1)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `categories`: Many-to-many with Category (via GameCategory)
- `genres`: Many-to-many with Genre (via GameGenre)
- `platforms`: Many-to-many with Platform (via GamePlatform)
- `tags`: Many-to-many with Tag (via GameTag)
- `keys`: One-to-many with GameKey
- `orderItems`: One-to-many with OrderItem
- `wishlist`: One-to-many with Wishlist
- `cart`: One-to-many with CartItem

**Validation Rules**:
- Slug must be unique
- Price must be positive
- `g2aProductId` must be unique if provided
- `inStock` and `g2aStock` must be synchronized during G2A sync
- Price must be updated with 2% markup from G2A price during sync

**State Transitions**:
- Product sync: G2A data fetched → price calculated (2% markup) → stock updated → `g2aLastSync` updated → cache invalidated
- Stock update: G2A stock checked → `g2aStock` updated → `inStock` updated → cache invalidated

**Cache Keys**:
- Game details: `game:{id}` (TTL: 1 hour)
- Game list: `home:bestSellers`, `home:newInCatalog`, `home:preorders` (TTL: varies)
- Catalog filters: `catalog:filterOptions` (TTL: 1 hour)

**Synchronization Requirements**:
- G2A product sync updates: price (with 2% markup), stock status, metadata
- Cache must be invalidated on: create, update, delete, stock changes
- Sync frequency: Full sync 2x daily, stock checks every 15 minutes

---

### Order

**Purpose**: Represents purchase order with items, status, and G2A integration.

**Fields**:
- `id` (String, UUID, Primary Key): Unique order identifier
- `userId` (String, Required, Foreign Key): User who placed order
- `status` (OrderStatus enum, Default: PENDING): Order status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `subtotal` (Decimal, Required): Order subtotal before discount
- `discount` (Decimal, Default: 0): Discount amount
- `total` (Decimal, Required): Final order total
- `paymentMethod` (String, Optional): Payment method used
- `paymentStatus` (PaymentStatus enum, Optional): Payment status
- `promoCode` (String, Optional): Promo code used
- `externalOrderId` (String, Optional, Unique): G2A order ID (for webhook integration)
- `createdAt` (DateTime): Order creation timestamp
- `completedAt` (DateTime, Optional): Order completion timestamp

**Relationships**:
- `user`: Many-to-one with User
- `items`: One-to-many with OrderItem
- `keys`: One-to-many with GameKey
- `transaction`: One-to-one with Transaction

**Validation Rules**:
- `total` must equal `subtotal - discount`
- `externalOrderId` must be unique if provided
- Order status transitions must be valid (PENDING → PROCESSING → COMPLETED/FAILED)

**State Transitions**:
- Order creation: PENDING → order created → G2A order created → PROCESSING → keys purchased → COMPLETED
- Webhook update: G2A webhook received → order status updated → transaction updated → cache invalidated

**Cache Keys**:
- User orders: `user:{id}:orders` (TTL: 30 minutes)
- Order details: `order:{id}` (TTL: 15 minutes)

**Synchronization Requirements**:
- G2A order creation: Order created in G2A → `externalOrderId` stored
- G2A webhook: Order status updated from G2A webhook → local order updated
- Transaction must be created for each order
- Cache must be invalidated on order status changes

---

### Transaction

**Purpose**: Represents financial transaction (purchase, top-up, refund) linked to user and order.

**Fields**:
- `id` (String, UUID, Primary Key): Unique transaction identifier
- `userId` (String, Required, Foreign Key): User who owns transaction
- `orderId` (String, Optional, Unique, Foreign Key): Related order (for purchases)
- `type` (TransactionType enum, Required): Transaction type (TOP_UP, PURCHASE, REFUND)
- `amount` (Decimal, Required): Transaction amount (negative for purchases)
- `currency` (String, Default: "EUR"): Transaction currency
- `method` (String, Optional): Payment method
- `status` (PaymentStatus enum, Required): Transaction status
- `description` (String, Optional): Transaction description
- `transactionHash` (String, Optional, Unique): External transaction hash
- `gatewayResponse` (Json, Optional): Payment gateway response data
- `createdAt` (DateTime): Transaction creation timestamp

**Relationships**:
- `user`: Many-to-one with User
- `order`: One-to-one with Order (optional)

**Validation Rules**:
- `orderId` must be unique if provided
- `transactionHash` must be unique if provided
- Amount sign must match transaction type (negative for PURCHASE, positive for TOP_UP/REFUND)

**State Transitions**:
- Purchase: Transaction created → order linked → user balance updated → status COMPLETED
- Top-up: Transaction created → user balance updated → status COMPLETED
- Refund: Transaction created → order linked → user balance updated → status COMPLETED

**Cache Keys**:
- User transactions: `user:{id}:transactions` (TTL: 15 minutes)

**Synchronization Requirements**:
- Transaction must be created atomically with order creation
- Transaction must be linked to order correctly
- No external sync required (internal entity)

---

### CartItem

**Purpose**: Represents item in user's shopping cart (authenticated or guest).

**Fields**:
- `userId` (String, Required, Foreign Key, Composite Key): User ID (or sessionId for guests)
- `gameId` (String, Required, Foreign Key, Composite Key): Game ID
- `quantity` (Int, Default: 1): Item quantity
- `addedAt` (DateTime): Item addition timestamp

**Relationships**:
- `user`: Many-to-one with User
- `game`: Many-to-one with Game

**Validation Rules**:
- Composite primary key: `(userId, gameId)`
- Quantity must be positive
- Game must exist and be in stock
- For guests: `userId` field stores `sessionId` (temporary identifier)

**State Transitions**:
- Add to cart: Item added → quantity updated if exists → cache invalidated
- Remove from cart: Item deleted → cache invalidated
- Migration: Guest cart items → validated → user cart items → guest items deleted → cache invalidated

**Cache Keys**:
- User cart: `user:{id}:cart` (TTL: 30 minutes)
- Guest cart: `session:{sessionId}:cart` (TTL: 24 hours)

**Synchronization Requirements**:
- Cart migration: Guest items (by sessionId) → user items (by userId) → atomic transaction
- Game availability must be validated before migration
- Duplicate items: merge quantities for cart
- Cache must be invalidated on: add, update, remove, migration

---

### Wishlist

**Purpose**: Represents item in user's wishlist (authenticated or guest).

**Fields**:
- `userId` (String, Required, Foreign Key, Composite Key): User ID (or sessionId for guests)
- `gameId` (String, Required, Foreign Key, Composite Key): Game ID
- `addedAt` (DateTime): Item addition timestamp

**Relationships**:
- `user`: Many-to-one with User
- `game`: Many-to-one with Game

**Validation Rules**:
- Composite primary key: `(userId, gameId)`
- Game must exist
- Duplicate items: skip if already in wishlist
- For guests: `userId` field stores `sessionId` (temporary identifier)

**State Transitions**:
- Add to wishlist: Item added if not exists → cache invalidated
- Remove from wishlist: Item deleted → cache invalidated
- Migration: Guest wishlist items → user wishlist items → guest items deleted → cache invalidated

**Cache Keys**:
- User wishlist: `user:{id}:wishlist` (TTL: 1 hour)
- Guest wishlist: `session:{sessionId}:wishlist` (TTL: 24 hours)

**Synchronization Requirements**:
- Wishlist migration: Guest items (by sessionId) → user items (by userId) → atomic transaction
- Duplicate items: skip (wishlist doesn't have quantities)
- Cache must be invalidated on: add, remove, migration

---

## Data Consistency Rules

### Database Transactions

All multi-step operations must use Prisma transactions:

1. **User Registration**: User creation + token generation (atomic)
2. **Order Creation**: Order creation + items creation + balance deduction + transaction creation (atomic)
3. **Cart Migration**: Guest items read + user items create/update + guest items delete (atomic)
4. **Wishlist Migration**: Guest items read + user items create + guest items delete (atomic)

### Cache Invalidation

Cache must be invalidated after successful database commits:

1. **Product Changes**: Invalidate `game:{id}`, `home:*`, `catalog:*`
2. **Order Changes**: Invalidate `user:{id}:orders`, `order:{id}`
3. **Cart Changes**: Invalidate `user:{id}:cart`, `session:{sessionId}:cart`
4. **Wishlist Changes**: Invalidate `user:{id}:wishlist`, `session:{sessionId}:wishlist`

### G2A Synchronization

1. **Product Sync**: Fetch from G2A → update database → invalidate cache
2. **Stock Check**: Check G2A stock → update database → invalidate cache
3. **Order Sync**: G2A webhook → update order status → update transaction → invalidate cache

### Graceful Degradation

When Redis is unavailable:
1. Operations continue using database only
2. Cache misses are logged but don't fail operations
3. Cache writes are fire-and-forget (try/catch, don't await)
4. System automatically recovers when Redis becomes available

## Indexes

All entities have appropriate indexes for performance:
- User: `email` (unique)
- Game: `slug`, `inStock`, `g2aProductId`, `price`, etc.
- Order: `userId`, `status`, `externalOrderId`
- Transaction: `userId`, `orderId`, `transactionHash`
- CartItem: `userId` (composite key: `userId, gameId`)
- Wishlist: `userId` (composite key: `userId, gameId`)

## Validation Summary

| Entity | Required Validations | Cache Keys | Sync Requirements |
|--------|---------------------|------------|-------------------|
| User | Email unique, password hashed | `user:{id}:*` | None (internal) |
| Game | Slug unique, price positive | `game:{id}`, `home:*`, `catalog:*` | G2A product sync |
| Order | Total = subtotal - discount | `order:{id}`, `user:{id}:orders` | G2A order sync |
| Transaction | Amount sign matches type | `user:{id}:transactions` | None (internal) |
| CartItem | Quantity positive, game in stock | `user:{id}:cart` | Migration on login |
| Wishlist | Game exists | `user:{id}:wishlist` | Migration on login |

