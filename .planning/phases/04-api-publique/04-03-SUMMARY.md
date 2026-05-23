---
phase: 04-api-publique
plan: "03"
subsystem: api-docs-and-key-management
tags: [openapi, scalar, zod-to-openapi, api-keys, settings-ui, vitest, react-testing-library]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [buildOpenApiSpec, GET /api/openapi.json, GET /api/docs, ApiKeysSection]
  affects:
    - src/lib/openapi.ts
    - src/app/api/openapi.json/route.ts
    - src/app/api/docs/route.ts
    - src/components/settings/api-keys-section.tsx
    - src/app/(app)/parametres/organisation/page.tsx
tech_stack:
  added:
    - "@asteasolutions/zod-to-openapi@8.5.0"
    - "@scalar/nextjs-api-reference@0.10.18"
    - "@testing-library/user-event (devDependency)"
  patterns:
    - extendZodWithOpenApi-scoped-to-module (schemas defined after extendZodWithOpenApi call)
    - controlled-dialog-pattern (open state managed externally, no DialogTrigger nesting)
    - server-side-role-gate (canManageApiKeys check before rendering ApiKeysSection)
    - force-static-public-routes (openapi.json and docs served cached)
key_files:
  created:
    - src/lib/openapi.ts
    - src/lib/openapi.test.ts
    - src/app/api/openapi.json/route.ts
    - src/app/api/docs/route.ts
    - src/components/settings/api-keys-section.tsx
    - src/components/settings/api-keys-section.test.tsx
  modified:
    - src/app/(app)/parametres/organisation/page.tsx
    - package.json
    - package-lock.json
decisions:
  - "extendZodWithOpenApi: define schemas locally in openapi.ts after extension call — imported schemas from api-validation.ts were created before the extension applied due to ESM module caching"
  - "Removed DialogTrigger asChild pattern: Base UI Dialog uses render prop (not Radix asChild) — nested button resulted in invalid HTML; use controlled Dialog with external Button instead"
  - "Pre-existing build error in src/lib/email.ts (react-dom/server import) and TS error in route.ts are out of scope — confirmed pre-existing before this plan"
metrics:
  duration: ~35 min
  completed: "2026-05-23"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 9
requirements_satisfied: [API-03, API-04]
---

# Phase 4 Plan 03: OpenAPI Docs + API Key Management UI Summary

**One-liner:** OpenAPI 3.1 spec generated from local Zod schemas, served at `/api/openapi.json` (force-static) with Scalar docs UI at `/api/docs`, plus a full-featured ApiKeysSection component wired to Plan 01 Server Actions — 15 new tests, 44 total Phase 4 tests GREEN.

## What Was Built

### Dependencies Installed (Task 1)

| Package | Version | Purpose |
|---------|---------|---------|
| `@asteasolutions/zod-to-openapi` | 8.5.0 | Generate OpenAPI 3.1 spec from Zod schemas |
| `@scalar/nextjs-api-reference` | 0.10.18 | Serve interactive Scalar docs UI as a Route Handler |
| `@testing-library/user-event` | (latest) | Component interaction tests (click, type) |

### OpenAPI Spec Builder (Task 1)

`src/lib/openapi.ts` exports `buildOpenApiSpec()` which:
- Calls `extendZodWithOpenApi(z)` before defining any schemas (ESM import hoisting fix)
- Defines inline schemas for `WorkOrderCreate`, `WorkOrder`, `Error` (registered via `registry.register()`)
- Registers GET and POST paths for `/work-orders` with full response documentation (200/401/403 for GET; 201/400/401/403 for POST)
- Declares `bearerAuth` security scheme and applies it to both paths
- Generates OpenAPI 3.1 document with `info.title: 'Korvia API'`, `servers: [{ url: '/api/v1' }]`

`src/app/api/openapi.json/route.ts` — public `force-static` GET route serving the spec as JSON.

### Scalar Docs Route (Task 2)

