# Data Model: Admin Panel Function Synchronization

**Feature**: 013-admin-sync  
**Date**: 2024-12-23  
**Status**: Complete

## Key Entities

### Payment Method
**Purpose**: Represents a payment gateway configuration and status

**Fields**:
- `id`: Unique identifier (UUID)
- `name`: Display name (e.g., "Stripe", "PayPal", "Mollie", "Terminal")
- `type`: Payment gateway type (string)
- `icon`: Icon URL or identifier (optional)
- `available`: Whether payment method is currently available (boolean)
- `order`: Display order (integer)
- `config`: Gateway-specific configuration (JSON, optional)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- None (standalone configuration entity)

**Validation Rules**:
- Name must be unique
- Type must be one of: "stripe", "paypal", "mollie", "terminal"
- Available must be boolean
- Order must be non-negative integer

**Cache Keys**:
- `payment:methods`: All payment methods
- `payment:method:{id}`: Specific payment method

**Synchronization Requirements**:
- Payment method status updates must invalidate cache
- Configuration changes must be logged for audit

---

### Payment Transaction
**Purpose**: Represents a payment transaction with gateway-specific details

**Fields** (from Prisma schema):
- `id`: Unique identifier (UUID)
- `userId`: User who made the transaction
- `orderId`: Associated order (optional, unique)
- `type`: Transaction type (TOP_UP, PURCHASE, REFUND)
- `amount`: Transaction amount (Decimal)
- `currency`: Currency code (default: "EUR")
- `method`: Payment method used (string, optional)
- `status`: Payment status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `description`: Transaction description (optional)
- `transactionHash`: Gateway transaction ID (optional, unique)
- `gatewayResponse`: Full gateway response (JSON, optional)
- `createdAt`: Creation timestamp

**Relationships**:
- Belongs to User (userId)
- Optional relationship to Order (orderId)

**Validation Rules**:
- Amount must be positive for TOP_UP, negative for PURCHASE/REFUND
- Currency must be valid ISO 4217 code
- Method must match available payment methods
- Status transitions must be valid (PENDING → PROCESSING → COMPLETED/FAILED)

**Cache Keys**:
- `transaction:{id}`: Specific transaction
- `user:{userId}:transactions`: User transactions
- `transaction:method:{method}`: Transactions by payment method

**Synchronization Requirements**:
- Transaction status updates must invalidate user transaction cache
- Refund operations must create new REFUND transaction atomically

---

### User Cart
**Purpose**: Represents a user's shopping cart (admin view)

**Fields** (from Prisma schema):
- `userId`: User identifier (part of composite key)
- `gameId`: Game identifier (part of composite key)
- `quantity`: Item quantity (integer, default: 1)
- `addedAt`: When item was added (timestamp)

**Relationships**:
- Belongs to User (userId)
- Belongs to Game (gameId)

**Validation Rules**:
- Quantity must be positive integer
- Game must exist and be in stock
- User must exist

**Cache Keys**:
- `user:{userId}:cart`: User cart
- `session:{sessionId}:cart`: Guest session cart

**Synchronization Requirements**:
- Cart modifications must invalidate user cart cache
- Admin cart modifications must be logged

---

### User Wishlist
**Purpose**: Represents a user's wishlist (admin view)

**Fields** (from Prisma schema):
- `userId`: User identifier (part of composite key)
- `gameId`: Game identifier (part of composite key)
- `addedAt`: When item was added (timestamp)

**Relationships**:
- Belongs to User (userId)
- Belongs to Game (gameId)

**Validation Rules**:
- Game must exist
- User must exist
- Duplicate items are prevented by composite key

**Cache Keys**:
- `user:{userId}:wishlist`: User wishlist
- `session:{sessionId}:wishlist`: Guest session wishlist

**Synchronization Requirements**:
- Wishlist modifications must invalidate user wishlist cache
- Wishlist statistics computed from existing data

---

### FAQ Item
**Purpose**: Represents a FAQ entry

**Fields** (from Prisma schema):
- `id`: Unique identifier (UUID)
- `category`: FAQ category (string)
- `question`: FAQ question (string)
- `answer`: FAQ answer (text)
- `order`: Display order within category (integer, default: 0)
- `active`: Whether FAQ is published (boolean, default: true)
- `createdAt`: Creation timestamp

**Relationships**:
- None (standalone content entity)

**Validation Rules**:
- Question must not be empty
- Answer must not be empty
- Category must not be empty
- Order must be non-negative integer
- Active must be boolean

**Cache Keys**:
- `faq:all`: All active FAQs
- `faq:category:{category}`: FAQs by category
- `faq:{id}`: Specific FAQ

**Synchronization Requirements**:
- FAQ CRUD operations must invalidate FAQ cache
- Category changes must update category cache

---

### G2A Offer
**Purpose**: Represents a G2A marketplace offer (read-only for admin)

**Fields** (from G2A API):
- `offerId`: G2A offer identifier
- `productId`: G2A product identifier
- `status`: Offer status (New, Accepted, Active, Rejected, Cancelled, Finished, Banned)
- `inventory`: Inventory size (integer)
- `sold`: Number of keys sold (integer)
- `price`: Offer price (decimal)
- `visibility`: Offer visibility (retail, business, both)
- `offerType`: Offer type (dropshipping, promo, steamgift, game, preorder)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Linked to Game via g2aProductId

