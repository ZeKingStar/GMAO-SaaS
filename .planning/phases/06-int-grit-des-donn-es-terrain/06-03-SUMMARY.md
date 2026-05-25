---
phase: 06
plan: 03
subsystem: terrain-data-integrity-ui
tags: [settings-ui, closure-requirements, hourly-rate, team-table, admin-ui]
dependency_graph:
  requires:
    - "06-01 (updateClosureRequirements + updateMemberHourlyRate Server Actions)"
  provides:
    - "ClosureRequirementsSection composant client (3 checkbox + Sauvegarder)"
    - "TeamTable colonne Taux horaire (éditable admin/manager, lecture seule sinon)"
    - "Section Exigences de clôture dans /parametres/organisation (admin/manager only)"
  affects:
    - src/components/settings/closure-requirements-section.tsx
    - src/components/settings/team-table.tsx
    - src/app/(app)/parametres/organisation/page.tsx
tech_stack:
  added: []
  patterns:
    - "useState + useTransition pour form optimiste"
    - "dirty check pour désactiver bouton Sauvegarder"
    - "onBlur sur input number pour mise à jour taux horaire"
    - "Role gate côté UI (cosmétique, sécurité assurée par Server Actions)"
key_files:
  created:
    - src/components/settings/closure-requirements-section.tsx
  modified:
    - src/components/settings/team-table.tsx
    - src/app/(app)/parametres/organisation/page.tsx
decisions:
  - "Dirty check comparant req vs initial pour désactiver Sauvegarder tant qu'aucune modification"
  - "handleRateBlur sur onBlur (pas onChange) pour éviter appels SA à chaque frappe"
  - "Validation client miroir du serveur : bornes [0, 10000] + Number.isFinite"
  - "TeamTable reçoit hourlyRate automatiquement car findMany sans select — Prisma inclut tous les scalars"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-05-25T00:00:00Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 2
---

# Phase 06 Plan 03: UI admin — Exigences de clôture + Taux horaire — Summary

**One-liner:** Composant ClosureRequirementsSection (3 checkbox + dirty-save) et colonne Taux horaire éditable dans TeamTable, câblés sur les Server Actions de Plan 01 et gardés par role admin/manager.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer ClosureRequirementsSection | 8c95339 | src/components/settings/closure-requirements-section.tsx |
| 2 | Étendre TeamTable avec colonne Taux horaire | 60dc00f | src/components/settings/team-table.tsx |
| 3 | Câbler ClosureRequirementsSection dans page.tsx | 17610c7 | src/app/(app)/parametres/organisation/page.tsx |

## What Was Built

### ClosureRequirementsSection (src/components/settings/closure-requirements-section.tsx)
- Composant `'use client'` avec `useState<ClosureRequirements>` et `useTransition`
- 3 checkboxes (faultCode, timeSpent, partsUsed) avec labels depuis `CLOSURE_FIELD_LABELS`
- Bouton Sauvegarder désactivé tant qu'aucune modification (dirty check)
- Appelle `updateClosureRequirements(req)` → toast succès/erreur

### TeamTable étendue (src/components/settings/team-table.tsx)
- Import `updateMemberHourlyRate` ajouté
- Type `Member` étendu avec `hourlyRate: number | null`
- Handler `handleRateBlur` : validation client (0..10000 + `Number.isFinite`) puis appel SA
- Colonne `Taux horaire` dans `<thead>` (hidden md:table-cell)
- Cellule : `<input type="number">` avec onBlur pour admin/manager, texte lecture seule sinon

### Page /parametres/organisation étendue (src/app/(app)/parametres/organisation/page.tsx)
- Import `ClosureRequirementsSection`, `parseClosureRequirements`, `ClipboardCheck`
- `select` étendu avec `closureRequirements: true`
- `closureReq` calculé via `parseClosureRequirements(org.closureRequirements)`
- Section "Exigences de clôture des bons de travail" insérée entre Équipe et API
- Visible uniquement pour `['admin', 'manager'].includes(currentMembership.role)`
- `TeamTable` reçoit `hourlyRate` automatiquement (findMany sans select → Prisma inclut tous les scalars)

## Threat Model Applied

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-06-16 | mitigate | UI gate cosmétique ; sécurité réelle assurée par `getAdminOrg()` dans Plan 01 |
| T-06-17 | mitigate | Validation client `value > 10000` dans `handleRateBlur` + validation serveur Plan 01 |
| T-06-18 | accept | Taux horaire lecture seule dans TeamTable — acceptable (interne à l'org) |
| T-06-19 | mitigate | Serveur sanitize via `!!req.faultCode` (Plan 01) — bypass UI inopérant |

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit.

Note : L'erreur TS préexistante dans `src/app/api/v1/work-orders/route.ts` (type `string` au lieu de `WorkOrderType`) est hors périmètre de ce plan, documentée dans Plan 01.

## Known Stubs

None — les deux composants sont entièrement fonctionnels et branchés sur les Server Actions.

## Threat Flags

None — aucune surface de sécurité nouvelle non couverte par le threat model.

## Self-Check: PASSED

- [x] `src/components/settings/closure-requirements-section.tsx` — EXISTS
- [x] `src/components/settings/team-table.tsx` — MODIFIÉ (hourlyRate + handleRateBlur + colonne)
- [x] `src/app/(app)/parametres/organisation/page.tsx` — MODIFIÉ (ClosureRequirementsSection câblée)
- [x] Commit 8c95339 — ClosureRequirementsSection créé
- [x] Commit 60dc00f — TeamTable étendue
- [x] Commit 17610c7 — page câblée
- [x] Aucune erreur TS dans les fichiers modifiés par ce plan
- [x] `grep "'use client'" closure-requirements-section.tsx` — 1 ligne
- [x] `grep "export function ClosureRequirementsSection"` — 1 ligne
- [x] `grep "updateClosureRequirements"` dans closure-requirements-section.tsx — import + appel
- [x] `grep "hourlyRate: number | null"` dans team-table.tsx — 1 ligne
- [x] `grep "Taux horaire"` dans team-table.tsx — présent
- [x] `grep "value > 10000"` dans team-table.tsx — validation client présente
- [x] `grep "closureRequirements: true"` dans page.tsx — 1 ligne
- [x] `grep "Exigences de clôture"` dans page.tsx — présent
