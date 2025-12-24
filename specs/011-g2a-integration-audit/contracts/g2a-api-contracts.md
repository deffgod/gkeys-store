# G2A API Contracts

## Authentication

G2A Integration API uses **two different authentication methods** depending on the API type:

### 1. OAuth2 Token Authentication (Import API)

**Method**: OAuth2 token-based authentication for Import API operations

**Token Endpoint**: `GET /token`

**Token Response**:
```typescript
{
  access_token: string;
  expires_in: number; // 3600 seconds (1 hour)
  token_type: string;
}
```

**Usage**:
- Token is obtained via `GET /token` using hash-based auth
- Token is cached in Redis with TTL matching `expires_in`
- Token is automatically refreshed if it expires within 5 minutes
- Token is used in `Authorization: Bearer {access_token}` header for Import API requests

**When to Use**: All Import API endpoints (offers, jobs, bestsellers, reservations, price simulations)

### 2. Hash-based Authentication (Export API)

**Method**: Hash-based authentication with SHA-256 hash generation

**Headers Required**:
- `X-API-HASH`: G2A_API_HASH (from environment variable)
- `X-API-KEY`: G2A_API_KEY (from environment variable)
- `X-G2A-Timestamp`: Unix timestamp in seconds (current time)
- `X-G2A-Hash`: SHA-256 hash of (G2A_API_HASH + G2A_API_KEY + timestamp)

**Hash Generation**:
```
timestamp = Math.floor(Date.now() / 1000).toString()
hash = SHA256(G2A_API_HASH + G2A_API_KEY + timestamp)
```

**Sandbox Authentication** (simplified):
- For sandbox API (`sandboxapi.g2a.com`), uses simple Authorization header:
  - `Authorization: "{G2A_API_HASH}, {G2A_API_KEY}"`

**When to Use**: All Export API endpoints (products, orders, order details, order keys, payment)

**Environment Variables**:
- `G2A_API_HASH` (or `G2A_API_SECRET` for backward compatibility)
- `G2A_API_KEY`
- `G2A_API_URL` (base URL, auto-normalized to include `/integration-api/v1`)

## Export API - Products (G2A Developers API)

### Get Products (GET /v1/products)
- Params: 
  - page (optional, default: 1, max: 500)
  - id (optional) - specific product ID
  - minQty (optional) - minimum product quantity
  - minPriceFrom (optional) - minimal product's price start
  - minPriceTo (optional) - minimal product's price end
  - includeOutOfStock (optional, default: false) - include out of stock products
  - updatedAtFrom (optional) - filter by updated at from (yyyy-mm-dd hh:mm:ss)
  - updatedAtTo (optional) - filter by updated at to (yyyy-mm-dd hh:mm:ss)
- Response: { total: number, page: number, docs: G2AProduct[] }
- Product fields include:
  - availableToBuy (boolean, v1.10.0) - product availability for purchase
  - priceLimit (object, v1.8.0) - { min: number | null, max: number | null }
  - retailMinBasePrice (number, v1.6.0) - minimal price without fees
  - coverImage (string, v1.4.0) - URL to cover image
  - images (array, v1.4.0) - array of image URLs
  - categories (array, v1.3.0) - [{ id: string|number, name: string }]
  - restrictions (object) - PEGI restrictions
  - requirements (object) - system requirements (minimal/recommended)
  - videos (array) - [{ type: string, url: string }]

### Price/Stock Check (GET /v1/products/{id})
- Response: product detail with all fields including stock (qty), price, etc.
- **Note**: Stock information is included in the main product endpoint response. There is no separate `/products/{id}/stock` endpoint (returns 404).
- **Note**: There is no batch price endpoint `POST /products/prices` (returns 404). Use individual `GET /products/{id}` requests for each product.

## Export API - Orders (G2A Developers API)

### Order Create (POST /v1/order)
- Body: { product_id: string, currency?: string (default: EUR), max_price?: number }
- Response: { order_id: string, price: number, currency: string }
- Note: Keys are not returned immediately - need to pay first, then get keys via getOrderKey()

### Get Order Details (GET /v1/order/details/{id})
- Response: { status: string, price: number, currency: string }
- Status: 'complete' | 'pending'
- Error: 404 if order not found (ORD02)

### Get Order Key (GET /v1/order/key/{id})
- Response: { key: string, isFile?: boolean }
- Error: 404 if order not found (ORD02), 400 if key already downloaded (ORD004)
- Note: Key can only be downloaded once. Field `isFile` added in API v1.9.0

