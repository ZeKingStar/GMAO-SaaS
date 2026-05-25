---
status: complete
phase: 05-portail-de-demandes-de-travail
source: [05-03-PLAN.md]
started: 2026-05-25T00:00:00Z
updated: 2026-05-25T00:00:00Z
---

## Current Test

All 10 tests passed — human UAT approved 2026-05-25.

## Tests

### 1. Section "Portails publics" visible (admin)
expected: La section "Portails publics" apparaît dans /parametres/organisation pour les rôles admin et manager
result: passed

### 2. Activer un portail
expected: Cliquer "Activer le portail" génère un token UUID, affiche l'URL complète `http://localhost:3000/portail/{uuid}` et un toast "Portail activé"
result: passed

### 3. Copier l'URL
expected: Le bouton "Copier" copie l'URL dans le presse-papier et l'icône passe à "Copié" pendant 2 secondes
result: passed

### 4. Page publique accessible sans authentification
expected: En fenêtre privée (sans session Clerk), l'URL du portail s'affiche SANS redirection vers /sign-in — formulaire visible avec nom de l'organisation et du site
result: passed

### 5. Soumission d'une demande (anonyme)
expected: Formulaire rempli (Nom "Jean Test", Email réel, Localisation "Salle B-203", Description "Ceci est une demande de test depuis le portail public") → cliquer "Envoyer" → message de succès avec numéro de BT (ex. "#42")
result: passed

### 6. BT créé dans l'admin
expected: Dans /bons-de-travail, nouveau BT avec le numéro du succès, statut "Ouvert", contenant "Jean Test", "Salle B-203" et le bon site
result: passed

### 7. Email de confirmation reçu
expected: Email Korvia arrivé dans la boîte indiquée à l'étape 5, contenant le numéro BT, le nom du site et le nom de l'organisation
result: passed

### 8. Désactivation du portail
expected: Admin clique "Désactiver" → en fenêtre privée, rafraîchir l'URL → page 404
result: passed

### 9. Régénération du token
expected: Réactiver le portail, cliquer "Régénérer" → confirmer dans la dialog → nouveau token différent. Ancienne URL → 404. Nouvelle URL → fonctionnelle
result: passed

### 10. Gating de rôle
expected: Connexion en tant que technician ou viewer → /parametres/organisation → section "Portails publics" absente
result: passed

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
