# Quickstart: Admin Panel Function Synchronization

**Feature**: 013-admin-sync  
**Date**: 2024-12-23  
**Status**: Complete

## Summary of Changes

This feature adds 6 new admin panel sections and extends backend services to support administrative operations across payment management, cart/wishlist management, FAQ management, G2A advanced management, cache management, and enhanced user management.

### New Admin Pages

1. **PaymentManagementPage.tsx**: Payment methods and transaction management
2. **CartManagementPage.tsx**: User cart viewing and management
3. **WishlistManagementPage.tsx**: User wishlist viewing and statistics
4. **FAQManagementPage.tsx**: FAQ CRUD operations
5. **G2AOffersPage.tsx**: G2A offers viewing
6. **G2AReservationsPage.tsx**: G2A reservations viewing and cancellation
7. **CacheManagementPage.tsx**: Cache statistics and invalidation
8. **EnhancedUsersPage.tsx**: Enhanced user management (balance, roles, activity)

### Backend Service Extensions

1. **admin.service.ts**: Add new admin functions for all new features
2. **payment.service.ts**: Add refund operations for all payment gateways
3. **cart.service.ts**: Add admin read/write operations
4. **wishlist.service.ts**: Add admin read operations and statistics
5. **faq.service.ts**: Add CRUD operations (if missing)
6. **g2a-offer.service.ts**: Add admin read operations
7. **g2a-reservation.service.ts**: Add admin read operations and cancellation
8. **g2a-metrics.service.ts**: Already exists, ensure proper exposure
9. **cache.service.ts**: Add cache statistics and management functions
10. **user.service.ts**: Add balance management, role assignment, activity logs

### New API Endpoints

All endpoints under `/api/admin/*` with admin authentication required:

- Payment: `/payments/methods`, `/payments/transactions`, `/payments/transactions/:id/refund`
- Cart: `/carts`, `/carts/user/:userId`, `PUT /carts/user/:userId`, `DELETE /carts/user/:userId`
- Wishlist: `/wishlists`, `/wishlists/user/:userId`, `/wishlists/statistics`
- FAQ: `/faqs`, `POST /faqs`, `PUT /faqs/:id`, `DELETE /faqs/:id`, `/faqs/categories`
- G2A: `/g2a/offers`, `/g2a/offers/:offerId`, `/g2a/reservations`, `POST /g2a/reservations/:id/cancel`
- Cache: `/cache/statistics`, `POST /cache/invalidate`, `POST /cache/clear`
- Users: `PUT /users/:id/balance`, `PUT /users/:id/role`, `/users/:id/activity`

## Implementation Checklist

### Phase 1: Backend Service Extensions

- [ ] Extend `payment.service.ts` with refund functions for Stripe, PayPal, Mollie, Terminal
- [ ] Extend `cart.service.ts` with admin functions: `getUserCart()`, `updateUserCart()`, `clearUserCart()`
- [ ] Extend `wishlist.service.ts` with admin functions: `getUserWishlist()`, `getWishlistStatistics()`
- [ ] Extend `faq.service.ts` with CRUD functions: `createFAQ()`, `updateFAQ()`, `deleteFAQ()`
- [ ] Extend `g2a-offer.service.ts` with admin read functions: `getAllOffers()`, `getOfferById()`
- [ ] Extend `g2a-reservation.service.ts` with admin functions: `getAllReservations()`, `cancelReservation()`
- [ ] Extend `cache.service.ts` with: `getCacheStatistics()`, `getCacheKeys()`
- [ ] Extend `user.service.ts` with: `updateUserBalance()`, `updateUserRole()`, `getUserActivity()`

### Phase 2: Backend Controllers and Routes

- [ ] Add payment management controllers to `admin.controller.ts`
- [ ] Add cart management controllers to `admin.controller.ts`
- [ ] Add wishlist management controllers to `admin.controller.ts`
- [ ] Add FAQ management controllers to `admin.controller.ts`
- [ ] Add G2A advanced management controllers to `admin.controller.ts`
- [ ] Add cache management controllers to `admin.controller.ts`
- [ ] Add enhanced user management controllers to `admin.controller.ts`
- [ ] Add all new routes to `admin.routes.ts`
- [ ] Add TypeScript types to `types/admin.ts`

