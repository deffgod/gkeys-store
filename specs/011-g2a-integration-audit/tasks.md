# Tasks: G2A Integration & Backend Audit

**Prereqs**: spec/plan in this folder.

## Phase 1 – Config & Validation
- [ ] T01 Add env validation: ensure `G2A_API_URL` includes `/integration-api/v1`; auto-append if missing; reject non-HTTPS.
- [ ] T02 Add config toggle `G2A_ENV` (sandbox|live) with safe default sandbox in non-prod; wire timeouts/retry limits (`G2A_TIMEOUT_MS`, `G2A_RETRY_MAX`).

## Phase 2 – HTTP Client & Auth
- [ ] T03 Implement `g2aHttpClient` with timeout (5–10s), bounded retries (429/5xx) with jitter; no retry on 4xx; structured logs/metrics.
- [ ] T04 Implement OAuth2 token service with Redis caching: fetch access token via `GET /token` using hash-based auth; cache in Redis with key pattern `g2a:token:{env}` and TTL matching `expires_in`; refresh when <5min remaining; graceful degradation if Redis unavailable (fetch on-demand); handle invalid creds fast-fail.

## Phase 3 – Operations
- [ ] T05 Implement product list/query and product detail (price/stock) with response validation/mapping.
- [ ] T06 Implement order create with payload validation and error taxonomy.

## Phase 4 – Webhooks & Idempotency
- [ ] T07 Implement HMAC-SHA256 signature validation (signature = HMAC-SHA256(payload + timestamp + nonce + G2A_API_HASH)), nonce uniqueness check, timestamp validation (clock-skew tolerance ±5min) for webhooks; use timing-safe comparison; reject stale/invalid.
- [ ] T08 Implement idempotency store (DB/Redis) and atomic processing for webhook events; prevent double updates.

## Phase 5 – Observability & Health
- [ ] T09 Add structured logs (method, path, status, latency, retries) with masked secrets; metrics (latency histo, success/error/retry counters, token TTL gauge, webhook validation failures).
- [ ] T10 Add health/diagnostic endpoint: checks token fetch probe and idempotency store connectivity.

## Phase 6 – Testing
- [ ] T11 Unit tests: URL validation, signature/nonce/timestamp validation, retry policy, response mappers.
- [ ] T12 Integration (sandbox): token fetch, product list/detail, order create; negative creds/4xx; ensure URL normalization.
- [ ] T13 E2E smoke: token → product/price → order create → simulated webhook; assert idempotency.

## Phase 7 – Docs & Handoff
- [ ] T14 Update README/Quickstart for G2A env + commands + smoke steps; include log/metrics notes.
- [ ] T15 Add architecture flow diagram (auth → client → order → webhook → idempotency update → DB) and ops checklist for handoff.