**Validation Rules**:
- Offer must exist in G2A system
- Status must be valid G2A status
- Inventory must be non-negative

**Cache Keys**:
- `g2a:offer:{offerId}`: Specific offer
- `g2a:offers:product:{productId}`: Offers for product

**Synchronization Requirements**:
- Offer data fetched from G2A API (not stored locally)
- Cache offers briefly (5 minutes) to reduce API calls

---

### G2A Reservation
**Purpose**: Represents an active G2A reservation (read-only for admin)

**Fields** (from G2A API):
- `reservationId`: G2A reservation identifier
- `orderId`: Local order identifier
- `productId`: G2A product identifier
- `quantity`: Reserved quantity (integer)
- `status`: Reservation status (pending, confirmed, expired, cancelled)
- `expiresAt`: Reservation expiration timestamp
- `createdAt`: Creation timestamp

**Relationships**:
- Linked to Order via orderId
- Linked to Game via productId → g2aProductId

**Validation Rules**:
- Reservation must exist in G2A system
- Status must be valid reservation status
- Quantity must be positive

**Cache Keys**:
- `g2a:reservation:{reservationId}`: Specific reservation
- `g2a:reservations:order:{orderId}`: Reservations for order

**Synchronization Requirements**:
- Reservation data fetched from G2A API (not stored locally)
- Cache reservations briefly (1 minute) due to frequent status changes

---

### Cache Statistics
**Purpose**: Represents cache performance metrics

**Fields** (computed from Redis):
- `totalKeys`: Total number of cache keys (integer)
- `memoryUsage`: Memory usage in bytes (integer)
- `hitRate`: Cache hit rate percentage (decimal)
- `missRate`: Cache miss rate percentage (decimal)
- `redisStatus`: Redis connection status (string: "connected", "disconnected", "error")
- `keysByPattern`: Key counts by pattern (object: { pattern: count })

**Relationships**:
- None (runtime statistics, not persisted)

**Validation Rules**:
- Statistics computed from Redis INFO command
- Hit/miss rates calculated from application metrics (if tracked)

**Cache Keys**:
- `cache:stats`: Cache statistics (cached for 30 seconds)

**Synchronization Requirements**:
- Statistics updated every 30 seconds
- Real-time invalidation operations bypass statistics cache

---

### User Activity
**Purpose**: Represents user activity logs (compiled from existing data)

**Fields** (compiled from multiple sources):
- `userId`: User identifier
- `loginHistory`: Array of login timestamps
- `orderHistory`: Array of orders with details
- `transactionHistory`: Array of transactions with details
- `cartActivity`: Recent cart modifications
- `wishlistActivity`: Recent wishlist modifications

**Relationships**:
- Compiled from User, Order, Transaction, CartItem, Wishlist entities

**Validation Rules**:
- User must exist
- Activity data compiled from existing database records

**Cache Keys**:
- `user:{userId}:activity`: User activity (cached for 5 minutes)

**Synchronization Requirements**:
- Activity logs compiled on-demand from existing data
- No separate activity log table needed
- Cache activity data briefly to improve performance

---

## Data Relationships Summary

```
User
├── orders (Order[])
├── transactions (Transaction[])
├── cart (CartItem[])
└── wishlist (Wishlist[])

Order
├── user (User)
├── items (OrderItem[])
└── transactions (Transaction[])

Transaction
├── user (User)
└── order (Order?)

Game
├── cartItems (CartItem[])
└── wishlistItems (Wishlist[])

PaymentMethod (standalone configuration)

FAQ (standalone content)

G2A Offer (external, linked via g2aProductId)
G2A Reservation (external, linked via orderId)
```

---

## Validation Rules Summary

- **Payment Transactions**: Amount sign must match transaction type, status transitions must be valid
- **Cart Items**: Quantity must be positive, game must be in stock
- **Wishlist Items**: No duplicates (enforced by composite key)
- **FAQ Items**: Question and answer must not be empty, order must be non-negative
- **User Balance**: Balance updates must create transaction records atomically
- **User Role**: Role must be valid enum value (USER, ADMIN)

---

## Cache Key Patterns

- `payment:methods`: All payment methods
- `payment:method:{id}`: Specific payment method
- `transaction:{id}`: Specific transaction
- `user:{userId}:transactions`: User transactions
- `transaction:method:{method}`: Transactions by payment method
- `user:{userId}:cart`: User cart
- `user:{userId}:wishlist`: User wishlist
- `faq:all`: All active FAQs
- `faq:category:{category}`: FAQs by category
- `g2a:offer:{offerId}`: G2A offer (5 min TTL)
- `g2a:reservation:{reservationId}`: G2A reservation (1 min TTL)
- `cache:stats`: Cache statistics (30 sec TTL)
- `user:{userId}:activity`: User activity (5 min TTL)

---

## Synchronization Requirements

1. **Payment Operations**: Refund operations must create transaction records atomically
2. **Cart/Wishlist**: Admin modifications must invalidate user cache and be logged
3. **FAQ**: CRUD operations must invalidate FAQ cache
4. **G2A**: Offer and reservation data fetched from API, cached briefly
5. **Cache**: Statistics cached for 30 seconds, invalidation operations bypass cache
6. **User Management**: Balance and role updates must be atomic and logged

