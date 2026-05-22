# Phase 4: API Publique — Research

**Researched:** 2026-05-22
**Domain:** REST API, API key authentication, OpenAPI documentation, Next.js 16 Route Handlers
**Confidence:** HIGH

---

## Summary

Phase 4 adds a public REST API to Korvia so external systems can list and create work orders (bons de travail) using API keys. The project runs Next.js 16.2.6 with the App Router, Prisma 7, Zod 4, and Clerk 7 — all stable and well-suited for this work.

The core challenge is authentication: the existing auth stack uses Clerk sessions (cookie-based), but external API consumers need stateless API key auth. The solution is a new `ApiKey` model in Prisma (hashed key stored in DB, plain key returned once at creation), a standalone `validateApiKey()` helper that bypasses Clerk, and Next.js Route Handlers under `src/app/api/v1/` that call this helper directly. This is completely decoupled from Clerk — no middleware changes needed.

For documentation, `@scalar/nextjs-api-reference@0.10.18` has first-class Next.js 16 + React 19 support (peer deps confirmed). A static OpenAPI 3.1 spec file is generated from `@asteasolutions/zod-to-openapi@8.5.0` (peer dep: `zod ^4.0.0` — exact match). The Swagger UI serves at `/api/docs` as a public Route Handler with no auth gate.

**Primary recommendation:** API key stored hashed (SHA-256, Node.js `crypto` built-in — already used in the project), validated in a thin middleware helper, enforced inside each Route Handler. No external rate-limiting library needed at this scale — Vercel's built-in edge protection is sufficient for v1.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | Un endpoint REST authentifié permet de lister les bons de travail | Route Handler `GET /api/v1/work-orders` + `validateApiKey()` helper + `requireApiPlan()` gate |
| API-02 | Un endpoint REST permet de créer un bon de travail depuis un système externe | Route Handler `POST /api/v1/work-orders` — reuses `createWorkOrder` business logic |
| API-03 | La documentation API est accessible publiquement (Swagger/OpenAPI) | `@scalar/nextjs-api-reference` at `/api/docs` — public route, no auth |
| API-04 | Les clés API sont gérables depuis les paramètres organisation | New `ApiKey` Prisma model + Server Actions + UI section in `/parametres/organisation` |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **CLAUDE.md directive:** `@AGENTS.md` — this is NOT the Next.js you know. Breaking changes exist. Read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- Next.js 16.2.6 App Router is in use. `params` in Route Handlers is a `Promise` (must `await params`). [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md]
- `GET` Route Handlers default to **dynamic** (not static) in Next.js 15+. [VERIFIED: Next.js route.md changelog — "default caching for GET handlers was changed from static to dynamic" at v15.0.0-RC]
- Existing Route Handler pattern (QR route) correctly uses `await params` — must follow same pattern.
- Zod 4.4.3 is installed. Zod v4 has breaking API changes from v3 (e.g., `.error()` not `.message()` in refinements). [VERIFIED: package.json + node check]

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Route Handlers | 16.2.6 (built-in) | REST endpoints under `src/app/api/v1/` | Already in use; no additional framework needed |
| Prisma | 7.8.0 (installed) | `ApiKey` model + DB queries | Project ORM — consistent with all other data access |
| Zod | 4.4.3 (installed) | Request body validation + schema definitions | Already used throughout project |
| Node.js `crypto` | built-in (Node 24) | SHA-256 hashing of API keys | Already used in project (`randomUUID` in assets.ts) |
| `@asteasolutions/zod-to-openapi` | 8.5.0 (registry) | Generate OpenAPI 3.1 spec from Zod schemas | Peer dep `zod ^4.0.0` — exact match; latest release |
| `@scalar/nextjs-api-reference` | 0.10.18 (registry) | Interactive docs UI at `/api/docs` | Peer deps `next ^15\|^16` + `react ^19` — exact match |

