---
phase: 02-feature-gating
plan: 01
subsystem: auth
tags: [feature-gating, subscription, stripe, prisma, react, server-component, tailwind]

# Dependency graph
requires:
  - phase: 02-00
    provides: vitest test infrastructure + RED stub test files for requirePlan and UpgradeGate
  - phase: 01-identit-korvia
    provides: existing auth.ts with getOrganizationMembership(), Clerk + Prisma membership model
provides:
  - requirePlan() exported async function in src/lib/auth.ts — derives effective subscription plan and returns hasAccess boolean
  - UpgradeGate React Server Component in src/components/upgrade-gate/upgrade-gate.tsx — amber banner + blur preview for gated content
affects:
  - 02-02 (rapports gating — will call requirePlan(['growth','enterprise']))
  - 02-03 (API gating — will call requirePlan(['enterprise']))
  - Any page implementing plan-based feature gates

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "requirePlan() pattern: server-side plan check returning hasAccess + effectivePlan — never throws on access denied, only on unauthenticated"
    - "UpgradeGate RSC pattern: amber banner + blur-sm overlay for subscription-gated content"
    - "Effective plan derivation: status in [active, trialing] ? sub.plan : 'starter' — non-active degrades to starter"

key-files:
  created:
    - src/components/upgrade-gate/upgrade-gate.tsx
  modified:
    - src/lib/auth.ts

key-decisions:
  - "requirePlan() returns hasAccess: false instead of throwing — allows pages to render blur preview (per D-07, D-10)"
  - "ACTIVE_STATUSES = ['active', 'trialing'] — past_due/canceled/unpaid degrade to starter (per D-05)"
  - "null subscription row → effectivePlan = 'starter' — orgs without subscription treated as free tier"
  - "UpgradeGate is a Server Component (no 'use client') — avoids client bundle overhead for gating UI"
  - "CTA uses plain Next.js Link with Tailwind classes (not shadcn Button) — avoids client component dependency"

patterns-established:
  - "Plan gate check: const { hasAccess, effectivePlan } = await requirePlan(['growth', 'enterprise'])"
  - "Page gate: wrap gated content in <UpgradeGate hasAccess={hasAccess}>{content}</UpgradeGate>"

requirements-completed: [GATE-01, GATE-02]

# Metrics
duration: 18min
completed: 2026-05-20
---

# Phase 2 Plan 01: Feature Gating Primitives Summary

**requirePlan() server helper + UpgradeGate RSC implementing subscription-tier access control with amber banner and blur preview**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-20T18:17:00Z
- **Completed:** 2026-05-20T18:35:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Added `requirePlan()` to `src/lib/auth.ts` — derives effective subscription plan from Prisma membership, handles null subscription, degrades non-active statuses to 'starter', returns `{ hasAccess, effectivePlan, membership, subscription }`
- Created `<UpgradeGate>` React Server Component at `src/components/upgrade-gate/upgrade-gate.tsx` — amber upgrade banner with Lock icon, 'Voir les plans' CTA linking to `/parametres/organisation`, and `blur-sm pointer-events-none select-none` content preview
- All UI-SPEC visual specifications applied (amber Tailwind classes, dark mode variants, aria-hidden on blur zone)
- Zero new npm packages installed

## Task Commits

Each task was committed atomically:

1. **Task 1: Add requirePlan() to src/lib/auth.ts** - `34d7370` (feat)
2. **Task 2: Create UpgradeGate component** - `dc2084d` (feat)

## Files Created/Modified
- `src/lib/auth.ts` - Extended with `SubscriptionPlan` import, `ACTIVE_STATUSES` constant, and `requirePlan()` export
- `src/components/upgrade-gate/upgrade-gate.tsx` - New React Server Component with amber gate banner and blur preview

## Decisions Made
- `requirePlan()` returns `{ hasAccess: false }` instead of throwing — enabling pages to render a blurred preview rather than an error page (per locked decision D-07 and D-10)
- `ACTIVE_STATUSES = ['active', 'trialing']` — `past_due`, `canceled`, and `unpaid` statuses degrade to 'starter' effective plan (per D-05)
- `null` subscription row is treated as 'starter' — orgs without any subscription record cannot access paid features
- `UpgradeGate` is a Server Component with no `"use client"` directive — CTA uses `next/link` + Tailwind classes rather than shadcn Button to avoid pulling in a client component

## Deviations from Plan

None — plan executed exactly as written. The implementation matches the exact code specified in `<action>` blocks for both tasks.

## Issues Encountered
- The worktree's `src/generated/prisma` directory did not exist (Prisma client not generated in worktree). Resolved by symlinking `/home/deploy/gmao-saas/src/generated/prisma` into the worktree's `src/generated/prisma`. This allowed TypeScript compilation to verify no errors in the modified files.

## Known Stubs
None — all logic is fully wired. `requirePlan()` reads live Prisma data via `getOrganizationMembership()`. `UpgradeGate` receives `hasAccess` from the caller (no hardcoded values).

## Next Phase Readiness
- `requirePlan()` and `<UpgradeGate>` are ready for use by Wave 2 plans (02-02 rapports gating, 02-03 API gating)
- Usage pattern: `const { hasAccess } = await requirePlan(['growth', 'enterprise'])` in page → pass to `<UpgradeGate hasAccess={hasAccess}>`
- No blockers for Wave 2 execution

---
*Phase: 02-feature-gating*
*Completed: 2026-05-20*
