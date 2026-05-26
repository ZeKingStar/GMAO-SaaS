---
phase: 07-analytique-de-fiabilit
plan: "01"
subsystem: work-orders / schema / report-utils
tags: [prisma, migration, schema, pcr, fault-code, report-utils, typescript]
dependency_graph:
  requires: []
  provides:
    - WorkOrder.faultProblem/faultCause/faultRemedy (DB + client)
    - src/lib/report-utils.ts (getPeriodStart, formatCurrency, isPeriod, PERIOD_LABELS)
    - WorkOrderFaultForm P/C/R (3 champs)
    - setWorkOrderFault updated signature
  affects:
    - Plans 02, 03, 04 (consomment getPeriodStart, faultProblem)
tech_stack:
  added: []
  patterns:
    - Formal Prisma migration (ALTER RENAME — preserve data, no db push)
    - TDD Red→Green for utility modules
key_files:
  created:
    - prisma/migrations/20260526000000_phase7_fault_pcr/migration.sql
    - src/lib/report-utils.ts
    - src/lib/report-utils.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/closure-requirements.ts
    - src/lib/closure-requirements.test.ts
    - src/actions/work-orders.ts
    - src/components/work-orders/work-order-fault-form.tsx
    - src/components/work-orders/work-order-detail.tsx
    - src/components/work-orders/work-order-closure-banner.tsx
decisions:
  - Formal migration (ALTER RENAME) chosen over db push to preserve existing faultDescription data
  - work-order-closure-banner.tsx local Input type updated in Task 7 (auto-fix Rule 1 — blocked tsc)
metrics:
  duration: "~15 minutes"
  completed: "2026-05-26"
  tasks_completed: 7
  tasks_total: 7
  files_created: 3
  files_modified: 7
---

# Phase 7 Plan 01: Migration P/C/R Schema + report-utils Summary

**One-liner:** Prisma schema migration renames faultDescription→faultProblem and adds faultCause/faultRemedy via formal ALTER RENAME SQL, with report-utils utility module for Plans 02-04.

## What Was Built

### Migration SQL appliquée

Fichier: `prisma/migrations/20260526000000_phase7_fault_pcr/migration.sql`

```sql
ALTER TABLE "WorkOrder" RENAME COLUMN "faultDescription" TO "faultProblem";
ALTER TABLE "WorkOrder" ADD COLUMN "faultCause" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "faultRemedy" TEXT;
```

Vérification: `npx prisma migrate status` → "Database schema is up to date!" (4 migrations applied)

### Exports de src/lib/report-utils.ts

```typescript
export const PERIOD_VALUES = ['month', '3m', '6m', 'year'] as const
export type Period = typeof PERIOD_VALUES[number]
export const PERIOD_LABELS: Record<Period, string>   // { month: 'Ce mois', '3m': '3 mois', ... }
export const DEFAULT_PERIOD: Period                  // 'month'

export function isPeriod(value: string | undefined | null): value is Period
export function getPeriodStart(period: Period): Date
export function formatCurrency(amount: number | null | undefined): string  // fr-CA / CAD
```

8 tests Vitest passent (RED→GREEN confirmé).

### Nouvelle signature de setWorkOrderFault

```typescript
export async function setWorkOrderFault(
  workOrderId: string,
  data: {
    faultCategory: string | null
    faultProblem: string | null
    faultCause: string | null
    faultRemedy: string | null
  }
): Promise<void>
```

Auth: préservé via `getOrgAndMembership()` + filtre `organizationId` sur le `db.workOrder.update`.

### Nouveaux props de WorkOrderFaultForm

```typescript
type Props = {
  workOrderId: string
  initialCategory: string | null
  initialProblem: string | null
  initialCause: string | null
  initialRemedy: string | null
  required: boolean
}
```

Formulaire affiche 4 champs: Catégorie (select) + Problème observé + Cause identifiée + Remède appliqué.

### Confirmation faultDescription absent

```
grep -rn "faultDescription" src/ --exclude-dir=generated
→ NONE FOUND
```

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (TDD) | 05cf06a | feat(07-01): create report-utils.ts — 8 tests GREEN |
| 2 | 5437208 | feat(07-01): rename faultDescription→faultProblem + add faultCause/faultRemedy in schema |
| 3 | 44d058b | feat(07-01): formal migration phase7_fault_pcr — RENAME + ADD COLUMN, regenerate client |
| 4 (TDD) | 7d9d042 | feat(07-01): rename faultDescription→faultProblem in closure-requirements + tests GREEN |
| 5 | 5f3b93d | feat(07-01): update setWorkOrderFault + validateClosure call in work-orders.ts |
| 6 | f1a0091 | feat(07-01): extend WorkOrderFaultForm with Cause + Remède fields (P/C/R) |
| 7 | b2b7b19 | feat(07-01): update work-order-detail + closure-banner callers for P/C/R fields |

## Verification Results

- `npx prisma migrate status` → Database schema is up to date! (4/4 migrations)
- `grep -q "faultProblem" src/generated/prisma/internal/class.ts` → exit 0
- `grep -q "faultDescription" src/generated/prisma/internal/class.ts` → exit 1 (not found — correct)
- `npx vitest run src/lib/report-utils.test.ts` → 8/8 passed
- `npx vitest run src/lib/closure-requirements.test.ts` → 9/9 passed
- `npx tsc --noEmit` → only pre-existing error in src/app/api/v1/work-orders/route.ts (unrelated — type: string vs WorkOrderType, exists before this plan)
- `grep -rn "faultDescription" src/ --exclude-dir=generated` → 0 lines

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] src/components/work-orders/work-order-closure-banner.tsx — local Input type used faultDescription**

- **Found during:** Task 7 (`npx tsc --noEmit`)
- **Issue:** `work-order-closure-banner.tsx` defines its own local `Input` type with `faultDescription: string | null`. Since `computeMissingForClosure()` delegates to `validateClosure()` which now expects `faultProblem`, this caused a TypeScript error that blocked compilation.
- **Fix:** Updated the local `Input` type: `faultDescription` → `faultProblem`
- **Files modified:** `src/components/work-orders/work-order-closure-banner.tsx`
- **Commit:** b2b7b19 (included in Task 7 commit)

## Known Stubs

None — all fields are wired to the database (Prisma migration applied, client regenerated, server action updated).

## Threat Flags

None — no new network endpoints or auth paths introduced. The existing `getOrgAndMembership()` auth check and `organizationId` filter are preserved in the updated `setWorkOrderFault`.

## Self-Check: PASSED

| Item | Result |
|------|--------|
| src/lib/report-utils.ts | FOUND |
| src/lib/report-utils.test.ts | FOUND |
| prisma/migrations/20260526000000_phase7_fault_pcr/migration.sql | FOUND |
| .planning/phases/07-analytique-de-fiabilit/07-01-SUMMARY.md | FOUND |
| commit 05cf06a (report-utils) | FOUND |
| commit 5437208 (schema) | FOUND |
| commit 44d058b (migration) | FOUND |
| commit 7d9d042 (closure-requirements) | FOUND |
| commit 5f3b93d (work-orders action) | FOUND |
| commit f1a0091 (fault-form) | FOUND |
| commit b2b7b19 (detail + banner) | FOUND |