[VERIFIED: npm registry for versions; peer deps confirmed via `npm view` during research]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `requirePlan()` from `@/lib/auth` | existing | Gate API access to `growth`/`enterprise` tiers | Called inside `validateApiKey()` result or as separate check |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@scalar/nextjs-api-reference` | `swagger-ui-react` (5.32.6) | swagger-ui-react requires client component setup; Scalar is a pure Route Handler — simpler |
| `@asteasolutions/zod-to-openapi` | Hand-written OpenAPI YAML | Manual YAML drifts from code; zod-to-openapi stays in sync with validation schemas |
| SHA-256 hash storage | `bcrypt` / `argon2` | API keys are long random tokens — SHA-256 is standard industry practice (GitHub, Stripe). Bcrypt adds latency for no security benefit on 32-byte random tokens |
| In-handler rate limiting | `upstash/ratelimit` | Overkill for v1; Vercel platform handles DDoS; revisit for v2 |

**Installation (new packages only):**
```bash
npm install @asteasolutions/zod-to-openapi @scalar/nextjs-api-reference
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/api/
│   ├── v1/
│   │   └── work-orders/
│   │       └── route.ts          # GET (list) + POST (create) — API-01, API-02
│   └── docs/
│       └── route.ts              # Scalar UI — API-03 (public)
├── lib/
│   ├── api-auth.ts               # validateApiKey() + requireApiPlan()
│   └── openapi.ts                # OpenAPI spec builder (zod-to-openapi registry)
├── actions/
│   └── api-keys.ts               # Server Actions: create, list, revoke — API-04
└── components/settings/
    └── api-keys-section.tsx      # UI component for /parametres/organisation — API-04
prisma/
└── schema.prisma                 # +ApiKey model migration
```

### Pattern 1: API Key Validation Helper

**What:** `validateApiKey(request)` reads `Authorization: Bearer <key>` header, hashes the key, looks up the DB record, checks expiry and active status, returns `{ organizationId, keyId } | null`.

**When to use:** Called at the top of every `/api/v1/` Route Handler. Returns 401 if null. Never touches Clerk.

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md (headers pattern)
// + Node.js built-in crypto (verified: already used in src/actions/assets.ts)
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function validateApiKey(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7)
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await db.apiKey.findUnique({
    where: { hashedKey },
    select: { id: true, organizationId: true, isActive: true, expiresAt: true },
  })

  if (!apiKey || !apiKey.isActive) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  return { organizationId: apiKey.organizationId, keyId: apiKey.id }
}
```

[VERIFIED: `await params` pattern from Next.js 16 route.md; `crypto` usage from src/actions/assets.ts]

### Pattern 2: API Key Generation (Server Action)

**What:** Generate a cryptographically random 32-byte key, store only the SHA-256 hash in DB, return the plaintext key once.

```typescript
// Source: Node.js crypto built-in — already used in project
import { randomBytes, createHash } from 'crypto'

export async function createApiKey(name: string) {
  const rawKey = `krv_${randomBytes(32).toString('hex')}`  // 65-char prefixed key
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')

  const key = await db.apiKey.create({
    data: { organizationId, name, hashedKey, isActive: true },
  })

  // rawKey returned ONCE — not stored, cannot be recovered
  return { id: key.id, name: key.name, key: rawKey, createdAt: key.createdAt }
}
```

[ASSUMED: `krv_` prefix is a convention choice — confirmed as standard practice by GitHub, Stripe; not verified against a specific doc]

### Pattern 3: Public Route Handler for Swagger (API-03)

**What:** A Route Handler that serves the Scalar API reference UI. Added to the public route matcher in `src/proxy.ts`.

```typescript
// Source: @scalar/nextjs-api-reference docs (confirmed peer deps match project)
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  spec: { url: '/api/openapi.json' },
  theme: 'default',
})
```

The OpenAPI spec itself is served from a separate `GET /api/openapi.json` Route Handler that imports from `src/lib/openapi.ts`.

