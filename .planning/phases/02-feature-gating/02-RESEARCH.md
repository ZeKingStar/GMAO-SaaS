# Phase 2: Feature Gating - Research

**Researched:** 2026-05-19
**Domain:** Subscription-based access control — Next.js App Router Server Components, Prisma, Tailwind CSS
**Confidence:** HIGH

---

## Summary

The infrastructure for feature gating is already fully in place. The Prisma `Subscription` model carries `plan` (`SubscriptionPlan` enum: `starter | growth | enterprise`) and `status` (`SubscriptionStatus` enum: `trialing | active | past_due | canceled | unpaid`). The `getOrganizationMembership()` function in `src/lib/auth.ts` already `include`s `organization.subscription`, meaning every gated Server Component can derive the plan from the membership object at zero additional DB cost.

The three pages to be gated (`/rapports`, `/inventaire`, `/actifs/scan/[qrCode]`) all follow the same pattern today: call `auth()`, do a short `db.organization.findUnique`, then render. None has plan-checking logic yet. Adding `requirePlan()` at the top of each page function replaces the existing `auth()` + `findUnique` calls and provides the subscription data as a return value.

The sidebar (`Sidebar` and `SidebarSheet`) is a `"use client"` component that currently receives no props from the server. Because plan data is a server concern, the cleanest approach — consistent with how the rest of the app handles server data — is to fetch the plan in the parent Server Component layout and pass it down as a prop, or to create a small async Server Component wrapper that fetches and passes `userPlan` into the client sidebar. No React Context or cookie-based solution is needed.

**Primary recommendation:** Extend `src/lib/auth.ts` with `requirePlan()`, create `<UpgradeGate>` as a pure-CSS Server-compatible component, add the dashboard subscription widget as a server-rendered section, and thread the plan prop through the layout to the sidebar.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Gate matrix (Phase 2 scope):**
- D-01: `/rapports` requires tier `growth` or `enterprise`
- D-02: `/inventaire` requires tier `growth` or `enterprise`
- D-03: `/actifs/scan/[qrCode]` requires tier `growth` or `enterprise`
- D-04: Public API — out of scope Phase 2 (built gated directly in Phase 4)
- D-05: Expired subscriptions (`past_due`, `canceled`, `unpaid`) treated as tier `starter`

**Gate mechanism:**
- D-06: Extend `src/lib/auth.ts` with `requirePlan(plans: SubscriptionPlan[])` — consistent with `requireOrgAccess()`
- D-07: Each gated page Server Component calls `requirePlan(['growth', 'enterprise'])` at the top — no Edge Runtime middleware
- D-08: `requirePlan()` reads `membership.organization.subscription` (already loaded by `getOrganizationMembership()`) — zero additional DB queries

**Blocked page UX (GATE-02):**
- D-09: Amber banner at top: "Passez à Croissance pour accéder" + CTA "Voir les plans" → `/parametres/organisation`
- D-10: Page content below the banner rendered with CSS `filter: blur`
- D-11: Reusable `<UpgradeGate requiredPlan="growth">` wrapping gated content

**Dashboard tier widget (GATE-03):**
- D-12: Widget at bottom of `/dashboard`: active plan + status badge (Actif/Essai/En retard) + renewal date + "Gérer l'abonnement" link
- D-13: Widget uses Korvia navy/amber palette
- D-14: If no active subscription: "Aucun abonnement actif — Choisir un plan" + CTA

**Sidebar navigation:**
- D-15: Gated nav items (Inventaire, Rapports) show a subtle lock icon for starter users — link remains clickable

### Claude's Discretion

- Exact wording of the upgrade banner
- Design of `<UpgradeGate>` component (colors, icon, layout)
- Handling of `null` subscription (org with no subscription record = treat as starter)

### Deferred Ideas (OUT OF SCOPE)

- Import/export Excel — Phase 7+
- Gate on asset count (50/200/unlimited) — different quota logic, plan separately
- Gate on user count (5/15/unlimited) — Clerk quota, plan separately
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GATE-01 | Les fonctionnalités avancées (rapports, API) sont bloquées pour le tier Démarrage | `requirePlan()` added to `/rapports`, `/inventaire`, `/actifs/scan/[qrCode]` pages; `subscription.plan` + `subscription.status` already available on the membership object |
| GATE-02 | Un message clair invite à upgrader quand une feature gated est tentée | `<UpgradeGate>` component with amber banner + blur overlay; pages render the gate instead of redirecting, so users see the content preview |
| GATE-03 | Le dashboard affiche le tier actif et la date de renouvellement | Dashboard `page.tsx` already fetches `org.id`; subscription can be co-loaded via `getOrganizationMembership()` or a targeted `db.subscription.findUnique`; `currentPeriodEnd` field confirmed present on model |
</phase_requirements>

