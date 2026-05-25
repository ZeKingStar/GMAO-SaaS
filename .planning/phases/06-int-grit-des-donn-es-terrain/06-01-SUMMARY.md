---
phase: 06
plan: 01
subsystem: terrain-data-integrity
tags: [prisma, schema, server-actions, timer, work-orders, settings, tdd]
dependency_graph:
  requires: []
  provides:
    - WorkOrderPart model (schema + Prisma client)
    - validateClosure helper (src/lib/closure-requirements.ts)
    - startTimer / stopTimer / closeActiveTimer server actions
    - upsertWorkOrderPart / deleteWorkOrderPart server actions
    - setWorkOrderFault server action
    - updateWorkOrderStatus with closure validation
    - updateClosureRequirements admin action
    - updateMemberHourlyRate admin action
  affects:
    - prisma/schema.prisma
    - src/generated/prisma/ (régénéré)
    - src/actions/work-orders.ts
    - src/actions/settings.ts
tech_stack:
  added: []
  patterns:
    - TDD Red/Green pour validateClosure (vitest)
    - Transaction Prisma pour décrément stock + création WorkOrderPart
    - parseClosureRequirements() pour safe-parse d'un champ Json?
    - getAdminOrg() guard pour actions admin (admin|manager only)
key_files:
  created:
    - src/lib/closure-requirements.ts
    - src/lib/closure-requirements.test.ts
  modified:
    - prisma/schema.prisma
    - src/actions/work-orders.ts
    - src/actions/settings.ts
decisions:
  - "WorkOrderPart.sparePartId est nullable avec onDelete: SetNull — pièce libre supportée sans inventaire"
  - "Décrément stock dans transaction Prisma uniquement à la création (pas à l'update — compromis simplicité Phase 6)"
  - "parseClosureRequirements() fallback aux defaults si Json malformé (T-06-10)"
  - "hourlyRate borné [0, 10000] côté serveur (T-06-04)"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-05-25T17:52:08Z"
  tasks_completed: 5
  tasks_total: 5
  files_created: 2
  files_modified: 3
---

# Phase 06 Plan 01: Fondation intégrité données terrain — Summary

**One-liner:** Schema Prisma étendu (WorkOrderPart + faultCategory/Description + closureRequirements + hourlyRate), client régénéré, helper validateClosure TDD (9 tests), et 9 Server Actions métier (timer/pièces/fault/clôture/config admin).

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Étendre prisma/schema.prisma | d146cd5 | prisma/schema.prisma |
| 2 | Pousser schema + régénérer client Prisma | 87c25d2 | prisma/schema.prisma (formaté), src/generated/prisma/ (non tracké) |
| 3 | Créer closure-requirements.ts (TDD) | f2fb4b2 | src/lib/closure-requirements.ts, src/lib/closure-requirements.test.ts |
| 4 | Étendre work-orders.ts (timer, pièces, fault, validation) | afc471b | src/actions/work-orders.ts |
| 5 | Ajouter actions admin dans settings.ts | 1fd476f | src/actions/settings.ts |

## What Was Built

### Schema Extensions (prisma/schema.prisma)
- `WorkOrder.faultCategory String?` — catégorie de panne (mécanique/électrique/hydraulique/autre)
- `WorkOrder.faultDescription String?` — description libre de la panne
- `WorkOrder.parts WorkOrderPart[]` — relation vers les pièces utilisées
- `Membership.hourlyRate Float?` — taux horaire par technicien (TERRAIN-02)
- `Organization.closureRequirements Json?` — config exigences de clôture (TERRAIN-01)
- Nouveau modèle `WorkOrderPart` : id, workOrderId, sparePartId?, name, quantity, unitCost?, timestamps
- Relation inverse `SparePart.workOrderParts WorkOrderPart[]`

### Helper de validation (src/lib/closure-requirements.ts)
- `validateClosure(input, req)` : retourne les codes manquants `['faultCode','timeSpent','partsUsed']`
- `parseClosureRequirements(raw)` : safe-parse du champ Json avec fallback aux defaults
- Types exportés : `ClosureRequirements`, `ClosureCheckInput`, `FaultCategory`
- Constantes : `DEFAULT_CLOSURE_REQUIREMENTS`, `FAULT_CATEGORIES`, `FAULT_CATEGORY_LABELS`, `CLOSURE_FIELD_LABELS`

### Server Actions métier (src/actions/work-orders.ts)
- `updateWorkOrderStatus` : validation closureRequirements côté serveur avant resolved/closed
- `setWorkOrderFault` : enregistre faultCategory + faultDescription sur un BT
- `startTimer` : crée WorkOrderTimeLog avec endedAt=null, refuse si session déjà active
- `stopTimer` : ferme la session du membre courant, calcule minutes
- `closeActiveTimer` : admin/manager peut clore une session d'un autre membre (T-06-07)
- `upsertWorkOrderPart` : create (transaction avec décrément stock) ou update
- `deleteWorkOrderPart` : supprime une pièce, scoped par org

### Server Actions admin (src/actions/settings.ts)
- `updateClosureRequirements` : sauvegarde les 3 bools sur Organization, coercion défensive
- `updateMemberHourlyRate` : sauvegarde taux horaire, validé [0, 10000]

## Threat Model Applied

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-06-01 | mitigate | `sparePart.findFirst({where:{id, organizationId}})` avant link |
| T-06-02 | mitigate | Validation `validateClosure()` 100% côté serveur, lit closureRequirements depuis DB |
| T-06-03 | mitigate | `getAdminOrg()` vérifie role admin|manager |
| T-06-04 | mitigate | Validation `0 <= hourlyRate <= 10000` dans `updateMemberHourlyRate` |
| T-06-05 | mitigate | `Number.isFinite(quantity) && quantity > 0` dans `upsertWorkOrderPart` |
| T-06-06 | mitigate | `findFirst({where:{id, membershipId, endedAt:null}})` dans `stopTimer` |
| T-06-07 | mitigate | Check explicite `role === admin || role === manager` dans `closeActiveTimer` |
| T-06-08 | accept | Rate-limit implicite Vercel ; risque faible (tech interne authentifié) |
| T-06-09 | accept | Pas d'audit log Phase 6 ; Phase 7 analytique |
| T-06-10 | mitigate | `parseClosureRequirements()` valide les 3 clés bools avec fallback |

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit.

Note: Une erreur TypeScript préexistante existe dans `src/app/api/v1/work-orders/route.ts` (type `string` au lieu de `WorkOrderType`) — hors du périmètre de ce plan, non introduite par ces changements. Consignée dans les items différés.

## Known Stubs

None — toutes les Server Actions sont fonctionnelles avec logique métier complète.

## Threat Flags

None — aucune surface de sécurité non couverte par le threat model.

## Self-Check: PASSED

- [x] `src/lib/closure-requirements.ts` — EXISTS
- [x] `src/lib/closure-requirements.test.ts` — EXISTS
- [x] `src/actions/work-orders.ts` — EXISTS (modifié)
- [x] `src/actions/settings.ts` — EXISTS (modifié)
- [x] Commit d146cd5 — schema.prisma étendu
- [x] Commit 87c25d2 — schema poussé + client régénéré
- [x] Commit f2fb4b2 — closure-requirements (9 tests verts)
- [x] Commit afc471b — work-orders.ts étendu
- [x] Commit 1fd476f — settings.ts étendu
- [x] `npx prisma validate` — exit code 0
- [x] `npx vitest run src/lib/closure-requirements.test.ts` — 9/9 passed
- [x] Aucune erreur TS dans `src/actions/work-orders.ts` ou `src/actions/settings.ts`
