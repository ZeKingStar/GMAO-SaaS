---
phase: 09-maintenance-conditionnelle
verified: 2026-05-29T02:48:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification: false
human_verification:
  - test: "Saisir un relevé de compteur depuis /actifs sur un actif avec compteur"
    expected: "Toast 'Relevé enregistré — compteur et plans mis à jour' + AssetMeter.value mis à jour en DB + nextMeterValue recalculé sur les plans meter_based liés"
    why_human: "Comportement UI transactionnel — nécessite session auth active, actif avec compteur en DB, vérification via Prisma Studio ou requête directe"
  - test: "Tenter de saisir une valeur négative ou non numérique dans AssetMeterSection"
    expected: "Toast d'erreur 'Valeur invalide — entrez un nombre positif' sans appel serveur"
    why_human: "Validation côté client puis serveur — l'erreur toast s'affiche avant l'appel Server Action"
  - test: "Configurer un PM meter_based avec nextMeterValue=1000 sur un actif dont AssetMeter.value=1500, puis attendre ou déclencher manuellement GET /api/cron/meter-threshold-check avec Bearer CRON_SECRET"
    expected: "Un BT est créé automatiquement, nextMeterValue avancé à 2000 (1500+500), aucun doublon si relancé"
    why_human: "Intégration end-to-end cron → DB réelle — nécessite données configurées et appel HTTP authentifié"
---

# Phase 9: Maintenance Conditionnelle — Rapport de Vérification

**Objectif de la phase :** Implémenter la maintenance conditionnelle (meter-based) — permettre la saisie de relevés compteur sur les actifs et déclencher automatiquement des bons de travail quand les seuils configurés sont atteints.
**Vérifié :** 2026-05-29T02:48:00Z
**Statut :** human_needed
**Re-vérification :** Non — vérification initiale

---

## Vérités Observables

| # | Vérité | Statut | Preuve |
|---|--------|--------|--------|
| 1 | Un technicien peut saisir un relevé de compteur directement sur un actif depuis /actifs (hors contexte BT) | ✓ VERIFIED | `AssetMeterSection` rendu dans `asset-list.tsx` (ligne 87-89), câblé via `asset.meters` inclus dans la query page |
| 2 | La saisie d'un relevé met à jour AssetMeter.value avec la nouvelle valeur | ✓ VERIFIED | `updateMeterAndPlans` appelle `db.assetMeter.update({ data: { value: reading } })` — test 1 vert |
| 3 | La saisie d'un relevé recalcule nextMeterValue pour tous les plans meter_based liés à l'actif | ✓ VERIFIED | `updateMeterAndPlans` itère sur plans meter_based et appelle `update({ data: { nextMeterValue: reading + plan.meterThreshold } })` — test 2 vert |
| 4 | Une valeur négative ou non finie est rejetée avec une erreur | ✓ VERIFIED | Validation cliente dans `handleSave()` + validation serveur `Number.isFinite(reading) \|\| reading < 0` dans `recordMeterReadingOnAsset` (work-orders.ts:172) |
| 5 | Un actif d'une autre organisation ne peut pas être modifié | ✓ VERIFIED | `db.asset.findFirst({ where: { id: assetId, organizationId } })` avant toute écriture (work-orders.ts:177-181) |
| 6 | Un cron horaire vérifie chaque plan meter_based actif et compare AssetMeter.value à nextMeterValue | ✓ VERIFIED | Route Handler GET authentifié, query `findMany` filtrée sur `isActive: true, triggerType: 'meter_based', nextMeterValue: { not: null }, assetId: { not: null }` — test détection vert |
| 7 | Quand AssetMeter.value >= nextMeterValue, un BT est généré automatiquement sans doublon | ✓ VERIFIED | Guard idempotence `db.workOrder.findFirst({ status: { in: ['open','in_progress','on_hold'] } })` avant appel `generateWorkOrderFromPlanInternal` — test idempotence vert (triggered=0 si BT actif) |
| 8 | Le cron rejette toute requête sans Bearer CRON_SECRET valide | ✓ VERIFIED | Contrôle `authHeader !== \`Bearer ${expectedToken}\`` → 401 — 2 tests auth verts (token absent + token incorrect) |

