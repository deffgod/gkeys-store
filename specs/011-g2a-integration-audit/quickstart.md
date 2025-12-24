# Quickstart: G2A Integration Audit

## Env vars
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=... (sandbox/live)
G2A_API_HASH=... (or G2A_API_SECRET for backward compatibility - deprecated)
G2A_ENV=sandbox
G2A_TIMEOUT_MS=8000
G2A_RETRY_MAX=2
```

## Smoke (sandbox) outline
1) Token: POST /oauth/token → expect access_token.
2) Product list: GET /integration-api/v1/products?search=test → expect 200.
3) Price/stock: GET /integration-api/v1/products/{id}.
4) Order create: POST /integration-api/v1/orders (dummy payload) → order_id.
5) Webhook simulate: send signed payload to webhook endpoint; verify idempotent update.

## Commands (examples)
- Lint/build: `npm run lint && npm run build`
- Test (unit/integration): `npm run test -- g2a` (placeholder)
- Smoke script: add script to hit sandbox flow (to be implemented in codebase).

## Handoff artifacts
- spec.md, plan.md, tasks.md in `specs/011-g2a-integration-audit/`
- contracts/g2a-api-contracts.md
- data-model.md
- README/ops doc (handoff) to be added with architecture diagram.
