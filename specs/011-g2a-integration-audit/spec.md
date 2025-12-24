# Feature Specification: G2A Integration & Backend Audit

**Feature Branch**: `011-g2a-integration-audit`
**Status**: Draft
**Input**: G2A API documentation (https://static.g2a.com/_/User-guide-to-api.pdf) and request to verify/prepare backend integration and handoff.

## User Scenarios & Testing

### Story 1 – Stable G2A API connectivity (P1)
As a backend service, I must authenticate to G2A and call product/price/stock/order endpoints reliably with proper timeouts/retries and logging so that commerce flows do not fail silently.

### Story 2 – Correct order creation and callback handling (P1)
As the order service, I must create G2A orders, validate webhook signatures/timestamps/nonces, and update local order/payment states idempotently so that duplicates or tampering are prevented.

### Story 3 – Environment safety (P1)
As a deployer, I must have clear sandbox/live separation, env vars, and URL validation so that wrong endpoints/keys cannot break production.

### Story 4 – Operability & handoff (P2)
As an operator/next team, I need docs, quickstart, and health/metrics so I can monitor, debug, and extend the integration quickly.

## Requirements

### Functional Requirements
- **FR-001a**: Authenticate to G2A Import API using OAuth2 Bearer Token authentication. Fetch access token via `GET /token` endpoint using hash-based auth (G2A_API_HASH + G2A_API_KEY + timestamp). Cache token in Redis with TTL matching `expires_in` (3600s). Refresh token when <5min remaining. Use `Authorization: Bearer {access_token}` header for all Import API requests (offers, jobs, bestsellers, reservations, price simulations).
- **FR-001b**: Authenticate to G2A Export API using hash-based authentication. See `contracts/g2a-api-contracts.md` for hash generation algorithm (SHA-256 of G2A_API_HASH + G2A_API_KEY + timestamp). Include headers: `X-API-HASH`, `X-API-KEY`, `X-G2A-Timestamp`, `X-G2A-Hash`. For sandbox, use simplified `Authorization: "{hash}, {key}"` format. Validate credentials on startup and fail fast on invalid credentials.
- **FR-002**: Provide client ops: product list/query, price check, stock check, order creation; map to internal models with validation.
- **FR-003**: Validate base URL: Production Import API uses `/integration-api/v1`; Export API uses `/v1`; Sandbox uses `/v1`. Auto-append correct path if missing and reject malformed URLs.
- **FR-004**: Apply HTTP timeouts (5–10s) and bounded retries with jitter/backoff for transient errors (429/5xx), no retry on 4xx.
- **FR-005**: Log requests (path, method, status, latency, correlation-id) with secrets masked; emit metrics (latency, error rate, retries).
- **FR-006**: Webhook handler validates HMAC-SHA256 signature (signature = HMAC-SHA256(payload + timestamp + nonce + G2A_API_HASH)), validates nonce uniqueness, validates timestamp (clock-skew tolerance ±5min), and rejects stale/invalid callbacks. Uses timing-safe comparison to prevent timing attacks.
- **FR-007**: Webhook processing is idempotent (idempotency key per event/order) and persists status updates atomically.
- **FR-008**: Expose health/diagnostic endpoint covering G2A connectivity. Token fetch probe: verify OAuth2 access token retrieval and caching for Import API (tests Redis cache + token endpoint). Also verify idempotency store (DB/Redis) availability.
- **FR-009**: Provide smoke script or e2e path against sandbox: token → product/price → order create → simulated webhook.
- **FR-010**: Configuration toggle for sandbox vs live (env var) with safe defaults to sandbox in non-prod.

### Non-Functional Requirements
- **NFR-001 (Performance)**: API calls complete within timeout; retries capped; no unbounded loops.
- **NFR-002 (Reliability)**: Idempotent callbacks; durable persistence of order status; retries logged.
- **NFR-003 (Security)**: Secrets in env only; never logged; signatures verified; TLS required.
- **NFR-004 (Maintainability)**: Typed contracts for requests/responses; single client module; clear error taxonomy.
- **NFR-005 (Observability)**: Structured logs + metrics for G2A calls and webhooks; trace/correlation ids propagated.
- **NFR-006 (Compliance/Access)**: Production keys guarded; rotation documented; least-privilege principle.
- **NFR-007 (Caching)**: OAuth2 tokens MUST be cached in Redis with TTL matching `expires_in`; refresh when <5min remaining; graceful degradation if Redis unavailable (fetch on-demand). Cache keys follow pattern: `g2a:token:{env}`. Cache invalidation on credential rotation.

### Entities
- **G2AAuthCredentials**: apiHash, apiKey, baseUrl, env (sandbox|live) - stored in environment variables, not cached tokens.
- **G2AProduct**: id, title, price, stock, region, platform, etc.
- **G2AOrder**: id, items, amount/currency, status, created_at, signature fields.
- **WebhookEvent**: event_id, order_id, type, payload, signature, nonce, timestamp, processed_at.
- **IdempotencyRecord**: key, status, attempts, last_error, updated_at.

### Edge Cases
- Invalid/missing G2A credentials (G2A_API_HASH or G2A_API_KEY); authentication 401/429/5xx.
- Base URL misconfigured (missing `/integration-api/v1`).
- Price/stock mismatch vs local expectation.
- Order create returns partial/validation errors.
- Duplicate webhook deliveries; replay attacks with old timestamps.
- Clock skew beyond tolerance.
- Network timeouts; all retries exhausted.
- Sandbox vs live mix-up.

## Success Criteria
- SC-001: 100% G2A calls use validated base URL: Production Import API uses `/integration-api/v1`; Export API uses `/v1`; Sandbox uses `/v1`. URL normalization applied correctly based on API type and environment.
- SC-002: Both authentication methods work correctly: OAuth2 token authentication for Import API (no 401s, token cached and refreshed); hash-based authentication for Export API (no 401s in steady state, hash generated with correct timestamp).
- SC-003: Webhook signature/timestamp validation blocks invalid/stale requests (0 false accepts in tests).
- SC-004: Idempotent processing proven by duplicate webhook test (no double updates).
- SC-005: Sandbox smoke test passes end-to-end (auth → product/price → order → webhook simulation).
- SC-006: Logs/metrics present for all client calls and webhooks; secrets masked.
- SC-007: Env separation verified; non-prod defaults to sandbox.

## Assumptions
- Backend already TypeScript/Node; HTTP client available (e.g., axios/fetch wrapper).
- Persistent store (DB/Redis) available for idempotency records.
- Time sync (NTP) is in place for timestamp validation.
- PDF doc is the canonical contract reference.

## Dependencies
- Env vars: `G2A_API_URL`, `G2A_API_KEY`, `G2A_API_HASH` (or `G2A_API_SECRET` for backward compatibility), `G2A_ENV` (sandbox|live), `G2A_TIMEOUT_MS` (optional), `G2A_RETRY_MAX` (optional).
- G2A Integration API (HTTPS).
- Logger/metrics stack (e.g., pino + prom + tracing).
- Database/Redis for idempotency.

## Out of Scope
- Frontend catalog rendering (covered in other features).
- Payment provider specifics outside G2A.
- UI/UX changes beyond admin/ops tooling for G2A visibility.
- **Payment flow operations** (`payOrder`, `getOrderKey`, `getOrderDetails`) - these are implemented in `g2a.service.ts` but are outside the scope of this audit feature. They will be covered in a separate payment integration feature.