**Score :** 8/8 vérités confirmées

---

## Artefacts Requis

### Plan 09-01 (COND-01)

| Artefact | Description | Existe | Substantiel | Câblé | Statut |
|----------|-------------|--------|-------------|-------|--------|
| `src/lib/meter-utils.ts` | Helper `updateMeterAndPlans` | ✓ | ✓ (34 lignes, logique complète) | ✓ importé dans `work-orders.ts:7` | ✓ VERIFIED |
| `src/lib/meter-utils.test.ts` | 4 tests Vitest | ✓ | ✓ (113 lignes, 4 blocs `it(`) | ✓ 4/4 verts | ✓ VERIFIED |
| `src/actions/work-orders.ts` | Export `recordMeterReadingOnAsset` | ✓ | ✓ (auth + validation + scoping org + updateMeterAndPlans) | ✓ importé dans `asset-meter-section.tsx:8` | ✓ VERIFIED |
| `src/components/assets/asset-meter-section.tsx` | Composant client saisie compteur | ✓ | ✓ ('use client', Input + Button + toast + handleSave) | ✓ importé et rendu dans `asset-list.tsx:11,87-89` | ✓ VERIFIED |
| `src/app/(app)/actifs/page.tsx` | Query include `meters: true` + rendu `AssetList` | ✓ | ✓ (`meters: true` ligne 22, `AssetList` rendu ligne 34) | ✓ `AssetList` reçoit `assets` avec `meters` | ✓ VERIFIED |

### Plan 09-02 (COND-02)

| Artefact | Description | Existe | Substantiel | Câblé | Statut |
|----------|-------------|--------|-------------|-------|--------|
| `src/actions/maintenance.ts` | Export `generateWorkOrderFromPlanInternal` | ✓ | ✓ (lignes 141-192, logique complète sans auth()) | ✓ importé dans `route.ts:3` | ✓ VERIFIED |
| `src/app/api/cron/meter-threshold-check/route.ts` | Route Handler GET cron | ✓ | ✓ (74 lignes, auth + boucle + idempotence + avancement seuil) | ✓ enregistré dans `vercel.json` | ✓ VERIFIED |
| `src/app/api/cron/meter-threshold-check/route.test.ts` | 7 tests Vitest | ✓ | ✓ (168 lignes, 7 blocs `it(`) | ✓ 7/7 verts | ✓ VERIFIED |
| `vercel.json` | Entrée cron `meter-threshold-check` à `0 * * * *` | ✓ | ✓ (3 crons, entrée présente) | ✓ JSON valide, chemin `/api/cron/meter-threshold-check` | ✓ VERIFIED |

---

## Vérification des Liens Clés

| De | Vers | Via | Statut | Détail |
|----|------|-----|--------|--------|
| `asset-meter-section.tsx` | `recordMeterReadingOnAsset` | import + appel au submit | ✓ WIRED | Ligne 8 import, ligne 33 appel dans `handleSave()` |
| `work-orders.ts` | `updateMeterAndPlans` | import depuis `@/lib/meter-utils` | ✓ WIRED | Ligne 7 import, ligne 183 appel dans `recordMeterReadingOnAsset` |
| `actifs/page.tsx` | `asset.meters` | `meters: true` dans query Prisma | ✓ WIRED | Ligne 22 dans `db.asset.findMany` include |
| `asset-list.tsx` | `AssetMeterSection` | import + rendu conditionnel | ✓ WIRED | Ligne 11 import, lignes 87-89 rendu `if (asset.meters.length > 0)` |
| `route.ts (cron)` | `generateWorkOrderFromPlanInternal` | import + appel dans boucle | ✓ WIRED | Ligne 3 import, ligne 46 appel |
| `route.ts (cron)` | Guard idempotence `db.workOrder.findFirst` | query avec `status: { in: [...] }` | ✓ WIRED | Lignes 36-43, statuts `open/in_progress/on_hold` |
| `vercel.json` | `/api/cron/meter-threshold-check` | entrée crons schedule | ✓ WIRED | 3ème entrée, schedule `0 * * * *` |
| `maintenance.ts` | `generateWorkOrderFromPlan` (wrapper) | délègue à `generateWorkOrderFromPlanInternal` | ✓ WIRED | Ligne 196 — Server Action publique est un wrapper thin sans duplication |

