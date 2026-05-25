---
phase: 06
plan: 02
subsystem: terrain-ui-integration
tags: [react, next.js, client-components, work-orders, timer, parts, fault-form, closure]
dependency_graph:
  requires:
    - WorkOrderPart model (06-01)
    - validateClosure / parseClosureRequirements (06-01)
    - startTimer / stopTimer / closeActiveTimer (06-01)
    - upsertWorkOrderPart / deleteWorkOrderPart (06-01)
    - setWorkOrderFault (06-01)
    - updateWorkOrderStatus with closure validation (06-01)
  provides:
    - WorkOrderTimer component (live ticker + start/stop/close)
    - WorkOrderParts component (hybrid inventory/free form + list)
    - WorkOrderFaultForm component (category select + description textarea)
    - WorkOrderClosureBanner component (missing fields alert + computeMissingForClosure)
    - WorkOrderDetail enriched (all 4 sub-components wired + labor cost)
    - page.tsx extended (parts, hourlyRate, closureRequirements, spareParts, currentRole)
  affects:
    - src/app/(app)/bons-de-travail/[id]/page.tsx
    - src/components/work-orders/work-order-detail.tsx
tech_stack:
  added: []
  patterns:
    - useTransition pour Server Actions non-bloquantes
    - setInterval ticker côté client depuis startedAt serveur (pas de persistance locale)
    - computeMissingForClosure wrapper côté client de validateClosure (defense-in-depth)
    - Formulaire hybride toggle inventaire/libre dans le même composant
key_files:
  created:
    - src/components/work-orders/work-order-timer.tsx
    - src/components/work-orders/work-order-parts.tsx
    - src/components/work-orders/work-order-fault-form.tsx
    - src/components/work-orders/work-order-closure-banner.tsx
  modified:
    - src/app/(app)/bons-de-travail/[id]/page.tsx
    - src/components/work-orders/work-order-detail.tsx
decisions:
  - "WorkOrderFaultForm affiché conditionnellement : uniquement si faultCode requis OU déjà renseigné (évite UI vide pour BTs sans exigence de fault)"
  - "WorkOrderParts toujours visible : les pièces sont utiles même sans exigence partsUsed"
  - "laborCostDisplay calculé depuis assignees.membership.hourlyRate (snapshot actuel) — pas depuis un rate historique figé au moment du log"
  - "activeSession détecté par endedAt === null côté client — source de vérité DB confirmée au reload"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-25T18:01:10Z"
  tasks_completed: 5
  tasks_total: 6
  files_created: 4
  files_modified: 2
---

# Phase 06 Plan 02: Intégration UI terrain — Summary (partiel, checkpoint en attente)

**One-liner:** Page détail BT enrichie avec timer live (setInterval), formulaire pièces hybride inventaire/libre, formulaire fault code, banner closure amber, et coût main-d'œuvre dans la sidebar.

**Statut :** Tasks 1–5 complétées et committées. Task 6 (checkpoint humain) en attente d'approbation.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Étendre page.tsx + types WorkOrderDetail | 8f0476a | page.tsx, work-order-detail.tsx |
| 2 | Créer WorkOrderTimer | ddf38a5 | work-order-timer.tsx |
| 3 | Créer WorkOrderParts | a3d295f | work-order-parts.tsx |
| 4 | Créer WorkOrderFaultForm + WorkOrderClosureBanner | 49c614f | work-order-fault-form.tsx, work-order-closure-banner.tsx |
| 5 | Câbler les 4 composants dans WorkOrderDetail | 13cba19 | work-order-detail.tsx |
| 6 | Checkpoint humain | — | En attente |

## What Was Built

### page.tsx — Chargement étendu
- `parts: { include: { sparePart } }` — pièces du BT avec détails inventaire
- `assignees.membership.hourlyRate` — taux horaire pour calcul coût main-d'œuvre
- `timeLogs.membership.id` — identifiant nécessaire pour détecter la session active
- `orgConfig.closureRequirements` — config exigences de l'organisation
- `spareParts` findMany — liste pour le dropdown inventaire
- `currentMembership.role` — rôle pour contrôle d'accès bouton Fermer timer

