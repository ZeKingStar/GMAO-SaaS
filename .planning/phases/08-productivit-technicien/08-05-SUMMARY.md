---
phase: 08-productivit-technicien
plan: "05"
subsystem: ui
tags: [react, nextjs, dialog, maintenance, spare-parts, search, filter]

requires:
  - phase: 08-01
    provides: addPlanPart server action avec validation org
  - phase: 08-02
    provides: PlanPartsSection avec type SparePart de base
  - phase: 08-04
    provides: PlanPartsSection refactorisé (sans form bubbling, mode séquentiel)

provides:
  - SparePartPickerDialog — modal de sélection de pièce avec recherche full-text et filtre fournisseur
  - PlanPartsSection avec bouton picker remplaçant le <select> natif
  - Toggle "Pièce hors inventaire" accessible depuis la même zone
  - Type SparePart étendu (+ description, quantityOnHand, supplier) cohérent sur tous les composants

affects: [maintenance, plan-parts, spare-parts]

tech-stack:
  added: []
  patterns:
    - "useMemo double-pipeline : filtrage fournisseur d'abord, puis recherche texte — O(n) client-side pour ~5000 items"
    - "Modal Dialog avec overflow-y-auto pour listes longues sans débordement de viewport"
    - "Callback onSelect(id, name) — closure de la sélection + réinitialisation search/filter dans handleSelect"
    - "isHorsInventaire = selectedSparePartId === '__free__' comme sentinelle de mode"

key-files:
  created:
    - src/components/maintenance/spare-part-picker-dialog.tsx
  modified:
    - src/components/maintenance/plan-parts-section.tsx
    - src/components/maintenance/maintenance-plan-form-dialog.tsx
    - src/app/(app)/maintenance/page.tsx

self-check:
  status: PASSED
  must_haves_verified:
    - "✓ Clic 'Choisir une pièce inventaire' ouvre SparePartPickerDialog"
    - "✓ Modal affiche référence (partNumber), nom, description, stock (quantityOnHand)"
    - "✓ Filtre texte libre sur nom + partNumber + description (insensible casse)"
    - "✓ Filtre fournisseur via <select> dans la barre du modal"
    - "✓ Clic pièce → sélection + fermeture modal + nom affiché dans bouton"
    - "✓ Option 'Pièce hors inventaire' accessible via toggle textuel"
  commits:
    - "7a3144e feat(08-05): create SparePartPickerDialog with search and supplier filter"
    - "8ea3182 feat(08-05): integrate SparePartPickerDialog into PlanPartsSection - GAP-2"
---

## Summary

Remplacement du `<select>` natif non-scalable de PlanPartsSection par un modal de sélection de pièce (SparePartPickerDialog) adapté à un catalogue de milliers d'articles — résolution du GAP-2 identifié en UAT.

## What Was Built

**SparePartPickerDialog** (`spare-part-picker-dialog.tsx`) :
- Modal Dialog 2xl avec barre de recherche autofocusée
- Filtrage client-side via deux useMemo chaînés : fournisseur d'abord, texte ensuite
- Colonnes : référence (mono), nom + description, stock, bouton "Choisir"
- Filtre fournisseur affiché uniquement si ≥ 1 fournisseur non-null dans les données
- Footer avec compteur `N pièces sur M`

**PlanPartsSection** (modifications post-08-04) :
- Import et usage de SparePartPickerDialog
- `pickerOpen` + `selectedPartName` comme états locaux pour l'UX
- Bouton remplaçant le `<select>` : affiche le nom de la pièce sélectionnée ou un placeholder
- Toggle "Pièce hors inventaire →" / "← Choisir depuis l'inventaire" pour switcher de mode

**Types et loader** :
- SparePart étendu avec `description`, `quantityOnHand`, `supplier` dans `plan-parts-section.tsx`, `maintenance-plan-form-dialog.tsx`
- Loader `maintenance/page.tsx` charge les 3 nouveaux champs dans `db.sparePart.findMany`

## Deviations

Aucune déviation par rapport au plan.

## Issues Encountered

Aucun.
