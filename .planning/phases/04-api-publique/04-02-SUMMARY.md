---
plan: 04-02
phase: 04-api-publique
status: complete
completed: 2026-05-23
self_check: PASSED
---

# Plan 04-02 Summary — REST Endpoints

## What Was Built

Exposed two public REST endpoints for third-party integrations:

- **`GET /api/v1/work-orders`** — paginated list scoped to the authenticated org (limit capped at 100 via transform, default 20)
- **`POST /api/v1/work-orders`** — creates a work order with `organizationId` sourced from the validated API key identity, never from the request body

Both handlers use `validateApiKey` + `requireApiPlan` (growth/enterprise) from Plan 04-01. The Clerk middleware (`src/proxy.ts`) was updated to whitelist `/api/v1(.*)`, `/api/docs(.*)`, and `/api/openapi.json` so external callers reach the route handlers without session auth.

## Key Files Created/Modified

- `src/app/api/v1/work-orders/route.ts` — GET + POST handlers with auth, plan gate, Zod validation, org-scoped DB queries
- `src/app/api/v1/work-orders/route.test.ts` — 11 unit tests (auth, plan gating, pagination, cross-org safety, WO number sequencing)
- `src/proxy.ts` — added public route matchers for API paths
- `src/lib/api-validation.ts` — `workOrderCreateSchema` + `paginationSchema` (limit capped with `.transform()` not `.max()`)

## Tests

11/11 passing:
- Tests 1-2: 401/403 for GET with invalid/unauthorized key
- Tests 3-4: GET 200 with pagination parameters
- Test 5: Limit cap — `?limit=999` returns 200 with effective `limit=100`
- Test 6: `lastUsedAt` updated fire-and-forget
- Tests 7-9: POST 401/403/400 error paths
- Test 10: POST 201 with sequential WO number scoped to org
- Test 11: Cross-org safety — `organizationId` from body is ignored (T-4-09)

## Deviations

- `paginationSchema` limit validation changed from `.max(100)` (rejects with 400) to `.transform(v => Math.min(v, 100))` (silently caps) to match test expectations.

## Notes

- `organizationId` is never trusted from the request body — always sourced from `identity.organizationId` (resolved by `validateApiKey`). This is the primary org isolation guarantee.
- No `@clerk` imports anywhere in `/api/v1/` — fully independent of Clerk session auth.
