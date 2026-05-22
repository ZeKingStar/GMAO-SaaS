---
phase: 04-api-publique
plan: "01"
subsystem: api-foundation
tags: [api-keys, authentication, prisma, vitest, server-actions]
dependency_graph:
  requires: []
  provides: [validateApiKey, requireApiPlan, createApiKey, listApiKeys, revokeApiKey, ApiKey-table]
  affects: [src/lib/api-auth.ts, src/actions/api-keys.ts, prisma/schema.prisma]
tech_stack:
  added: []
  patterns: [SHA-256-hashed-api-keys, bearer-token-auth, clerk-free-validation, tdd-red-green]
key_files:
  created:
    - prisma/schema.prisma (modified: ApiKey model + Organization.apiKeys back-relation)
    - src/lib/api-auth.ts
    - src/lib/api-auth.test.ts
    - src/actions/api-keys.ts
    - src/actions/api-keys.test.ts
  modified: []
decisions:
  - "SHA-256 hash only stored in DB — raw krv_ key returned once at creation and never persisted (industry standard: GitHub, Stripe)"
  - "requireApiPlan() is Clerk-free — replicates ACTIVE_STATUSES logic from auth.ts using direct DB query on organizationId"
  - "API key management restricted to admin + manager roles (technicians cannot create/list/revoke keys)"
metrics:
  duration: ~15 min
  completed: "2026-05-22"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 5
requirements_satisfied: [API-01, API-04]
---

# Phase 4 Plan 01: API Key Foundations Summary

**One-liner:** SHA-256-hashed API key infrastructure — Prisma model, validateApiKey/requireApiPlan helpers, and three role-gated Server Actions — with 18 unit tests all GREEN.

## What Was Built

### Schema Changes (Task 1)

Added `ApiKey` model to `prisma/schema.prisma` with:
- `hashedKey String @unique` — only the SHA-256 digest is stored, raw key never persisted
- `isActive Boolean @default(true)` + `expiresAt DateTime?` — for key lifecycle management
- `lastUsedAt DateTime?` — tracked for UX (updated by Plan 02 Route Handlers)
- `organization Organization @relation(..., onDelete: Cascade)` — foreign key with cascade delete
- `@@index([organizationId])` + `@@index([hashedKey])` — performance indexes

Added `apiKeys ApiKey[]` back-relation to `Organization` model.

`npx prisma db push --accept-data-loss` ran successfully — table confirmed live in neondb PostgreSQL.

### api-auth.ts Helpers (Task 2)

`src/lib/api-auth.ts` exports:

```typescript
export type ApiIdentity = { organizationId: string; keyId: string }
export async function validateApiKey(req: NextRequest): Promise<ApiIdentity | null>
export async function requireApiPlan(organizationId: string, plans: SubscriptionPlan[]): Promise<boolean>
```

- `validateApiKey()`: reads `Authorization: Bearer <token>`, SHA-256 hashes it, looks up `db.apiKey.findUnique({ where: { hashedKey } })`, checks `isActive` and `expiresAt`. Returns `{ organizationId, keyId }` on success, `null` otherwise.
- `requireApiPlan()`: looks up subscription directly by `organizationId` (no Clerk). Returns `false` for null subscription, non-active status, or tier not in allowed list. Replicates `requirePlan()` logic from `auth.ts`.
- **Zero Clerk imports** — fully usable from external API consumers.

### Server Actions (Task 3)

`src/actions/api-keys.ts` exports:

```typescript
export async function createApiKey(name: string): Promise<CreatedApiKey>
export async function listApiKeys(): Promise<ApiKeyListItem[]>
export async function revokeApiKey(id: string): Promise<{ id: string; isActive: false }>
```

- `createApiKey()`: generates `krv_<randomBytes(32).hex>` (68 chars), stores SHA-256 hash only, returns raw key once in response.
- `listApiKeys()`: returns `id/name/createdAt/lastUsedAt/isActive/expiresAt` — no `key` or `hashedKey` in response.
- `revokeApiKey()`: `findFirst({ where: { id, organizationId } })` scopes lookup before update — foreign-org IDs throw "Clé API introuvable".
- All three gated with `requireRole(['admin', 'manager'])`.

## Test Coverage

| File | Tests | Coverage Areas |
|------|-------|----------------|
| `src/lib/api-auth.test.ts` | 12 | validateApiKey (null cases, hashing, expiry, valid path), requireApiPlan (null sub, starter, canceled, active, trialing) |
| `src/actions/api-keys.test.ts` | 6 | createApiKey (shape, hash-only storage, role gate, entropy), listApiKeys (no key/hash in output), revokeApiKey (org scoping) |
| **Total** | **18** | **All GREEN** |

Requirements satisfied: API-01 (validateApiKey + requireApiPlan), API-04 (createApiKey, listApiKeys, revokeApiKey)

## Commits

| Hash | Description |
|------|-------------|
| `2d35a98` | feat(04-01): add ApiKey model to Prisma schema + push to PostgreSQL |
| `2d1f22f` | feat(04-01): implement validateApiKey + requireApiPlan with 12 unit tests |
| `4f2d96f` | feat(04-01): implement createApiKey/listApiKeys/revokeApiKey Server Actions + 6 unit tests |

## Deviations from Plan

None — plan executed exactly as written.

The TDD red-green cycle was followed for both Task 2 and Task 3. RED confirmed by import error (file did not exist). GREEN confirmed by all tests passing after implementation.

## Known Stubs

None. This plan creates infrastructure (model, helpers, actions) with no UI components — no stub risk.

## Threat Flags

No new threat surface beyond what the threat model covers. All T-4-01 through T-4-06 mitigations are implemented and tested.

## Self-Check: PASSED

- `prisma/schema.prisma` — model ApiKey present: FOUND
- `src/lib/api-auth.ts` — FOUND
- `src/lib/api-auth.test.ts` — FOUND
- `src/actions/api-keys.ts` — FOUND
- `src/actions/api-keys.test.ts` — FOUND
- Commit `2d35a98` — FOUND
- Commit `2d1f22f` — FOUND
- Commit `4f2d96f` — FOUND
- 18 tests passing — VERIFIED
- `npx tsc --noEmit` — 0 errors — VERIFIED
- ApiKey table in neondb — VERIFIED (`npx prisma db pull --print | grep -c "model ApiKey"` → 1)