`src/app/api/docs/route.ts` — public `force-static` GET route using `ApiReference` from `@scalar/nextjs-api-reference`:
```typescript
export const GET = ApiReference({
  spec: { url: '/api/openapi.json' },
  theme: 'default',
  metaData: { title: 'Korvia API — Documentation', ... },
})
```
Serves interactive Scalar UI. Both routes are already whitelisted in `src/proxy.ts` (Plan 02).

### ApiKeysSection Component (Task 2)

`src/components/settings/api-keys-section.tsx` — `'use client'` component:

- **Generate flow**: Button opens controlled Dialog → form with name input → `createApiKey(name)` Server Action → raw key displayed in read-only input with warning banner → `listApiKeys()` called to refresh table
- **Security**: `setCreated(null)` in `handleClose()` wipes raw key from React state on dialog close (T-4-18 mitigation)
- **List**: Table with Nom, Créée le, Dernière utilisation, Statut (Actif/Révoquée), Actions columns
- **Revoke**: `confirm()` prompt before `revokeApiKey(id)` call → list refreshes
- **Dialog pattern**: Controlled `open` state with external Button (not `DialogTrigger asChild`) — required for Base UI compatibility

**Architecture note**: `DialogTrigger asChild` was removed because Base UI's `DialogTrigger` renders its own `<button>` element. Using `asChild` causes a nested `<button>` in `<button>` (invalid HTML). The fix was to use a plain `Button` with `onClick={() => setOpen(true)}` outside the `Dialog`.

### Settings Page Integration (Task 2)

`src/app/(app)/parametres/organisation/page.tsx` — server component additions:
```typescript
const canManageApiKeys = currentMembership && ['admin', 'manager'].includes(currentMembership.role)
const apiKeys = canManageApiKeys ? await listApiKeys() : []
```
Renders `<ApiKeysSection initialKeys={apiKeys} />` at the bottom of the page, gated by `canManageApiKeys`. Defense-in-depth: Server Actions also call `requireRole(['admin','manager'])` (Plan 01).

## Test Coverage

| File | Tests | Coverage Areas |
|------|-------|----------------|
| `src/lib/openapi.test.ts` | 8 | spec shape, title, paths GET+POST, responses codes, bearerAuth scheme, security declarations |
| `src/components/settings/api-keys-section.test.tsx` | 7 | empty state, list render, dialog open, createApiKey call, key display + warning, raw key wipe on close, revokeApiKey call |
| **New total** | **15** | **All GREEN** |
| **Phase 4 total** | **44** | **All GREEN (Plans 01+02+03)** |

## Routes Exposed

| Route | Auth | Caching | Purpose |
|-------|------|---------|---------|
| `GET /api/openapi.json` | None (public) | `force-static` | OpenAPI 3.1 JSON spec |
| `GET /api/docs` | None (public) | `force-static` | Scalar interactive docs UI |

Both routes were already whitelisted in `src/proxy.ts` by Plan 02.

## Curl Examples (Partner Onboarding)

```bash
# View spec
curl -s https://app.korvia.com/api/openapi.json | jq '.info.title, .paths | keys'

# List work orders (requires growth/enterprise key)
curl -s -H "Authorization: Bearer krv_<your-key>" \
  https://app.korvia.com/api/v1/work-orders | jq .

# Create work order
curl -s -X POST \
  -H "Authorization: Bearer krv_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Remplacement filtre HVAC","type":"preventive","priority":"medium"}' \
  https://app.korvia.com/api/v1/work-orders | jq .
```

## Commits

