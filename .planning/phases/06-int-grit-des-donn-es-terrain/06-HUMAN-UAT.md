---
status: partial
phase: 06-int-grit-des-donn-es-terrain
source: [06-02-PLAN.md]
started: 2026-05-25T18:00:00Z
updated: 2026-05-25T18:00:00Z
---

## Current Test

En attente de validation humaine — ouvrir un BT réel et suivre les 14 étapes ci-dessous.

**Pré-requis DB avant test :**

```sql
UPDATE "Organization"
SET "closureRequirements" = '{"faultCode":true,"timeSpent":true,"partsUsed":true}'::jsonb
WHERE "clerkId" = '<your_org_clerk_id>';

UPDATE "Membership"
SET "hourlyRate" = 65
WHERE id = '<your_membership_id>';
```

## Tests

### 1. Lancer le serveur et ouvrir un BT
expected: `npm run dev` → ouvrir un BT en status `open` → page de détail se charge normalement
result: [pending]

### 2. Démarrer le BT (transition in_progress)
expected: Cliquer "Démarrer" sur le bon de travail → status passe à `in_progress` → bloc Timer apparaît avec bouton "Démarrer"
result: [pending]

### 3. Démarrer le timer
expected: Cliquer "Démarrer" dans le bloc Timer → un compteur `mm:ss` commence à tiquer en temps réel (1 seconde d'intervalle)
result: [pending]

### 4. Persistance du timer au refresh
expected: Rafraîchir la page → le compteur reprend depuis `startedAt` (continuité, pas reset à 0)
result: [pending]

### 5. Arrêter le timer
expected: Cliquer "Arrêter" → session fermée, compteur disparaît, section "Temps" affiche la ligne avec les minutes enregistrées
result: [pending]

### 6. Banner de clôture amber
expected: Banner amber visible listant les champs manquants : "Pour clore ce bon, complétez : Code de panne, Temps passé, Pièces utilisées"
result: [pending]

### 7. Saisir le fault code
expected: Sélectionner Catégorie = "Mécanique", saisir Description = "test", cliquer "Enregistrer" → banner retire "Code de panne" de la liste
result: [pending]

### 8. Ajouter une pièce libre
expected: Mode "Pièce libre" → saisir nom + quantité 2 → soumettre → banner retire "Pièces utilisées" de la liste
result: [pending]

### 9. Ajouter une pièce inventaire
expected: Mode "Inventaire" → sélectionner une pièce existante → soumettre → vérifier en DB que `quantityOnHand` a diminué du bon montant
result: [pending]

### 10. Coût de main-d'œuvre dans la sidebar
expected: Sidebar affiche "Coût main-d'œuvre : X.XX $" calculé comme `(totalMinutes / 60) × 65` — ou "—" si aucun taux configuré
result: [pending]

### 11. Banner vide → boutons clôture actifs
expected: Après étapes 7 + 8 (ou 9), le banner est vide ou absent, boutons "Marquer résolu" et "Fermer" ne sont plus grisés
result: [pending]

### 12. Marquer résolu
expected: Cliquer "Marquer résolu" → succès, status du BT passe à `resolved`
result: [pending]

### 13. Test négatif — clôture bloquée sans champs
expected: Sur un autre BT (status `in_progress`, champs vides) → bouton "Marquer résolu" est désactivé avec tooltip listant les champs manquants
result: [pending]

### 14. Test de rôles — timer d'un autre membre
expected: Avec un compte technicien : ne voit PAS le bouton "Fermer" sur une session démarrée par un autre membre. Avec un admin : le voit et peut fermer la session.
result: [pending]

## Summary

total: 14
passed: 0
issues: 0
pending: 14
skipped: 0
blocked: 0

## Gaps
