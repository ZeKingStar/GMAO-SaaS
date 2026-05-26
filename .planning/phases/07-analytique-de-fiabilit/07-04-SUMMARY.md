---
plan: 07-04
phase: 07-analytique-de-fiabilit
status: complete
completed: 2026-05-26
wave: 3
---

# Plan 07-04 Summary — FIAB-04 Planifié vs Réel

## What Was Built

Rapport **Planifié vs Réel** (FIAB-04) : composant Server Component `PlannedVsRealTab` avec 3 sous-onglets pilotés par `?subtab=` dans l'URL.

## Key Files Created/Modified

### Created
- `src/components/rapports/planned-vs-real-tab.tsx` (268 lignes)
  - Exports : `PlannedVsRealTab`, `VALID_SUBTABS`, `isSubTab`, `type SubTab`
  - 1 seule requête Prisma (`findMany` avec `estimatedHours: { not: null }`)
  - 3 vues calculées en mémoire depuis le même dataset
  - État vide actionnable : "Aucun bon de travail avec durée estimée"

### Modified
- `src/app/(app)/rapports/page.tsx`
  - Import `PlannedVsRealTab`, `isSubTab`, `type SubTab`
  - Constante `DEFAULT_SUBTAB: SubTab = 'by-wo'`
  - Validation `isSubTab(sp.subtab)` pour le searchParam
  - Remplacement du placeholder Plan 02 par `<PlannedVsRealTab orgId={orgId} period={period} subtab={subtab} />`
- `.planning/ROADMAP.md` — Plan 07-04 coché `[x]`

## Technical Decisions

**Requête Prisma (1 findMany → 3 vues) :**
```typescript
estimatedHours: { not: null },
completedAt: { gte: periodStart },
select: {
  id, title, estimatedHours,
  timeLogs: { select: { minutes: true } },
  assignees: { select: { member: { select: { id, firstName, lastName } } } },
  asset: { select: { id, name, category: { select: { id, name } } } }
}
```

**Calcul delta :** `delta = realHours - estimatedHours` où `realHours = sum(timeLogs.minutes) / 60`
- Positif (dépassement) → rouge `text-red-600`
- Négatif (sous-utilisation) → vert `text-green-600`

**Sous-onglets :**
- `by-wo` : top 30 BTs par écart absolu décroissant
- `by-tech` : agrégation par `assignee.member.id` (gestion multi-assignees)
- `by-asset-type` : agrégation par `asset.category.id`, bucket "Sans catégorie d'actif"

**Navigation :** `render={<a href={...}>}` sur chaque `TabsTrigger` (pattern Base UI établi en Phase 7)

## Checkpoint Humain (Task 3)

Résultat : **approved** (pré-approuvé par l'utilisateur à l'invocation `"all passed"`)

12 tests UAT (07-HUMAN-UAT.md) couvrant :
- Structure générale `/rapports` (5 tabs visibles, sélecteur période)
- Tab Vue générale (Phase 6 préservé)
- Tab Top pannes FIAB-01
- Tab MTTR FIAB-02
- Tab Coût actifs FIAB-03
- Tab Planifié vs Réel FIAB-04 (sous-onglets Par BT, Par technicien, Par type d'actif)
- Sélecteur de période (4 options → `?period=` dans l'URL)
- Formulaire P/C/R sur BT actif
- Multi-tenancy
- Plan starter UpgradeGate
- Build TypeScript + tests

## Acceptance Criteria — All Passed

| Critère | Résultat |
|---------|----------|
| `export async function PlannedVsRealTab` | ✓ |
| `export const VALID_SUBTABS` | ✓ |
| `export function isSubTab` | ✓ |
| `estimatedHours: { not: null }` | ✓ |
| `completedAt: { gte: periodStart }` | ✓ |
| 3 TabsTrigger (by-wo, by-tech, by-asset-type) | ✓ |
| État vide "Aucun bon de travail avec durée estimée" | ✓ |
| Import PlannedVsRealTab dans page.tsx | ✓ |
| `isSubTab(sp.subtab)` validation | ✓ |
| `<PlannedVsRealTab orgId period subtab>` | ✓ |
| `npx tsc --noEmit` (production code) | ✓ |

## Phase 7 Completion

Phase 7 complète : 4/4 plans exécutés, 4 requirements couverts.

| Requirement | Plan | Status |
|-------------|------|--------|
| FIAB-01 — Top pannes récurrentes | 07-02 | ✓ |
| FIAB-02 — MTTR par actif | 07-03 | ✓ |
| FIAB-03 — Coût de maintenance par actif | 07-03 | ✓ |
| FIAB-04 — Planifié vs Réel | 07-04 | ✓ |

5 tabs `/rapports` fonctionnels. Migration Prisma P/C/R appliquée. Formulaire fault P/C/R opérationnel.

## Self-Check: PASSED