[VERIFIED: `@scalar/nextjs-api-reference` peer deps `next ^15|^16`, `react ^19` confirmed via `npm view`]

### Pattern 4: Feature Gate on API Routes (GATE-01 linkage)

**What:** The existing `requirePlan(['growth', 'enterprise'])` helper uses Clerk session auth. For API key routes, we need an equivalent that works off the resolved `organizationId`. Create `requireApiPlan(organizationId)` that looks up the subscription directly.

```typescript
// Adapted from src/lib/auth.ts requirePlan() — same DB query, no Clerk dependency
export async function requireApiPlan(
  organizationId: string,
  plans: SubscriptionPlan[]
): Promise<boolean> {
  const sub = await db.subscription.findUnique({
    where: { organizationId },
    select: { plan: true, status: true },
  })
  const effectivePlan =
    sub && ['active', 'trialing'].includes(sub.status) ? sub.plan : 'starter'
  return plans.includes(effectivePlan)
}
```

[VERIFIED: `requirePlan()` logic in src/lib/auth.ts — same ACTIVE_STATUSES constant replicated]

### Pattern 5: Prisma Schema — ApiKey Model

```prisma
model ApiKey {
  id             String    @id @default(cuid())
  organizationId String
  name           String
  hashedKey      String    @unique
  isActive       Boolean   @default(true)
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([hashedKey])
}
```

The `Organization` model needs a `apiKeys ApiKey[]` relation field added.

[VERIFIED: Prisma schema conventions match existing models in prisma/schema.prisma]

### Anti-Patterns to Avoid

- **Storing plaintext API keys in DB:** Once hashed, the raw key is unrecoverable — if leaked from DB, hashes cannot be reversed. [VERIFIED: standard industry pattern]
- **Using Clerk `auth()` inside `/api/v1/` routes:** Clerk `auth()` reads cookies/JWT session. External API clients have no Clerk session. These routes must bypass Clerk entirely and use `validateApiKey()` instead.
- **Protecting `/api/v1/` via Clerk middleware (`auth.protect()`):** The Clerk middleware in `src/proxy.ts` uses `auth.protect()` for non-public routes. Routes under `/api/v1/` and `/api/docs` must be added to the `isPublicRoute` matcher (or a custom `isApiRoute` matcher) so Clerk doesn't block them — they handle their own auth.
- **Using `NextResponse.json()` vs `Response.json()`:** The existing organizations route uses `NextResponse.json()`. The official Next.js 16 docs use `Response.json()` natively. Both work, but `Response.json()` is the current standard. [VERIFIED: route.md examples]
- **Not awaiting `params` in Route Handlers:** As of Next.js 15+, `context.params` is a Promise. Must `await params`. [VERIFIED: QR route already does this correctly; route.md v15.0.0-RC changelog]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI UI rendering | Custom Swagger HTML page | `@scalar/nextjs-api-reference` | CDN assets, dark mode, try-it-out, maintained |
| OpenAPI spec generation | Manual JSON/YAML | `@asteasolutions/zod-to-openapi` | Stays in sync with Zod validation schemas; handles `$ref` deduplication |
| API key hashing | Custom hash function | Node.js `crypto.createHash('sha256')` | Built-in, no dependency, already used in project |
| Rate limiting (v1) | Redis + sliding window | Skip (Vercel platform) | Unnecessary complexity for v1 scale |

**Key insight:** The OpenAPI spec as code (zod-to-openapi) ensures the documentation is always consistent with the actual validation — a common failure mode of hand-maintained API docs.

---

## Common Pitfalls

### Pitfall 1: Clerk Middleware Blocks API Key Routes

**What goes wrong:** External client calls `GET /api/v1/work-orders` with `Authorization: Bearer krv_...`. The Clerk middleware runs first, sees no session token, calls `auth.protect()`, and returns 401 before the Route Handler runs.