---

## Standard Stack

### Core (all verified in codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | existing | Server Components for gate logic | No Edge Runtime needed; `async` page functions are the natural gate point |
| Prisma | existing | `SubscriptionPlan` / `SubscriptionStatus` enums | Already generated; `$Enums.SubscriptionPlan` importable from `@/generated/prisma/enums` |
| Tailwind CSS | existing | `filter: blur(4px)` via `blur-sm`, amber colors | Inline blur via `className="blur-sm pointer-events-none select-none"` |
| lucide-react | existing | Lock icon for sidebar (`Lock` from lucide-react) | Already used throughout app |
| `src/components/ui/` | existing | `Card`, `Badge`, `Button` for widget and banner | Established component library |

### No New Dependencies

This phase requires zero new npm packages. Everything is implemented with existing primitives:
- Gate logic: TypeScript function in `src/lib/auth.ts`
- UpgradeGate UI: Server Component with Tailwind classes
- Dashboard widget: Additional JSX section in existing `DashboardPage`
- Sidebar lock: Additional prop + conditional `Lock` icon render

[VERIFIED: codebase read]

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── lib/
│   └── auth.ts                          # ADD: requirePlan() helper
├── components/
│   └── upgrade-gate/
│       └── upgrade-gate.tsx             # NEW: <UpgradeGate> component
└── app/(app)/
    └── dashboard/
        └── page.tsx                     # MODIFY: add subscription widget section
```

### Pattern 1: `requirePlan()` — Gate Helper

**What:** Async server-side function that loads the membership (reusing `getOrganizationMembership()`), resolves the effective plan (accounting for expired statuses), and either returns the membership or throws/redirects if the plan is insufficient.

**When to use:** Top of every gated Server Component page function, before any DB queries specific to that page.

**Key insight from codebase:** `getOrganizationMembership()` already does:
```typescript
// src/lib/auth.ts (existing)
include: { organization: { include: { subscription: true } } }
```
So `membership.organization.subscription` is always available — no extra query needed.

**Implementation:**
```typescript
// Source: VERIFIED — src/lib/auth.ts pattern + src/generated/prisma/enums
import type { SubscriptionPlan } from '@/generated/prisma/enums'

const ACTIVE_STATUSES = ['active', 'trialing'] as const

export async function requirePlan(plans: SubscriptionPlan[]) {
  const membership = await getOrganizationMembership()
  if (!membership) throw new Error('Unauthorized')

  const sub = membership.organization.subscription
  // null subscription OR non-active status → effective plan is 'starter'
  const effectivePlan: SubscriptionPlan =
    sub && ACTIVE_STATUSES.includes(sub.status as typeof ACTIVE_STATUSES[number])
      ? sub.plan
      : 'starter'

  return { membership, subscription: sub, effectivePlan, hasAccess: plans.includes(effectivePlan) }
}
```

**Note:** `requirePlan()` does NOT throw/redirect — it returns `hasAccess`. The page decides whether to render `<UpgradeGate>` or the real content. This is required by D-10 (blur the content behind the gate).

### Pattern 2: `<UpgradeGate>` Component

**What:** Server Component that wraps gated content with a relative-positioned container, renders a sticky amber banner, and applies CSS blur + pointer-events-none to children when `hasAccess` is false.

**When to use:** In each gated page after calling `requirePlan()`.

```typescript
// Source: VERIFIED — CONTEXT.md D-09/D-10/D-11; Tailwind blur utility
// src/components/upgrade-gate/upgrade-gate.tsx
import Link from 'next/link'
import { Lock } from 'lucide-react'

interface UpgradeGateProps {
  hasAccess: boolean
  requiredPlan?: 'growth' | 'enterprise'
  children: React.ReactNode
}

