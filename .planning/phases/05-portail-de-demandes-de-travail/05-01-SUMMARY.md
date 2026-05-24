---
phase: 05-portail-de-demandes-de-travail
plan: "01"
subsystem: portal-foundations
tags: [prisma, clerk, server-actions, vitest, email, portal]
dependency_graph:
  requires: []
  provides:
    - prisma/schema.prisma:Site.portalToken
    - prisma/schema.prisma:Site.portalEnabled
    - src/proxy.ts:/portail(.*) whitelist
    - src/proxy.ts:/api/portal(.*) whitelist
    - src/actions/sites.ts:enablePortal
    - src/actions/sites.ts:disablePortal
    - src/actions/sites.ts:regeneratePortalToken
    - src/lib/portal-validation.ts:portalSubmitSchema
    - src/lib/portal-work-order.ts:createPortalWorkOrder
    - src/lib/email.ts:sendPortalConfirmationEmail
    - src/emails/portal-confirmation.tsx:PortalConfirmationEmail
  affects:
    - Plan 05-02: Route Handler + public portal page (consumes all artifacts)
    - Plan 05-03: Admin UI (consumes enablePortal/disablePortal/regeneratePortalToken)
tech_stack:
  added: []
  patterns:
    - Clerk middleware whitelist via createRouteMatcher for public portal routes
    - requireAdminOrManager() role guard pattern in Server Actions
    - organizationId always from server-resolved params (never from client input)
    - Zod honeypot field (max(0).optional().or(literal(''))) for bot detection
    - createPortalWorkOrder Clerk-free helper (same pattern as API v1 route handler)
    - React Email template reusing Korvia brand palette (#E8830C header)
key_files:
  created:
    - src/lib/portal-validation.ts
    - src/lib/portal-work-order.ts
    - src/lib/portal-work-order.test.ts
    - src/emails/portal-confirmation.tsx
  modified:
    - prisma/schema.prisma (Site model: +portalToken, +portalEnabled, +@@index([portalToken]))
    - src/proxy.ts (whitelist /portail(.*) and /api/portal(.*))
    - src/actions/sites.ts (+enablePortal, +disablePortal, +regeneratePortalToken, +requireAdminOrManager)
    - src/lib/email.ts (+sendPortalConfirmationEmail, +import PortalConfirmationEmail)
decisions:
  - requireAdminOrManager() enforces admin|manager role (blocks technician/viewer) per threat T-05-02
  - enablePortal reuses existing portalToken if present (avoids invalidating shared URLs on toggle off/on)
  - createPortalWorkOrder is completely Clerk-free to support anonymous portal submissions
  - honeypot field validated at Zod level (max 0 chars) — caller decides whether to reject filled submissions
metrics:
  duration: "~15 minutes"
  completed: "2026-05-24"
  tasks_completed: 5
  tasks_total: 5
  files_created: 4
  files_modified: 4
  tests_added: 7
---

# Phase 05 Plan 01: Fondations Portail de Demandes — Summary

**One-liner:** Schema Prisma étendu (portalToken/portalEnabled), proxy Clerk mis à jour, Server Actions admin avec contrôle de rôle, helper `createPortalWorkOrder` sans Clerk testé en isolation, template email de confirmation Korvia.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Étendre Site model + whitelister proxy | 877d2c8 | prisma/schema.prisma, src/proxy.ts |
| 2 | Pousser schema DB + régénérer client | (db push + generate — no new tracked files) | src/generated/prisma/models/Site.ts |
| 3 | Server Actions admin portail | e9401c9 | src/actions/sites.ts |
| 4 | createPortalWorkOrder + tests Vitest | 5ca4655 | src/lib/portal-validation.ts, src/lib/portal-work-order.ts, src/lib/portal-work-order.test.ts |
| 5 | PortalConfirmationEmail + sendPortalConfirmationEmail | 89d4d0b | src/emails/portal-confirmation.tsx, src/lib/email.ts |

## Verification Results

- `npx prisma validate` → valid (exit 0)
- `npx prisma db push --accept-data-loss` → "Your database is now in sync with your Prisma schema"
- `npx vitest run src/lib/portal-work-order.test.ts` → 7/7 tests green
- `npx tsc --noEmit` → no errors introduced on modified files
- `grep -c "portalToken\|portalEnabled" prisma/schema.prisma` → 3
- `grep "/portail(.*)" src/proxy.ts` → 1 match

## Decisions Made

1. **requireAdminOrManager()** — Implemented as internal helper (not exported) per threat T-05-02. Blocks technician/viewer roles from modifying portal state.
2. **enablePortal reuses existing token** — If a site already has a portalToken, enablePortal reuses it rather than generating a new one. This ensures URL links shared before disabling still work after re-enabling.
3. **Clerk-free createPortalWorkOrder** — Zero calls to `auth()` or any Clerk API. organizationId and siteId are always resolved by the caller (Route Handler in Plan 02) from the portalToken DB lookup.
4. **Honeypot Zod validation** — `z.string().max(0).optional().or(z.literal(''))` accepts empty/absent honeypot but the spam decision (reject if filled) is deferred to the Route Handler caller.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-05-01 | organizationId isolation in enablePortal/disablePortal/regeneratePortalToken | Applied in Task 3 |
| T-05-02 | requireAdminOrManager() blocks technician/viewer | Applied in Task 3 |
| T-05-04 | organizationId from params only — test 5 asserts explicitly | Applied in Task 4 |
| T-05-05 | Zod .max(1000)/.max(200) on description/locationDescription | Applied in Task 4 |

## Known Stubs

None — all artifacts are fully implemented and wired. Plan 02 will consume these as dependencies.

## Self-Check: PASSED

Files exist:
- src/lib/portal-validation.ts: FOUND
- src/lib/portal-work-order.ts: FOUND
- src/lib/portal-work-order.test.ts: FOUND
- src/emails/portal-confirmation.tsx: FOUND

Commits exist:
- 877d2c8: FOUND (Task 1)
- e9401c9: FOUND (Task 3)
- 5ca4655: FOUND (Task 4)
- 89d4d0b: FOUND (Task 5)