### Pay Order (PUT /v1/order/pay/{id})
- Method: PUT (not POST) with empty body (Content-Length: 0)
- Response: { status: boolean, transaction_id: string }
- Errors: ORD112 (not enough funds), ORD114 (payment too late), ORD03 (not ready yet), ORD05 (payment required or in progress - 402), ORD122 (Bad Gateway - 502)

## Import API - Offers

### Create Offer (POST /integration-api/v1/offers)
- Body: { offerType, productId, price, visibility, inventory?, variant? }
- Response: { jobId: string } - Use jobId to check status and get resourceId (offerId)
- Offer Types: 'dropshipping', 'promo', 'steamgift', 'game', 'preorder'

### Get Offer (GET /integration-api/v1/offers/{offerId})
- Response: { id, type, productId, price, visibility, status, active, inventory, ... }

### Get Offers List (GET /integration-api/v1/offers)
- Params: productId?, status?, offerType?, active?, page?, perPage? (10, 20, 50, 100)
- Response: { data: G2AOffer[], meta: { currentPage, lastPage, perPage, total } }

### Update Offer Partial (PATCH /integration-api/v1/offers/{offerId})
- Body: { price?, visibility?, active?, inventory?, variant? }
- Response: Updated G2AOffer
- Note: Only certain types can be edited: dropshipping, promo, steamgift, game

### Add Offer Inventory (POST /integration-api/v1/offers/{offerId}/inventory)
- Body: { keys: string[] } or FormData with image files
- Response: { collectionUuid: string } - Use as tmpInventoryId when updating offer
- Note: Used for promo offers to add keys collection

## Import API - Jobs

### Get Job Status (GET /integration-api/v1/jobs/{jobId})
- Response: { jobId, resourceId?, resourceType?, status, code?, message? }
- Status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
- ResourceId: Available after job completion (this is the offerId for offer creation)

## Import API - Price Simulations

### Get Price Simulation (GET /integration-api/v1/prices/simulations)
- Params: productId, price, country? (optional)
- Response: { income, finalePrice, businessFinalPrice, businessIncome }
- Values can be for ALL, OTHER, or specific country codes (e.g., "PL", "GB")

## Import API - Bestsellers

### Get Bestsellers (GET /integration-api/v1/bestsellers)
- Params: category?, platform?, page?, perPage?
- Response: { data: G2ABestseller[], meta? }
- Returns list of best selling products to expand selling portfolio

## Import API - Reservations (Dropshipping)

### Create Reservation (POST /integration-api/v1/reservations)
- Body: { orderId, productId, quantity }
- Response: { reservationId, orderId, productId, quantity, status, expiresAt, createdAt }
- Timeout: 9 seconds (API must respond within 9 seconds)
- TTL: Minimum 30 minutes

### Confirm Reservation (POST /integration-api/v1/reservations/{id}/confirm)
- Response: { reservationId, status: 'confirmed', stockReady: boolean }
- Timeout: 9 seconds
- If stockReady is false, respond with HTTP 202 (Order created without stock)

### Check Inventory (GET /integration-api/v1/inventory/{orderId})
- Response: { orderId, stockReady: boolean, keys?: string[] }
- Used when stock is not ready (HTTP 202 response)
- Should be called repeatedly until stockReady is true

## Error Model
- HTTP codes: 4xx validation/auth; 429 rate limit; 5xx server.
- Include error code/message; map to internal error taxonomy.
- Specific error codes:
  - **ORD02** (404) - Order not found
  - **ORD004** (400) - Order key has been downloaded already
  - **ORD05** (402) - Payment required or in progress (v1.10.0 - now clearly indicates payment issues)
  - **ORD112** (403) - Not enough funds to pay for order
  - **ORD114** (403) - Payment is too late. Try with another order
  - **ORD03** (403) - Payment is not ready yet. Try again later
  - **ORD122** (502) - Bad Gateway (v1.11.0)
  - **ORD121** (403) - G2A PAY limit reached (v1.2.0)
  - **AUTH01** (400) - No Authorization header
  - **AUTH02** (401) - Merchant with this authorization not found
  - **AUTH03** (401) - Unallowed IP address
  - **AUTH04** (401) - No privileges to this method
  - **BR03** (429) - Too many requests to the API

## Internal Models
- G2AProduct (with new fields: availableToBuy, priceLimit, retailMinBasePrice, coverImage, categoryDetails, restrictions, requirements, videos)
- G2AOrder, G2AOrderDetailsResponse, G2AOrderKeyResponse (with isFile field)
- G2APayOrderResponse
- G2AOffer, G2AJob, G2AReservation, PriceSimulationResponse
- WebhookEvent, IdempotencyRecord

> For full field list, consult the PDF; this contract captures required fields for typing and validation.