export function UpgradeGate({ hasAccess, requiredPlan = 'growth', children }: UpgradeGateProps) {
  if (hasAccess) return <>{children}</>

  const planName = requiredPlan === 'growth' ? 'Croissance' : 'Entreprise'

  return (
    <div className="relative">
      {/* Amber upgrade banner */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-4">
        <div className="flex items-center gap-2 text-amber-800">
          <Lock className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            Passez au plan {planName} pour accéder à cette fonctionnalité
          </span>
        </div>
        <Link
          href="/parametres/organisation"
          className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          Voir les plans
        </Link>
      </div>

      {/* Blurred content preview */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}
```

### Pattern 3: Gated Page Integration

**What:** Each gated page calls `requirePlan()` at the top and wraps its content in `<UpgradeGate>`.

**Rapports page (example):**
```typescript
// Source: VERIFIED — src/app/(app)/rapports/page.tsx existing structure
export default async function RapportsPage() {
  const { hasAccess, subscription } = await requirePlan(['growth', 'enterprise'])

  // DB queries still run — content is rendered server-side (blurred if no access)
  // This avoids a flash and gives the real preview effect
  const org = await db.organization.findUnique({ where: { clerkId: orgId }, select: { id: true } })
  // ... existing queries ...

  return (
    <UpgradeGate hasAccess={hasAccess} requiredPlan="growth">
      {/* existing page JSX unchanged */}
    </UpgradeGate>
  )
}
```

**Critical decision:** The DB queries inside gated pages still execute even for blocked users, because the blur preview requires real data. This is intentional per D-10. If performance becomes a concern in Phase 7+ (when reports are heavier), a `hasAccess` early-return with a skeleton preview is the upgrade path.

### Pattern 4: Dashboard Subscription Widget

**What:** A new section at the bottom of `DashboardPage` co-loading subscription data alongside the existing 7-query `Promise.all`.

**Integration with existing `DashboardPage`:**
```typescript
// Source: VERIFIED — src/app/(app)/dashboard/page.tsx line 35-102
// Add subscription to the existing org query:
const org = await db.organization.findUnique({
  where: { clerkId: orgId },
  select: {
    id: true,
    subscription: {          // ADD THIS
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
      }
    }
  },
})
```

This adds zero extra DB round-trips — it's a nested `select` on the same query.

**Widget display logic:**
- `active` or `trialing` with a plan → show plan badge + renewal date + portal link
- `past_due` or `unpaid` → show warning badge + "Mettre à jour la facturation"
- `canceled` → show "Abonnement annulé" + CTA to re-subscribe
- `null` (no subscription record) → "Aucun abonnement actif — Choisir un plan"

### Pattern 5: Sidebar Lock Indicator

**What:** The sidebar is `"use client"`. Plan data must be passed as a prop from the server layout.

**The challenge:** `src/components/layout/sidebar.tsx` currently accepts no props. The parent layout (`src/app/(app)/layout.tsx` — not yet read but standard App Router convention) is a Server Component that can fetch the plan.

**Recommended approach:** Add `userPlan?: SubscriptionPlan` prop to both `Sidebar` and `SidebarSheet`. In the `(app)/layout.tsx` server component, call `getOrganizationMembership()` once (it is already cached by React's request deduplication since it calls `auth()` which is cached per request), derive the effective plan, and pass it to both sidebar components.

```typescript
// In Sidebar/SidebarSheet — add to navItems config:
const GATED_HREFS = new Set(['/inventaire', '/rapports'])

// In the nav item render:
{GATED_HREFS.has(href) && userPlan === 'starter' && (
  <Lock className="h-3 w-3 ml-auto text-muted-foreground/60" aria-label="Fonctionnalité verrouillée" />
)}
```

### Anti-Patterns to Avoid

- **Throwing/redirecting in `requirePlan()`:** D-10 requires showing blurred content. A redirect would prevent the preview. Return `hasAccess: boolean` instead.
- **Middleware for plan gating:** D-07 explicitly forbids Edge Runtime middleware. Server Component checks are the pattern.
- **Skipping DB queries for blocked users:** The blur preview requires real rendered content. Run queries for all users.
- **Separate DB query for plan in each page:** Use `requirePlan()` which reuses `getOrganizationMembership()` — the underlying `auth()` call is deduplicated by Next.js per request.
- **Context/cookie for sidebar plan:** The layout Server Component has direct DB access. Pass as prop — simpler and type-safe.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS blur overlay | Custom canvas/SVG masking | `className="blur-sm pointer-events-none"` | Tailwind utility; works in all browsers |
| Plan enum validation | String comparisons | Import `SubscriptionPlan` from `@/generated/prisma/enums` | Type-safe; enum values are `'starter' | 'growth' | 'enterprise'` |
| Lock icon | Custom SVG | `Lock` from `lucide-react` | Already installed, consistent with rest of app |
| Status badge styling | New CSS | Reuse `STATUS_LABELS` pattern from `billing-section.tsx` | Already defined with correct Tailwind classes |

**Key insight:** This phase is entirely composition — no new data model, no new API routes, no new dependencies.

---

## Common Pitfalls

### Pitfall 1: `requirePlan()` throws instead of returning `hasAccess`

**What goes wrong:** If `requirePlan()` throws for blocked users, the page cannot render the blurred preview (D-10). The user sees an error or redirect instead of the upgrade gate.

**Why it happens:** Following the `requireOrgAccess()` pattern too literally — that function throws because unauthenticated users should never see anything. Plan-gated pages are different: blocked users SHOULD see the page, just blurred.

**How to avoid:** `requirePlan()` returns `{ membership, subscription, effectivePlan, hasAccess }`. The page renders `<UpgradeGate hasAccess={hasAccess}>`.

**Warning signs:** If any gated page uses `if (!hasAccess) redirect(...)` — that contradicts D-10.

### Pitfall 2: Double DB query for organization in gated pages

**What goes wrong:** Each gated page currently does `auth()` + `db.organization.findUnique`. If `requirePlan()` calls `getOrganizationMembership()` which also fetches `organization`, the page would fetch org twice.

**Why it happens:** Copy-paste from existing pages without removing the old org lookup.

**How to avoid:** `requirePlan()` returns `membership` which includes `membership.organization`. Derive `orgId` from `membership.organization.id` (the internal DB id) rather than from `auth()` again. The `clerkId` → internal `id` mapping is done once inside `getOrganizationMembership()`.

**Warning signs:** Any gated page that calls both `requirePlan()` AND `db.organization.findUnique`.

### Pitfall 3: Sidebar receives plan via React Context or cookie

**What goes wrong:** Adding a React Context provider for plan state, or reading a cookie set during login, introduces synchronization bugs when the subscription changes (e.g., after a Stripe webhook).

**Why it happens:** Sidebar is `"use client"` so developers reach for client-side state management.

**How to avoid:** Pass `userPlan` as a prop from the layout Server Component. The layout re-fetches on every navigation in App Router — always fresh.

**Warning signs:** Any `createContext`, `useContext`, or `document.cookie` usage for plan data.

### Pitfall 4: `null` subscription not handled

**What goes wrong:** New organizations that have never started a checkout session have no `Subscription` row. `membership.organization.subscription` is `null`. Accessing `.plan` on null throws at runtime.

**Why it happens:** Testing with seeded accounts that have subscriptions; not testing the "no subscription" state.

**How to avoid:** `requirePlan()` handles `sub === null` explicitly → effective plan is `'starter'`. Dashboard widget handles `subscription === null` → show "Aucun abonnement actif" (D-14).

**Warning signs:** Any code that does `membership.organization.subscription.plan` without null-checking.

### Pitfall 5: `trialing` plan access

**What goes wrong:** A user in trial period (`status: 'trialing'`) might have `plan: 'growth'` or `plan: 'starter'`. The effective plan should be based on the enrolled plan, not the status. `trialing` is an active status — the user has access to the features of their enrolled plan.

**Why it happens:** Treating `trialing` as a restricted state like `past_due`.

**How to avoid:** `ACTIVE_STATUSES = ['active', 'trialing']` — both grant access to the features of `subscription.plan`. Only `past_due`, `canceled`, `unpaid` degrade to starter.

---

## Code Examples

### Existing `getOrganizationMembership()` — the base to extend
```typescript
// Source: VERIFIED — src/lib/auth.ts (full file read)
export async function getOrganizationMembership() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) return null

  return db.membership.findFirst({
    where: { clerkUserId: userId, organization: { clerkId: orgId } },
    include: { organization: { include: { subscription: true } } },
  })
}
```

### Existing `Plan` and `SubscriptionStatus` types in billing-section
```typescript
// Source: VERIFIED — src/components/settings/billing-section.tsx lines 9-10
type Plan = 'starter' | 'growth' | 'enterprise'
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
```
These match the Prisma enums `$Enums.SubscriptionPlan` and `$Enums.SubscriptionStatus` exactly.

### Existing `STATUS_LABELS` pattern — reuse for dashboard widget badge
```typescript
// Source: VERIFIED — src/components/settings/billing-section.tsx lines 45-51
const STATUS_LABELS: Record<SubscriptionStatus, { label: string; class: string }> = {
  trialing: { label: 'Essai gratuit', class: 'bg-blue-100 text-blue-700' },
  active:   { label: 'Actif',        class: 'bg-green-100 text-green-700' },
  past_due: { label: 'Paiement en retard', class: 'bg-yellow-100 text-yellow-700' },
  canceled: { label: 'Annulé',       class: 'bg-red-100 text-red-700' },
  unpaid:   { label: 'Non payé',     class: 'bg-red-100 text-red-700' },
}
```

### Prisma Subscription scalar fields (confirmed)
```typescript
// Source: VERIFIED — src/generated/prisma/models/Subscription.ts
// Fields available on membership.organization.subscription:
// plan: $Enums.SubscriptionPlan          ('starter' | 'growth' | 'enterprise')
// status: $Enums.SubscriptionStatus      ('trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid')
// currentPeriodEnd: Date | null
// trialEndsAt: Date | null
// currentPeriodStart: Date | null
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Middleware-based plan gating | Server Component top-of-function check | App Router GA (Next.js 13.4+) | No Edge Runtime limitations; can query DB directly |
| CSS `filter: blur()` via inline style | Tailwind `blur-sm` utility | Tailwind v3+ | Class-based, PurgeCSS-safe |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `(app)/layout.tsx` is a Server Component that can call `getOrganizationMembership()` | Architecture Patterns §Sidebar | If layout is `"use client"`, plan data must be fetched differently — need to read layout file before implementing sidebar changes |
| A2 | Next.js deduplicates `auth()` calls within a single request (so `getOrganizationMembership()` called in layout + `requirePlan()` in page = 1 Clerk call, 1 DB call) | Common Pitfalls | If deduplication doesn't apply, each gated page does 2 membership queries — harmless but wasteful |

