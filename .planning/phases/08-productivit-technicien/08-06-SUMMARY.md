---
phase: 08-productivit-technicien
plan: "06"
subsystem: ui-lists
tags: [sorting, ux, work-orders, maintenance, gap-closure]
dependency_graph:
  requires: [08-01, 08-02, 08-03]
  provides: [tri-colonnes-bt, tri-colonnes-plans, hover-filtre-distinct]
  affects: [work-order-list, maintenance-plan-list]
tech_stack:
  added: []
  patterns: [client-side-sort, useMemo-pipeline, SortHeader-local-component]
key_files:
  created: []
  modified:
    - src/components/work-orders/work-order-list.tsx
    - src/components/maintenance/maintenance-plan-list.tsx
decisions:
  - "Tri client-side via useMemo/fonction synchrone — suffisant pour MVP < 500 items"
  - "SortHeader défini localement dans chaque fichier (non exporté) — évite couplage inter-composants"
  - "hover:bg-accent hover:text-accent-foreground pour contraste intermédiaire distinct (Shadcn design system)"
metrics:
  duration_minutes: 12
  completed_date: "2026-05-27T18:03:41Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 08 Plan 06 : Tri par colonnes et hover amélioré — Summary

## One-liner

Tri client-side par colonnes (6 pour BT, 4 pour plans) via SortHeader local + useMemo, et correction du contraste hover des boutons de filtre avec `bg-accent`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | WorkOrderList — tri + hover | 879716d | src/components/work-orders/work-order-list.tsx |
| 2 | MaintenancePlanList — tri | 6e61d44 | src/components/maintenance/maintenance-plan-list.tsx |

## What Was Built

**Tâche 1 — WorkOrderList**

- Composant `SortHeader` local avec icônes `ChevronUp` / `ChevronDown` / `ChevronsUpDown` (lucide-react)
- Type `SortDir = 'asc' | 'desc'`
- États `sortKey` (défaut: `'number'`) et `sortDir` (défaut: `'desc'`) — tri initial par numéro décroissant (comportement Maximo)
- Fonction `handleSort` : inverse le sens si même colonne, sinon reset à `'asc'`
- Pipeline `filtered` migré vers `useMemo` avec tri sur 6 colonnes : `number`, `title`, `status`, `priority`, `dueDate`, `createdAt`
- Barre d'en-têtes `hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto]` affichée au-dessus de la liste si `filtered.length > 0`
- Hover des boutons de filtre : `hover:bg-accent hover:text-accent-foreground` (remplace `hover:bg-muted/80`)

**Tâche 2 — MaintenancePlanList**

- Même composant `SortHeader` et type `SortDir` définis localement avant `PlanCard`
- États `sortKey` (défaut: `'name'`) et `sortDir` (défaut: `'asc'`) — tri initial par nom croissant
- Fonction `sortPlans()` appliquée aux deux groupes (actifs et inactifs) indépendamment
- Tri sur 4 colonnes : `name`, `priority`, `nextDueAt`, `tasks`
- Barre d'en-têtes `hidden sm:flex gap-4` au-dessus des listes (visible uniquement si `plans.length > 0`)
- `PlanCard` non modifiée

## Verification Results

```
# 1. SortHeader dans les deux fichiers — 2/2
grep -l "SortHeader" work-order-list.tsx maintenance-plan-list.tsx → 2 fichiers

# 2. hover:bg-muted/80 absent
grep "hover:bg-muted/80" work-order-list.tsx → 0

# 3. TypeScript clean
npx tsc --noEmit | grep -E "work-order-list|maintenance-plan-list" → 0 erreur
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Import superflu] useMemo retiré de maintenance-plan-list.tsx**
- **Found during:** Tâche 2 verification
- **Issue:** `useMemo` importé mais non utilisé dans maintenance-plan-list.tsx (la fonction `sortPlans` est synchrone, pas besoin de mémoisation)
- **Fix:** Import retiré — `import { useState, useTransition }` sans `useMemo`
- **Files modified:** src/components/maintenance/maintenance-plan-list.tsx

### Pre-existing Issues (hors scope)

Les erreurs TS2719 dans `maintenance-plan-form-dialog.tsx` (conflit de types `PlanPart`/`SparePart` dupliqués) et dans `scripts/seed-package-pie.ts` préexistaient avant ce plan et sont hors scope.

## Known Stubs

Aucun stub — les en-têtes de tri sont entièrement fonctionnels avec données réelles.

## Threat Flags

Aucune nouvelle surface de sécurité introduite — tri 100% client-side, aucune requête serveur, aucune donnée ne quitte le navigateur.

## Self-Check

- [x] src/components/work-orders/work-order-list.tsx modifié avec SortHeader
- [x] src/components/maintenance/maintenance-plan-list.tsx modifié avec SortHeader
- [x] Commit 879716d existe
- [x] Commit 6e61d44 existe
- [x] TypeScript clean sur les deux fichiers modifiés

## Self-Check: PASSED
