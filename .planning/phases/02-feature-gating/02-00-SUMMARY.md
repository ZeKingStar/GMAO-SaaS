---
phase: 02-feature-gating
plan: "00"
subsystem: test-infrastructure
tags: [vitest, testing-library, tdd, red-state, feature-gating]
dependency_graph:
  requires: []
  provides: [vitest-config, auth-test-stubs, upgrade-gate-test-stubs]
  affects: [02-01, 02-02]
tech_stack:
  added:
    - "@testing-library/react ^14"
    - "@testing-library/jest-dom ^6"
    - "@testing-library/dom ^10"
  patterns:
    - vitest with jsdom environment
    - globals: true (no per-file imports for describe/it/expect)
    - vi.mock() for module-level mocking of @/lib/auth
key_files:
  created:
    - vitest.config.ts
    - vitest.setup.ts
    - src/lib/auth.test.ts
    - src/components/upgrade-gate/upgrade-gate.test.tsx
  modified:
    - package.json (devDependencies)
    - package-lock.json
decisions:
  - "@testing-library/jest-dom used for toBeInTheDocument/toHaveClass matchers via setupFiles"
  - "globals: true avoids per-file describe/it/expect imports — consistent with plan spec"
  - "@/ alias resolved via path.resolve in vitest.config.ts (not vite-tsconfig-paths) per plan action"
  - "Both test stubs correctly in RED state — import errors confirm production code absent"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 2
requirements_covered:
  - GATE-01
  - GATE-02
---

# Phase 02 Plan 00: Test Infrastructure (Vitest + RTL) Summary

**One-liner:** vitest 4.1.6 + React Testing Library installed with jsdom environment; 9 RED requirePlan() unit stubs and 6 RED UpgradeGate RTL stubs ready for Wave 1 green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install vitest + RTL and create vitest.config.ts | 37d41a4 | vitest.config.ts, vitest.setup.ts, package.json, package-lock.json |
| 2 | Create test stubs (RED state) for requirePlan and UpgradeGate | 4e6b842 | src/lib/auth.test.ts, src/components/upgrade-gate/upgrade-gate.test.tsx |

## What Was Built

**Task 1 — Test infrastructure:**
- `vitest.config.ts`: jsdom environment, globals=true, setupFiles=./vitest.setup.ts, include=src/**/*.test.{ts,tsx}
- `vitest.setup.ts`: imports @testing-library/jest-dom for RTL matchers
- Installed: @testing-library/react, @testing-library/jest-dom, @testing-library/dom (jsdom was already present)
- Note: vitest 4.1.6 and @vitejs/plugin-react were already in devDependencies — only RTL packages were missing

**Task 2 — RED-state test stubs:**
- `src/lib/auth.test.ts`: 9 test cases covering requirePlan() GATE-01 behaviours
  - starter active → hasAccess: false
  - growth active → hasAccess: true
  - growth trialing → hasAccess: true (trialing is an active status)
  - growth past_due → hasAccess: false (degrades to starter)
  - growth canceled → hasAccess: false (degrades to starter)
  - growth unpaid → hasAccess: false (degrades to starter)
  - null subscription → hasAccess: false (starter)
  - null membership → throws 'Unauthorized'
  - enterprise active → hasAccess: true
- `src/components/upgrade-gate/upgrade-gate.test.tsx`: 6 test cases covering UpgradeGate render GATE-02 behaviours

## Verification Results

`npx vitest run` output:
- Test Files: 2 failed (2) — CORRECT RED state
- Tests: 9 failed (9)
- auth.test.ts: fails because requirePlan() not yet exported from @/lib/auth
- upgrade-gate.test.tsx: fails with "Failed to resolve import @/components/upgrade-gate/upgrade-gate"

Both failures are expected RED-state import errors confirming production code does not yet exist.

## Deviations from Plan

None — plan executed exactly as written.

Minor observation: vitest and @vitejs/plugin-react were already present in devDependencies (version 4.1.6 and ^6.0.2). The npm install only added the missing @testing-library/* packages.

## Known Stubs

All files in this plan are intentional test stubs in RED state. They exist to define expected behaviours. No production stubs were created.

## Threat Flags

None — this plan creates test-only infrastructure with no production surface area.

## Self-Check: PASSED

- [x] vitest.config.ts exists: FOUND
- [x] vitest.setup.ts exists: FOUND
- [x] src/lib/auth.test.ts exists: FOUND
- [x] src/components/upgrade-gate/upgrade-gate.test.tsx exists: FOUND
- [x] Commit 37d41a4 exists: FOUND (chore(02-00): install vitest + RTL and create vitest.config.ts)
- [x] Commit 4e6b842 exists: FOUND (test(02-00): create RED-state stubs for requirePlan and UpgradeGate)
- [x] vitest run finds 2 test files with 9 tests (all RED): CONFIRMED