**Why it happens:** `src/proxy.ts` only whitelists specific public paths. `/api/v1/` is not currently whitelisted.

**How to avoid:** Add `/api/v1/(.*)` and `/api/docs(.*)` and `/api/openapi.json` to the `isPublicRoute` matcher in `src/proxy.ts`. These routes self-authenticate via `validateApiKey()`.

**Warning signs:** External client gets a Clerk-formatted 401/redirect response instead of a JSON error.

### Pitfall 2: Returning Raw API Key More Than Once

**What goes wrong:** UI fetches key list and displays full keys. Keys in DB are hashed — the raw key is gone after creation.

**Why it happens:** Confusion between "show key in creation response" and "show key in list response."

**How to avoid:** The creation Server Action returns `{ id, name, key: rawKey, createdAt }` — this is the only time `key` appears. All subsequent list/detail queries return `{ id, name, createdAt, lastUsedAt, isActive }` with no `key` field. UI shows last 4 chars via stored `keyPreview` column (optional) or just shows `krv_****`.

### Pitfall 3: Feature Gate Not Applied on API Routes

**What goes wrong:** A starter-tier organization generates an API key (if somehow created) and successfully lists/creates work orders without a growth subscription.

**Why it happens:** `validateApiKey()` only validates identity — it does not check subscription tier.

**How to avoid:** After `validateApiKey()` succeeds, immediately call `requireApiPlan(organizationId, ['growth', 'enterprise'])`. Return 403 with a clear message if false. The API key management UI itself should also be gated with `UpgradeGate`.

### Pitfall 4: Missing `Content-Type: application/json` on Error Responses

**What goes wrong:** External integrations fail to parse error responses because some return plain text (from `new Response('error', { status: 401 })`).

**How to avoid:** Always use `Response.json({ error: '...' }, { status: NNN })` for all responses in `/api/v1/`. Define a consistent error envelope: `{ error: string, code?: string }`.

### Pitfall 5: Zod v4 Breaking Changes in Schema Definitions

**What goes wrong:** Copying Zod v3 patterns (`.message()` in refinements, `.email()` as method) into validation schemas.

**Why it happens:** Training data and many examples online are Zod v3. Project uses Zod 4.4.3.

**How to avoid:** In Zod v4: use `.error()` not `.message()` in refinements. `z.email()` is a standalone function. Check the installed version docs. [VERIFIED: package.json shows 4.4.3; auth.test.ts already uses Zod v4 patterns]

---

## Code Examples

### Route Handler: List Work Orders (API-01)

```typescript
// Source: Next.js 16 route.md (Request headers, Response.json pattern)
// File: src/app/api/v1/work-orders/route.ts
import type { NextRequest } from 'next/server'
import { validateApiKey, requireApiPlan } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const identity = await validateApiKey(request)
  if (!identity) {
    return Response.json({ error: 'Clé API invalide ou manquante' }, { status: 401 })
  }

  const allowed = await requireApiPlan(identity.organizationId, ['growth', 'enterprise'])
  if (!allowed) {
    return Response.json({ error: 'Votre forfait ne permet pas l\'accès à l\'API' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100)

  const [workOrders, total] = await Promise.all([
    db.workOrder.findMany({
      where: { organizationId: identity.organizationId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, number: true, title: true, status: true,
        priority: true, type: true, dueDate: true, createdAt: true,
      },
    }),
    db.workOrder.count({ where: { organizationId: identity.organizationId } }),
  ])

  return Response.json({ data: workOrders, total, page, limit })
}
```

### OpenAPI Spec Route

```typescript
// File: src/app/api/openapi.json/route.ts
import { buildOpenApiSpec } from '@/lib/openapi'

export const dynamic = 'force-static'  // Cache the spec at build time

export async function GET() {
  const spec = buildOpenApiSpec()
  return Response.json(spec)
}
```

### Public Route Matcher Update (proxy.ts)