**If A1 is wrong:** Read `src/app/(app)/layout.tsx` before planning the sidebar wave. The plan data may need to come from a server action or a data-fetching child component.

---

## Open Questions (RESOLVED)

1. **Layout file structure** — RESOLVED
   - What we know: Standard App Router convention has `src/app/(app)/layout.tsx` as a Server Component
   - What's unclear: Whether the current layout already calls `getOrganizationMembership()` or `requireOrgAccess()` for auth
   - **Resolution:** `(app)/layout.tsx` IS a Server Component. Plan 02-02 Task 2 reads it first (`read_first` directive) and the plan action shows the layout is a simple Server Component with no auth call currently — it just imports `Sidebar` and `Header`. `getOrganizationMembership()` is safe to call from it. This assumption is confirmed by the interface block in 02-02 which shows the current layout as `async function AppLayout` with no prior auth.

2. **`SubscriptionPlan` enum import path** — RESOLVED
   - What we know: `billing-section.tsx` uses local string types `'starter' | 'growth' | 'enterprise'`; the Prisma generated enum is at `@/generated/prisma/enums`
   - What's unclear: Whether `$Enums.SubscriptionPlan` is re-exported from a barrel or must be imported from `@/generated/prisma/enums` directly
   - **Resolution:** Import directly from `@/generated/prisma/enums`. Plan 02-01 Task 1 action specifies `import type { SubscriptionPlan } from '@/generated/prisma/enums'` and instructs the executor to verify the exact barrel path by reading the generated file. Direct import is always safe; any barrel is a convenience alias pointing to the same source.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is pure code changes to existing files. No external tools, services, CLIs, or runtimes beyond the existing project stack are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no `jest.config.*`, `vitest.config.*`, or `__tests__/` found |
