---
phase: 07-analytique-de-fiabilit
plan: 02
subsystem: rapports
tags: [tabs, period-selector, top-faults, fiab-01, server-component, client-component]
dependency_graph:
  requires: [07-01]
  provides: [rapports-tabs-structure, period-selector, top-faults-tab, overview-tab]
  affects: [07-03, 07-04]
tech_stack:
  added: [base-ui/select, select.tsx]
  patterns: [searchParams-await, groupBy-prisma, render-prop-tabs, useTransition-router-push]
key_files:
  created:
    - src/components/rapports/period-selector.tsx
    - src/components/rapports/overview-tab.tsx
    - src/components/rapports/top-faults-tab.tsx
    - src/components/ui/select.tsx
  modified:
    - src/app/(app)/rapports/page.tsx
decisions:
  - "Tabs navigation via render prop <a href> sur TabsTrigger (base-ui 1.4.1 supporte render dans BaseUIComponentProps) — pas de Client Component wrapper"
  - "PeriodSelector source de vérité = URL ; prop value vient du serveur ; useTransition pour optimistic UI pending"
  - "TopFaultsTab orderBy _count.faultProblem (Prisma ne supporte pas _all dans groupBy orderBy) — sémantiquement équivalent car faultProblem est l'agrégat principal"
  - "select.tsx créé avec base-ui/select — composant manquant du projet (Rule 3 auto-fix)"
metrics:
  duration_minutes: 25
  completed_date: "2026-05-26"
  tasks_completed: 4
  tasks_total: 4
  files_created: 4
  files_modified: 1
---

# Phase 7 Plan 02: Page Rapports — Tabs + Sélecteur Période + Top Pannes Summary

Navigation tabs (5 onglets) avec sélecteur de période URL-driven et rapport Top pannes récurrentes (FIAB-01) groupé par faultProblem + faultCategory via Prisma groupBy.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer PeriodSelector (Client Component) | d7c0a19 | src/components/rapports/period-selector.tsx |
| 2 | Extraire OverviewTab depuis page.tsx actuel | 1a023ef | src/components/rapports/overview-tab.tsx |
| 3 | Créer TopFaultsTab (FIAB-01) | 833c9e1 | src/components/rapports/top-faults-tab.tsx |
| 4 | Refondre src/app/(app)/rapports/page.tsx avec Tabs + searchParams | 43747c8 | src/app/(app)/rapports/page.tsx, src/components/ui/select.tsx |

## Architecture Decisions

### Structure Tabs

Variant `default` (bg-muted pill style). Navigation par `render={<a href="?tab=...">}` sur chaque `TabsTrigger` — base-ui 1.4.1 expose le prop `render` via `BaseUIComponentProps`. Ceci permet la navigation server-side sans Client Component wrapper : clic sur un tab déclenche une navigation HTTP normale, le serveur ré-évalue `searchParams`, et les Server Components (`OverviewTab`, `TopFaultsTab`) sont ré-rendus avec les nouvelles données.

Le `defaultValue={tab}` sur `<Tabs>` initialise l'état client à la valeur lue depuis les searchParams côté serveur — pas de flash de contenu.

### PeriodSelector

- `'use client'` — seul composant client de ce plan
- Source de vérité : URL (`?period=`)
- Prop `value: Period` reçue depuis le serveur (searchParams validés via `isPeriod()`)
- `useTransition` pour état pending pendant la navigation
- `onChange(next: string | null)` : supprime `?period=` si `next === DEFAULT_PERIOD` (mois courant = défaut propre)
- `router.push` via Next.js 16 App Router

### Requête Prisma TopFaultsTab

```typescript
db.workOrder.groupBy({
  by: ['faultProblem', 'faultCategory'],
  where: {
    organizationId: orgId,
    faultProblem: { not: null },
    completedAt: { gte: getPeriodStart(period) },
  },
  _count: { faultProblem: true },
  orderBy: { _count: { faultProblem: 'desc' } },
  take: 10,
})
```

Note: `_count._all` n'est pas supporté dans `orderBy` de `groupBy` Prisma — utilisation de `_count.faultProblem` (sémantiquement équivalent car les enregistrements groupés ont toujours un `faultProblem` non-null par le filtre `where`).

### Contrats consommés par Plans 03 et 04

