# Phase 7 : Analytique de fiabilité - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Donner aux gestionnaires 4 rapports de fiabilité intégrés à la page `/rapports` existante : Top pannes récurrentes, MTTR par actif, Coût par actif, et Planifié vs Réel. Nécessite une extension du schéma WorkOrder pour capturer les 3 champs P/C/R structurés.

Ne comprend pas : export CSV, notifications push, tableaux de bord temps réel (phase future).

</domain>

<decisions>
## Implementation Decisions

### Structure P/C/R (codes de panne)
- **D-01:** Renommer le champ existant `faultDescription` → `faultProblem` via migration Prisma (`ALTER TABLE RENAME COLUMN`). Pas de perte de données.
- **D-02:** Ajouter deux nouveaux champs nullable à `WorkOrder` : `faultCause` (String?) et `faultRemedy` (String?).
- **D-03:** Le rapport "Top pannes récurrentes" (FIAB-01) groupe par `faultProblem` + `faultCategory` pour identifier les pannes répétitives.

### Navigation et structure des rapports
- **D-04:** Les 4 nouveaux rapports s'intègrent dans la page `/rapports` existante via des **tabs** : "Vue générale" (contenu actuel) + "Top pannes" + "MTTR" + "Coût actifs" + "Planifié vs Réel".
- **D-05:** Filtrage temporel par **périodes prédéfinies** : Ce mois / 3 mois / 6 mois / Cette année. Pas de date picker personnalisé pour Phase 7.
- **D-06:** Le tab "Planifié vs Réel" (FIAB-04) contient **3 sous-onglets** : Par BT | Par technicien | Par type d'actif.

### Claude's Discretion
- Calcul du MTTR (FIAB-02) : utiliser la somme des `WorkOrderTimeLog.minutes` ÷ 60 par actif (temps technicien actif, cohérent avec le timer Phase 6). Exclure les BTs sans `timeLogs`.
- Plan gating : même pattern que `/rapports` existant — `requirePlan(['growth', 'enterprise'])`.
- Design des composants : réutiliser Card, Badge, Tabs de shadcn/ui existants; pas de librairie de charts si les données peuvent être rendues en tableau trié.
- État vide de chaque rapport : message informatif indiquant la condition manquante (ex: "Aucun code de panne saisi sur la période").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements Phase 7
- `.planning/ROADMAP.md` §Phase 7 — Objectif, requirements FIAB-01/FIAB-02/FIAB-03/FIAB-04, success criteria
- `.planning/REQUIREMENTS.md` §Analytique de fiabilité (Phase 7) — Critères d'acceptation détaillés

### Décisions Phase 6 héritées
- `.planning/phases/06-int-grit-des-donn-es-terrain/06-CONTEXT.md` — Décisions sur faultCategory/faultDescription (D-01 à D-04), WorkOrderTimeLog (D-09 à D-11), taux horaire Membership (D-12/D-13)

### Schéma et code existants
- `prisma/schema.prisma` — Modèles `WorkOrder` (faultCategory, faultDescription, estimatedHours, startedAt, completedAt), `WorkOrderTimeLog` (minutes), `WorkOrderPart` (unitCost, quantity), `Membership` (hourlyRate)
- `src/app/(app)/rapports/page.tsx` — Page rapports existante : pattern requirePlan, groupBy, structure UI actuelle à étendre avec tabs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(app)/rapports/page.tsx` : déjà structuré avec `requirePlan(['growth', 'enterprise'])`, `db.workOrder.groupBy()`, shadcn Card/Badge — base à étendre avec Tabs
- `src/lib/auth.ts` → `requirePlan()` : pattern de gating déjà en place
- `src/lib/db.ts` : instance Prisma partagée
- `src/components/ui/` : Card, Badge, Tabs, Table, Select — tous disponibles via shadcn

### Established Patterns
- Rapports = Server Component Next.js (données fetched server-side, pas de client state sauf pour les filtres de période)
- `db.workOrder.groupBy()` déjà utilisé dans /rapports pour compter par status/priority
- `db.workOrder.aggregate()` + `_sum` utilisable pour les coûts

### Integration Points
- Le schéma `WorkOrder` nécessite une migration (rename + 2 nouveaux champs) avant que les rapports puissent agréger les données P/C/R
- `WorkOrderPart.unitCost × quantity` = coût pièces par BT
- `WorkOrderTimeLog.minutes × Membership.hourlyRate ÷ 60` = coût main-d'œuvre par BT
- `WorkOrder.estimatedHours` vs somme `WorkOrderTimeLog.minutes ÷ 60` = delta Planifié vs Réel

</code_context>

<specifics>
## Specific Ideas

- Les 4 onglets analytiques remplacent l'actuel contenu fouillis de /rapports — "Vue générale" conserve le contenu existant (BTs par statut/priorité, plans de maintenance, inventaire pièces)
- Rapport "Top pannes" : afficher les N pannes les plus fréquentes triées par nombre d'occurrences, avec la catégorie en badge coloré

</specifics>

<deferred>
## Deferred Ideas

- Export CSV des rapports — future phase
- Date picker personnalisé (plage arbitraire) — non sélectionné par l'utilisateur pour Phase 7
- Calcul MTTR par fenêtre glissante (rolling average) — post Phase 7

</deferred>

---

*Phase: 07-analytique-de-fiabilit*
*Context gathered: 2026-05-25*
