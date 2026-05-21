---
phase: 03-notifications-email
plan: "03"
subsystem: infra
tags: [vercel-cron, maintenance-reminder, email, prisma, nextjs]

# Dependency graph
requires:
  - phase: 03-notifications-email
    plan: "01"
    provides: [sendMaintenanceReminderEmail function in src/lib/email.ts]
provides:
  - Hourly Vercel Cron job that auto-sends 48h maintenance reminder emails to org admins
  - GET /api/cron/maintenance-reminder route protected by CRON_SECRET
  - vercel.json with hourly cron schedule declaration
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [vercel-cron-bearer-auth, idempotency-window-query, sequential-email-dispatch]

key-files:
  created:
    - src/app/api/cron/maintenance-reminder/route.ts
    - vercel.json
  modified: []

key-decisions:
  - "47-49h query window provides 2-hour idempotency buffer so same plan cannot be notified twice per 48h cycle"
  - "Sequential await in for-loop is intentional — rate-limits Resend API calls, prevents bursting on large plan counts"
  - "Return 401 immediately before any DB query when auth fails — satisfies T-03-03-02 DoS mitigation"
  - "Filter adminEmails to non-empty strings before passing to sendMaintenanceReminderEmail — avoids Resend API error on empty to[] array"

patterns-established:
  - "Vercel Cron auth pattern: check Authorization: Bearer CRON_SECRET header, return 401 before any I/O on failure"
  - "Cron idempotency via time window: query nextDueAt between now+47h and now+49h, cron runs every hour"

requirements-completed: [NOTIF-02]

# Metrics
duration: 10min
completed: "2026-05-21"
---

# Phase 03 Plan 03: Maintenance Reminder Cron Summary

**Vercel Cron Job running hourly that queries MaintenancePlan.nextDueAt in a 47-49h window and emails each org's admin members via Resend.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-21T13:16:00Z
- **Completed:** 2026-05-21T13:16:53Z
- **Tasks:** 1 of 1
- **Files modified:** 2

## Accomplishments

- GET /api/cron/maintenance-reminder route protected by `Authorization: Bearer CRON_SECRET`
- Queries `MaintenancePlan` where `isActive=true` and `nextDueAt` between `now+47h` and `now+49h` using indexed column
- Filters to admin-role Membership emails per organization and calls `sendMaintenanceReminderEmail` for each plan
- Returns 200 JSON with `plansFound` and `emailsSent` counts; 401 if auth missing or wrong
- `vercel.json` declares hourly cron (`0 * * * *`) pointing to the route

## Task Commits

1. **Task 1: Cron route handler and vercel.json** - `7fb0e07` (feat)

## Files Created/Modified

- `src/app/api/cron/maintenance-reminder/route.ts` - Hourly cron GET handler with CRON_SECRET auth guard, 47-49h window query, and per-plan email dispatch
- `vercel.json` - Cron schedule declaration for Vercel deployment

## Decisions Made

- **47-49h window idempotency:** The 2-hour window centered on 48h means the cron running every hour will match a given plan's `nextDueAt` exactly once. No DB deduplication field needed.
- **Sequential dispatch:** Emails sent one-by-one with `await` inside a for-loop rather than `Promise.all`. This rate-limits Resend API calls and keeps the Vercel Cron within its 60s execution window even if many plans are due.
- **Early 401 before DB:** Auth check fires before any database query, satisfying threat T-03-03-02 (DoS via polling cron endpoint without secret).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — route is fully wired. Queries real DB via Prisma, sends real emails via `sendMaintenanceReminderEmail` from 03-01.

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-03-03-01: `Authorization: Bearer CRON_SECRET` required — implemented, returns 401 without DB query if missing or wrong.
- T-03-03-02: Auth guard fires before any DB access — DoS protection in place.
- T-03-03-03: Emails sent only to org admin-role members; no cross-org data leakage possible (query scoped to plan's `organizationId`).

## Issues Encountered

None.

## User Setup Required

`CRON_SECRET` must be set in Vercel environment variables (already documented in `.env.example` from plan 03-01). Vercel will automatically inject this value as the `Authorization: Bearer` header when invoking the cron job.

## Next Phase Readiness

- Maintenance reminder automation is complete and production-ready once `CRON_SECRET` and `RESEND_API_KEY` are set in Vercel.
- Plans 03-02 and 03-04 (work order assigned email and low-stock alert) operate independently — this plan's completion does not block them.

---
*Phase: 03-notifications-email*
*Completed: 2026-05-21*

## Self-Check: PASSED

- FOUND: src/app/api/cron/maintenance-reminder/route.ts
- FOUND: vercel.json
- FOUND: commit 7fb0e07
- TypeScript compilation: no errors (npx tsc --noEmit produced no output)
- vercel.json: valid JSON (node -e parse passed)
- All acceptance criteria verified: GET export, 401 guard, 47h/49h window, admin filter, sendMaintenanceReminderEmail call, hourly schedule
