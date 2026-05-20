---
phase: 02-feature-gating
plan: 02
subsystem: feature-gating
tags: [feature-gating, subscription, server-component, sidebar, layout, next-js]

# Dependency graph
requires:
  - phase: 02-01
    provides: requirePlan() + UpgradeGate RSC
provides:
  - Gated rapports page — UpgradeGate wraps full page content
  - Gated inventaire page — UpgradeGate wraps full page content
  - Gated actifs/scan page — UpgradeGate wraps full page content with cross-org isolation
  - Sidebar with Lock icon for starter users on gated nav items
  - SidebarSheet with Lock icon for starter users on gated nav items
  - AppLayout threading userPlan from server to client sidebars via Header
affects:
  - All authenticated app pages (layout change affects every route)
  - 02-03 (API gating — independent, same requirePlan pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page gate pattern: const { membership, hasAccess } = await requirePlan(['growth','enterprise']) + <UpgradeGate hasAccess={hasAccess}>"
    - "No double org lookup: membership.organization.id replaces db.organization.findUnique"
    - "Layout plan threading: async Server Component fetches plan, passes to client Sidebar + Header(→SidebarSheet) as prop"
    - "Sidebar lock: GATED_HREFS Set + Lock icon (h-3 w-3 ml-auto text-muted-foreground/60) conditionally on starter plan"

key-files:
  created: []
  modified:
    - src/app/(app)/rapports/page.tsx
    - src/app/(app)/inventaire/page.tsx
    - src/app/(app)/actifs/scan/[qrCode]/page.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/sidebar-sheet.tsx
    - src/components/layout/header.tsx
    - src/app/(app)/layout.tsx

key-decisions:
  - "Header receives userPlan prop and threads it to SidebarSheet — Header is 'use client' and owns SidebarSheet rendering"
  - "GATED_HREFS = Set(['/inventaire', '/rapports']) — /actifs/scan excluded (not in nav, scan is gated at page level)"
  - "Scan page cross-org isolation: asset.organization.id === membership.organization.id (internal DB id, not Clerk clerkId)"
  - "DB queries still run when hasAccess=false — intentional for blur preview per D-10"
  - "userPlan defaults to 'starter' in both Sidebar and SidebarSheet — fail-safe per D-15"

# Metrics
duration: 3min
completed: 2026-05-20
---

# Phase 2 Plan 02: Apply Feature Gates to Pages and Sidebar Summary

**Three pages gated with requirePlan()+UpgradeGate and sidebar updated with Lock icon for starter users, with userPlan threaded from async server layout through Header to SidebarSheet**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-20T18:38:11Z
- **Completed:** 2026-05-20T18:41:41Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Replaced `auth()+db.organization.findUnique` with `requirePlan(['growth','enterprise'])` in rapports, inventaire, and actifs/scan pages — eliminating double org lookups
- Wrapped each page's JSX in `<UpgradeGate hasAccess={hasAccess} requiredPlan="growth">` — starter users see amber banner + blurred preview
- Scan page cross-org isolation updated to compare internal DB ids (`asset.organization.id === membership.organization.id`) instead of Clerk clerkId
- Added `Lock` icon (h-3 w-3 ml-auto text-muted-foreground/60, aria-label="Fonctionnalité verrouillée") to Sidebar and SidebarSheet for `/inventaire` and `/rapports` when `userPlan === 'starter'`
- Converted `AppLayout` to async Server Component — fetches `getOrganizationMembership()`, derives `effectivePlan`, passes it to `Sidebar` and `Header`
- Added `userPlan` prop to `Header` which threads it to `SidebarSheet`
- TypeScript clean (0 errors) throughout

## Task Commits

1. **Task 1: Gate rapports, inventaire, and scan pages** — `d9ba295` (feat)
2. **Task 2: Add sidebar lock icons + thread userPlan from layout** — `70c5d18` (feat)

## Files Created/Modified

- `src/app/(app)/rapports/page.tsx` — requirePlan + UpgradeGate, orgId from membership
- `src/app/(app)/inventaire/page.tsx` — requirePlan + UpgradeGate, orgId from membership
- `src/app/(app)/actifs/scan/[qrCode]/page.tsx` — requirePlan + UpgradeGate, cross-org via internal id
- `src/components/layout/sidebar.tsx` — userPlan prop, GATED_HREFS, Lock icon
- `src/components/layout/sidebar-sheet.tsx` — userPlan prop, GATED_HREFS, Lock icon
- `src/components/layout/header.tsx` — userPlan prop, threads to SidebarSheet
- `src/app/(app)/layout.tsx` — async, getOrganizationMembership(), effectivePlan, passes to Sidebar+Header

## Decisions Made

- Header is `"use client"` and owns SidebarSheet rendering, so `userPlan` is threaded Layout → Header → SidebarSheet (rather than rendering SidebarSheet separately in the server layout)
- GATED_HREFS contains only `/inventaire` and `/rapports` — `/actifs/scan` is not a nav item so no lock icon needed there
- Scan page ownership check migrated from Clerk `clerkId` to internal `id` comparison — consistent with requirePlan() returning internal membership

## Deviations from Plan

### Auto-added Header prop threading

**[Rule 2 - Missing critical functionality] Thread userPlan through Header to SidebarSheet**
- **Found during:** Task 2
- **Issue:** The plan specified passing `userPlan` to `Header` and threading it to `SidebarSheet`, but Header itself needed a `userPlan` prop added (not mentioned explicitly in the plan's action block)
- **Fix:** Added `HeaderProps` interface with `userPlan?` to `header.tsx` and passed it through to `<SidebarSheet userPlan={userPlan} />`
- **Files modified:** `src/components/layout/header.tsx`
- **Commit:** `70c5d18`

## Known Stubs

None — all gating logic is fully wired. requirePlan() reads live Prisma data. UpgradeGate receives real hasAccess. Sidebar receives effectivePlan derived from live subscription.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. Cross-org isolation on scan page maintained (migrated from Clerk id to internal DB id comparison — same security property).

## Self-Check: PASSED

- `src/app/(app)/rapports/page.tsx` — exists, contains requirePlan + UpgradeGate
- `src/app/(app)/inventaire/page.tsx` — exists, contains requirePlan + UpgradeGate
- `src/app/(app)/actifs/scan/[qrCode]/page.tsx` — exists, contains requirePlan + UpgradeGate
- `src/components/layout/sidebar.tsx` — exists, contains GATED_HREFS + Lock icon
- `src/components/layout/sidebar-sheet.tsx` — exists, contains GATED_HREFS + Lock icon
- `src/components/layout/header.tsx` — exists, contains userPlan prop
- `src/app/(app)/layout.tsx` — exists, async, contains getOrganizationMembership
- Commits d9ba295 and 70c5d18 — verified in git log
- TypeScript: 0 errors
