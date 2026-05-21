---
phase: 03-notifications-email
plan: "02"
subsystem: notifications
tags: [email, work-orders, notifications, fire-and-forget, resend]
dependency_graph:
  requires: [03-01]
  provides: [work-order-assignment-notifications]
  affects: []
tech_stack:
  added: []
  patterns: [fire-and-forget, Promise.allSettled, detached-promise-catch]
key_files:
  created: []
  modified:
    - src/actions/work-orders.ts
decisions:
  - "Promise.allSettled used in createWorkOrder — all assignee emails dispatched in parallel, individual failures isolated and logged"
  - "Detached promise with .catch used in assignMember — single recipient, simpler than allSettled"
  - "organizationName added to getOrgAndMembership return — avoids second DB round-trip in both functions"
  - "Email sends placed after DB commits complete — work order is always created before any email attempt"
metrics:
  duration_seconds: 240
  completed_date: "2026-05-21"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 03 Plan 02: Work Order Email Notifications Summary

**One-liner:** NOTIF-01 implemented — `sendWorkOrderAssignedEmail` hooked into `createWorkOrder` (Promise.allSettled, all initial assignees) and `assignMember` (detached promise, single new assignee), both fire-and-forget with error logging.

## What Was Built

### Task 1: Hook email into createWorkOrder and assignMember

`src/actions/work-orders.ts` modified with three changes:

**1. Import added:**
```typescript
import { sendWorkOrderAssignedEmail } from '@/lib/email'
```

**2. `getOrgAndMembership` extended:**
- `select: { id: true, name: true }` on Organization query
- Returns `organizationName: org.name` alongside existing fields

**3. `createWorkOrder` — email dispatch after `db.workOrder.create`:**
- Queries `WorkOrderAssignee` with `membership` include after work order creation
- Filters to members with non-empty email
- `Promise.allSettled(...)` dispatch — fully non-blocking, individual failures logged via `.catch(console.error)`

**4. `assignMember` — email dispatch after upsert:**
- `Promise.all` fetches member and work order in parallel
- Guards on `member?.email && workOrder` before sending
- Detached promise with `.catch(err => console.error(...))` — never throws

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | cb4e838 | feat(03-02): hook sendWorkOrderAssignedEmail into createWorkOrder and assignMember |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — email sends are fully wired to real DB data. No hardcoded values in notification paths.

## Threat Surface Scan

No new surface beyond the plan's threat model:
- T-03-02-01: `membershipId` looked up in DB scoped to org — client cannot supply arbitrary email — mitigated.
- T-03-02-03: `Promise.allSettled` ensures no HTTP timeout risk even with many assignees — mitigated.
- T-03-02-04: `getOrgAndMembership()` validates caller's org before any assignment — mitigated.

## Self-Check: PASSED

- FOUND: src/actions/work-orders.ts (modified)
- FOUND: commit cb4e838
- `grep "sendWorkOrderAssignedEmail"` matches at import + 2 call sites
- `grep "Promise.allSettled"` matches in createWorkOrder path
- `grep "console.error.*email"` matches both fire-and-forget handlers
- All 9 pre-existing exports confirmed present
- TypeScript compilation: no errors
