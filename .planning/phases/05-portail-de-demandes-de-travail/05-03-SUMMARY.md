---
phase: 05-portail-de-demandes-de-travail
plan: "03"
subsystem: portal-admin-ui
tags: [react, client-component, vitest, settings, portal, role-gating]
dependency_graph:
  requires:
    - src/actions/sites.ts:enablePortal
    - src/actions/sites.ts:disablePortal
    - src/actions/sites.ts:regeneratePortalToken
  provides:
    - src/components/settings/portal-sites-section.tsx:PortalSitesSection
    - src/app/(app)/parametres/organisation/page.tsx:canManagePortals gate
  affects:
    - Plan 05-02: Route Handler + public portal page (end-to-end verified at checkpoint)
tech_stack:
  added: []
  patterns:
    - useState + useTransition client component pattern (mirrors api-keys-section)
    - Dialog shadcn for destructive confirmation (regenerate token)
    - navigator.clipboard.writeText with 2s Copié feedback
    - Server Component role gate (canManagePortals) before rendering section
    - db.site.findMany with explicit select (no over-fetching)
key_files:
  created:
    - src/components/settings/portal-sites-section.tsx
    - src/components/settings/portal-sites-section.test.tsx
  modified:
    - src/app/(app)/parametres/organisation/page.tsx
decisions:
  - PortalSitesSection has no plan gating (unlike ApiKeysSection) — portail is available on all plans per spec
  - canManagePortals uses admin|manager role check at Server Component level (defense-in-depth with Server Action guards from Plan 01)
  - enablePortal reuses existing token if present (Plan 01 decision) — UI always shows current token after enable
metrics:
  duration: "~10 minutes"
  completed: "2026-05-25T00:00:00Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 1
  tests_added: 7
---

# Phase 05 Plan 03: UI Admin Portail + Checkpoint End-to-End — Summary

**One-liner:** Section "Portails publics" dans /parametres/organisation avec toggle enable/disable, copie URL, régénération token, gating admin|manager, 7 tests Vitest verts.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | PortalSitesSection composant client + tests Vitest | 14a7dad | src/components/settings/portal-sites-section.tsx, portal-sites-section.test.tsx |
| 2 | Intégrer PortalSitesSection dans /parametres/organisation | a55d5b9 | src/app/(app)/parametres/organisation/page.tsx |
| 3 | Vérification humaine end-to-end | — | 05-HUMAN-UAT.md (10/10 passed) |

## Task 3: Checkpoint Approved

Task 3 was a `checkpoint:human-verify` — human end-to-end verification of the full portal flow (Plans 01 + 02 + 03 together) was completed on 2026-05-25. All 10 steps passed. See 05-HUMAN-UAT.md for full results.

## Verification Results

- `npx vitest run src/components/settings/portal-sites-section.test.tsx` → 7/7 tests green
- `npx tsc --noEmit` → 0 errors on parametres/organisation/page.tsx
- All Task 1 acceptance criteria grep checks pass
- All Task 2 acceptance criteria grep checks pass

## Decisions Made

1. **No plan gating on portal** — PortalSitesSection is shown to all admin/manager regardless of subscription tier. The portal is a core feature, not a premium one.
2. **Server Component role gate** — `canManagePortals` evaluated server-side before rendering; technician/viewer receive empty `portalSites: []` and no JSX section.
3. **Clipboard spy pattern** — B6 test uses `vi.spyOn(navigator.clipboard, 'writeText')` scoped per-test to avoid spy contamination from `vi.clearAllMocks()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clipboard mock approach changed from Object.assign to vi.spyOn**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** `Object.assign(navigator, { clipboard: { writeText: vi.fn() } })` + `vi.clearAllMocks()` in beforeEach caused the writeText function to no longer be a spy when B6 ran
- **Fix:** Moved clipboard mock to `beforeEach` using `Object.defineProperty` + scoped `vi.spyOn` within the B6 test itself
- **Files modified:** src/components/settings/portal-sites-section.test.tsx
- **Commit:** 14a7dad

## Known Stubs

None — PortalSitesSection is fully wired to real Server Actions. The portal URL display uses `window.location.origin` in browser context (correct for production).

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-05-15 | Section not rendered for technician/viewer (canManagePortals server-side gate) | Applied in Task 2 |
| T-05-16 | siteId validated in Server Actions (Plan 01) — defense-in-depth | Inherited from Plan 01 |

## Self-Check: PASSED

Files exist:
- src/components/settings/portal-sites-section.tsx: FOUND
- src/components/settings/portal-sites-section.test.tsx: FOUND
- src/app/(app)/parametres/organisation/page.tsx: FOUND (modified)

Commits exist:
- 14a7dad: FOUND (Task 1)
- a55d5b9: FOUND (Task 2)
