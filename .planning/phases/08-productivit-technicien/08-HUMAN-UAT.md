---
status: partial
phase: 08-productivit-technicien
source: [08-03-PLAN.md, checkpoint humain task 4, 08-VERIFICATION.md]
started: 2026-05-27T00:00:00Z
updated: 2026-05-28T12:00:00Z
---

## Current Test

Validation humaine Phase 8 — PROD-01 + PROD-02 + PROD-03

## Tests

### 1. PROD-01 — Section "Pièces requises" accessible depuis le dialog de plan
expected: La section "Pièces requises" est visible dans le dialog d'édition d'un plan sans action supplémentaire
result: RESOLVED — Corrigé par 08-04 : key={plan?.id} + re-sync handleOpen. À valider visuellement.

### 2. PROD-01 — Sauvegarde d'une pièce ne ferme pas le dialog
expected: Cliquer "Enregistrer" après l'ajout d'une pièce reste dans le dialog d'édition (toast de confirmation uniquement)
result: RESOLVED — Corrigé par 08-04 : <form> remplacé par <div> + onClick. À valider visuellement.

### 3. PROD-01 — Sélection de pièce existante — ergonomie avec grand volume
expected: Le combobox de sélection de pièce supporte des milliers d'articles avec recherche et filtres
result: RESOLVED — Corrigé par 08-05 : SparePartPickerDialog avec recherche full-text + filtre fournisseur. À valider visuellement.

### 4. PROD-01 — Ajout de plusieurs étapes en séquence
expected: Possible d'ajouter plusieurs pièces/étapes rapidement sans confirmation bloquante à chaque fois
result: RESOLVED — Corrigé par 08-04 : bouton "+ Continuer" (keepFormOpen=true). À valider visuellement.

### 5. PROD-01 — Bouton "Générer un BT" depuis un plan
expected: Cliquer le bouton crée un BT pré-rempli et redirige vers /bons-de-travail/{id}
result: pending

### 6. PROD-01 — BT généré contient les données du plan
expected: Titre = nom du plan, type = preventive, priorité = celle du plan, asset = celui du plan
result: pending

### 7. PROD-01 — BT généré contient les pièces du plan (stock inchangé)
expected: Section "Pièces" du BT contient les pièces définies dans le plan, stock non décrémenté
result: pending

### 8. PROD-02 — Section "Checklist" présente sur un BT issu d'un plan
expected: BT généré depuis un plan affiche une section Checklist avec les tâches du plan dans l'ordre
result: pending

### 9. PROD-02 — Cocher un item de checklist
expected: La coche persiste, texte barré, compteur "X/Y complétés" mis à jour
result: pending

### 10. PROD-02 — Saisir une mesure dans un item de checklist
expected: Champ "Mesure / valeur" librement saisissable, toast "Mesure enregistrée" au blur
result: pending

### 11. PROD-02 — Persistance des coches et mesures après refresh
expected: Refresh de la page → coches et mesures telles que saisies
result: pending

### 12. PROD-02 — BT correctif sans checklist
expected: Un BT créé manuellement (non issu d'un plan) n'affiche PAS de section Checklist
result: pending

### 13. PROD-02 — En-têtes de colonnes filtrables dans les listes
expected: Les listes (BTs, plans, actifs) ont des en-têtes cliquables pour trier par numéro, description, statut, etc.
result: RESOLVED — Corrigé par 08-06 : SortHeader avec flèche ASC/DESC sur 6 cols (BT) + 4 cols (plans). À valider visuellement.

### 14. PROD-02/UI — Hover sur les boutons de filtre
expected: État intermédiaire visible au survol des boutons de filtre (entre l'état "pale" et "sélectionné foncé")
result: RESOLVED — Corrigé par 08-06 : hover:bg-accent sur les boutons de filtre. À valider visuellement.

### 15. PROD-03 — Configuration escalade dans /parametres/organisation
expected: Section "Escalade des bons urgents" visible, toggle + champ delayHours, sauvegarde via toast
result: pending

### 16. PROD-03 — Déclenchement cron local
expected: `curl -H "Authorization: Bearer 2" http://localhost:3000/api/cron/urgent-escalation` retourne `{ ok: true, ... }`
result: ISSUE — Requête non autorisée. À tester avec : `curl -H "Authorization: Bearer 2" http://localhost:3000/api/cron/urgent-escalation`

### 17. PROD-03 — Réponse cron avec BT urgent éligible
expected: `{ ok: true, orgsProcessed: ≥1, workOrdersFound: ≥1, emailsSent: ≥1 }`
result: pending

### 18. PROD-03 — Email reçu dans dashboard Resend
expected: Email "Bon de travail urgent non résolu" reçu par les admin/manager
result: pending

### 19. PROD-03 — Idempotence du cron
expected: Re-déclencher le cron → `emailsSent: 0` (escalationSentAt déjà positionné)
result: pending

### 20. PROD-03 — Désactiver l'escalade stoppe les envois
expected: Désactiver le toggle + sauvegarder → cron ne génère plus d'emails même pour BTs urgents anciens
result: pending

### 21. PROD-02 — Photos sur mobile dans la checklist
expected: Les items de checklist permettent d'attacher une photo (champ photoUrl dans le schéma)
result: pending — Décision requise : gap réel ou fonctionnalité intentionnellement reportée ?

### 22. PROD-03 — Comportement cron avec orgs sans escalationConfig
expected: Les orgs sans config ne reçoivent aucun email (filtre { not: undefined } + double sécurité parseEscalationConfig)
result: pending — Valider avec curl après démarrage dev server

### 23. Checkpoint end-to-end Phase 8 (25 étapes)
expected: Toutes les étapes PROD-01/02/03 du protocole 08-03 Task 4 produisent les résultats attendus
result: pending — Parcours utilisateur complet requis

## Summary

total: 23
passed: 0
issues: 0
pending: 14
skipped: 0
blocked: 0
resolved_gaps: 5

## Gaps

### GAP-1 — Pièces requises : visibilité et comportement du dialog
type: bug
severity: high
status: resolved
resolved_by: 08-04-PLAN.md
resolution: key={plan?.id} sur DialogContent + re-sync handleOpen + suppression <form> imbriqué

### GAP-2 — Sélecteur de pièces : scalabilité
type: ux
severity: high
status: resolved
resolved_by: 08-05-PLAN.md
resolution: SparePartPickerDialog avec recherche full-text + filtre fournisseur remplace le <select> natif

### GAP-3 — Ajout séquentiel de pièces/étapes
type: ux
severity: medium
status: resolved
resolved_by: 08-04-PLAN.md
resolution: Bouton "+ Continuer" avec handleAddPart(keepFormOpen=true)

### GAP-4 — En-têtes de colonnes filtrables dans les listes
type: feature
severity: medium
status: resolved
resolved_by: 08-06-PLAN.md
resolution: SortHeader sur 6 colonnes (BT) + 4 colonnes (plans de maintenance), tri ASC/DESC avec indicateur visuel

### GAP-5 — État hover des boutons de filtre
type: ux
severity: low
status: resolved
resolved_by: 08-06-PLAN.md
resolution: hover:bg-accent sur les boutons de filtre (état intermédiaire distinct)

### GAP-6 — Cron CRON_SECRET non autorisé en test local
type: config
severity: medium
status: pending
description: >
  Tester avec le serveur dev démarré : `curl -H "Authorization: Bearer 2" http://localhost:3000/api/cron/urgent-escalation`
  Le filtre { not: undefined } est un workaround documenté — la double sécurité parseEscalationConfig protège en production.