**OverviewTab** — Server Component prêt pour extension :
```typescript
type Props = { orgId: string }
export async function OverviewTab({ orgId }: Props)
```

**TopFaultsTab** — Server Component FIAB-01 :
```typescript
type Props = { orgId: string; period: Period }
export async function TopFaultsTab({ orgId, period }: Props)
```

Les Plans 03 (MTTR/Coût) et 04 (Planifié vs Réel) remplaceront les placeholders dans les `TabsContent` correspondants en ajoutant leurs propres Server Components avec la même signature `{ orgId, period }`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Créé select.tsx manquant dans src/components/ui/**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** `src/components/rapports/period-selector.tsx` importait `@/components/ui/select` qui n'existait pas dans le projet
- **Fix:** Créé `src/components/ui/select.tsx` avec base-ui/select (Select, SelectTrigger, SelectValue, SelectContent, SelectItem)
- **Files modified:** src/components/ui/select.tsx (nouveau)
- **Commit:** 43747c8

**2. [Rule 1 - Bug] Corrigé Prisma groupBy orderBy: _count._all → _count.faultProblem**
- **Found during:** Task 4 (tsc --noEmit après Task 3)
- **Issue:** `orderBy: { _count: { _all: 'desc' } }` invalide pour Prisma groupBy — `_all` n'existe pas dans `WorkOrderCountOrderByAggregateInput`
- **Fix:** Remplacé par `_count: { faultProblem: true }` + `orderBy: { _count: { faultProblem: 'desc' } }` — sémantiquement équivalent avec le filtre `faultProblem: { not: null }` en place
- **Files modified:** src/components/rapports/top-faults-tab.tsx
- **Commit:** 43747c8

**3. [Rule 1 - Bug] Corrigé signature onValueChange: string → string | null**
- **Found during:** Task 4 (tsc --noEmit)
- **Issue:** base-ui Select `onValueChange` envoie `(value: string | null, eventDetails)` mais `onChange` déclaré `(next: string)` — erreur TS2322
- **Fix:** `onChange(next: string | null)` avec guard `if (!next) return`
- **Files modified:** src/components/rapports/period-selector.tsx
- **Commit:** 43747c8

## Known Stubs

| File | Content | Plan to resolve |
|------|---------|-----------------|
| src/app/(app)/rapports/page.tsx:54 | `TabsContent value="mttr"` → placeholder "Rapport MTTR — disponible après livraison Plan 03" | Plan 07-03 |
| src/app/(app)/rapports/page.tsx:58 | `TabsContent value="cost"` → placeholder "Rapport Coût par actif — disponible après livraison Plan 03" | Plan 07-03 |
| src/app/(app)/rapports/page.tsx:62 | `TabsContent value="planned-vs-real"` → placeholder "Rapport Planifié vs Réel — disponible après livraison Plan 04" | Plan 07-04 |

Ces stubs sont intentionnels — les Plans 03 et 04 les remplaceront. La structure tabs est prête à les accueillir.

## Threat Surface

Mitigations du threat model vérifiées en place :

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-07-02-01 | `isPeriod()` + `isTab()` — toute valeur non-whitelist → défaut | Implemented |
| T-07-02-02 | `where: { organizationId: orgId }` dans groupBy TopFaultsTab | Implemented |
| T-07-02-03 | `requirePlan(['growth', 'enterprise'])` avant lecture searchParams, `UpgradeGate` wrappe tout | Implemented |
| T-07-02-04 | faultProblem = données opérationnelles, accès limité managers/admins du tenant | Accepted |

## Self-Check: PASSED

- [x] src/components/rapports/period-selector.tsx — FOUND
- [x] src/components/rapports/overview-tab.tsx — FOUND
- [x] src/components/rapports/top-faults-tab.tsx — FOUND
- [x] src/components/ui/select.tsx — FOUND
- [x] src/app/(app)/rapports/page.tsx — modified FOUND
- [x] d7c0a19 feat(07-02): créer PeriodSelector — FOUND
- [x] 1a023ef feat(07-02): extraire OverviewTab — FOUND
- [x] 833c9e1 feat(07-02): créer TopFaultsTab — FOUND
- [x] 43747c8 feat(07-02): refondre page rapports — FOUND
- [x] npx tsc --noEmit — 0 erreurs nouvelles (erreur pré-existante api/v1/work-orders exclue)