### Phase 3: Frontend Admin API Client

- [ ] Extend `adminApi.ts` with payment management API calls
- [ ] Extend `adminApi.ts` with cart management API calls
- [ ] Extend `adminApi.ts` with wishlist management API calls
- [ ] Extend `adminApi.ts` with FAQ management API calls
- [ ] Extend `adminApi.ts` with G2A advanced management API calls
- [ ] Extend `adminApi.ts` with cache management API calls
- [ ] Extend `adminApi.ts` with enhanced user management API calls

### Phase 4: Frontend Admin Pages

- [ ] Create `PaymentManagementPage.tsx` with payment methods and transactions tables
- [ ] Create `CartManagementPage.tsx` with user cart search and management
- [ ] Create `WishlistManagementPage.tsx` with wishlist search and statistics
- [ ] Create `FAQManagementPage.tsx` with FAQ CRUD interface
- [ ] Create `G2AOffersPage.tsx` with G2A offers table
- [ ] Create `G2AReservationsPage.tsx` with reservations table and cancellation
- [ ] Create `CacheManagementPage.tsx` with cache statistics and invalidation controls
- [ ] Create `EnhancedUsersPage.tsx` with balance, role, and activity management

### Phase 5: Navigation and Integration

- [ ] Add new pages to `AdminApp.tsx` routes
- [ ] Add new menu items to `AdminSidebar.tsx`
- [ ] Update admin navigation to include all new sections
- [ ] Ensure all pages follow existing admin design patterns

### Phase 6: Testing

- [ ] Integration tests for payment refund operations
- [ ] Integration tests for cart/wishlist admin operations
- [ ] Integration tests for FAQ CRUD operations
- [ ] Integration tests for G2A management operations
- [ ] Integration tests for cache management operations
- [ ] Integration tests for enhanced user management operations
- [ ] Test admin authentication and authorization
- [ ] Test error handling and edge cases

## Code Examples

### Backend: Payment Refund Service

```typescript
// backend/src/services/payment.service.ts
export const refundTransaction = async (
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { user: true },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (!transaction.method) {
    throw new AppError('Transaction has no payment method', 400);
  }

  // Route to appropriate gateway service
  let refundResult: RefundResult;
  switch (transaction.method.toLowerCase()) {
    case 'stripe':
      refundResult = await refundStripeTransaction(transaction, amount);
      break;
    case 'paypal':
      refundResult = await refundPayPalTransaction(transaction, amount);
      break;
    case 'mollie':
      refundResult = await refundMollieTransaction(transaction, amount);
      break;
    case 'terminal':
      refundResult = await refundTerminalTransaction(transaction, amount);
      break;
    default:
      throw new AppError(`Unsupported payment method: ${transaction.method}`, 400);
  }

  // Create refund transaction record atomically
  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: transaction.userId,
        orderId: transaction.orderId,
        type: 'REFUND',
        amount: -Math.abs(refundResult.amount),
        currency: transaction.currency,
        method: transaction.method,
        status: refundResult.status === 'completed' ? 'COMPLETED' : 'PENDING',
        description: reason || `Refund for transaction ${transactionId}`,
        transactionHash: refundResult.refundId,
      },
    });

    // Update original transaction if needed
    if (refundResult.status === 'completed') {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' },
      });
    }
  });

  return refundResult;
};
```

### Backend: Cache Statistics Service

