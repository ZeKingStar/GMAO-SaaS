---
phase: 03-notifications-email
plan: "04"
subsystem: inventory
tags: [email, resend, notifications, inventory, low-stock, prisma]

requires:
  - phase: 03-01
    provides: sendLowStockAlertEmail function in src/lib/email.ts

provides:
  - Low-stock alert emails triggered on threshold-crossing in inventory actions
  - Transition detection (before >= min AND after < min) in updateSparePart and adjustQuantity
  - getOrgAdminEmails helper for org-scoped admin email lookup

affects: []

tech-stack:
  added: []
  patterns:
    - "read-before-write pattern: fetch current DB state before mutation to enable threshold comparison"
    - "fire-and-forget email: Promise.catch for non-blocking email sends in server actions"
    - "transition detection: only fire alert when value crosses boundary, not on every sub-threshold save"

key-files:
  created: []
  modified:
    - src/actions/inventory.ts

key-decisions:
  - "effectiveMin uses new quantityMin if provided, falls back to existing quantityMin — handles update that changes both qty and threshold simultaneously"
  - "adjustQuantity reads before increment and uses select: { quantityOnHand: true } to get updated value from Prisma — increment does not return new value otherwise"
  - "getOrganizationId now returns { organizationId, organizationName } — all four callers updated to destructure"

patterns-established:
  - "read-before-write for threshold crossing: fetch current record before any mutation when post-mutation comparison is needed"
  - "fire-and-forget pattern: sendEmailFn(...).catch(err => console.error(...)) — email failure never blocks the primary action"

requirements-completed: [NOTIF-03]

duration: 8min
completed: "2026-05-21"
---

# Phase 03 Plan 04: Low-Stock Alert Hook Summary

**Threshold-crossing detection in inventory server actions fires sendLowStockAlertEmail to org admins via read-before-write pattern — non-blocking, transition-only, null-guarded.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-21T13:11:00Z
- **Completed:** 2026-05-21T13:19:16Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `updateSparePart` now reads current `quantityOnHand`/`quantityMin` before the DB update, then compares to detect a threshold crossing (before >= min AND after < min)
- `adjustQuantity` reads before the Prisma increment and uses `select: { quantityOnHand: true }` to retrieve the post-increment value for comparison
- Both functions fire `sendLowStockAlertEmail` only on the single crossing event — alert storm prevention (T-03-04-02 mitigated)
- `getOrganizationId` extended to return `organizationName`; all four callers updated to destructure
- `getOrgAdminEmails` helper added, querying `Membership WHERE organizationId = ? AND role = 'admin'`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add threshold-crossing detection to updateSparePart and adjustQuantity** - `a94fe73` (feat)

## Files Created/Modified

- `src/actions/inventory.ts` — Extended with import of sendLowStockAlertEmail, getOrgAdminEmails helper, read-before-write in both update functions, threshold-crossing logic, fire-and-forget email calls

## Decisions Made

- `effectiveMin` in `updateSparePart` uses `newMin ?? before?.quantityMin ?? null` — this correctly handles the case where the user changes both quantity and threshold in one save operation
- Explicit type annotation `(a: { email: string })` added to map callback in `getOrgAdminEmails` to satisfy strict TypeScript without Prisma client being pre-generated
- No new infrastructure required — plan was self-contained modification to an existing file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed implicit any TypeScript error in getOrgAdminEmails**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** `admins.map(a => a.email)` produced TS7006 (implicit `any`) because Prisma generated types are not present in worktree at compile-time
- **Fix:** Added explicit type annotation `(a: { email: string })` to the map callback
- **Files modified:** src/actions/inventory.ts
- **Verification:** `npx tsc --noEmit` reports zero errors for inventory.ts
- **Committed in:** a94fe73 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix necessary for TypeScript compliance. No scope change.

## Issues Encountered

None beyond the TypeScript annotation fix documented above.

## User Setup Required

None — no new external services or environment variables required. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` were already introduced in plan 03-01.

## Known Stubs

None — both alert hooks are fully wired to real DB queries and real email send-functions. No hardcoded empty values or placeholder paths in the alert flow.

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-03-04-02 (alert storm): mitigated by transition detection — alert fires only when crossing from above threshold to at-or-below, not on every sub-threshold save.
- Admin emails sourced from DB using organizationId scope — no cross-tenant risk.

## Next Phase Readiness

- NOTIF-03 complete — low-stock alert emails wired into inventory actions
- Wave 2 plans (03-02 work-order assigned emails, 03-03 maintenance reminder emails) are independent
- No blockers for remaining wave 2 plans

---
*Phase: 03-notifications-email*
*Completed: 2026-05-21*
