# Data Model: System Integration Enhancement

**Feature**: 001-system-integration-enhancement  
**Date**: 2024-12-23  
**Status**: Complete

## Overview

This document describes the data model for system integration enhancement, focusing on entities involved in authentication, cart/wishlist management, admin operations, and G2A synchronization. The data model is based on the existing Prisma schema.

## Core Entities

### User

Represents a registered user with authentication credentials and profile information.

**Fields**:
- `id` (UUID, Primary Key): Unique user identifier
- `email` (String, Unique): User's email address (used for login)
- `passwordHash` (String): Bcrypt hashed password
- `nickname` (String?, Optional): User's display name (default: "Newbie Guy")
- `firstName` (String?, Optional): User's first name
- `lastName` (String?, Optional): User's last name
- `avatar` (String?, Optional): URL to user's avatar image
- `balance` (Decimal, Default: 0): User's account balance in EUR
- `role` (Role Enum, Default: USER): User role (USER or ADMIN)
- `emailVerified` (Boolean, Default: false): Email verification status
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `orders`: One-to-many with Order
- `transactions`: One-to-many with Transaction
- `wishlist`: One-to-many with Wishlist
- `cart`: One-to-many with CartItem
- `loginHistory`: One-to-many with LoginHistory

**Indexes**:
- `email`: For fast login lookups

**Validation Rules**:
- Email must be unique
- Email format validated on registration
- Password must meet strength requirements (min 8 chars, uppercase, lowercase, number)
- Role must be USER or ADMIN

**State Transitions**:
- Registration: Creates user with role=USER, emailVerified=false
- Email verification: Updates emailVerified=true
- Role change: Admin can update role to ADMIN (requires admin privileges)

### Game

Represents a game/product in the catalog with full details and metadata.

**Fields**:
- `id` (UUID, Primary Key): Unique game identifier
- `title` (String): Game title
- `slug` (String, Unique): URL-friendly identifier
- `description` (Text): Full game description
- `shortDescription` (String?, Optional): Brief description for cards
- `price` (Decimal): Current price in EUR
- `originalPrice` (Decimal?, Optional): Original price before discount
- `discount` (Int?, Optional): Discount percentage (0-100)
- `currency` (String, Default: "EUR"): Price currency
- `image` (String): Main cover image URL
- `images` (String[]): Array of additional image URLs
- `inStock` (Boolean, Default: true): Stock availability flag
- `g2aProductId` (String?, Optional): G2A product identifier for sync
- `g2aStock` (Boolean, Default: false): G2A stock availability
- `g2aLastSync` (DateTime?, Optional): Last G2A synchronization timestamp
- `releaseDate` (DateTime): Game release date
- `metacriticScore` (Int?, Optional): Metacritic rating (0-100)
- `userRating` (Decimal?, Optional): Average user rating (0-5)
- `ageRating` (String?, Optional): Age rating (e.g., "PEGI 18")
- `multiplayer` (Boolean, Default: false): Multiplayer support flag
- `activationService` (String?, Optional): Activation service (e.g., "Steam")
- `region` (String?, Optional): Region availability
- `publisher` (String?, Optional): Game publisher
- `isBestSeller` (Boolean, Default: false): Best seller flag
- `isNew` (Boolean, Default: false): New release flag
- `isPreorder` (Boolean, Default: false): Preorder flag
- `ratingCritic` (Int?, Optional): Critic rating (0-100)
- `ratingUser` (Int?, Optional): User rating (0-100)
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

**Indexes**:
- `slug`: For URL lookups
- `inStock`: For availability filtering
- `isPreorder`: For preorder filtering
- `releaseDate`: For date-based sorting
- `isBestSeller`: For best seller queries
- `isNew`: For new releases queries
- `price`: For price-based sorting/filtering
- `g2aProductId`: For G2A synchronization
- `ratingCritic`: For rating-based filtering
- `ratingUser`: For user rating filtering
- `languages`: For language filtering

**Validation Rules**:
- Slug must be unique
- Price must be positive
- Discount must be 0-100 if provided
- Release date must be valid date
- Ratings must be within valid ranges (0-100 for critic/user, 0-5 for userRating)

**State Transitions**:
- Creation: Admin creates game with initial data
- Update: Admin updates any field
- G2A Sync: Updates g2aProductId, g2aStock, g2aLastSync
- Stock change: Updates inStock flag

### CartItem

