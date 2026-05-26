---
phase: 07-analytique-de-fiabilit
plan: "03"
subsystem: rapports
tags: [analytics, mttr, cost, fiabilite, prisma, server-component]
dependency_graph:
  requires: [07-02]
  provides: [FIAB-02, FIAB-03]
  affects: [src/app/(app)/rapports/page.tsx]
tech_stack:
  added: []
  patterns: [server-component-async, prisma-findMany-select, js-aggregation-by-key, promise-all-parallel]
key_files:
  created:
    - src/components/rapports/mttr-tab.tsx
    - src/components/rapports/cost-tab.tsx
  modified:
    - src/app/(app)/rapports/page.tsx
decisions:
  - "JS aggregation in-memory (not Prisma groupBy) for MTTR — timeLogs.minutes must be summed across relations, groupBy cannot traverse nested relations"
  - "Promise.all for CostTab two queries — parts and timeLogs are independent, parallel fetch reduces latency"
  - "hasMissingRate flag — null hourlyRate counted as 0 but flagged per asset so managers see data quality warning"
  - "Top 20 slice on both tabs — caps memory and render time per Hypothesis A3 (<10k BTs per org)"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-26"
  tasks_completed: 3
  files_created: 2
  files_modified: 1
requirements: [FIAB-02, FIAB-03]
---

# Phase 7 Plan 03: MTTR + Coût actifs (FIAB-02, FIAB-03) Summary

One-liner: Server Components MttrTab and CostTab with real Prisma data wired into /rapports tabs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer MttrTab (FIAB-02) | 13a035a | src/components/rapports/mttr-tab.tsx |
| 2 | Créer CostTab (FIAB-03) | da691ae | src/components/rapports/cost-tab.tsx |
| 3 | Câbler dans rapports/page.tsx | 44f766d | src/app/(app)/rapports/page.tsx |

## Prisma Queries

### MttrTab — Requête exacte (Task 1)

```typescript
const orders = await db.workOrder.findMany({
  where: {
    organizationId: orgId,        // multi-tenancy strict
    type: 'corrective',           // FIAB-02: BTs correctifs uniquement
    assetId: { not: null },       // exclure BTs sans actif
    completedAt: { gte: periodStart }, // fenêtre temporelle
    timeLogs: { some: { minutes: { not: null } } }, // exclure BTs sans temps loggé
  },
  select: {
    assetId: true,
    asset: { select: { id: true, name: true } },
    timeLogs: { select: { minutes: true } },
  },
})
```

Agrégation JS post-requête par `assetId` : `totalMinutes / btCount / 60 = mttrHours`. Tri décroissant, `.slice(0, 20)`.

### CostTab — Deux requêtes parallèles (Task 2)

```typescript
const [parts, timeLogs] = await Promise.all([
  db.workOrderPart.findMany({
    where: {
      workOrder: {
        organizationId: orgId,
        assetId: { not: null },
        completedAt: { gte: periodStart },
      },
    },
    select: {
      quantity: true,
      unitCost: true,
      workOrder: { select: { assetId: true, asset: { select: { name: true } } } },
    },
  }),
  db.workOrderTimeLog.findMany({
    where: {
      minutes: { not: null },
      workOrder: {
        organizationId: orgId,
        assetId: { not: null },
        completedAt: { gte: periodStart },
      },
    },
    select: {
      minutes: true,
      membership: { select: { hourlyRate: true } },
      workOrder: { select: { assetId: true, asset: { select: { name: true } } } },
    },
  }),
])
```

- Coût pièces : `(unitCost ?? 0) * quantity`
- Coût MO : `(rate ?? 0) * (minutes / 60)`

## Comportement du flag hasMissingRate

`hasMissingRate` est mis à `true` sur une entrée d'actif quand au moins un `WorkOrderTimeLog` sur cet actif a `minutes > 0` ET `membership.hourlyRate == null`. Dans ce cas :

1. La MO de ce log est comptée à 0 $ (pas de données perdues, mais données incomplètes signalées)
2. La ligne de l'actif dans la table affiche un badge "taux manquant"
3. Si au moins un actif dans le top 20 a ce flag, un banner d'alerte amber s'affiche en haut du tab avec un lien vers Paramètres > Équipe

Ce comportement satisfait T-07-03-01 : `hourlyRate` individuel jamais rendu — seul le coût agrégé `laborCost` par actif est affiché.

## Confirmation Plan 04

Le `<TabsContent value="planned-vs-real">` dans `src/app/(app)/rapports/page.tsx` contient toujours le placeholder :

```tsx
<Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
  Rapport Planifié vs Réel — disponible après livraison Plan 04
</CardContent></Card>
```

Plan 04 doit remplacer UNIQUEMENT ce bloc. Les imports `Card` et `CardContent` resteront nécessaires jusqu'à ce que Plan 04 remplace ce dernier placeholder.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both MttrTab and CostTab query real Prisma data. The `planned-vs-real` tab placeholder is intentional and documented — it will be resolved by Plan 04.

## Threat Flags

None. All trust boundaries from the threat model are respected:
- `organizationId: orgId` filter present on every `findMany` (T-07-03-02)
- `period` validated upstream by `isPeriod()` before reaching these components (T-07-03-03)
- `hourlyRate` never rendered individually — only aggregated `laborCost` per asset (T-07-03-01)
- `requirePlan(['growth', 'enterprise'])` inherited from Plan 02 page wrapper (T-07-03-05)

## Self-Check: PASSED

Files exist:
- src/components/rapports/mttr-tab.tsx — FOUND
- src/components/rapports/cost-tab.tsx — FOUND
- src/app/(app)/rapports/page.tsx — FOUND (modified)

Commits exist:
- 13a035a feat(07-03): créer MttrTab — FOUND
- da691ae feat(07-03): créer CostTab — FOUND
- 44f766d feat(07-03): câbler dans rapports/page.tsx — FOUND