### WorkOrderTimer (work-order-timer.tsx)
- Ticker setInterval toutes les secondes depuis `activeSession.startedAt`
- Bouton "Démarrer" si `status === in_progress` et aucune session ouverte
- Bouton "Arrêter" si session appartenant au membre courant
- Bouton "Fermer" (X) si session d'un autre membre et role `admin|manager`
- `formatElapsed` : affichage `mm:ss` ou `Xh mm:ss`

### WorkOrderParts (work-order-parts.tsx)
- Toggle mode inventaire (dropdown SparePart avec stock) / libre (texte libre)
- Création → `upsertWorkOrderPart` (décrément stock côté serveur en transaction)
- Édition inline → `upsertWorkOrderPart` (pas de réajustement stock)
- Suppression avec confirmation → `deleteWorkOrderPart`
- Liste : nom, badge "(inventaire)", quantité × coût ligne

### WorkOrderFaultForm (work-order-fault-form.tsx)
- Sélecteur catégorie depuis `FAULT_CATEGORIES` / `FAULT_CATEGORY_LABELS`
- Textarea description libre
- Bouton "Enregistrer" affiché uniquement si dirty (évite soumissions accidentelles)
- Indicateur `*` si champ requis selon `closureRequirements.faultCode`

### WorkOrderClosureBanner + computeMissingForClosure (work-order-closure-banner.tsx)
- Banner amber listé les champs manquants via `CLOSURE_FIELD_LABELS`
- Retourne `null` si `missing.length === 0` (invisible si tout est OK)
- `computeMissingForClosure` : wrapper client de `validateClosure`

### WorkOrderDetail — Intégration
- `activeSession` : premier log avec `endedAt === null`
- `missingForClosure` : calculé via `computeMissingForClosure`
- `laborCostDisplay` : Σ(minutes/60 × hourlyRate) par membre, `'—'` si aucun taux
- Boutons `resolved`/`closed` : `disabled={blocks}` avec tooltip listant les champs manquants
- `WorkOrderClosureBanner` juste avant les boutons de statut
- `WorkOrderTimer` en haut de la colonne principale
- `WorkOrderFaultForm` conditionnel (faultCode requis ou déjà renseigné)
- `WorkOrderParts` toujours visible
- Coût main-d'œuvre dans sidebar Détails

## Threat Model Applied

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-06-11 | mitigate | `disabled={blocks}` côté client (UX) ; `updateWorkOrderStatus` ré-exécute `validateClosure` côté serveur (Plan 01) |
| T-06-12 | mitigate | Bouton "Fermer" masqué si non-manager (UI) ; `closeActiveTimer` vérifie le rôle serveur (Plan 01) |
| T-06-13 | accept | hourlyRate interne à l'org — risque accepté (D-16) |
| T-06-14 | accept | Server Action throw si session déjà active |
| T-06-15 | accept | unitCost non-sensible, déjà visible en /inventaire |

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit. La seule erreur TypeScript existante est dans `src/app/api/v1/work-orders/route.ts` (préexistante, documentée en 06-01, hors périmètre).

## Known Stubs

None — tous les composants sont fonctionnels avec vrais Server Actions et vraies données Prisma.

## Threat Flags

None — aucune nouvelle surface de sécurité non couverte par le threat model.

## Self-Check: PASSED

- [x] `src/components/work-orders/work-order-timer.tsx` — EXISTS
- [x] `src/components/work-orders/work-order-parts.tsx` — EXISTS
- [x] `src/components/work-orders/work-order-fault-form.tsx` — EXISTS
- [x] `src/components/work-orders/work-order-closure-banner.tsx` — EXISTS
- [x] Commit 8f0476a — page.tsx + types étendus
- [x] Commit ddf38a5 — WorkOrderTimer
- [x] Commit a3d295f — WorkOrderParts
- [x] Commit 49c614f — WorkOrderFaultForm + WorkOrderClosureBanner
- [x] Commit 13cba19 — Câblage complet WorkOrderDetail
- [x] Aucune erreur TS dans les fichiers modifiés par ce plan