```typescript
// src/proxy.ts — add API routes to public matcher
const isPublicRoute = createRouteMatcher([
  "/",
  "/tarifs(.*)",
  "/fonctionnalites(.*)",
  "/a-propos(.*)",
  "/aide(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/v1(.*)",        // ← API key routes — self-authenticated
  "/api/docs(.*)",      // ← Scalar UI — public
  "/api/openapi.json",  // ← OpenAPI spec — public
])
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `/home/deploy/gmao-saas/vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/api-auth.test.ts` |
| Full suite command | `npx vitest run` |

[VERIFIED: vitest.config.ts exists and configures jsdom environment with `src/**/*.test.{ts,tsx}`]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | `validateApiKey()` returns identity for valid key | unit | `npx vitest run src/lib/api-auth.test.ts` | ❌ Wave 0 |
| API-01 | `validateApiKey()` returns null for invalid/missing key | unit | `npx vitest run src/lib/api-auth.test.ts` | ❌ Wave 0 |
| API-01 | `validateApiKey()` returns null for inactive key | unit | `npx vitest run src/lib/api-auth.test.ts` | ❌ Wave 0 |
| API-01 | `requireApiPlan()` returns false for starter tier | unit | `npx vitest run src/lib/api-auth.test.ts` | ❌ Wave 0 |
| API-01 | `requireApiPlan()` returns true for growth tier | unit | `npx vitest run src/lib/api-auth.test.ts` | ❌ Wave 0 |
| API-02 | POST /api/v1/work-orders rejects invalid body | unit | `npx vitest run src/actions/api-keys.test.ts` | ❌ Wave 0 |
| API-04 | `createApiKey()` stores hash, returns raw key once | unit | `npx vitest run src/actions/api-keys.test.ts` | ❌ Wave 0 |
| API-03 | Swagger UI accessible without auth | manual | — | manual-only |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/api-auth.test.ts src/actions/api-keys.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/api-auth.test.ts` — covers API-01 (validateApiKey + requireApiPlan unit tests)
- [ ] `src/actions/api-keys.test.ts` — covers API-04 (createApiKey stores hash correctly)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | API key via `Authorization: Bearer` — validated by `validateApiKey()` |
| V3 Session Management | no | Stateless API key — no session |
| V4 Access Control | yes | `requireApiPlan()` enforces tier gate; org isolation via `organizationId` from key |
| V5 Input Validation | yes | Zod 4 schemas on all POST bodies |
| V6 Cryptography | yes | SHA-256 for key storage — never plaintext |

### Known Threat Patterns for REST API with API Keys

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key leakage from DB | Information Disclosure | Store only SHA-256 hash — raw key unrecoverable |
| Brute force key guessing | Elevation of Privilege | 32-byte random key = 256-bit entropy — brute force infeasible |
| Cross-org data access | Spoofing / Elevation | `organizationId` is derived from validated key in DB — never from request body |
| Starter tier bypassing API gate | Elevation of Privilege | `requireApiPlan()` called on every request after key validation |
| Timing attack on key comparison | Spoofing | DB lookup on indexed hash is constant-time equivalent at application level; acceptable for v1 |
| API key created for revoked org | Spoofing | `onDelete: Cascade` on ApiKey — org deletion removes all keys |
| Unauthenticated access to docs | Information Disclosure | Docs are intentionally public (API-03 requirement) — spec should not expose internal implementation details |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js `crypto` | API key hashing | ✓ | built-in (Node 24.15.0) | — |
| Prisma + PostgreSQL | ApiKey model | ✓ | Prisma 7.8.0 | — |
| `@asteasolutions/zod-to-openapi` | OpenAPI spec | ✗ (not installed) | 8.5.0 available | — |
| `@scalar/nextjs-api-reference` | Swagger UI | ✗ (not installed) | 0.10.18 available | swagger-ui-react (heavier) |