---

## Trace de Flux de Données (Niveau 4)

| Artefact | Variable de données | Source | Produit des données réelles | Statut |
|----------|--------------------|---------|-----------------------------|--------|
| `AssetMeterSection` | `meters` prop | `db.asset.findMany({ include: { meters: true } })` via `actifs/page.tsx` | Oui — query Prisma réelle, pas de valeur statique | ✓ FLOWING |
| `asset-list.tsx` | `asset.meters` | transmis depuis page sans transformation | Oui — tableau direct depuis Prisma | ✓ FLOWING |
| `cron route.ts` | `plans` + `meter.value` | `db.maintenancePlan.findMany({ include: { asset: { include: { meters: { take: 1 } } } } })` | Oui — query Prisma avec includes imbriqués | ✓ FLOWING |
| `meter-utils.ts` | `meter.value` → `reading` | paramètre `reading` validé en amont | Oui — valeur utilisateur validée (≥0, finie) | ✓ FLOWING |

---

## Tests Comportementaux (Spot-Checks)

| Comportement | Commande | Résultat | Statut |
|-------------|---------|---------|--------|
| 4 tests `updateMeterAndPlans` verts | `npx vitest run src/lib/meter-utils.test.ts` | 4/4 passed | ✓ PASS |
| 7 tests cron `meter-threshold-check` verts | `npx vitest run src/app/api/cron/meter-threshold-check/route.test.ts` | 7/7 passed | ✓ PASS |
| Aucune erreur TS dans les fichiers source Phase 9 | `npx tsc --noEmit` filtré sur fichiers Phase 9 | 0 erreurs dans les 5 fichiers source Phase 9 | ✓ PASS |
| 3 crons dans vercel.json avec `meter-threshold-check` | Lecture fichier | `/api/cron/meter-threshold-check` présent, schedule `0 * * * *` | ✓ PASS |
| Aucune unité codée en dur dans AssetMeterSection | `grep -n "\"h\"\|'h'" asset-meter-section.tsx` | Aucun résultat | ✓ PASS |
| generateWorkOrderFromPlanInternal sans auth() | Lecture maintenance.ts lignes 141-192 | Aucun appel `auth()` ni `getOrgAndMembership()` dans le corps | ✓ PASS |

Note : Les erreurs TypeScript présentes dans le projet (`toggleChecklistItem`, `setWorkOrderFault`, etc.) sont des régressions de la Phase 8 sur des fichiers non touchés par la Phase 9. L'erreur de cast dans `meter-utils.test.ts` (TS2352) n'empêche pas les tests de passer (Vitest ignore les erreurs de type dans les tests).

---

## Couverture des Exigences

| Exigence | Plan source | Description | Statut | Preuve |
|----------|------------|-------------|--------|--------|
| COND-01 | 09-01-PLAN.md | Un technicien peut saisir un relevé de compteur (heures moteur, cycles, km) à la clôture d'un BT ou directement sur un actif | ✓ SATISFIED | Saisie à la clôture BT : livrée en Phase 8 (`recordMeterReading`). Saisie directe sur actif : livrée en Phase 9-01 (`recordMeterReadingOnAsset` + `AssetMeterSection`) |
| COND-02 | 09-02-PLAN.md | Un PM configuré avec un seuil de compteur génère automatiquement un BT lorsque l'actif atteint ce seuil | ✓ SATISFIED | Cron `GET /api/cron/meter-threshold-check` implémenté, enregistré dans vercel.json, 7 tests verts incluant détection, idempotence, avancement seuil |

