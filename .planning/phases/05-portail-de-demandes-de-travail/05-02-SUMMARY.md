---
phase: 05-portail-de-demandes-de-travail
plan: "02"
subsystem: portal-public-surface
tags: [nextjs, vitest, react19, clerk-free, honeypot, email, portal]
dependency_graph:
  requires:
    - src/lib/portal-validation.ts:portalSubmitSchema (Plan 05-01)
    - src/lib/portal-work-order.ts:createPortalWorkOrder (Plan 05-01)
    - src/lib/email.ts:sendPortalConfirmationEmail (Plan 05-01)
    - src/proxy.ts:/portail(.*) and /api/portal(.*) whitelist (Plan 05-01)
  provides:
    - src/app/(public)/layout.tsx:PublicLayout
    - src/app/api/portal/[siteToken]/route.ts:POST
    - src/app/(public)/portail/[siteToken]/page.tsx:PortalPage
    - src/app/(public)/portail/[siteToken]/portal-form.tsx:PortalForm
    - src/components/ui/textarea.tsx:Textarea
  affects:
    - Plan 05-03: Admin UI consumes same portal DB fields (portalToken, portalEnabled)
tech_stack:
  added: []
  patterns:
    - React 19 useActionState (not useFormState) for form submission with pending state
    - Honeypot extracted from raw body BEFORE Zod validation (schema rejects non-empty honeypot)
    - Fire-and-forget email with .catch() to avoid blocking HTTP response
    - Next.js 16 params: Promise<{...}> pattern with await params
    - (public) route group with no Clerk imports — completely auth-free
    - organizationId/siteId always from DB lookup, never from request body (T-05-07)
key_files:
  created:
    - src/app/(public)/layout.tsx
    - src/app/api/portal/[siteToken]/route.ts
    - src/app/api/portal/[siteToken]/route.test.ts
    - src/app/(public)/portail/[siteToken]/page.tsx
    - src/app/(public)/portail/[siteToken]/portal-form.tsx
    - src/components/ui/textarea.tsx
  modified: []
decisions:
  - Honeypot check before Zod because the schema uses .max(0) which rejects filled values with 400 instead of 204
  - Textarea component created as missing shadcn dependency (not pre-installed in project)
metrics:
  duration: "~15 minutes"
  completed: "2026-05-24"
  tasks_completed: 3
  tasks_total: 3
  files_created: 6
  files_modified: 0
  tests_added: 9
---

# Phase 05 Plan 02: Surface Publique Portail — Summary

**One-liner:** Route publique `/portail/[siteToken]` avec SSR Next.js 16, formulaire React 19 `useActionState`, Route Handler POST sans Clerk qui crée le BT, envoie l'email et détecte les bots via honeypot — 9 tests Vitest verts.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Layout public minimal pour le groupe (public) | 558a92d | src/app/(public)/layout.tsx |
| 2 (RED) | Tests Vitest A1-A9 (failing) | ea9e12f | src/app/api/portal/[siteToken]/route.test.ts |
| 2 (GREEN) | Route Handler POST /api/portal/[siteToken] | 98a61a3 | src/app/api/portal/[siteToken]/route.ts |
| 3 | Page SSR + PortalForm client useActionState | a035871 | src/app/(public)/portail/[siteToken]/page.tsx, portal-form.tsx, textarea.tsx |

## Verification Results

- `npx vitest run src/app/api/portal/[siteToken]/route.test.ts` → 9/9 tests green
- `npx tsc --noEmit` → no new errors in files created by this plan (pre-existing error in work-orders/route.ts out of scope)
- `grep -r "@clerk" src/app/(public)/` → 0 results (confirmed auth-free)
- All PORTAL-01 and PORTAL-02 requirements satisfied

## Decisions Made

1. **Honeypot before Zod validation** — The `portalSubmitSchema` from Plan 01 uses `.max(0)` on the honeypot field, meaning a filled honeypot would fail Zod with a 400 error instead of the intended 204 (silent ignore). Fix: extract the raw honeypot from the body object before calling `safeParse`. This preserves the anti-spam contract without revealing bot detection to the sender.

2. **Textarea component created** — `src/components/ui/textarea.tsx` was not pre-installed in the shadcn setup. Created following the existing `input.tsx` pattern (base HTML element + cn() class merging). This is a Rule 3 auto-fix (missing dependency for portal-form.tsx to compile).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing Textarea shadcn component**
- **Found during:** Task 3 — portal-form.tsx imports `@/components/ui/textarea`
- **Issue:** `src/components/ui/textarea.tsx` did not exist in the project
- **Fix:** Created minimal shadcn-style Textarea component matching Input styling conventions
- **Files modified:** src/components/ui/textarea.tsx (created)
- **Commit:** a035871

**2. [Rule 1 - Bug] Honeypot 204 blocked by Zod .max(0) returning 400 instead**
- **Found during:** Task 2 GREEN phase — test A7 failed (expected 204, got 400)
- **Issue:** portalSubmitSchema rejects honeypot values > 0 chars with a Zod 400 error before the honeypot check could run
- **Fix:** Move honeypot inspection to raw body check BEFORE calling `portalSubmitSchema.safeParse()`
- **Files modified:** src/app/api/portal/[siteToken]/route.ts
- **Commit:** 98a61a3

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-05-07 | organizationId/siteId from DB site lookup — never from request body; Test A6 asserts | Applied |
| T-05-08 | Zod .max() limits on all fields + React escape in SSR | Applied via Plan 01 schema |
| T-05-10 | Always 404 (never 403) for invalid/disabled tokens | Applied |
| T-05-11 | Honeypot 'website' field — bot fills → 204 (no WO created); Test A7 asserts | Applied |

## Known Stubs

None — all artifacts are fully implemented and wired. The `/portail/[siteToken]` URL is functional end-to-end.

## Self-Check: PASSED

Files exist:
- src/app/(public)/layout.tsx: FOUND
- src/app/api/portal/[siteToken]/route.ts: FOUND
- src/app/api/portal/[siteToken]/route.test.ts: FOUND
- src/app/(public)/portail/[siteToken]/page.tsx: FOUND
- src/app/(public)/portail/[siteToken]/portal-form.tsx: FOUND
- src/components/ui/textarea.tsx: FOUND

Commits exist:
- 558a92d: FOUND (Task 1 — public layout)
- ea9e12f: FOUND (Task 2 RED — tests)
- 98a61a3: FOUND (Task 2 GREEN — route handler)
- a035871: FOUND (Task 3 — page + form)
