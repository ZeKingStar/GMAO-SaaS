---
phase: 09-maintenance-conditionnelle
plan: "02"
subsystem: maintenance-conditionnelle
tags: [cron, meter, tdd, idempotence, vercel, cond-02]
dependency_graph:
  requires: [generateWorkOrderFromPlanInternal, updateMeterAndPlans]
  provides: [meter-threshold-check-cron, generateWorkOrderFromPlanInternal]
  affects: [src/app/api/cron/meter-threshold-check/route.ts, src/actions/maintenance.ts, vercel.json]
tech_stack:
  added: []
  patterns: [cron-route-handler, tdd-red-green, internal-helper-no-auth, idempotence-guard]
key_files:
  created:
    - src/app/api/cron/meter-threshold-check/route.ts
    - src/app/api/cron/meter-threshold-check/route.test.ts
  modified:
    - src/actions/maintenance.ts
    - vercel.json
decisions:
  - "generateWorkOrderFromPlanInternal extrait comme helper pur (sans auth) — la Server Action publique devient un wrapper thin"
  - "Guard d'idempotence via db.workOrder.findFirst sur statuts open/in_progress/on_hold — prévient 1 BT/heure"
  - "nextMeterValue avancé à meter.value + meterThreshold après génération — pas de recalcul depuis 0"
  - "7 tests (6 comportements + 1 variante auth) — test 401 wrong-token ajouté comme déviation Rule 2"
metrics:
  duration: "~15 min"
  completed_date: "2026-05-29"
  tasks_completed: 3
  files_changed: 4
---

# Phase 09 Plan 02: Déclenchement automatique cron compteur (COND-02) Summary

Cron horaire Vercel `GET /api/cron/meter-threshold-check` qui compare `AssetMeter.value >= nextMeterValue` sur tous les plans `meter_based` actifs, génère un BT via `generateWorkOrderFromPlanInternal`, avance le seuil, et bloque les doublons par guard d'idempotence. 7 tests Vitest verts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor generateWorkOrderFromPlanInternal (sans auth) | 3a78d57 | src/actions/maintenance.ts |
| 2 RED | Tests Vitest cron (failing) | eee3aa6 | src/app/api/cron/meter-threshold-check/route.test.ts |
| 2 GREEN | Cron meter-threshold-check route | 2147739 | src/app/api/cron/meter-threshold-check/route.ts |
| 3 | Enregistrer le cron dans vercel.json | ca17b48 | vercel.json |

## What Was Built

**Helper `generateWorkOrderFromPlanInternal`** (`src/actions/maintenance.ts`) — Logique pure de création de BT sans dépendance `auth()`. Prend `planId` + `organizationId` en paramètres. La Server Action publique `generateWorkOrderFromPlan` est devenue un wrapper thin qui appelle `getOrgAndMembership()` puis délègue au helper.

**Cron `GET /api/cron/meter-threshold-check`** (`src/app/api/cron/meter-threshold-check/route.ts`) — Route Handler authentifiée par `Bearer ${CRON_SECRET}`. Boucle sur tous les plans `meter_based` actifs avec `assetId` et `nextMeterValue` non-null. Pour chaque plan :
1. Récupère `asset.meters[0]` — skip si absent
2. Compare `meter.value >= nextMeterValue` — skip si sous le seuil
3. Guard d'idempotence : `db.workOrder.findFirst` sur statuts `open/in_progress/on_hold` — skip si BT actif existe déjà
4. Appelle `generateWorkOrderFromPlanInternal(plan.id, plan.organizationId)`
5. Avance `nextMeterValue = meter.value + meterThreshold`

**Tests** (`route.test.ts`) — 7 tests Vitest : auth manquant (401), auth incorrect (401), détection (triggered=1), idempotence (triggered=0 si BT actif), sous-seuil (triggered=0), avancement seuil (db.update appelé avec valeur correcte), filtre sans compteur (triggered=0).

**vercel.json** — 3ème entrée cron ajoutée : `/api/cron/meter-threshold-check` à `0 * * * *`.

## Deviations from Plan

### Auto-ajout test supplémentaire (Rule 2 — sécurité)

**1. [Rule 2 - Security] Test 401 avec wrong-token ajouté**
- **Trouvé pendant :** Task 2 (écriture des tests)
- **Problème :** Le plan spécifiait 6 tests ; un test "Bearer absent" et un test "Bearer incorrect" sont deux cas distincts pour la validation de la sécurité auth (token manquant vs token erroné ne sont pas le même chemin de code)
- **Fix :** Ajout d'un 2ème test auth (`returns 401 when Bearer token is incorrect`) — résultat : 7 tests verts
- **Fichier :** src/app/api/cron/meter-threshold-check/route.test.ts

### Worktree bootstrap (Rule 3 — blocage résolu)

**2. [Rule 3 - Blocker] Fichiers manquants dans le worktree après git reset --soft**
- **Trouvé pendant :** Task 1 (début d'exécution)
- **Problème :** Le worktree était basé sur un commit antérieur (34e91d9) et le `git reset --soft` vers 3fc8ae5 a laissé les fichiers du repo non présents dans le working directory. `vitest.config.ts`, `src/generated/`, `src/lib/meter-utils.ts` et autres absents.
- **Fix :** `git checkout 3fc8ae50 -- vitest.config.ts vitest.setup.ts src/lib/meter-utils.ts` ; création d'un symlink `src/generated -> /home/deploy/gmao-saas/src/generated` ; récupération de `vercel.json` avant modification.
- **Impact :** Aucun changement fonctionnel — bootstrap worktree uniquement.

## Threat Mitigations Applied

| Threat ID | Mitigation | Location |
|-----------|-----------|----------|
| T-09-05 | `Bearer ${process.env.CRON_SECRET}` — 401 si absent/incorrect | route.ts:GET (lignes 10-14) |
| T-09-06 | `db.workOrder.findFirst({ status: { in: ['open','in_progress','on_hold'] } })` | route.ts:GET (guard idempotence) |
| T-09-07 | `assetId: { not: null }` dans la query findMany | route.ts:GET (filtre plans sans actif) |
| T-09-08 | Endpoint authentifié par CRON_SECRET — erreurs internes acceptables | route.ts — réponse JSON errors[] |

## Known Stubs

Aucun stub — le cron opère sur des données réelles Prisma.

## Threat Flags

Aucun nouveau surface de sécurité non prévu par le plan.

## Self-Check: PASSED

- [x] `src/actions/maintenance.ts` — exporte `generateWorkOrderFromPlanInternal`
- [x] `src/app/api/cron/meter-threshold-check/route.ts` — existe, exporte `GET`
- [x] `src/app/api/cron/meter-threshold-check/route.test.ts` — 7 tests verts
- [x] `vercel.json` — 3 crons, inclut `/api/cron/meter-threshold-check`
- [x] Commits 3a78d57, eee3aa6, 2147739, ca17b48 — vérifiés dans git log