| Config file | None — Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GATE-01 | `requirePlan()` returns `hasAccess: false` for `starter` plan | unit | `vitest run src/lib/auth.test.ts` | Wave 0 |
| GATE-01 | `requirePlan()` returns `hasAccess: true` for `growth` plan | unit | `vitest run src/lib/auth.test.ts` | Wave 0 |
| GATE-01 | `requirePlan()` returns `hasAccess: false` for `past_due` status (any plan) | unit | `vitest run src/lib/auth.test.ts` | Wave 0 |
| GATE-01 | `requirePlan()` returns `hasAccess: false` for null subscription | unit | `vitest run src/lib/auth.test.ts` | Wave 0 |
| GATE-01 | `requirePlan()` returns `hasAccess: true` for `trialing` with `growth` plan | unit | `vitest run src/lib/auth.test.ts` | Wave 0 |
| GATE-02 | `<UpgradeGate hasAccess={false}>` renders amber banner + blurred children | unit | `vitest run src/components/upgrade-gate/upgrade-gate.test.tsx` | Wave 0 |
| GATE-02 | `<UpgradeGate hasAccess={true}>` renders children without blur | unit | `vitest run src/components/upgrade-gate/upgrade-gate.test.tsx` | Wave 0 |
| GATE-03 | Dashboard widget renders plan name and renewal date when subscription active | manual | Visual check in browser | — |
| GATE-03 | Dashboard widget renders "Aucun abonnement actif" when subscription is null | manual | Visual check with seeded no-sub org | — |