Represents an item in a user's shopping cart. Can be associated with authenticated user or guest session.

**Fields**:
- `userId` (String, Composite Key): User ID (can be user UUID or session ID for guests)
- `gameId` (String, Composite Key): Game identifier
- `quantity` (Int, Default: 1): Number of items
- `addedAt` (DateTime): When item was added to cart

**Relationships**:
- `user`: Many-to-one with User
- `game`: Many-to-one with Game

**Indexes**:
- `userId`: For fast cart retrieval

**Validation Rules**:
- Quantity must be > 0
- Game must exist and be in stock
- User ID must be valid (user UUID or session ID)

**State Transitions**:
- Add: Creates new cart item or updates quantity if exists
- Update: Changes quantity
- Remove: Deletes cart item
- Migration: Moves from session ID to user ID on login

**Migration Logic**:
- When guest logs in, cart items with `userId = sessionId` are migrated to `userId = user.id`
- Quantities are merged if user already has item in cart
- Items for out-of-stock games are removed during migration

### Wishlist

Represents an item in a user's wishlist. Can be associated with authenticated user or guest session.

**Fields**:
- `userId` (String, Composite Key): User ID (can be user UUID or session ID for guests)
- `gameId` (String, Composite Key): Game identifier
- `addedAt` (DateTime): When item was added to wishlist

**Relationships**:
- `user`: Many-to-one with User
- `game`: Many-to-one with Game

**Indexes**:
- `userId`: For fast wishlist retrieval

**Validation Rules**:
- Game must exist
- User ID must be valid (user UUID or session ID)
- Duplicate items prevented by composite key

**State Transitions**:
- Add: Creates new wishlist item (fails if duplicate)
- Remove: Deletes wishlist item
- Migration: Moves from session ID to user ID on login

**Migration Logic**:
- When guest logs in, wishlist items with `userId = sessionId` are migrated to `userId = user.id`
- Duplicate items are skipped (user already has item)
- Items for non-existent games are removed during migration

### Order

Represents a completed purchase order.

**Fields**:
- `id` (UUID, Primary Key): Unique order identifier
- `userId` (String): User who placed the order
- `status` (OrderStatus Enum, Default: PENDING): Order status
- `subtotal` (Decimal): Subtotal before discount
- `discount` (Decimal, Default: 0): Discount amount
- `total` (Decimal): Final total after discount
- `paymentMethod` (String?, Optional): Payment method used
- `paymentStatus` (PaymentStatus Enum?, Optional): Payment status
- `promoCode` (String?, Optional): Promo code used
- `externalOrderId` (String?, Unique, Optional): G2A order ID for webhook integration
- `createdAt` (DateTime): Order creation timestamp
- `completedAt` (DateTime?, Optional): Order completion timestamp

**Relationships**:
- `user`: Many-to-one with User
- `items`: One-to-many with OrderItem
- `keys`: One-to-many with GameKey
- `transaction`: One-to-one with Transaction

**Indexes**:
- `userId`: For user order queries
- `status`: For status-based filtering
- `createdAt`: For date-based sorting
- `externalOrderId`: For G2A webhook lookups

**Validation Rules**:
- Total must equal subtotal - discount
- Status must be valid OrderStatus enum value
- User must exist

**State Transitions**:
- PENDING → PROCESSING: Order being processed
- PROCESSING → COMPLETED: Order fulfilled
- PROCESSING → FAILED: Order failed
- Any → CANCELLED: Order cancelled (admin action)

### Article (Blog Post)

Represents a blog post/article.

**Fields**:
- `id` (UUID, Primary Key): Unique article identifier
- `slug` (String, Unique): URL-friendly identifier
- `title` (String): Article title
- `excerpt` (String): Short excerpt for preview
- `content` (Text): Full article content
- `coverImage` (String): Cover image URL
- `category` (String): Article category
- `author` (String): Author name
- `published` (Boolean, Default: false): Publication status
- `publishedAt` (DateTime?, Optional): Publication timestamp
- `readTime` (Int?, Optional): Estimated reading time in minutes
- `tags` (String[]): Article tags
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**: None (standalone entity)

**Indexes**:
- `slug`: For URL lookups
- `category`: For category-based queries
- `published`: For published/unpublished filtering

**Validation Rules**:
- Slug must be unique
- Title and content required
- readTime calculated automatically: `Math.ceil(wordCount / 200)`

