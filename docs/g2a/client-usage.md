# G2A Integration Client - Usage Guide

Complete guide for using the G2A Integration Client

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Authentication](#authentication)
3. [Product Operations](#product-operations)
4. [Order Operations](#order-operations)
5. [Batch Operations](#batch-operations)
6. [Advanced Filtering](#advanced-filtering)
7. [Synchronization](#synchronization)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

## Installation & Setup

### Environment Variables

Set up the following environment variables:

```bash
# Required
G2A_API_KEY=your_api_key
G2A_API_HASH=your_api_hash

# Optional
G2A_EMAIL=your_email@domain.com
G2A_ENV=sandbox # or 'live'
G2A_API_URL=https://sandboxapi.g2a.com/v1
G2A_TIMEOUT_MS=8000
G2A_RETRY_MAX=3
REDIS_URL=redis://localhost:6379
```

### Initialize Client

```typescript
import { G2AIntegrationClient } from './lib/g2a/index.js';

// Singleton pattern (recommended for production)
const client = await G2AIntegrationClient.getInstance({
  apiKey: process.env.G2A_API_KEY!,
  apiHash: process.env.G2A_API_HASH!,
  env: process.env.G2A_ENV as 'sandbox' | 'live',
});

// Or create new instance (useful for testing)
const client = await G2AIntegrationClient.create({
  apiKey: process.env.G2A_API_KEY!,
  apiHash: process.env.G2A_API_HASH!,
});
```

## Authentication

The client handles two types of authentication automatically:

### OAuth2 Token (Import API)

Used for: Offers, Jobs, Bestsellers, Reservations, Price Simulations

```typescript
// Token is automatically obtained and cached
const offers = await client.offers.list();
```

### Hash-based Authentication (Export API)

Used for: Products, Orders

```typescript
// Authentication headers are automatically added
const products = await client.products.list();
```

### Manual Token Management

```typescript
// Refresh token manually
await client.getAuthManager().refreshOAuth2Token();

// Invalidate token cache
await client.getAuthManager().invalidateToken();

// Test authentication
const isValid = await client.getAuthManager().testAuthentication('export');
```

## Product Operations

### List Products

```typescript
// Basic list
const response = await client.products.list({ page: 1 });

// With filters
const response = await client.products.list({
  page: 1,
  minQty: 5,
  minPriceFrom: 10,
  minPriceTo: 50,
  includeOutOfStock: false,
  updatedAtFrom: '2024-01-01 00:00:00',
});

console.log(`Total: ${response.total}`);
console.log(`Products: ${response.docs.length}`);
```

### Get Single Product

```typescript
const product = await client.products.get('PRODUCT_ID');

console.log(`Name: ${product.name}`);
console.log(`Price: ${product.price} ${product.currency}`);
console.log(`Stock: ${product.qty}`);
```

### Batch Get Products

```typescript
const productIds = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5'];
const products = await client.products.batchGet(productIds);

console.log(`Fetched ${products.length} products`);
```

### Search Products

```typescript
const results = await client.products.search('witcher', {
  minQty: 1,
  page: 1,
});

console.log(`Found ${results.total} products`);
```

## Order Operations

### Create Order

```typescript
const order = await client.orders.create({
  product_id: 'PRODUCT_ID',
  currency: 'USD',
  max_price: 50,
});

console.log(`Order ID: ${order.order_id}`);
console.log(`Price: ${order.price} ${order.currency}`);
```

### Complete Order Flow

```typescript
// 1. Create order
const order = await client.orders.create({
  product_id: 'PRODUCT_ID',
  currency: 'USD',
  max_price: 50,
});

// 2. Pay for order
const payment = await client.orders.pay(order.order_id);
console.log(`Transaction ID: ${payment.transaction_id}`);

// 3. Get order key
const keyResponse = await client.orders.getKey(order.order_id);
console.log(`Key: ${keyResponse.key}`);
console.log(`Is File: ${keyResponse.isFile || false}`);
```

### Get Order Details

```typescript
const details = await client.orders.get('ORDER_ID');

console.log(`Status: ${details.status}`);
console.log(`Price: ${details.price} ${details.currency}`);
```

## Batch Operations

### Batch Product Fetcher

```typescript
import { BatchProductFetcher } from './lib/g2a/batch/BatchProductFetcher.js';

const fetcher = new BatchProductFetcher(
  client.products,
  client.getLogger(),
  10, // chunk size
  3 // max concurrency
);

// Fetch by IDs
const result = await fetcher.fetchByIds(['ID1', 'ID2', '...', 'ID100']);

console.log(`Success: ${result.successCount}`);
console.log(`Failures: ${result.failureCount}`);
console.log(`Duration: ${result.duration}ms`);

// Fetch updated since date
const deltaResult = await fetcher.fetchUpdatedSince('2024-01-01 00:00:00');
```

### Batch Order Creator

```typescript
import { BatchOrderCreator } from './lib/g2a/batch/BatchOrderCreator.js';

const creator = new BatchOrderCreator(
  client.orders,
  client.getLogger()
);

// Create multiple orders
const orders = [
  { product_id: 'PROD1', currency: 'USD' },
  { product_id: 'PROD2', currency: 'EUR' },
  { product_id: 'PROD3', currency: 'GBP' },
];

const result = await creator.createOrders(orders);

console.log(`Created ${result.successCount} orders`);

// Create and pay
const paidResult = await creator.createAndPayOrders(orders);
```

### Batch Price Updater

```typescript
import { BatchPriceUpdater } from './lib/g2a/batch/BatchPriceUpdater.js';

const updater = new BatchPriceUpdater(
  client.priceSimulations,
  client.getLogger()
);

// Simulate price updates
const updates = [
  { productId: 'PROD1', newPrice: 29.99, currentPrice: 24.99 },
  { productId: 'PROD2', newPrice: 39.99, currentPrice: 34.99 },
];

const result = await updater.simulatePrices(updates);

result.success.forEach(update => {
  console.log(`Product ${update.productId}:`);
  console.log(`  Income: ${update.simulation.income}`);
  console.log(`  Final Price: ${update.simulation.finalPrice}`);
});
```

## Advanced Filtering

### Using ProductFilter

```typescript
import { ProductFilter } from './lib/g2a/filters/ProductFilter.js';

const filter = new ProductFilter(client.products, client.getLogger());

// Build complex filter
const products = await filter
  .priceRange(10, 50)
  .platforms(['Steam', 'Epic Games'])
  .region('GLOBAL')
  .inStock()
  .updatedSince('2024-01-01 00:00:00')
  .search('action')
  .sortBy('price', 'asc')
  .paginate(1, 20)
  .execute();

console.log(`Found ${products.total} products`);
```

### Custom Filter Builder

```typescript
import { FilterBuilder } from './lib/g2a/filters/FilterBuilder.js';

const filter = new FilterBuilder<Product>(client.getLogger(), 'Product');

filter
  .where('status', 'active')
  .whereBetween('price', 10, 100)
  .whereIn('platform', ['Steam', 'Epic'])
  .sortBy('createdAt', 'desc')
  .paginate(1, 50);

const built = filter.build();
// Use built filter object for custom queries
```

## Synchronization

### Delta Sync

```typescript
import { DeltaSync } from './lib/g2a/sync/DeltaSync.js';

const deltaSync = new DeltaSync(client.products, client.getLogger());

// Incremental sync
const result = await deltaSync.sync({
  lastSyncTimestamp: '2024-01-01 00:00:00',
  maxPages: 50,
});

console.log(`New products: ${result.newProducts.length}`);
console.log(`Updated products: ${result.updatedProducts.length}`);

// Save last sync timestamp for next run
const nextSyncTimestamp = result.lastSyncTimestamp;
```

### Conflict Resolution

```typescript
import { ConflictResolver } from './lib/g2a/sync/ConflictResolver.js';

const resolver = new ConflictResolver(client.getLogger(), 'newer_wins');

// Resolve single conflict
const resolution = resolver.resolveProduct(
  sourceProduct,
  destinationProduct,
  'merge' // or 'source_wins', 'destination_wins', 'newer_wins'
);

console.log(`Strategy used: ${resolution.strategy}`);
console.log(`Changes: ${resolution.changes.join(', ')}`);
```

### Sync Orchestrator

```typescript
import { SyncOrchestrator } from './lib/g2a/sync/SyncOrchestrator.js';
import { DeltaSync } from './lib/g2a/sync/DeltaSync.js';
import { ConflictResolver } from './lib/g2a/sync/ConflictResolver.js';

const deltaSync = new DeltaSync(client.products, client.getLogger());
const resolver = new ConflictResolver(client.getLogger());
const orchestrator = new SyncOrchestrator(deltaSync, resolver, client.getLogger());

// Full sync with all components
const result = await orchestrator.sync({
  syncCatalog: true,
  syncCategories: true,
  parallel: true,
  lastSyncTimestamp: '2024-01-01 00:00:00',
});

console.log(`Total duration: ${result.totalDuration}ms`);
console.log(`Errors: ${result.errors.length}`);
```

## Error Handling

### Typed Error Handling

```typescript
import { G2AError, G2AErrorCode } from './lib/g2a/index.js';

try {
  await client.products.get('INVALID_ID');
} catch (error) {
  if (error instanceof G2AError) {
    switch (error.code) {
      case G2AErrorCode.G2A_PRODUCT_NOT_FOUND:
        console.log('Product not found');
        break;
      case G2AErrorCode.G2A_RATE_LIMIT:
        console.log('Rate limit exceeded');
        await new Promise(resolve => setTimeout(resolve, error.metadata.retryAfter || 5000));
        break;
      case G2AErrorCode.G2A_AUTH_FAILED:
        console.log('Authentication failed');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```

### Circuit Breaker Monitoring

```typescript
// Get circuit breaker stats
const stats = client.getCircuitBreakerStats('/products');

console.log(`State: ${stats.state}`);
console.log(`Failures: ${stats.failures}`);
console.log(`Last failure: ${stats.lastFailure}`);
```

### Rate Limiter Monitoring

```typescript
// Get remaining tokens
const stats = client.getRateLimiterStats('/products');

console.log(`Remaining tokens: ${stats.remainingTokens}`);
```

## Best Practices

### 1. Use Singleton Pattern in Production

```typescript
// Good
const client = await G2AIntegrationClient.getInstance(config);

// Avoid creating multiple instances
const client1 = await G2AIntegrationClient.create(config);
const client2 = await G2AIntegrationClient.create(config); // Unnecessary
```

### 2. Handle Errors Gracefully

```typescript
try {
  const product = await client.products.get(productId);
} catch (error) {
  if (error instanceof G2AError && error.isRetryable()) {
    // Retry is automatic, but you can add custom logic
    console.log('Will be retried automatically');
  } else {
    // Handle non-retryable error
    console.error('Fatal error:', error);
  }
}
```

### 3. Use Batch Operations for Multiple Requests

```typescript
// Good
const products = await client.products.batchGet(productIds);

// Avoid
const products = await Promise.all(
  productIds.map(id => client.products.get(id))
);
```

### 4. Leverage Delta Sync

```typescript
// Store last sync timestamp
let lastSync = await getLastSyncFromDB();

// Only fetch updated products
const result = await deltaSync.sync({ lastSyncTimestamp: lastSync });

// Update timestamp
await saveLastSyncToDB(result.lastSyncTimestamp);
```

### 5. Monitor Circuit Breaker and Rate Limiter

```typescript
// Periodically check health
setInterval(() => {
  const stats = client.getCircuitBreakerStats('/products');
  if (stats.state === 'OPEN') {
    alert('G2A API circuit breaker is open!');
  }
}, 60000);
```

## Complete Example

```typescript
import { G2AIntegrationClient } from './lib/g2a/index.js';
import { ProductFilter } from './lib/g2a/filters/ProductFilter.js';
import { DeltaSync } from './lib/g2a/sync/DeltaSync.js';

async function main() {
  // 1. Initialize client
  const client = await G2AIntegrationClient.getInstance({
    apiKey: process.env.G2A_API_KEY!,
    apiHash: process.env.G2A_API_HASH!,
    env: 'sandbox',
  });

  // 2. Fetch products with filtering
  const filter = new ProductFilter(client.products, client.getLogger());
  const products = await filter
    .priceRange(10, 50)
    .inStock()
    .sortBy('price', 'asc')
    .paginate(1, 20)
    .execute();

  console.log(`Found ${products.total} products`);

  // 3. Create and pay for order
  const order = await client.orders.create({
    product_id: products.docs[0].id,
    currency: 'USD',
    max_price: products.docs[0].price,
  });

  const payment = await client.orders.pay(order.order_id);
  const key = await client.orders.getKey(order.order_id);

  console.log(`Order completed! Key: ${key.key}`);

  // 4. Run delta sync
  const deltaSync = new DeltaSync(client.products, client.getLogger());
  const syncResult = await deltaSync.sync({
    lastSyncTimestamp: '2024-01-01 00:00:00',
  });

  console.log(`Sync completed: ${syncResult.totalFetched} products`);

  // 5. Cleanup
  await client.close();
}

main().catch(console.error);
```