| Hash | Description |
|------|-------------|
| `03637a1` | feat(04-03): install zod-to-openapi + Scalar, implement OpenAPI spec builder + JSON route |
| `000472f` | feat(04-03): Scalar docs UI, ApiKeysSection component, settings page integration |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] extendZodWithOpenApi not applied to imported Zod schemas**
- **Found during:** Task 1 tests (8 failures: `zodSchema.openapi is not a function`)
- **Issue:** ESM module caching means `workOrderCreateSchema` from `api-validation.ts` was created before `extendZodWithOpenApi(z)` ran in `openapi.ts` (imports are hoisted before module-level code executes). Calling `registry.register()` on a schema that was created before the extension fails.
- **Fix:** Define schemas locally inside `openapi.ts` after the `extendZodWithOpenApi(z)` call, instead of importing and registering the shared schemas from `api-validation.ts`. The spec schemas mirror the validation schemas but are independent instances.
- **Files modified:** `src/lib/openapi.ts`
- **Commit:** `03637a1`

**2. [Rule 1 - Bug] Base UI DialogTrigger creates nested button — invalid HTML**
- **Found during:** Task 2 tests (React warning + multiple elements matching the button query)
- **Issue:** Base UI's `DialogTrigger` renders as `<button>`. Using `asChild` with a `<Button>` child caused `<button><button>` nesting (invalid HTML, hydration error in React).
- **Fix:** Remove `DialogTrigger` entirely. Use a plain `Button` with `onClick={() => setOpen(true)}` outside the controlled `Dialog`. The dialog's `open`/`onOpenChange` props handle the controlled state.
- **Files modified:** `src/components/settings/api-keys-section.tsx`
- **Commit:** `000472f`

**3. [Rule 3 - Blocking] @testing-library/user-event not installed**
- **Found during:** Task 2 test run (import resolution failure)
- **Fix:** `npm install --save-dev @testing-library/user-event`
- **Commit:** `000472f`

### Out-of-Scope Pre-existing Issues (Deferred)

- **TS error:** `src/app/api/v1/work-orders/route.ts:117` — `string` not assignable to `WorkOrderType` — pre-existing from Plan 02, not introduced here
- **Build error:** `src/lib/email.ts:2` — `react-dom/server` import in server context — pre-existing from Phase 03, not introduced here

## Human Verification (Task 3 — PENDING)

Task 3 is a `checkpoint:human-verify` gate. Automated tasks complete. Awaiting human verification of:

- Vérif 1: Scalar UI loads at `/api/docs` in incognito (no auth redirect)
- Vérif 2: `/api/openapi.json` returns valid JSON with `openapi=3.1.0`
- Vérif 3: API key generation flow in `/parametres/organisation` (admin/manager)
- Vérif 4: curl end-to-end (200 list, 401 no auth, 201 create, 400 invalid)
- Vérif 5: Revoked key returns 401 on subsequent calls
- Vérif 6: Starter tier blocked / non-admin role hides section

## Known Stubs

None. All wiring is complete: `buildOpenApiSpec()` generates from code (no hardcoded JSON), `ApiKeysSection` calls real Server Actions (`createApiKey`, `listApiKeys`, `revokeApiKey`), page integrates live `listApiKeys()` call.

## Threat Flags

No new threat surface beyond what the threat model covers. T-4-18 through T-4-25 mitigations are all implemented:
- T-4-18 (raw key in React state): `setCreated(null)` in `handleClose()` — verified by grep + test
- T-4-19 (spec exposes internal models): spec uses externally-relevant fields only — no `clerkUserId`, `hashedKey`, or membership relations
- T-4-20 (non-admin renders ApiKeysSection): server-side `canManageApiKeys` gate — section not rendered for non-admin/manager
- T-4-21 (forged role in client state): server component controls rendering; Server Actions throw for unauthorized callers (Plan 01)

## Self-Check: PASSED

Files exist:
- `src/lib/openapi.ts` — FOUND
- `src/lib/openapi.test.ts` — FOUND
- `src/app/api/openapi.json/route.ts` — FOUND
- `src/app/api/docs/route.ts` — FOUND
- `src/components/settings/api-keys-section.tsx` — FOUND
- `src/components/settings/api-keys-section.test.tsx` — FOUND

Commits:
- `03637a1` — FOUND (feat 04-03 Task 1)
- `000472f` — FOUND (feat 04-03 Task 2)

Tests: 44/44 Phase 4 tests passing — VERIFIED
