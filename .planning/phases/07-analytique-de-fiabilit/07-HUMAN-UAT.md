---
status: partial
phase: 07-analytique-de-fiabilit
source: [07-04-PLAN.md]
started: 2026-05-26T14:00:00Z
updated: 2026-05-26T14:00:00Z
---

## Current Test

En attente de validation humaine — démarrer le serveur et suivre les 12 vérifications ci-dessous.

**Pré-requis :**

```bash
npm run dev
```

Se connecter comme manager d'une org avec plan `growth` ou `enterprise` (au besoin activer god mode via `ENABLE_GOD_MODE=true`).

## Tests

### 1. Page /rapports — structure générale
expected: `/rapports` affiche 5 tabs ("Vue générale", "Top pannes", "MTTR", "Coût actifs", "Planifié vs Réel") + un sélecteur de période à droite de l'entête
result: [pending]

### 2. Tab "Vue générale"
expected: 4 KPI cards (BTs ouverts, en cours, clôturés, créés sur période), distributions statut/priorité, plans de maintenance, top actifs, pièces stock faible — contenu Phase 6 intact
result: [pending]

### 3. Tab "Top pannes" — FIAB-01
expected: Si des BTs clôturés ont `faultProblem` non null sur la période → tableau groupé par (Problème + Catégorie) trié par occurrence décroissante. Sinon → état vide "Aucun code de panne saisi sur la période"
result: [pending]

### 4. Tab "MTTR" — FIAB-02
expected: Si des BTs correctifs ont des timeLogs sur la période → top 20 actifs par MTTR décroissant (heures) avec barre visuelle proportionnelle. Sinon → état vide "Aucune session de temps enregistrée"
result: [pending]

### 5. Tab "Coût actifs" — FIAB-03
expected: Top 20 actifs par coût total (MO + pièces) décroissant. Si un technicien n'a pas de `hourlyRate` → banner amber + badge "taux manquant" sur les lignes concernées
result: [pending]

### 6. Tab "Planifié vs Réel" — FIAB-04, sous-onglet "Par BT"
expected: Table listant les BTs avec colonnes date planifiée / date réelle / écart. URL reflète `?subtab=work-order`
result: [pending]

### 7. Tab "Planifié vs Réel" — sous-onglets "Par technicien" et "Par type d'actif"
expected: Cliquer "Par technicien" → agrégation par technicien ; "Par type d'actif" → agrégation par catégorie d'actif. L'URL met à jour `?subtab=` à chaque changement
result: [pending]

### 8. Sélecteur de période
expected: Changer "Ce mois" → "Cette année" via le sélecteur → URL passe à `?period=year` → données de tous les tabs rechargées pour refléter la nouvelle période
result: [pending]

### 9. Formulaire P/C/R sur un BT actif
expected: Ouvrir un BT non clôturé → formulaire de panne affiche 3 champs distincts (Problème, Cause, Remède) + sélecteur de catégorie. Remplir + sauvegarder + recharger la page → les valeurs persistent
result: [pending]

### 10. Multi-tenancy
expected: Se connecter avec un compte d'une autre organisation → `/rapports` n'affiche aucune donnée de l'org précédente
result: [pending]

### 11. Plan starter — UpgradeGate
expected: Se connecter avec un compte sur plan `starter` et accéder à `/rapports` → affichage d'un UpgradeGate (pas d'accès aux rapports), aucune donnée de rapport exposée
result: [pending]

### 12. Build TypeScript + tests
expected: `npx tsc --noEmit` → 0 erreur. `npx vitest run` → tous les tests passent (dont les 17 tests Phase 7)
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0

## Gaps
