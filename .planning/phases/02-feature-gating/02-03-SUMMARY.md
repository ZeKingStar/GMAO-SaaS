---
phase: 02-feature-gating
plan: "03"
subsystem: ui
tags: [nextjs, prisma, stripe, shadcn, canadian-french, subscription, dashboard]

# Dependency graph
requires:
  - phase: 02-01
    provides: requirePlan() helper and UpgradeGate component foundation
  - phase: 02-02
    provides: Gated pages (rapports, inventaire, scan) confirming subscription data model usage
provides:
  - Dashboard subscription widget rendering all 4 subscription states (active/trialing, past_due/unpaid, canceled, null)
  - Zero-extra-DB-round-trip subscription co-load via nested Prisma select on existing org query
  - PLAN_NAMES and STATUS_LABELS constants in Canadian French matching billing-section.tsx
  - formatRenewalDate() helper using fr-CA locale
  - Billing portal trigger via inline server action wrapping createBillingPortalSession()
affects:
  - phase-03 (any phase extending the dashboard or subscription management UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nested Prisma select to co-load related model data without extra DB round-trips"
    - "Inline 'use server' function inside JSX form action for billing portal redirect"
    - "Raw Tailwind span for status badges instead of shadcn Badge (exact class control)"
    - "Link with manual Tailwind button styling when Button asChild is unavailable in base-ui variant"

key-files:
  created: []
  modified:
    - src/app/(app)/dashboard/page.tsx

key-decisions:
  - "Button asChild not used — base-ui variant of shadcn Button lacks asChild; Link styled manually with Tailwind button classes instead"
  - "Billing portal CTA uses inline 'use server' wrapper around createBillingPortalSession() + redirect() rather than importing action directly as form action"
  - "Status badges implemented as raw <span> with Tailwind classes from STATUS_LABELS, not shadcn Badge component, to preserve exact bg-/text- class control"
  - "Subscription co-loaded via nested select on existing org query — no second DB call"

patterns-established:
  - "Pattern: Co-load related subscription data via Prisma nested select on org query — avoids N+1 round-trips"
  - "Pattern: Inline server action in form for portal redirects — 'use server' function directly in JSX"

requirements-completed:
  - GATE-03

# Metrics
duration: 20min
completed: 2026-05-20
---

# Phase 02 Plan 03: Dashboard Subscription Widget Summary

**Dashboard subscription widget co-loading plan/status/renewal via nested Prisma select, rendering 4 states in Canadian French with billing portal action**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-20T18:20:00Z
- **Completed:** 2026-05-20T18:49:00Z
- **Tasks:** 1 (+ 1 checkpoint verified)
- **Files modified:** 1

## Accomplishments

- Extended org Prisma query to co-load subscription fields (plan, status, currentPeriodEnd, trialEndsAt) with zero additional DB round-trips
- Implemented subscription widget with all 4 required states: active/trialing, past_due/unpaid, canceled, null — all copy in Canadian French
- Billing portal trigger implemented via inline `'use server'` form action wrapping `createBillingPortalSession()` + `redirect()`
- Human visual verification checkpoint passed and approved

## Task Commits

1. **Task 1: Add subscription widget to dashboard** - `a725d4d` (feat)

**Plan metadata:** (this summary commit — docs)

## Files Created/Modified

- `src/app/(app)/dashboard/page.tsx` - Extended with PLAN_NAMES, STATUS_LABELS, formatRenewalDate() constants; org query extended with subscription nested select; subscription widget JSX added at bottom of return with 4 conditional states

## Decisions Made

- **Button asChild unavailable:** The base-ui variant of the shadcn Button component does not support `asChild`. CTAs were implemented as `<Link>` elements with manual Tailwind button classes to match the design spec visually.
- **Inline server action for billing portal:** `createBillingPortalSession()` returns a URL that requires a server-side `redirect()` call. Wrapping it in an inline `'use server'` function inside the form's `action` prop was the cleanest approach without a separate action file.
- **Raw span for badges:** STATUS_LABELS uses specific Tailwind `bg-*/text-*` classes. Using raw `<span>` elements preserves these exactly without shadcn Badge adding conflicting styles.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Button asChild not used — inline Link styling substituted**
- **Found during:** Task 1 (Add subscription widget to dashboard)
- **Issue:** The plan specified `Button asChild` for Link CTAs, but the base-ui variant of Button in this project does not expose an `asChild` prop, causing a type/runtime issue.
- **Fix:** Replaced `<Button asChild>` wrapping `<Link>` with a plain `<Link>` element styled via manual Tailwind classes matching the Button variant's appearance.
- **Files modified:** `src/app/(app)/dashboard/page.tsx`
- **Verification:** TypeScript passes with 0 errors; visual appearance matches spec.
- **Committed in:** a725d4d (Task 1 commit)

**2. [Rule 1 - Bug] Billing portal form action uses inline 'use server' wrapper**
- **Found during:** Task 1 (Add subscription widget to dashboard)
- **Issue:** The plan specified `action={createBillingPortalSession}` directly on the form, but `createBillingPortalSession()` returns `{ url }` — it does not call `redirect()` itself. Passing it directly as a form action would not redirect the user.
- **Fix:** Wrapped the call in an inline `async () => { 'use server'; const { url } = await createBillingPortalSession(); redirect(url) }` inside the form's `action` prop.
- **Files modified:** `src/app/(app)/dashboard/page.tsx`
- **Verification:** Pattern is functionally correct per Next.js server action conventions; TypeScript clean.
- **Committed in:** a725d4d (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug)
**Impact on plan:** Both fixes required for correctness. No scope creep. UI outcome matches all plan specifications.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GATE-03 satisfied: users see plan name, status badge, renewal date, and appropriate CTA on the dashboard
- All Phase 02 deliverables complete: requirePlan() helper, UpgradeGate component, 3 gated pages, sidebar lock icons, dashboard widget
- Ready for Phase 03 when planned (billing management UI, Stripe webhook handlers, or further feature expansion)

---
*Phase: 02-feature-gating*
*Completed: 2026-05-20*