Aucune exigence orpheline — COND-01 et COND-02 sont les seules exigences mappées à la Phase 9 dans REQUIREMENTS.md.

---

## Anti-Patterns Détectés

| Fichier | Ligne | Pattern | Sévérité | Impact |
|---------|-------|---------|----------|--------|
| `src/lib/meter-utils.test.ts` | 29 | Cast TypeScript `as { ... }` non compatible (TS2352) | ℹ️ Info | N'empêche pas les tests de passer — pattern courant pour les mocks Prisma en Vitest ; pourrait être résolu avec `as unknown as ...` |
| `src/app/api/cron/meter-threshold-check/route.ts` | 64-66 | `console.log` de diagnostic | ℹ️ Info | Acceptable pour un cron — utile pour le monitoring Vercel |

Aucun stub bloquant identifié. Toutes les données sont dynamiques.

---

## Vérification Humaine Requise

### 1. Saisie de relevé compteur depuis /actifs

**Test :** Se connecter à l'application, ouvrir /actifs, trouver un actif avec un compteur configuré, saisir une nouvelle valeur dans le champ Input, cliquer "Enregistrer le relevé"
**Attendu :** Toast vert "Relevé enregistré — compteur et plans mis à jour" s'affiche ; via Prisma Studio ou requête directe, `AssetMeter.value` = nouvelle valeur ; `nextMeterValue` recalculé sur tous les plans `meter_based` liés à cet actif
**Pourquoi humain :** Nécessite une session auth active, des données en base (actif avec compteur + plans meter_based), et vérification de persistance DB

### 2. Rejet de valeur invalide

**Test :** Dans AssetMeterSection, effacer le champ et saisir -5 (ou "abc"), puis cliquer "Enregistrer le relevé"
**Attendu :** Toast rouge "Valeur invalide — entrez un nombre positif" sans aucun appel réseau
**Pourquoi humain :** La validation client affiche le toast avant tout appel serveur — comportement non observable par grep

### 3. Déclenchement automatique du cron compteur

**Test :** Configurer un PM meter_based avec `meterThreshold=500` et `nextMeterValue=1000` sur un actif dont `AssetMeter.value=1500`. Appeler `GET /api/cron/meter-threshold-check` avec header `Authorization: Bearer <CRON_SECRET>`. Appeler une deuxième fois.
**Attendu :** Premier appel → `triggered=1`, BT créé, `nextMeterValue` avancé à 2000. Deuxième appel → `triggered=0` (idempotence)
**Pourquoi humain :** Nécessite CRON_SECRET de l'environnement réel, données configurées en DB, vérification de non-doublon

---

## Résumé

La Phase 9 a livré l'intégralité des exigences COND-01 et COND-02 avec une implémentation substantielle et câblée :

- **11 tests automatisés verts** (4 unit helper + 7 unit cron) couvrant tous les chemins critiques : détection de seuil, idempotence, avancement nextMeterValue, authentification cron, filtrage des plans incomplets.
- **Aucun stub** — toutes les données sont issues de Prisma réel, aucune valeur codée en dur.
- **Sécurité respectée** — scoping org sur `recordMeterReadingOnAsset`, validation d'entrée, Bearer CRON_SECRET sur le cron, guard idempotence.
- **Architecture propre** — `updateMeterAndPlans` centralisé et réutilisé ; `generateWorkOrderFromPlanInternal` extrait sans dépendance auth, `generateWorkOrderFromPlan` devient un wrapper thin.

3 vérifications humaines sont nécessaires pour confirmer le comportement end-to-end en environnement réel avec données de production.

---

_Vérifié : 2026-05-29T02:48:00Z_
_Vérificateur : Claude (gsd-verifier)_
