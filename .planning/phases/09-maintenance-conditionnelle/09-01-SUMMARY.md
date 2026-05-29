---
phase: 09-maintenance-conditionnelle
plan: "01"
subsystem: maintenance-conditionnelle
tags: [meter, asset, server-action, tdd, cond-01]
dependency_graph:
  requires: []
  provides: [updateMeterAndPlans, recordMeterReadingOnAsset, AssetMeterSection]
  affects: [src/app/(app)/actifs/page.tsx, src/components/assets/asset-list.tsx]
tech_stack:
  added: []
  patterns: [server-action, tdd-red-green, org-scoped-query]
key_files:
  created:
    - src/lib/meter-utils.ts
    - src/lib/meter-utils.test.ts
    - src/components/assets/asset-meter-section.tsx
    - vitest.config.ts
    - vitest.setup.ts
  modified:
    - src/actions/work-orders.ts
    - src/components/assets/asset-list.tsx
    - src/app/(app)/actifs/page.tsx
decisions:
  - "AssetMeterSection intégré dans la cellule nom du tableau asset-list (pattern le plus simple, pas de modal supplémentaire)"
  - "vitest.config.ts ajouté au worktree pour exécution des tests isolée du repo principal"
  - "meters[0] utilisé : un actif a typiquement un seul compteur principal (même pattern que WorkOrderMeterReading)"
metrics:
  duration: "~15 min"
  completed_date: "2026-05-29"
  tasks_completed: 3
  files_changed: 8
---

# Phase 09 Plan 01: Saisie directe de relevé compteur (COND-01) Summary

Saisie directe de relevé compteur sur actif via helper `updateMeterAndPlans` centralisé, Server Action sécurisée `recordMeterReadingOnAsset`, et composant `AssetMeterSection` intégré dans `/actifs`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Helper updateMeterAndPlans + tests Vitest (RED→GREEN) | 352b5a8 | src/lib/meter-utils.ts, src/lib/meter-utils.test.ts |
| 2 | Server Action recordMeterReadingOnAsset | 089e107 | src/actions/work-orders.ts |
| 3 | Composant AssetMeterSection + intégration page /actifs | 8dc6b97 | src/components/assets/asset-meter-section.tsx, asset-list.tsx, actifs/page.tsx |

## What Was Built

**Helper `updateMeterAndPlans`** (`src/lib/meter-utils.ts`) — Centralise la logique : mise à jour de `AssetMeter.value` + recalcul de `nextMeterValue` pour tous les plans `meter_based` liés. Prêt à être réutilisé par le plan 09-02 (cron de déclenchement).

**Server Action `recordMeterReadingOnAsset`** (`src/actions/work-orders.ts`) — Valide la saisie (`Number.isFinite`, `>= 0`), scope l'actif par `organizationId` (protection cross-org), délègue au helper, revalide `/actifs` et `/maintenance`.

**Composant `AssetMeterSection`** (`src/components/assets/asset-meter-section.tsx`) — Composant client : affiche valeur courante + unité dynamique (`meter.unit`), Input numérique, Button avec feedback toast (sonner). Intégré dans chaque ligne du tableau des actifs lorsque `meters.length > 0`.

**Intégration `/actifs`** — Query Prisma étendue avec `meters: true`, AssetMeterSection rendu inline dans `AssetList`.

## Deviations from Plan

### Infrastructure ajoutée (Rule 3 — Blocage résolu)

**vitest.config.ts + vitest.setup.ts ajoutés au worktree**
- **Trouvé pendant :** Task 1 (TDD RED)
- **Problème :** Le worktree git isolé n'a pas de `node_modules/` propres ni de `vitest.config.ts`. Les tests ne pouvaient pas s'exécuter depuis le worktree.
- **Correction :** Création d'un `vitest.config.ts` dans le worktree pointant vers `@` = `./src` du worktree, et copie du `vitest.setup.ts` du repo principal.
- **Impact :** Aucun changement fonctionnel — infra de test worktree uniquement.

### Aucune autre déviation — plan exécuté tel qu'écrit.

## Threat Mitigations Applied

| Threat ID | Mitigation | Location |
|-----------|-----------|----------|
| T-09-01 | `db.asset.findFirst({ where: { id: assetId, organizationId } })` avant écriture | work-orders.ts:recordMeterReadingOnAsset |
| T-09-02 | `Number.isFinite(reading) && reading >= 0` | work-orders.ts:recordMeterReadingOnAsset |
| T-09-03 | `getOrgAndMembership()` en première ligne | work-orders.ts:recordMeterReadingOnAsset |
| T-09-04 | Message générique "Actif introuvable" | work-orders.ts:recordMeterReadingOnAsset |

## Known Stubs

Aucun stub — toutes les données sont dynamiques (valeur compteur depuis DB, unité depuis `meter.unit`).

## Threat Flags

Aucun nouveau surface de sécurité non prévu par le plan.

## Self-Check: PASSED

- [x] `src/lib/meter-utils.ts` — existe, exporte `updateMeterAndPlans`
- [x] `src/lib/meter-utils.test.ts` — existe, 4 tests verts
- [x] `src/actions/work-orders.ts` — exporte `recordMeterReadingOnAsset`
- [x] `src/components/assets/asset-meter-section.tsx` — existe, `'use client'`
- [x] `src/app/(app)/actifs/page.tsx` — contient `meters: true`
- [x] Commits 352b5a8, 089e107, 8dc6b97 — vérifiés dans git log