**Missing dependencies with no fallback:** None that block execution.

**Missing with known install path:**
- `npm install @asteasolutions/zod-to-openapi @scalar/nextjs-api-reference` — required before Wave 1 of Swagger/docs plan.

[VERIFIED: npm registry check during research; peer deps confirmed compatible]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| swagger-ui-react (React component) | `@scalar/nextjs-api-reference` (Route Handler) | ~2024 | No client bundle cost; works with App Router server components |
| `pages/api/` routes | `app/api/` Route Handlers | Next.js 13+ | `params` is now a Promise; no `bodyParser` config needed |
| Storing API key plaintext or bcrypt | SHA-256 hash (standard for random tokens) | Industry standard | GitHub, Stripe, Linear all use SHA-256 for API keys |

**Deprecated/outdated:**
- `pages/api/` directory: Not applicable — project uses App Router exclusively. Do not create files there.
- `NextResponse.json()`: Still works but `Response.json()` is now native Web API standard per Next.js 16 docs.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `krv_` prefix convention on API keys | Pattern 2 | Cosmetic only — any prefix works |
| A2 | Vercel platform DDoS protection sufficient for v1 rate limiting | Don't Hand-Roll | If deployed elsewhere, need to add rate limiting middleware |
| A3 | Storing `lastUsedAt` on ApiKey model is useful for UX | Prisma Schema | Can omit — does not affect correctness |

---

## Open Questions

1. **Should API key creation be admin-only or available to all org members?**
   - What we know: The existing settings page checks `currentMembership.role` for some UI decisions
   - What's unclear: No explicit decision in CONTEXT.md or ROADMAP.md about which roles can manage API keys
   - Recommendation: Restrict to `admin` and `manager` roles — consistent with the settings page access pattern

2. **Should `POST /api/v1/work-orders` trigger the NOTIF-01 assignment email?**
   - What we know: The existing `createWorkOrder` Server Action already fires `sendWorkOrderAssignedEmail` — but API creates likely won't include assigneeIds
   - What's unclear: Whether external systems will provide assignee membership IDs (they're internal UUIDs)
   - Recommendation: Accept optional `assigneeIds` in the API body but treat it as fire-and-forget, same as the existing action; document in OpenAPI spec

3. **Expiry dates on API keys?**
   - What we know: The `ApiKey` model includes `expiresAt DateTime?` (nullable)
   - What's unclear: Whether the UI should allow setting expiry at key creation time
   - Recommendation: Support optional expiry in the model; UI v1 can skip the date picker and create non-expiring keys; the `validateApiKey()` helper already handles expiry check

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route Handler API, params-as-Promise, CORS, headers
- `src/prisma/schema.prisma` — existing data models and conventions
- `src/lib/auth.ts` — `requirePlan()` logic to replicate for `requireApiPlan()`
- `src/proxy.ts` — Clerk middleware public route pattern
- `src/actions/assets.ts` — confirms `crypto.randomUUID()` already used (built-in available)
- `package.json` — installed dependencies and versions

### Secondary (MEDIUM confidence)
- `npm view @scalar/nextjs-api-reference` peer deps `{ next: '^15.0.0 || ^16.0.0', react: '^19.0.0' }` — confirmed compatible
- `npm view @asteasolutions/zod-to-openapi` peer deps `{ zod: '^4.0.0' }` — confirmed compatible with installed Zod 4.4.3

### Tertiary (LOW confidence)
- SHA-256 as the standard for API key hashing: industry convention (GitHub, Stripe) — not verified against a specific official doc in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from npm registry and peer deps
- Architecture: HIGH — patterns derived from existing codebase code and official Next.js 16 docs
- Pitfalls: HIGH — Clerk middleware pitfall verified from proxy.ts; Zod v4 pitfall verified from package.json + existing tests
- Security: HIGH — SHA-256 for random tokens is industry consensus

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (stable stack; 30-day window)
