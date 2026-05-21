---
phase: 03-notifications-email
plan: "01"
subsystem: email
tags: [email, resend, notifications, templates, french]
dependency_graph:
  requires: []
  provides: [email-infrastructure, send-functions, email-templates]
  affects: [03-02, 03-03, 03-04]
tech_stack:
  added: [resend@6.12.3]
  patterns: [module-level-singleton, renderToStaticMarkup, inline-styles-email]
key_files:
  created:
    - src/lib/email.ts
    - src/emails/work-order-assigned.tsx
    - src/emails/maintenance-reminder.tsx
    - src/emails/low-stock-alert.tsx
    - .env.example
  modified: []
decisions:
  - "Use renderToStaticMarkup from react-dom/server (not react-email) — react-email not installed, avoids new dependency"
  - "RESEND_FROM_EMAIL env var with fallback — dev environments without the var don't crash"
  - "Module-level Resend singleton — follows same pattern as db.ts, no lazy initialization needed"
  - ".env.example force-added despite .env* gitignore pattern — placeholder-only file, correct to track"
metrics:
  duration_seconds: 372
  completed_date: "2026-05-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 0
---

# Phase 03 Plan 01: Email Infrastructure Summary

**One-liner:** Resend client singleton with three typed send-functions and French Korvia-branded HTML email templates using renderToStaticMarkup.

## What Was Built

Wave 1 foundation for Phase 3 notifications. All downstream plans (03-02, 03-03, 03-04) can now import named send-functions from `@/lib/email` without any additional setup.

### Task 1: Resend client singleton and three typed send-functions

`src/lib/email.ts` — module-level Resend client initialized from `RESEND_API_KEY` env var. Three async send-functions exported:

- `sendWorkOrderAssignedEmail(params)` — sends to single assignee
- `sendMaintenanceReminderEmail(params)` — sends to array of admin emails
- `sendLowStockAlertEmail(params)` — sends to array of admin emails

Each function renders its template via `renderToStaticMarkup()` then calls `resend.emails.send()`.

### Task 2: Three HTML email templates in French with Korvia branding

Three plain React function components under `src/emails/`:

| File | Template | French Subject |
|------|----------|----------------|
| work-order-assigned.tsx | Bon de travail assigné | `[Korvia] Bon de travail #N — titre` |
| maintenance-reminder.tsx | Rappel maintenance préventive | `[Korvia] Rappel maintenance — plan dans 48h` |
| low-stock-alert.tsx | Alerte stock faible | `[Korvia] Alerte stock faible — pièce` |

All templates: `lang="fr"`, amber `#E8830C` header band, Korvia brand name, inline styles only (no className), French body text, gray footer.

`.env.example` created with `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CRON_SECRET` (all placeholder values).

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 2045032 | feat(03-01): Resend client singleton and three typed send-functions |
| Task 2 | 959e8bb | feat(03-01): three HTML email templates in French with Korvia branding |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- `.env.example` required `git add -f` to bypass the `.env*` gitignore pattern. The file contains only placeholder values (no real secrets). This is the intended behavior — `.env.example` should be tracked as documentation.

## Known Stubs

None — all send-functions are fully wired. Templates render real data passed by callers. No hardcoded empty values or placeholder text in functional paths.

## Threat Surface Scan

No new threat surface beyond what the plan's threat model covers:
- T-03-01-01: `.env.example` contains only placeholder key value (`re_xxxxxxxxxxxxxxxxxxxx`) — mitigated.
- T-03-01-02: FROM address set server-side from env var — callers cannot override — mitigated.

## Self-Check: PASSED

- FOUND: src/lib/email.ts
- FOUND: src/emails/work-order-assigned.tsx
- FOUND: src/emails/maintenance-reminder.tsx
- FOUND: src/emails/low-stock-alert.tsx
- FOUND: .env.example
- FOUND: commit 2045032
- FOUND: commit 959e8bb
- TypeScript compilation: no errors in email-related files