```typescript
// backend/src/services/cache.service.ts
export const getCacheStatistics = async (): Promise<CacheStatistics> => {
  const available = await isRedisAvailable();
  
  if (!available) {
    return {
      totalKeys: 0,
      memoryUsage: 0,
      hitRate: 0,
      missRate: 0,
      redisStatus: 'disconnected',
      keysByPattern: {},
    };
  }

  try {
    const info = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');
    
    // Parse Redis INFO output
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryUsage = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;
    
    // Get key counts by pattern
    const patterns = ['game:*', 'home:*', 'user:*', 'catalog:*', 'faq:*'];
    const keysByPattern: Record<string, number> = {};
    
    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      keysByPattern[pattern] = keys.length;
    }
    
    const totalKeys = Object.values(keysByPattern).reduce((sum, count) => sum + count, 0);
    
    return {
      totalKeys,
      memoryUsage,
      hitRate: 0, // Would need application-level tracking
      missRate: 0, // Would need application-level tracking
      redisStatus: 'connected',
      keysByPattern,
    };
  } catch (error) {
    console.error('[Cache] Error getting statistics:', error);
    return {
      totalKeys: 0,
      memoryUsage: 0,
      hitRate: 0,
      missRate: 0,
      redisStatus: 'error',
      keysByPattern: {},
    };
  }
};
```

### Frontend: Payment Management Page

```typescript
// frontend/src/admin/pages/PaymentManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import DataTable from '../components/DataTable';

const PaymentManagementPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');

  useEffect(() => {
    loadPaymentMethods();
    loadTransactions();
  }, [selectedMethod]);

  const loadPaymentMethods = async () => {
    const data = await adminApi.getPaymentMethods();
    setPaymentMethods(data.methods);
  };

  const loadTransactions = async () => {
    const data = await adminApi.getPaymentTransactions({ method: selectedMethod });
    setTransactions(data.transactions);
  };

  const handleRefund = async (transactionId: string) => {
    if (!confirm('Are you sure you want to refund this transaction?')) return;
    
    try {
      await adminApi.refundTransaction(transactionId);
      loadTransactions();
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  return (
    <div>
      <h1>Payment Management</h1>
      
      <section>
        <h2>Payment Methods</h2>
        <DataTable
          data={paymentMethods}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
            { key: 'available', label: 'Status' },
          ]}
        />
      </section>

      <section>
        <h2>Transactions</h2>
        <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
          <option value="">All Methods</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
          <option value="mollie">Mollie</option>
          <option value="terminal">Terminal</option>
        </select>
        
        <DataTable
          data={transactions}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'user.email', label: 'User' },
            { key: 'amount', label: 'Amount' },
            { key: 'method', label: 'Method' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Date' },
          ]}
          actions={[
            {
              label: 'Refund',
              onClick: (row) => handleRefund(row.id),
              condition: (row) => row.status === 'COMPLETED' && row.type !== 'REFUND',
            },
          ]}
        />
      </section>
    </div>
  );
};

export default PaymentManagementPage;
```

## Testing Strategy

### Unit Tests

- Test payment gateway refund functions individually
- Test cache statistics calculation
- Test cart/wishlist admin functions
- Test FAQ CRUD operations
- Test user balance and role updates

### Integration Tests

- Test payment refund flow end-to-end
- Test cart modification with cache invalidation
- Test FAQ creation and cache invalidation
- Test G2A offer/reservation fetching
- Test cache invalidation operations
- Test user balance update with transaction creation

### E2E Tests (Optional)

- Test admin login and navigation to new pages
- Test payment refund from admin panel
- Test FAQ creation and public display
- Test cache invalidation and data refresh

## Performance Considerations

- **Cache Statistics**: Cache for 30 seconds to avoid performance impact
- **G2A Data**: Cache offers for 5 minutes, reservations for 1 minute
- **User Activity**: Cache for 5 minutes, compiled on-demand
- **Payment Methods**: Cache for 1 hour (rarely changes)
- **FAQ Data**: Cache until invalidated on CRUD operations

## Security Considerations

- All endpoints require admin authentication
- Payment gateway credentials never exposed to frontend
- Refund operations logged for audit trail
- User balance updates require transaction records
- Cache invalidation operations logged
- All admin operations logged for audit

## Deployment Notes

- No database migrations required (using existing schema)
- New environment variables: None (using existing payment gateway configs)
- Frontend: New admin pages added to existing admin panel
- Backend: New routes added to existing admin router
- Cache: Redis optional (graceful degradation if unavailable)