### Sampling Rate

- **Per task commit:** `vitest run src/lib/auth.test.ts` (fast unit — tests pure function logic)
- **Per wave merge:** `vitest run` (full suite once exists)
- **Phase gate:** Full suite green + manual visual check of all three gated pages before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/auth.test.ts` — covers GATE-01 (`requirePlan` unit tests); requires mocking `getOrganizationMembership`
- [ ] `src/components/upgrade-gate/upgrade-gate.test.tsx` — covers GATE-02 (React Testing Library render tests)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom` — no test runner detected in project

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Clerk handles auth — not in scope |
| V3 Session Management | no | Clerk handles sessions — not in scope |
| V4 Access Control | **yes** | `requirePlan()` enforces server-side; no client-side-only gating |
| V5 Input Validation | no | No user input in this phase |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client-side plan bypass (removing blur CSS in DevTools) | Spoofing / Elevation of Privilege | Gate is enforced in Server Component — removing CSS still returns blurred server HTML. The DB queries run, but no write operations are exposed. Read-only data is acceptable for preview blur. |
| Stale plan data (subscription updated by webhook after page load) | Elevation of Privilege | Plan is read fresh on every Server Component render (no client-side caching). Next.js App Router does not cache page renders by default. |
| Null subscription treated as paid plan | Elevation of Privilege | `requirePlan()` explicitly handles `null` → `'starter'`. Covered by unit tests. |

**Security note:** The blur-preview approach means gated page data IS fetched for blocked users. This is intentional (D-10) and acceptable for read-only analytical data. Future phases with more sensitive data (e.g., financial exports in Phase 7) should consider skipping the DB queries for blocked users and using a static placeholder instead.

---

## Sources

### Primary (HIGH confidence — verified by reading actual files)
- `src/lib/auth.ts` — `getOrganizationMembership()` exact signature and include shape
- `src/components/settings/billing-section.tsx` — `Plan`, `SubscriptionStatus` types, `STATUS_LABELS` map
- `src/generated/prisma/models/Subscription.ts` — all scalar fields on Subscription model
- `src/app/(app)/rapports/page.tsx` — existing auth pattern (no plan check)
- `src/app/(app)/inventaire/page.tsx` — existing auth pattern (no plan check)
- `src/app/(app)/actifs/scan/[qrCode]/page.tsx` — existing auth pattern (no plan check)
- `src/app/(app)/dashboard/page.tsx` — existing org query structure, `Promise.all` pattern
- `src/components/layout/sidebar.tsx` — `"use client"`, no props, `navItems` array
- `src/components/layout/sidebar-sheet.tsx` — same structure as sidebar
- `.planning/phases/02-feature-gating/02-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- Next.js App Router Server Component patterns — well-established, consistent with codebase usage [ASSUMED training knowledge, consistent with observed code]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified in codebase; zero new dependencies
- Architecture: HIGH — all patterns derived from reading actual source files
- Pitfalls: HIGH — derived from concrete code gaps (null subscription, double query) observed in files
- Test framework: LOW — no test infrastructure detected; recommendations are standard but unverified against project

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable codebase; no external service changes)
