---
phase: 08-productivit-technicien
plan: "02"
subsystem: ui-job-plans-checklist
tags: [maintenance, work-orders, checklist, job-plans, client-components]
dependency_graph:
  requires:
    - Plan 08-01 (server actions: generateWorkOrderFromPlan, addPlanPart, deletePlanPart, toggleChecklistItem, setChecklistMeasure)
    - Plan 08-01 (Prisma models: MaintenancePlanPart, WorkOrderChecklistItem)
  provides:
    - PlanPartsSection component (gestion pièces requises d'un job plan)
    - GenerateWorkOrderButton component (génération BT depuis plan)
    - WorkOrderChecklist component (checklist interactive sur BT)
    - Intégration maintenance UI: planParts + spareParts dans page/list/dialog
    - Intégration BT detail: checklistItems chargés et affichés conditionnellement
  affects:
    - Plan 08-03 (checkpoint humain — validera visuellement PROD-01 et PROD-02)
tech_stack:
  added: []
  patterns:
    - Client components use useTransition + sonner toast (patron work-order-parts.tsx)
    - Conditional render guard (items.length === 0 → null) prevents empty sections
    - readOnly prop on checklist for closed/resolved work orders (soft UI guard)
    - spareParts scoped to org in server loader (T-08-12 mitigation)
key_files:
  created:
    - src/components/maintenance/plan-parts-section.tsx
    - src/components/maintenance/generate-work-order-button.tsx
    - src/components/work-orders/work-order-checklist.tsx
  modified:
    - src/components/maintenance/maintenance-plan-form-dialog.tsx
    - src/components/maintenance/maintenance-plan-list.tsx
    - src/app/(app)/maintenance/page.tsx
    - src/components/work-orders/work-order-detail.tsx
    - src/app/(app)/bons-de-travail/[id]/page.tsx
decisions:
  - "Checklist placée après WorkOrderTimer et avant Description — ordre naturel d'exécution technicien (timer → checklist → description → parts)"
  - "readOnly UI sur BT clos est soft (serveur autorise toujours toggle) — décision conforme T-08-11"
  - "Prisma generate exécuté dans le worktree (Rule 3) — models WorkOrderChecklistItem et MaintenancePlanPart manquaient"
  - "spareParts chargées with where: { organizationId } — mitigation T-08-12"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-27"
  tasks_completed: 4
  tasks_total: 4
  files_created: 3
  files_modified: 5
---

# Phase 8 Plan 02: UI Job Plans + Checklist Interactive

**One-liner:** Trois composants client (PlanPartsSection, GenerateWorkOrderButton, WorkOrderChecklist) intégrés dans les pages maintenance et BT, livrant PROD-01 (gestion pièces + génération BT) et PROD-02 (checklist mobile-first sur BT issu d'un plan).

## Composants créés

### PlanPartsSection (`src/components/maintenance/plan-parts-section.tsx`)

Props : `{ planId: string; parts: PlanPart[]; spareParts: SparePart[] }`

- Liste les pièces requises du plan avec icône Package + quantité
- Formulaire d'ajout : select inventaire (scopé org) OU "Pièce hors inventaire" → champ nom libre
- Validation client : nom requis si hors inventaire, quantité > 0
- Appelle `addPlanPart` (submit) et `deletePlanPart` (bouton corbeille) via `useTransition`
- Toast success/error + pending state (boutons disabled)
- Visible uniquement en mode édition du dialog (plan existant)

### GenerateWorkOrderButton (`src/components/maintenance/generate-work-order-button.tsx`)

Props : `{ planId: string; planName: string; disabled?: boolean }`

- Bouton "Générer un BT" avec icône Wrench
- Confirmation dialog avant génération
- Appelle `generateWorkOrderFromPlan`, redirige vers `/bons-de-travail/{id}` après succès
- Désactivé si `!plan.isActive` ou pendant la transition

### WorkOrderChecklist (`src/components/work-orders/work-order-checklist.tsx`)

Props : `{ workOrderId: string; items: ChecklistItem[]; readOnly?: boolean }`

- Retourne `null` immédiatement si `items.length === 0` (piège 3 — aucune section vide)
- En-tête : titre + badge `X/Y complétés`
- Liste triée par `order` ASC : checkbox + numéro étape + description + champ mesure
- Toggle checkbox → `toggleChecklistItem` via `useTransition` (optimistic)
- Mesure → `setChecklistMeasure` au `onBlur` si valeur changée (no-op si inchangé)
- `readOnly=true` désactive checkbox et input pour BTs `closed` ou `resolved`
- Mobile-first : checkboxes 5×5, inputs full-width, `flex flex-col gap-3`

## Modifications aux loaders de pages

### `src/app/(app)/maintenance/page.tsx`

- `Promise.all` étendu à 4 requêtes : ajout `spareParts` (filtré `organizationId`)
- Plans chargés avec `include: { planParts: { include: { sparePart } } }` trié par `createdAt asc`
- `spareParts` passé à `MaintenancePlanList`

### `src/app/(app)/bons-de-travail/[id]/page.tsx`

- `checklistItems` ajouté dans `include` du `findFirst` : `select { id, order, description, checked, measureValue }` trié `order asc`
- Scalaire `maintenancePlanId` déjà présent dans le retour par défaut

## Décisions UX

| Décision | Raison |
|----------|--------|
| Ordre : Timer → Checklist → Description → Parts | Flux naturel technicien : démarre timer, coche étapes, lit description, ajoute pièces |
| Checklist après Timer (pas avant Description) | Timer est le premier geste — checklist suit immédiatement |
| readOnly soft (UI seulement) | Sécurité métier côté server action, cohérent avec T-08-11 |
| "Pièce hors inventaire" via option `__free__` dans select | Évite un mode toggle séparé, plus simple et accessible |
| Étape {order + 1} (base 0 → base 1) | Ordre DB commence à 0, affichage naturel commence à 1 |

## Points à valider lors du checkpoint humain de Plan 08-03

1. **PROD-01 — Pièces requises** : Ouvrir un plan en mode édition → section "Pièces requises" visible, ajout/suppression fonctionnels
2. **PROD-01 — Génération BT** : Cliquer "Générer un BT" sur un plan actif → redirection vers la fiche BT avec checklist pré-remplie et pièces présentes
3. **PROD-02 — Checklist BT** : Sur la fiche du BT généré, section Checklist visible, cases cochables, mesure sauvegardée au blur + persistée après refresh
4. **Affichage conditionnel** : Sur un BT correctif créé manuellement (sans `maintenancePlanId`, sans items) → aucune section Checklist
5. **readOnly** : Fermer un BT → cases à cocher et inputs disabled

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Prisma client non régénéré dans le worktree**
- **Found during:** Vérification TypeScript Task 1 (avant commit)
- **Issue:** Le client Prisma généré dans `src/generated/prisma/` ne contenait pas les modèles `WorkOrderChecklistItem` et `MaintenancePlanPart` créés en Phase 08-01. Erreurs TS dans `src/actions/maintenance.ts` et `src/actions/work-orders.ts` (maintenancePlanPart, workOrderChecklistItem inexistants sur PrismaClient)
- **Fix:** `npx prisma generate` exécuté dans le worktree — `src/generated/prisma/` est dans `.gitignore`, donc absent du worktree cloné depuis fef60ff
- **Files modified:** `src/generated/prisma/` (gitignored, non commité)
- **Impact:** Aucun — fichier généré reconstruit à la demande, non versionné

## Known Stubs

Aucun stub — toutes les données sont câblées depuis les loaders Prisma et les props.

## Self-Check: PASSED
