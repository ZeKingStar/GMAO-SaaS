---
phase: 08-productivit-technicien
plan: "04"
subsystem: ui
tags: [react, nextjs, dialog, form, maintenance, plan-parts]

requires:
  - phase: 08-01
    provides: addPlanPart/deletePlanPart server actions avec auth org
  - phase: 08-02
    provides: MaintenancePlanFormDialog avec section PlanPartsSection intégrée

provides:
  - PlanPartsSection sans <form> imbriqué (pas de bubbling vers dialog parent)
  - Mode ajout séquentiel de pièces via bouton "+ Continuer"
  - Re-sync du state dialog à chaque ouverture sur un plan existant
  - key={plan?.id} sur DialogContent pour remontage forcé entre plans

affects: [maintenance, plan-parts, work-orders]

tech-stack:
  added: []
  patterns:
    - "onClick handler sur <button type=button> au lieu de <form onSubmit> pour éviter le bubbling dans les formulaires imbriqués"
    - "Paramètre booléen keepFormOpen dans le handler pour brancher deux comportements post-action"
    - "key prop sur DialogContent pour forcer le remontage React et réinitialiser le state à chaque plan cible"
    - "handleOpen re-sync explicite des props vers le state à l'ouverture (pas seulement à la création du composant)"

key-files:
  created:
    - src/components/maintenance/plan-parts-section.tsx
  modified:
    - src/components/maintenance/maintenance-plan-form-dialog.tsx

key-decisions:
  - "Supprimer <form onSubmit> dans PlanPartsSection — remplacé par <div> + onClick pour éviter le bubbling vers le dialog parent"
  - "handleAddPart(keepFormOpen: boolean) comme paramètre direct, pas un state — évite la race condition setState/appel"
  - "key={plan?.id ?? 'new'} sur DialogContent pour garantir remontage complet lors du changement de plan cible"
  - "Re-sync handleOpen sur branche 'isOpen && plan' pour corriger l'affichage stale des planParts après Server Action"

patterns-established:
  - "Formulaire inline dans dialog parent : toujours utiliser <div> + onClick, jamais <form onSubmit>"
  - "State dialog : re-sync explicite dans handleOpen pour garantir cohérence avec les props serveur"

requirements-completed: [PROD-01]

duration: 25min
completed: 2026-05-27
---

# Phase 08 Plan 04: GAP-1 Dialog Pièces Requises — Summary

**Correction du bubbling de submit qui fermait le dialog plan lors de l'ajout de pièces, et re-sync du state dialog à l'ouverture pour afficher immédiatement la section "Pièces requises"**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-27T17:50:00Z
- **Completed:** 2026-05-27T18:15:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- GAP-1-B corrigé : `<form onSubmit>` dans `PlanPartsSection` remplacé par `<div>` + `onClick` — le submit n'atteint plus le dialog parent
- GAP-3 ajouté : bouton "+ Continuer" appelle `handleAddPart(true)` pour reset partiel des champs sans fermer le formulaire
- GAP-1-A corrigé : `handleOpen` re-synchronise le form avec les props courantes à chaque ouverture d'un plan existant
- `key={plan?.id ?? 'new'}` sur `DialogContent` force le remontage React lors du passage d'un plan à l'autre

## Task Commits

1. **Tâche 1 : Corriger le bubbling de submit et mode séquentiel** - `3a0d71a` (feat)
2. **Tâche 2 : Corriger la visibilité initiale de la section Pièces requises** - `933fc28` (fix)

## Files Created/Modified

- `src/components/maintenance/plan-parts-section.tsx` - Créé (corrigé) : sans `<form>`, avec `handleAddPart(keepFormOpen: boolean)` et boutons "Ajouter" / "+ Continuer"
- `src/components/maintenance/maintenance-plan-form-dialog.tsx` - Modifié : `handleOpen` avec re-sync sur `isOpen && plan`, `key={plan?.id ?? 'new'}` sur `DialogContent`

## Decisions Made

- `handleAddPart(keepFormOpen: boolean)` comme paramètre direct plutôt qu'un state `keepOpen` — élimine la race condition entre `setState` et l'appel à la fonction
- `key` sur `DialogContent` plutôt que sur `Dialog` — force uniquement le remontage du contenu, pas la fermeture/ouverture de l'overlay

## Deviations from Plan

Aucune — plan exécuté exactement comme spécifié.

## Issues Encountered

**Worktree base incorrecte :** Le worktree était initialement basé sur un commit antérieur à `f90bcc6`. Après `git reset --soft`, les fichiers modifiés de l'ensemble du dépôt principal se sont retrouvés dans le working tree. Résolution : `git checkout --` sur tous les fichiers hors périmètre du plan, puis travail sur les deux fichiers cibles uniquement.

**Erreur TypeScript `@/generated/prisma/enums` préexistante :** Le répertoire `src/generated/` n'existait pas dans le worktree. Résolution : lien symbolique vers le répertoire `generated/` du dépôt principal. Aucune erreur TypeScript résiduelle sur les deux fichiers modifiés.

## User Setup Required

Aucun — pas de configuration externe requise.

## Next Phase Readiness

- GAP-1 (dialog pièces) et GAP-3 (ajout séquentiel) sont fermés
- Prêt pour 08-05 (scalabilité de la liste de pièces — GAP-2) et 08-06 (filtres actifs — GAP-4)

---
*Phase: 08-productivit-technicien*
*Completed: 2026-05-27*