**State Transitions**:
- Draft → Published: Sets `published=true`, `publishedAt=now()`
- Published → Draft: Sets `published=false`, `publishedAt=null`

### Category, Genre, Platform, Tag

Metadata entities for organizing games.

**Common Fields**:
- `id` (UUID, Primary Key): Unique identifier
- `name` (String, Unique): Display name
- `slug` (String, Unique): URL-friendly identifier

**Relationships**:
- All have many-to-many with Game via junction tables (GameCategory, GameGenre, GamePlatform, GameTag)

**Validation Rules**:
- Name and slug must be unique
- Slug generated from name if not provided

## Junction Tables

### GameCategory, GameGenre, GamePlatform, GameTag

Many-to-many relationship tables between Game and metadata entities.

**Fields**:
- Composite primary key: `gameId` + `categoryId` (or `genreId`, `platformId`, `tagId`)

**Behavior**:
- Cascade delete: Deleting game removes all relationships
- Cascade delete: Deleting category/genre/platform/tag removes all relationships

## Enums

### Role
- `USER`: Regular user
- `ADMIN`: Administrator

### OrderStatus
- `PENDING`: Order created, awaiting processing
- `PROCESSING`: Order being processed
- `COMPLETED`: Order fulfilled
- `FAILED`: Order failed
- `CANCELLED`: Order cancelled

### PaymentStatus
- `PENDING`: Payment pending
- `PROCESSING`: Payment processing
- `COMPLETED`: Payment completed
- `FAILED`: Payment failed
- `CANCELLED`: Payment cancelled

### TransactionType
- `TOP_UP`: Balance top-up
- `PURCHASE`: Purchase transaction
- `REFUND`: Refund transaction

## Data Integrity Rules

### Cart Migration
- Must be atomic (transaction)
- Validates game existence and stock before migration
- Merges quantities for duplicate items
- Removes items for out-of-stock games

### Wishlist Migration
- Must be atomic (transaction)
- Validates game existence before migration
- Skips duplicate items (user already has item)
- Removes items for non-existent games

### Game Updates
- Updating game invalidates cache: `game:{slug}`, `home:*`, `catalog:*`
- Updating relationships (categories, genres, platforms, tags) requires junction table updates

### G2A Synchronization
- Updates `g2aProductId`, `g2aStock`, `g2aLastSync` fields
- Invalidates cache after sync: `home:*`, `game:*`, `catalog:*`

## Cache Key Patterns

### User Data
- `user:{id}:cart` - User cart (TTL: 15 minutes)
- `user:{id}:wishlist` - User wishlist (TTL: 30 minutes)
- `user:{id}:orders` - User orders (TTL: 5 minutes)

### Session Data
- `session:{id}:cart` - Guest cart (TTL: 24 hours)
- `session:{id}:wishlist` - Guest wishlist (TTL: 24 hours)

### Game Data
- `game:{slug}` - Game details (TTL: 1 hour)
- `home:bestSellers` - Best sellers (TTL: 7 days)
- `home:newInCatalog` - New items (TTL: 24 hours)
- `catalog:filterOptions` - Filter options (TTL: 1 hour)

### Blog Data
- `blog:{slug}` - Blog post (TTL: 24 hours)
- `blog:category:{category}` - Category posts (TTL: 6 hours)
- `blog:recent` - Recent posts (TTL: 1 hour)

### G2A Data
- `g2a:oauth2:token` - OAuth2 token (TTL: 1 hour)
- `g2a:sync:progress` - Sync progress (TTL: 1 hour)
- `g2a:sync:metadata` - Sync metadata (TTL: 1 hour)

## Validation Summary

### Registration
- Email: Valid format, unique
- Password: Min 8 chars, uppercase, lowercase, number

### Cart Operations
- Game must exist
- Game must be in stock
- Quantity must be > 0

### Wishlist Operations
- Game must exist
- Duplicate items prevented

### Admin Operations
- User must have ADMIN role
- All operations logged for audit

### Product Updates
- All fields validated
- Relationships validated (categories, genres, platforms, tags exist)

## Migration Considerations

### Cart Migration
- Runs automatically on login if guest session exists
- Validates game availability
- Merges quantities
- Atomic transaction

### Wishlist Migration
- Runs automatically on login if guest session exists
- Validates game existence
- Skips duplicates
- Atomic transaction

### Cache Invalidation
- Pattern-based invalidation
- Graceful degradation if Redis unavailable
- Non-blocking operations

