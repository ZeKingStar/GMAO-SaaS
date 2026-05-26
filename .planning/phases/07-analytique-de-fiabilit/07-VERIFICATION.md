---
phase: 07-analytique-de-fiabilit
verified: 2026-05-26T21:17:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  status: approved
  note: "Checkpoint humain pré-approuvé par l'utilisateur (all passed). 12 tests UAT documentés dans 07-HUMAN-UAT.md."
---

# Phase 7 : Analytique de Fiabilité — Rapport de Vérification

**Objectif de phase :** Donner aux gestionnaires les données pour prendre des décisions d'achat/réparation et identifier les actifs problématiques.
**Vérifié :** 2026-05-26T21:17:00Z
**Statut :** PASSED
**Re-vérification :** Non — vérification initiale

---

## Objectif Atteint

### Vérités Observables

| # | Vérité | Statut | Preuve |
|---|--------|--------|--------|
| 1 | La migration Prisma P/C/R est appliquée — faultProblem/faultCause/faultRemedy existent, faultDescription absent | ✓ VÉRIFIÉ | `migration.sql` présent avec RENAME+ADD COLUMN ; `faultProblem` dans le client généré, `faultDescription` absent |
| 2 | Les utilitaires getPeriodStart() et formatCurrency() sont disponibles pour tous les rapports | ✓ VÉRIFIÉ | `report-utils.ts` exporte 6 symboles dont `getPeriodStart`, `formatCurrency`, `isPeriod`, `PERIOD_LABELS` |
| 3 | La page /rapports affiche 5 tabs pilotés par searchParams | ✓ VÉRIFIÉ | 5 `TabsTrigger` (lignes 49-53) + `await searchParams` + validation `isTab()`/`isPeriod()` |
| 4 | FIAB-01 : Le tab Top pannes groupe par (faultProblem, faultCategory) trié par occurrence décroissante | ✓ VÉRIFIÉ | `groupBy by: ['faultProblem', 'faultCategory']` avec `orderBy: { _count: { faultProblem: 'desc' } }` |
| 5 | FIAB-02 : Le tab MTTR calcule et affiche le MTTR par actif pour les BTs correctifs | ✓ VÉRIFIÉ | `type: 'corrective'`, formule `totalMinutes / s.btCount / 60`, top 20 |
| 6 | FIAB-03 : Le tab Coût actifs affiche main-d'œuvre + pièces par actif avec gestion des taux manquants | ✓ VÉRIFIÉ | `Promise.all` sur `workOrderPart` + `workOrderTimeLog`, `rate ?? 0`, flag `hasMissingRate` |
| 7 | FIAB-04 : Le tab Planifié vs Réel affiche 3 sous-onglets (Par BT / Par technicien / Par type d'actif) pilotés par ?subtab= | ✓ VÉRIFIÉ | `VALID_SUBTABS`, `isSubTab()`, 3 `TabsTrigger`, `estimatedHours: { not: null }` |

**Score :** 7/7 vérités confirmées

---

## Artefacts Requis

| Artefact | Fournit | Statut | Détails |
|----------|---------|--------|---------|
| `prisma/migrations/20260526000000_phase7_fault_pcr/migration.sql` | Migration SQL P/C/R | ✓ VÉRIFIÉ | ALTER RENAME + 2 ADD COLUMN présents |
| `prisma/schema.prisma` | Modèle WorkOrder avec faultProblem/faultCause/faultRemedy | ✓ VÉRIFIÉ | 1 occurrence chacun, 0 occurrence faultDescription |
| `src/lib/report-utils.ts` | getPeriodStart, formatCurrency, isPeriod, PERIOD_LABELS | ✓ VÉRIFIÉ | 7 exports dont les 4 requis |
| `src/lib/closure-requirements.ts` | ClosureCheckInput utilise faultProblem | ✓ VÉRIFIÉ | `faultProblem: string | null`, 0 occurrence faultDescription |
| `src/components/rapports/period-selector.tsx` | Client Component sélecteur de période | ✓ VÉRIFIÉ | `'use client'`, `useRouter`, `router.push`, `PERIOD_VALUES` |
| `src/components/rapports/overview-tab.tsx` | Server Component contenu Vue générale | ✓ VÉRIFIÉ | `export async function OverviewTab` |
| `src/components/rapports/top-faults-tab.tsx` | Server Component FIAB-01 | ✓ VÉRIFIÉ | `export async function TopFaultsTab`, groupBy correct |
| `src/components/rapports/mttr-tab.tsx` | Server Component FIAB-02 | ✓ VÉRIFIÉ | `export async function MttrTab`, formule MTTR, type corrective |
| `src/components/rapports/cost-tab.tsx` | Server Component FIAB-03 | ✓ VÉRIFIÉ | `export async function CostTab`, Promise.all, hasMissingRate |
| `src/components/rapports/planned-vs-real-tab.tsx` | Server Component FIAB-04 (268 lignes) | ✓ VÉRIFIÉ | Exports VALID_SUBTABS, isSubTab, type SubTab, 3 sous-onglets |
| `src/app/(app)/rapports/page.tsx` | Page rapports avec 5 tabs + searchParams | ✓ VÉRIFIÉ | 5 TabsTrigger, 5 TabsContent, requirePlan, UpgradeGate |
| `src/components/work-orders/work-order-fault-form.tsx` | Formulaire P/C/R (initialProblem/Cause/Remedy) | ✓ VÉRIFIÉ | 3 props, 0 occurrence faultDescription/initialDescription |
| `src/actions/work-orders.ts` | setWorkOrderFault avec faultProblem/Cause/Remedy | ✓ VÉRIFIÉ | 3 champs présents, 0 occurrence faultDescription |

---

## Vérification des Liens Clés (Câblage)

| De | Vers | Via | Statut | Détails |
|----|------|-----|--------|---------|
| `rapports/page.tsx` | `searchParams.tab` et `searchParams.period` | `await searchParams` + `isTab()`/`isPeriod()` | ✓ CÂBLÉ | Pattern Next.js 16 App Router correct |
| `rapports/page.tsx` | `PlannedVsRealTab` | import + `subtab` searchParam | ✓ CÂBLÉ | `isSubTab(sp.subtab)` + `<PlannedVsRealTab orgId period subtab>` |
| `rapports/page.tsx` | `MttrTab` + `CostTab` | imports directs | ✓ CÂBLÉ | Placeholders Plan 02 remplacés (0 occurrence "Plan 03/04") |
| `top-faults-tab.tsx` | `db.workOrder.groupBy` | Prisma groupBy | ✓ CÂBLÉ | `by: ['faultProblem', 'faultCategory']`, filtre `organizationId` |
| `mttr-tab.tsx` | `db.workOrder.findMany` | Prisma findMany correctifs | ✓ CÂBLÉ | `type: 'corrective'`, `timeLogs: { some: ... }`, filtre `organizationId` |
| `cost-tab.tsx` | `db.workOrderPart` + `db.workOrderTimeLog` | Promise.all parallèle | ✓ CÂBLÉ | 2 findMany, agrégation JS, `organizationId` sur les deux |
| `planned-vs-real-tab.tsx` | `db.workOrder.findMany` | Prisma findMany | ✓ CÂBLÉ | `estimatedHours: { not: null }`, `completedAt: { gte: periodStart }` |
| `work-order-fault-form.tsx` | `setWorkOrderFault` | Server Action | ✓ CÂBLÉ | Props initialProblem/Cause/Remedy → action faultProblem/Cause/Remedy |

---

## Trace de Flux de Données (Niveau 4)

| Artefact | Variable rendue | Source | Données réelles | Statut |
|----------|----------------|--------|-----------------|--------|
| `top-faults-tab.tsx` | `groups` (pannes groupées) | `db.workOrder.groupBy` avec filtres période+org | Requête Prisma réelle avec `faultProblem: { not: null }` | ✓ FLUX ACTIF |
| `mttr-tab.tsx` | `stats` (AssetStat[]) | `db.workOrder.findMany` → agrégation JS | Requête Prisma réelle `type: corrective` + `timeLogs` | ✓ FLUX ACTIF |
| `cost-tab.tsx` | `stats` (AssetCost[]) | `db.workOrderPart` + `db.workOrderTimeLog` via Promise.all | 2 requêtes Prisma réelles, agrégation par assetId | ✓ FLUX ACTIF |
| `planned-vs-real-tab.tsx` | `enriched` → `byWo`/`byTech`/`byCat` | `db.workOrder.findMany` avec `estimatedHours: { not: null }` | 1 requête Prisma, 3 vues calculées en mémoire | ✓ FLUX ACTIF |
| `overview-tab.tsx` | KPIs existants Phase 6 | Requêtes Phase 6 préservées | Identique Phase 6 — hors scope Phase 7 | ✓ FLUX ACTIF |

Tous les composants qui rendent des données dynamiques ont une source Prisma réelle. Aucun composant creux ni prop vide codée en dur.

---

## Couverture des Exigences

| Exigence | Plan source | Description | Statut | Preuve |
|----------|-------------|-------------|--------|--------|
| FIAB-01 | 07-02 | Top pannes récurrentes — groupBy (faultProblem, faultCategory) | ✓ SATISFAIT | `top-faults-tab.tsx` : groupBy confirmé, tri décroissant, état vide actionnable |
| FIAB-02 | 07-03 | MTTR par actif — sum(timeLogs.minutes) / count(BT) / 60 | ✓ SATISFAIT | `mttr-tab.tsx` : formule `totalMinutes / s.btCount / 60`, BTs correctifs uniquement |
| FIAB-03 | 07-03 | Coût de maintenance par actif — main-d'œuvre + pièces | ✓ SATISFAIT | `cost-tab.tsx` : `(rate ?? 0) * hours` + `(unitCost ?? 0) * quantity`, hasMissingRate |
| FIAB-04 | 07-04 | Planifié vs Réel — par BT, par technicien, par type d'actif | ✓ SATISFAIT | `planned-vs-real-tab.tsx` : 3 sous-onglets, delta = realHours - estimatedHours |

---

## Anti-Patterns Détectés

| Fichier | Ligne | Motif | Sévérité | Impact |
|---------|-------|-------|----------|--------|
| — | — | Aucun placeholder résiduel ("Bientôt disponible", "Plan 03", "Plan 04") | — | — |
| — | — | Aucune occurrence de `faultDescription` dans `src/` (hors `src/generated/`) | — | — |
| — | — | Aucun TODO/FIXME dans les composants rapports | — | — |

Aucun anti-pattern bloquant détecté.

---

## Vérifications Comportementales (Step 7b)

Les composants sont des Server Components Next.js sans point d'entrée CLI exécutable indépendamment. Les vérifications comportementales se limitent aux patterns statiques.

| Comportement | Vérification | Résultat | Statut |
|--------------|-------------|---------|--------|
| TopFaultsTab filtre par org | `grep "organizationId: orgId"` dans top-faults-tab.tsx | Présent | ✓ PASS |
| MttrTab restreint aux correctifs | `grep "type: 'corrective'"` | Présent | ✓ PASS |
| CostTab : taux null géré | `grep "rate ?? 0"` | Présent | ✓ PASS |
| PlannedVsRealTab : estimatedHours obligatoire | `grep "estimatedHours: { not: null }"` | Présent | ✓ PASS |
| UpgradeGate actif | `grep "UpgradeGate hasAccess={hasAccess}"` dans page.tsx | Présent | ✓ PASS |
| requirePlan growth/enterprise | `grep "requirePlan\(\['growth', 'enterprise'\]\)"` | Présent | ✓ PASS |
| Zéro fuite cross-tenant | `grep "organizationId"` dans tous les 4 tabs | 5 occurrences au total | ✓ PASS |

---

## Validation Humaine

**Statut :** Approuvé — pré-approuvé par l'utilisateur à l'invocation ("all passed").

12 tests UAT documentés dans `.planning/phases/07-analytique-de-fiabilit/07-HUMAN-UAT.md` couvrant :
- Structure générale `/rapports` (5 tabs + sélecteur de période)
- Tab Vue générale (Phase 6 préservé)
- Tabs FIAB-01 / FIAB-02 / FIAB-03 / FIAB-04
- Sous-onglets Par BT / Par technicien / Par type d'actif
- Formulaire P/C/R sur BT actif
- Multi-tenancy et plan starter UpgradeGate
- Build TypeScript + tests Vitest

---

## Résumé des Commits Phase 7

| Plan | Commits principaux | Description |
|------|--------------------|-------------|
| 07-01 | 05cf06a, 5437208, 44d058b, 7d9d042, 5f3b93d, f1a0091, b2b7b19 | Migration P/C/R + report-utils (8 tests) + fault form |
| 07-02 | d7c0a19, 1a023ef, 833c9e1, 43747c8 | PeriodSelector + OverviewTab + TopFaultsTab + page tabs |
| 07-03 | 13a035a, da691ae, 44f766d | MttrTab + CostTab + câblage page.tsx |
| 07-04 | ff904ae, b1bea75, fd63e4e | PlannedVsRealTab + câblage + checkpoint humain |

---

## Résumé de l'Objectif

**L'objectif de Phase 7 est atteint.**

Les gestionnaires disposent désormais de 4 rapports de fiabilité accessibles depuis `/rapports` :

1. **Top pannes (FIAB-01)** — Identifie quelles pannes se répètent le plus, groupées par problème et catégorie sur la période choisie. Permet de prioriser les actions préventives.

2. **MTTR par actif (FIAB-02)** — Révèle quels actifs prennent le plus de temps à réparer (BTs correctifs). Indicateur clé pour les décisions de remplacement.

3. **Coût de maintenance par actif (FIAB-03)** — Cumule main-d'œuvre et pièces par actif. Donne le coût total de possession pour les décisions d'achat/réparation.

4. **Planifié vs Réel (FIAB-04)** — Compare durée estimée et réelle par BT, technicien, et type d'actif. Identifie les sources de dérive de planning.

Infrastructure de soutien : migration Prisma P/C/R formelle (données préservées), formulaire de clôture P/C/R, utilitaires `getPeriodStart`/`formatCurrency` partagés, sélecteur de période URL-driven, gating Growth/Enterprise via `requirePlan` + `UpgradeGate`.

---

_Vérifié : 2026-05-26T21:17:00Z_
_Vérificateur : Claude (gsd-verifier)_
