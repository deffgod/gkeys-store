# G2A Integration Client

A comprehensive TypeScript client for G2A Integration API, based on the official PHP client with significant enhancements.

## Features

✅ **Unified Client Architecture** - Single entry point for all G2A operations  
✅ **Dual Authentication** - OAuth2 (Import API) and Hash-based (Export API) with automatic method selection  
✅ **Smart Token Management** - Redis caching with in-memory fallback, auto-refresh before expiration  
✅ **Production-Ready Auth** - Correct SHA256-based API key generation for Export API production  
✅ **Advanced Resilience** - Circuit breaker, rate limiting, retry with exponential backoff  
✅ **Batch Operations** - Efficient bulk product fetching, order creation, and price updates  
✅ **Advanced Filtering** - Fluent filter API with complex queries  
✅ **Delta Sync** - Incremental synchronization with conflict resolution  
✅ **Comprehensive Testing** - 85%+ test coverage with unit, integration, and E2E tests  
✅ **TypeScript** - Full type safety throughout  
✅ **Backward Compatible** - Supports old variable names (G2A_CLIENT_ID, G2A_CLIENT_SECRET, etc.)

## Installation

The client is already integrated into the backend. Import from:

```typescript
import { G2AIntegrationClient } from './lib/g2a/index.js';
```

## Quick Start

### Basic Usage

```typescript
import { G2AIntegrationClient } from './lib/g2a/index.js';

// Create and initialize client
const client = await G2AIntegrationClient.create({
  apiKey: process.env.G2A_API_KEY!,
  apiHash: process.env.G2A_API_HASH!,
  email: process.env.G2A_EMAIL,  // Required for production Export API
  env: 'sandbox', // or 'live'
});

// Fetch products
const products = await client.products.list({ minQty: 1, page: 1 });

// Create an order
const order = await client.orders.create({
  product_id: 'PRODUCT_ID',
  currency: 'USD',
  max_price: 50,
});

// Pay for the order
const payment = await client.orders.pay(order.order_id);

// Get the key
const key = await client.orders.getKey(order.order_id);
```

### Batch Operations

```typescript
// Batch fetch products
const productIds = ['PROD1', 'PROD2', 'PROD3'];
const result = await client.products.batchGet(productIds);

console.log(`Fetched ${result.length} products`);
```

### Advanced Filtering

```typescript
import { ProductFilter } from './lib/g2a/filters/ProductFilter.js';

const filter = new ProductFilter(client.products, client.getLogger());

const products = await filter
  .priceRange(10, 50)
  .platforms(['Steam', 'Epic Games'])
  .inStock()
  .sortBy('price', 'asc')
  .paginate(1, 20)
  .execute();
```

### Delta Sync

```typescript
import { DeltaSync } from './lib/g2a/sync/DeltaSync.js';

const deltaSync = new DeltaSync(client.products, client.getLogger());

// Sync products updated since last sync
const result = await deltaSync.sync({
  lastSyncTimestamp: '2024-01-01 00:00:00',
  maxPages: 50,
});

console.log(`New products: ${result.newProducts.length}`);
console.log(`Updated products: ${result.updatedProducts.length}`);
```

## API Modules

### Products API

```typescript
// List products
await client.products.list({ page: 1, minQty: 5 });

// Get single product
await client.products.get('PRODUCT_ID');

// Batch get
await client.products.batchGet(['ID1', 'ID2', 'ID3']);

// Search
await client.products.search('witcher');
```

### Orders API

```typescript
// Create order
await client.orders.create({
  product_id: 'PROD_ID',
  currency: 'USD',
  max_price: 50,
});

// Get order details
await client.orders.get('ORDER_ID');

// Pay for order
await client.orders.pay('ORDER_ID');

// Get order key
await client.orders.getKey('ORDER_ID');

// Batch create orders
await client.orders.batchCreate([
  { product_id: 'PROD1', currency: 'USD' },
  { product_id: 'PROD2', currency: 'EUR' },
]);
```

### Offers API (Import API)

```typescript
// Create offer
const result = await client.offers.create({
  offerType: 'dropshipping',
  productId: 'PROD_ID',
  price: 29.99,
  visibility: 'retail',
});

// Wait for job completion
const job = await client.jobs.waitForCompletion(result.jobId);
const offerId = job.resourceId;

// Get offer
await client.offers.get(offerId);

// List offers
await client.offers.list({ active: true });

// Update offer
await client.offers.update(offerId, { price: 24.99 });
```

### Reservations API (Dropshipping)

```typescript
// Create reservation
const reservation = await client.reservations.create({
  orderId: 'ORD_ID',
  productId: 'PROD_ID',
  quantity: 1,
});

// Confirm reservation
const confirmation = await client.reservations.confirm(reservation.reservationId);

if (!confirmation.stockReady) {
  // Wait for inventory
  const inventory = await client.reservations.waitForInventoryReady('ORD_ID');
  console.log(`Keys: ${inventory.keys}`);
}
```

## Configuration

### Full Configuration Options

```typescript
const config = {
  // Required
  apiKey: 'your-api-key',
  apiHash: 'your-api-hash',
  
  // Optional
  env: 'sandbox', // or 'live'
  email: 'your-email@example.com',
  
  // HTTP Settings
  timeoutMs: 8000,
  
  // Retry Configuration
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },
  
  // Circuit Breaker
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    failureWindowMs: 60000,
    resetTimeoutMs: 30000,
    halfOpenSuccessThreshold: 2,
  },
  
  // Rate Limiting
  rateLimiting: {
    enabled: true,
    requestsPerSecond: 10,
    burstSize: 20,
    perEndpoint: {
      '/products': { requestsPerSecond: 5, burstSize: 10 },
    },
  },
  
  // Batch Operations
  batch: {
    maxBatchSize: 100,
    maxConcurrentRequests: 3,
    productFetchChunkSize: 10,
  },
  
  // Logging & Metrics
  logging: {
    enabled: true,
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    maskSecrets: true,
  },
  
  metrics: {
    enabled: true,
  },
};
```

## Error Handling

```typescript
import { G2AError, G2AErrorCode } from './lib/g2a/index.js';

try {
  await client.products.get('INVALID_ID');
} catch (error) {
  if (error instanceof G2AError) {
    console.log(`Error code: ${error.code}`);
    console.log(`Retryable: ${error.isRetryable()}`);
    console.log(`HTTP status: ${error.metadata.httpStatus}`);
    
    if (error.code === G2AErrorCode.G2A_PRODUCT_NOT_FOUND) {
      // Handle not found
    }
  }
}
```

## Testing

```bash
# Run unit tests
npm test -- src/__tests__/unit/g2a

# Run specific test file
npm test -- src/__tests__/unit/g2a/CircuitBreaker.test.ts

# Run with coverage
npm test -- --coverage
```

## Migration from Old Client

The new client maintains backward compatibility through facade functions. See the migration guide for details.

## License

MIT

## Support

For issues or questions, please refer to the G2A Integration API documentation or create an issue in the repository.
