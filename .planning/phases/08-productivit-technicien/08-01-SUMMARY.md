---
phase: 08-productivit-technicien
plan: "01"
subsystem: backend-foundation
tags: [prisma, server-actions, escalation, checklist, maintenance]
dependency_graph:
  requires: []
  provides:
    - EscalationConfig type + parseEscalationConfig helper
    - generateWorkOrderFromPlan server action
    - addPlanPart / deletePlanPart server actions
    - toggleChecklistItem / setChecklistMeasure server actions
    - updateEscalationConfig server action
    - WorkOrderChecklistItem DB table
    - MaintenancePlanPart DB table
    - WorkOrder.maintenancePlanId + escalationSentAt columns
    - Organization.escalationConfig column
  affects:
    - Plan 08-02 (UI job plans + checklists)
    - Plan 08-03 (cron escalade + UI config)
tech_stack:
  added: []
  patterns:
    - parseEscalationConfig follows closure-requirements.ts patron exactly
    - Server Actions use org-scoped findFirst before any mutation (T-08-01, T-08-02)
    - EscalationConfig stored as Json? in Organization (same as closureRequirements)
key_files:
  created:
    - src/lib/escalation-config.ts
    - src/lib/escalation-config.test.ts
  modified:
    - prisma/schema.prisma
    - src/actions/maintenance.ts
    - src/actions/work-orders.ts
    - src/actions/settings.ts
decisions:
  - "generateWorkOrderFromPlan uses direct db.workOrder.create (not upsertWorkOrderPart) to avoid stock decrement on plan-based parts"
  - "escalationSentAt added on WorkOrder for cron idempotence (prevents repeated emails per hour)"
  - "delayHours validated in ]0, 168] server-side regardless of UI input"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-27"
  tasks_completed: 6
  tasks_total: 6
  files_created: 2
  files_modified: 4
---

# Phase 8 Plan 01: Fondations Phase 8 — Schéma, Types, Server Actions

**One-liner:** Prisma schema étendu (2 nouveaux modèles + 3 nouvelles colonnes), module `escalation-config` typé avec 9 tests Vitest, et 6 Server Actions exportées (génération BT depuis PM, manipulation checklist, config escalade admin).

## Tables et champs ajoutés

### Nouveaux modèles

| Modèle | Colonnes clés | Relations |
|--------|--------------|-----------|
| `MaintenancePlanPart` | id, maintenancePlanId, sparePartId?, name, quantity | → MaintenancePlan (Cascade), → SparePart? (SetNull) |
| `WorkOrderChecklistItem` | id, workOrderId, order, description, checked, checkedAt?, measureValue?, photoUrl? | → WorkOrder (Cascade) |

### Nouvelles colonnes sur modèles existants

| Modèle | Colonne | Type | Usage |
|--------|---------|------|-------|
| `Organization` | `escalationConfig` | `Json?` | Config escalade `{ enabled, delayHours }` |
| `WorkOrder` | `maintenancePlanId` | `String?` | Traçabilité origine PM |
| `WorkOrder` | `escalationSentAt` | `DateTime?` | Idempotence cron escalade |

### Nouveaux index

- `WorkOrder @@index([maintenancePlanId])`
- `WorkOrder @@index([priority, status, escalationSentAt])` — filtre cron escalade
- `MaintenancePlanPart @@index([maintenancePlanId])`, `@@index([sparePartId])`
- `WorkOrderChecklistItem @@index([workOrderId])`

## Nouvelles Server Actions exportées

| Fichier | Fonction | Signature | Guard |
|---------|----------|-----------|-------|
| `src/actions/maintenance.ts` | `generateWorkOrderFromPlan` | `(planId: string) → { id, number }` | org membre |
| `src/actions/maintenance.ts` | `addPlanPart` | `(planId, { sparePartId?, name, quantity }) → void` | org membre |
| `src/actions/maintenance.ts` | `deletePlanPart` | `(partId: string) → void` | org membre + org-scoped |
| `src/actions/work-orders.ts` | `toggleChecklistItem` | `(itemId, checked: boolean) → void` | org membre + org-scoped |
| `src/actions/work-orders.ts` | `setChecklistMeasure` | `(itemId, measureValue: string|null) → void` | org membre + org-scoped |
| `src/actions/settings.ts` | `updateEscalationConfig` | `(cfg: EscalationConfig) → void` | admin|manager |

## Contrat EscalationConfig

```typescript
type EscalationConfig = {
  enabled: boolean   // défaut: false
  delayHours: number // défaut: 4, plage valide: ]0, 168]
}

const DEFAULT_ESCALATION_CONFIG = { enabled: false, delayHours: 4 }

// Coerces strict — valeurs invalides → défauts, jamais throw
parseEscalationConfig(unknown): EscalationConfig
```

Patron identique à `parseClosureRequirements` — lecture sécurisée depuis `Organization.escalationConfig` (Json Prisma).

## Résultats de vérification

- `npx vitest run src/lib/escalation-config.test.ts` — 9/9 tests passants
- `npx prisma validate` — schéma valide
- `npx prisma db push` — base de données synchronisée
- `npx tsc --noEmit` — 0 erreur nouvelle sur les fichiers modifiés (1 erreur pré-existante sur `work-order-detail.tsx` hors scope)
- `src/generated/prisma/models/WorkOrderChecklistItem.ts` — présent
- `src/generated/prisma/models/MaintenancePlanPart.ts` — présent

## Points de friction pour Plans 08-02 et 08-03

1. **Erreur TS pré-existante** : `src/components/work-orders/work-order-detail.tsx` ligne 364 — `Property 'status' does not exist on type Props` — présente avant ce plan, hors scope. À corriger si le Plan 08-02 touche ce composant.

2. **photoUrl non câblé** : `WorkOrderChecklistItem.photoUrl` est dans le schéma mais aucune UI de capture photo n'est prévue en Phase 8. Le champ existe pour extension future.

3. **generateWorkOrderFromPlan — pas de décompte stock** : Les `WorkOrderPart` créés depuis le job plan utilisent `db.workOrder.create` directement (pas `upsertWorkOrderPart`), donc aucun décompte de stock. Le technicien confirme les pièces à l'exécution (comportement Phase 6 préservé).

4. **Env .env symlink** : Le worktree n'avait pas de fichier `.env`. Un symlink vers `/home/deploy/gmao-saas/.env` a été créé pour `prisma db push`. À noter pour les futurs worktrees.

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit. La seule action non planifiée est la création du symlink `.env` (Rule 3 — correction d'un blocage technique sans impact sur le code).

## Self-Check: PASSED
