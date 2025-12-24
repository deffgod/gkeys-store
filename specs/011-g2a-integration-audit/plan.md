# Implementation Plan: G2A Integration & Backend Audit

**Branch**: `011-g2a-integration-audit`  
**Spec**: `/specs/011-g2a-integration-audit/spec.md`  
**Context**: Ensure correct G2A Integration API usage, robust backend handling (client + webhooks), and handoff readiness.

## Technical Context
- **Runtime**: Node.js + TypeScript (strict). HTTP client (fetch/axios) available.
- **Persist**: DB/Redis for idempotency records.
- **Observability**: structured logger, metrics collector (Prometheus/tracing).
- **Envs**: sandbox + live; env vars required for keys/URLs.
- **PDF Reference**: https://static.g2a.com/_/User-guide-to-api.pdf (API contract).

## Constitution Check
- Type safety: TS types for all requests/responses.
- Component-driven: service modules (g2aService, webhookHandler) single-responsibility.
- Performance: timeouts, bounded retries, no unbounded loops.
- UX/Accessibility: N/A (backend), but admin UI (if any) must keep ARIA/focus.
- Code quality: lint/format; no console in prod.

## Architecture / Modules
- **g2aConfig**: validates env, ensures base URL has `/integration-api/v1`, selects sandbox/live, exports timeouts/retry limits.
- **g2aHttpClient**: wraps fetch/axios with timeout, retries (429/5xx), jitter; adds correlation-id headers; logs/metrics.
- **authService**: token fetch/refresh, cache with expiry guard; fails fast on invalid creds.
- **productService**: list/query, price/stock checks; response validation/mapping.
- **orderService**: create order; map amounts/currency; handle errors from G2A.
- **webhookHandler**: signature + nonce + timestamp validation (clock-skew tolerance); idempotency store; atomic status update.
- **idempotencyStore**: DB/Redis table/keys for webhook events; includes key, status, attempts, last_error.
- **health/ops**: health endpoint covering token probe + idempotency store connectivity; metrics for latency, errors, retries.

## Data Contracts (to document in contracts/)
- Request/response schemas for: token, product list/query, price/stock check, order create.
- Webhook schema: headers (signature, timestamp, nonce), payload fields, expected statuses.
- Internal models: G2AProduct, G2AOrder, WebhookEvent, IdempotencyRecord.

## Performance Targets
- Timeout: 5–10s per call; retry up to 2–3 with backoff/jitter; no retry on 4xx.
- Token refresh before expiry (e.g., refresh when <20% TTL).
- Healthcheck SLA: respond <1s when dependencies healthy.

## Security & Config
- Env vars: `G2A_API_URL`, `G2A_API_KEY`, `G2A_API_HASH` (preferred) or `G2A_API_SECRET` (deprecated, backward compatibility only), `G2A_ENV` (sandbox|live), optional `G2A_TIMEOUT_MS`, `G2A_RETRY_MAX`.
- Mask secrets in logs; never log full URLs with keys.
- Require HTTPS; validate hostname matches expected G2A domain.
- Webhook: verify signature/nonce/timestamp; reject stale (>5m skew) or replay (idempotency check).

## Testing Strategy
- **Unit**: signature/timestamp/nonce validation; URL validator; mapping/parsing of responses; retry policy.
- **Integration (sandbox)**: OAuth2 token fetch and Redis caching; product/price/stock calls; order create; negative cases (bad creds, 4xx); ensure base URL normalization. MUST cover Redis caching, G2A API calls, and database idempotency store per constitution Principle VII.
- **E2E smoke**: token → product/price → order create → simulate webhook (or manual callback) → verify idempotent processing.
- **Load-light**: small concurrent calls to observe retries/timeouts.

## Monitoring & Logging
- Structured logs: method, path, status, latency, retries, correlation-id; mask secrets.
- Metrics: counters (success/error/retries), histograms (latency), gauge for token TTL, webhook validation failures.

## Deliverables
- Updated spec/plan/tasks for G2A integration in `specs/011-g2a-integration-audit/`.
- Contracts in `contracts/` (schemas/OpenAPI snippets).
- Data model in `data-model.md`.
- Quickstart with env, commands, smoke script.
- Backend audit notes/checklist for env/config/health.
- Handoff README + diagram (auth → order → webhook → idempotency update).
