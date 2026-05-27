---
status: partial
phase: 08-productivit-technicien
source: [08-03-PLAN.md, checkpoint humain task 4]
started: 2026-05-27T00:00:00Z
updated: 2026-05-27T00:00:00Z
---

## Current Test

Validation humaine Phase 8 — PROD-01 + PROD-02 + PROD-03

## Tests

### 1. PROD-01 — Section "Pièces requises" accessible depuis le dialog de plan
expected: La section "Pièces requises" est visible dans le dialog d'édition d'un plan sans action supplémentaire
result: ISSUE — La section n'apparaît pas par défaut. Il faut fermer et rouvrir le dialog pour la voir.

### 2. PROD-01 — Sauvegarde d'une pièce ne ferme pas le dialog
expected: Cliquer "Enregistrer" après l'ajout d'une pièce reste dans le dialog d'édition (toast de confirmation uniquement)
result: ISSUE — Le bouton "Enregistrer" ferme le plan complètement au lieu de rester dans le dialog.

### 3. PROD-01 — Sélection de pièce existante — ergonomie avec grand volume
expected: Le combobox de sélection de pièce supporte des milliers d'articles avec recherche et filtres
result: ISSUE — L'interface actuelle (combobox simple) ne passe pas à l'échelle. Besoin d'un modal dédié avec filtres (référence, description, catégorie, etc.) — comparable à un sélecteur de pièce Maximo.

### 4. PROD-01 — Ajout de plusieurs étapes en séquence
expected: Possible d'ajouter plusieurs pièces/étapes rapidement sans confirmation bloquante à chaque fois
result: ISSUE — Pas de mode "ajout rapide" ou confirmation légère entre chaque ajout. Chaque ajout force une interaction complète.

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
expected: Les listes (BTs, plans, actifs) ont des en-têtes cliquables pour trier et filtrer par numéro, description, statut, etc. (comparable à Maximo)
result: FEEDBACK — À implémenter. L'utilisateur souhaite pouvoir filtrer rapidement par colonne dans toutes les listes principales.

### 14. PROD-02/UI — Hover sur les boutons de filtre
expected: État intermédiaire visible au survol des boutons de filtre (entre l'état "pale" et "sélectionné foncé")
result: FEEDBACK — L'état hover actuel est trop similaire à l'état normal. Besoin d'un état visuel distinct au mouse-over.

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

## Summary

total: 20
passed: 0
issues: 4
pending: 13
skipped: 0
blocked: 0

## Gaps

### GAP-1 — Pièces requises : visibilité et comportement du dialog
type: bug
severity: high
description: >
  La section "Pièces requises" n'est pas visible par défaut dans le dialog d'édition de plan.
  De plus, le bouton "Enregistrer" ferme le dialog entier au lieu de confirmer uniquement l'ajout de pièce.
steps_to_reproduce:
  - Ouvrir le dialog d'édition d'un plan existant
  - Observer l'absence de la section "Pièces requises"
  - Fermer / rouvrir → section apparaît
  - Ajouter une pièce → cliquer "Enregistrer" → dialog fermé
expected: Section visible d'emblée; "Enregistrer" reste dans le dialog avec toast de confirmation
status: open

### GAP-2 — Sélecteur de pièces : scalabilité
type: ux
severity: high
description: >
  Le combobox actuel ne supporte pas un catalogue de milliers de pièces. Besoin d'un modal
  dédié avec recherche full-text et filtres (référence, description, catégorie, fournisseur)
  pour correspondre aux standards GMAO (Maximo, SAP PM).
status: open

### GAP-3 — Ajout séquentiel de pièces/étapes
type: ux
severity: medium
description: >
  Impossible d'ajouter plusieurs pièces rapidement. Chaque ajout nécessite une interaction
  complète. Un mode "ajouter et continuer" (confirmation légère, champ qui se réinitialise)
  améliorerait significativement la productivité.
status: open

### GAP-4 — En-têtes de colonnes filtrables dans les listes
type: feature
severity: medium
description: >
  Les listes (BTs, plans de maintenance, actifs) n'ont pas d'en-têtes de colonnes
  cliquables pour trier/filtrer. L'utilisateur souhaite un comportement comparable à Maximo :
  clic sur en-tête → tri, filtre textuel par colonne.
status: open

### GAP-5 — État hover des boutons de filtre
type: ux
severity: low
description: >
  L'état visuel au survol (hover) des boutons de filtre est insuffisamment distinct de
  l'état normal. Besoin d'un état intermédiaire clair entre "pale" (non sélectionné) et
  "foncé" (sélectionné actif).
status: open

### GAP-6 — Cron CRON_SECRET non autorisé en test local
type: config
severity: medium
description: >
  La valeur `CRON_SECRET=2` dans .env est correctement définie mais le test curl a échoué.
  Vérifier que le serveur dev était bien démarré et que la variable est chargée.
  Commande de test : `curl -H "Authorization: Bearer 2" http://localhost:3000/api/cron/urgent-escalation`
status: open
