# Phase 9: Maintenance conditionnelle — Research

**Researched:** 2026-05-28
**Domain:** Meter-based preventive maintenance — trigger detection, work order auto-generation, asset meter UI
**Confidence:** HIGH (full codebase verified, no external dependencies needed)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COND-01 | Un technicien peut saisir un relevé de compteur (heures moteur, cycles, km) à la clôture d'un BT ou directement sur un actif | `WorkOrderMeterReading` component + `recordMeterReading` action exist; direct asset entry missing |
| COND-02 | Un PM configuré avec un seuil de compteur génère automatiquement un BT lorsque l'actif atteint ce seuil | `nextMeterValue` calculation exists; auto-generation loop (cron trigger check) is the missing piece |
</phase_requirements>

---

## Summary

La Phase 8 a posé les fondations : le modèle `AssetMeter`, le champ `WorkOrder.meterReading`, les champs `MaintenancePlan.meterThreshold` / `nextMeterValue`, l'action `recordMeterReading` et le composant `WorkOrderMeterReading`. L'infrastructure de données est complète et fonctionnelle.

Ce qui manque pour COND-01 est **l'entrée directe de compteur sur la page actif** (en dehors du contexte BT). Pour COND-02, l'action `recordMeterReading` calcule déjà `nextMeterValue`, mais **aucun mécanisme ne vérifie si la valeur actuelle du compteur dépasse `nextMeterValue` et génère automatiquement un BT**. Ce chaînon manquant est un cron Vercel (pattern identique aux deux crons Phase 3 et Phase 8).

**Recommandation principale:** Deux plans suffisent. Plan 09-01 : Server Action `recordMeterReadingOnAsset` + composant `AssetMeterSection` sur la page actifs. Plan 09-02 : cron `/api/cron/meter-threshold-check` + intégration vercel.json.

---

## État de l'infrastructure existante (Phase 8)

### Ce qui est DÉJÀ en place [VERIFIED: codebase grep]

| Élément | Fichier | État |
|---------|---------|------|
| `AssetMeter` model | `prisma/schema.prisma:255` | Champs: `id, assetId, name, unit, value, updatedAt` |
| `WorkOrder.meterReading` | `prisma/schema.prisma:305` | `Float?` — relevé saisi sur un BT |
| `MaintenancePlan.meterThreshold` | `prisma/schema.prisma:414` | `Float?` — intervalle (ex: 500h) |
| `MaintenancePlan.nextMeterValue` | `prisma/schema.prisma:415` | `Float?` — valeur cible calculée |
| `MaintenanceTriggerType` enum | `prisma/schema.prisma:56` | `time_based \| meter_based` |
| `recordMeterReading` action | `src/actions/work-orders.ts:464` | Met à jour BT + `AssetMeter.value` + recalcule `nextMeterValue` pour tous les plans meter_based de l'actif |
| `WorkOrderMeterReading` component | `src/components/work-orders/work-order-meter-reading.tsx` | Rendu dans `WorkOrderDetail` si `asset.meters.length > 0` |
| Formulaire plan meter_based | `maintenance-plan-form-dialog.tsx:335` | Champ `meterThreshold` visible quand `triggerType === 'meter_based'` |
| Affichage `nextMeterValue` | `maintenance-plan-list.tsx:217` | "Prochain BT à X h" ou "Seuil: X h" |

### Ce qui MANQUE [VERIFIED: codebase grep + code review]

| Manque | Impact | Requirement |
|--------|--------|-------------|
| Server Action `recordMeterReadingOnAsset` (hors contexte BT) | Technicien ne peut pas saisir depuis la page actif | COND-01 |
| Composant UI sur page `/actifs` pour saisie directe | Pas d'accès direct au compteur | COND-01 |
| Cron `meter-threshold-check` — boucle de comparaison `AssetMeter.value >= nextMeterValue` | Aucun BT n'est jamais auto-généré | COND-02 |
| Entrée dans `vercel.json` pour le nouveau cron | Le cron ne s'exécuterait pas en production | COND-02 |
| Guard idempotence sur `generateWorkOrderFromPlan` (éviter doublons) | Un actif à 1500h avec seuil 500h déclencherait 1 BT chaque heure | COND-02 |

---

## Standard Stack

### Core (inchangé — tout est déjà installé)
| Élément | Version | Usage |
|---------|---------|-------|
| Prisma Client | déjà en place | Requêtes DB |
| Next.js Route Handler | 16.2.6 [VERIFIED: package.json] | Cron endpoint GET |
| Vercel Cron | config vercel.json | Schedule horaire |
| Server Actions (`'use server'`) | Next.js 16 | Action directe actif |

### Aucune dépendance nouvelle à installer [VERIFIED: codebase]

L'ensemble du travail Phase 9 est de la **logique métier** sur l'infrastructure existante. Aucun `npm install` requis.

---

## Architecture Patterns

### Structure recommandée

```
src/
├── actions/
│   └── work-orders.ts          # Ajouter recordMeterReadingOnAsset()
├── components/assets/
│   └── asset-meter-section.tsx # NOUVEAU — saisie compteur depuis page actif
├── app/(app)/actifs/
│   └── page.tsx                # Passer meters aux composants
└── app/api/cron/
    └── meter-threshold-check/
        └── route.ts            # NOUVEAU — cron COND-02
```

### Pattern 1 : Server Action pour saisie directe sur actif (COND-01)

**Ce qui existe:** `recordMeterReading(workOrderId, reading)` — nécessite un BT

**Ce qu'il faut créer:** `recordMeterReadingOnAsset(assetId, reading)` — entrée directe

```typescript
// src/actions/work-orders.ts — à ajouter
export async function recordMeterReadingOnAsset(assetId: string, reading: number) {
  const { organizationId } = await getOrgAndMembership()

  if (!Number.isFinite(reading) || reading < 0) throw new Error('Valeur invalide')

  // Vérifier appartenance org
  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId },
    select: { id: true },
  })
  if (!asset) throw new Error('Actif introuvable')

  // Mettre à jour le premier compteur de l'actif
  const meter = await db.assetMeter.findFirst({ where: { assetId } })
  if (!meter) throw new Error('Aucun compteur configuré pour cet actif')

  await db.assetMeter.update({
    where: { id: meter.id },
    data: { value: reading },
  })

  // Recalculer nextMeterValue pour tous les plans meter_based
  const plans = await db.maintenancePlan.findMany({
    where: { assetId, organizationId, triggerType: 'meter_based' },
    select: { id: true, meterThreshold: true },
  })
  for (const plan of plans) {
    if (plan.meterThreshold) {
      await db.maintenancePlan.update({
        where: { id: plan.id },
        data: { nextMeterValue: reading + plan.meterThreshold },
      })
    }
  }

  revalidatePath('/actifs')
  revalidatePath('/maintenance')
}
```

**Note:** La logique de recalcul `nextMeterValue` est identique à `recordMeterReading` — extraire dans une fonction helper partagée `updateMeterAndPlans(assetId, orgId, reading)` évite la duplication.

### Pattern 2 : Cron de détection de seuil (COND-02)

**Modèle:** `/api/cron/urgent-escalation/route.ts` et `/api/cron/maintenance-reminder/route.ts`

**Logique:**
1. Charger tous les plans `meter_based` actifs avec `nextMeterValue != null`
2. Pour chaque plan, charger la valeur actuelle du premier compteur de l'actif lié
3. Si `assetMeter.value >= plan.nextMeterValue` → appeler `generateWorkOrderFromPlan()`
4. Mettre à jour `lastGeneratedAt` (déjà fait dans `generateWorkOrderFromPlan`)
5. Recalculer `nextMeterValue = assetMeter.value + plan.meterThreshold` (avance le seuil)

**Guard idempotence critique:** Vérifier qu'il n'existe pas de BT `open/in_progress/on_hold` lié à ce plan avant d'en créer un nouveau. Sinon le cron génère des doublons à chaque heure.

```typescript
// src/app/api/cron/meter-threshold-check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const plans = await db.maintenancePlan.findMany({
    where: {
      isActive: true,
      triggerType: 'meter_based',
      nextMeterValue: { not: null },
      assetId: { not: null },
    },
    include: {
      asset: { include: { meters: { take: 1 } } },
    },
  })

  let triggered = 0
  const errors: string[] = []

  for (const plan of plans) {
    const meter = plan.asset?.meters[0]
    if (!meter || plan.nextMeterValue == null) continue
    if (meter.value < plan.nextMeterValue) continue

    // Idempotence: skip si BT actif existe déjà pour ce plan
    const existing = await db.workOrder.findFirst({
      where: {
        maintenancePlanId: plan.id,
        status: { in: ['open', 'in_progress', 'on_hold'] },
      },
      select: { id: true },
    })
    if (existing) continue

    try {
      // Réutiliser generateWorkOrderFromPlan (déjà dans maintenance.ts)
      // Appel interne — pas via Server Action (pas de auth() context)
      await generateWorkOrderFromPlanInternal(plan.id, plan.organizationId)

      // Avancer le seuil au prochain cycle
      if (plan.meterThreshold) {
        await db.maintenancePlan.update({
          where: { id: plan.id },
          data: { nextMeterValue: meter.value + plan.meterThreshold },
        })
      }
      triggered++
    } catch (err) {
      errors.push(`Plan ${plan.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, plansChecked: plans.length, triggered, errors })
}
```

**Note architecturale:** `generateWorkOrderFromPlan` dans `maintenance.ts` appelle `auth()` (Clerk), ce qui est incompatible avec un contexte cron (pas de session utilisateur). Il faut extraire la logique de création de BT dans une fonction helper `generateWorkOrderFromPlanInternal(planId, organizationId)` appelable depuis les deux contextes. C'est le même pattern que `recordMeterReading` appelle directement Prisma sans passer par auth().

### Pattern 3 : Composant AssetMeterSection

**Modèle:** `WorkOrderMeterReading` (même structure Input + Button + toast)

```typescript
// src/components/assets/asset-meter-section.tsx
'use client'
// Props: assetId, meters: Meter[], isAdmin: boolean
// Appelle: recordMeterReadingOnAsset(assetId, reading)
// Affiche: valeur actuelle + form saisie
```

**Intégration:** La page `/actifs/page.tsx` ne charge pas les `meters` actuellement (query sans `include: { meters: true }`). Il faudra ajouter cette inclusion dans la query Prisma de la page actifs ou créer une page détail actif dédiée.

**Décision d'implémentation (Claude's Discretion):** Intégrer dans un modal ou drawer sur la liste actifs existante plutôt que créer une nouvelle route — plus simple, cohérent avec le pattern Phase 8.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser | Pourquoi |
|----------|-------------------|----------|----------|
| Scheduling cron | Custom polling, setTimeout serveur | Vercel Cron + vercel.json | Déjà utilisé pour 2 autres crons — pattern établi |
| Auth cron endpoint | Middleware Clerk | `Bearer ${CRON_SECRET}` header check | Pattern identique aux crons existants |
| Génération de BT depuis plan | Logique dupliquée dans le cron | Extraire `generateWorkOrderFromPlanInternal` depuis `maintenance.ts` | DRY — la logique existe déjà |
| Mise à jour compteur | Nouveau model ou table log | `AssetMeter.value` (existant) | Model déjà en place, Phase 9 le complete |

---

## Common Pitfalls

### Pitfall 1 : Génération infinie de BTs (CRITIQUE)
**Ce qui arrive:** Le cron tourne toutes les heures. Si `assetMeter.value (1500h) >= nextMeterValue (1000h)`, sans guard d'idempotence, un nouveau BT est créé à chaque exécution horaire.
**Cause:** `generateWorkOrderFromPlan` n'a pas de protection contre les doublons.
**Solution:** Avant de créer un BT, vérifier `db.workOrder.findFirst({ where: { maintenancePlanId, status: { in: ['open', 'in_progress', 'on_hold'] } } })`. Si trouvé, skip.
**Signe d'alerte:** `lastGeneratedAt` qui se met à jour toutes les heures sur le même plan.

### Pitfall 2 : `generateWorkOrderFromPlan` appelle `auth()` — incompatible cron
**Ce qui arrive:** Appeler la Server Action depuis un Route Handler échoue car `auth()` nécessite un contexte de requête utilisateur Clerk.
**Cause:** `getOrgAndMembership()` dans `maintenance.ts` appelle `await auth()`.
**Solution:** Extraire la logique pure de création BT (`generateWorkOrderFromPlanInternal`) qui prend `(planId, organizationId)` sans `auth()`. La Server Action existante l'appelle après auth ; le cron l'appelle directement.

### Pitfall 3 : `AssetMeter` n'a pas d'historique
**Ce qui arrive:** Chaque `recordMeterReading` écrase `AssetMeter.value`. Il n'y a pas de trail audit.
**Impact Phase 9:** Acceptable — COND-01 et COND-02 ne nécessitent que la valeur courante. Un historique complet est hors scope (Milestone 4).
**Ne pas over-engineer:** Ne pas créer un model `AssetMeterReading` pour Phase 9.

### Pitfall 4 : Plan `meter_based` sans `assetId`
**Ce qui arrive:** Un PM `meter_based` peut être configuré avec `categoryId` (pas d'actif précis). Dans ce cas `assetId = null`, aucun `AssetMeter` ne peut être lu.
**Solution dans le cron:** Filtrer `assetId: { not: null }` — les plans sans actif ne peuvent pas être déclenchés par compteur.
**UX:** Le formulaire `MaintenancePlanFormDialog` devrait afficher un avertissement si `triggerType === 'meter_based'` et aucun actif sélectionné.

### Pitfall 5 : `nextMeterValue` non initialisé sur plans existants
**Ce qui arrive:** Des plans `meter_based` créés en Phase 8 peuvent avoir `nextMeterValue = null` si aucun relevé n'a encore été saisi sur l'actif.
**Impact:** Le cron filtre `nextMeterValue: { not: null }` — ces plans sont ignorés jusqu'au premier relevé.
**Solution correcte:** Lors du premier `recordMeterReading` ou `recordMeterReadingOnAsset`, le `nextMeterValue = reading + meterThreshold` est calculé. Déjà géré dans `recordMeterReading`. S'assurer que `recordMeterReadingOnAsset` fait de même.

---

## Code Examples

### Cron vercel.json — ajouter l'entrée [VERIFIED: vercel.json actuel]

```json
{
  "crons": [
    { "path": "/api/cron/maintenance-reminder", "schedule": "0 * * * *" },
    { "path": "/api/cron/urgent-escalation", "schedule": "0 * * * *" },
    { "path": "/api/cron/meter-threshold-check", "schedule": "0 * * * *" }
  ]
}
```

**Fréquence horaire** (`0 * * * *`) — cohérente avec les autres crons. Suffisant pour une maintenance conditionnelle (les actifs n'accumulent pas 500h en une heure).

### Query Prisma pour la page actifs — ajouter meters [VERIFIED: actifs/page.tsx]

```typescript
// Modification de la query dans src/app/(app)/actifs/page.tsx
db.asset.findMany({
  where: { organizationId: org.id },
  include: {
    category: true,
    site: { include: { locations: true } },
    location: true,
    meters: true,  // AJOUTER
  },
  orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
})
```

### Fonction helper partagée — éviter la duplication [ASSUMED: pattern recommandé]

```typescript
// src/lib/meter-utils.ts (nouveau fichier)
export async function updateMeterAndPlans(
  assetId: string,
  organizationId: string,
  reading: number
) {
  const meter = await db.assetMeter.findFirst({ where: { assetId } })
  if (!meter) return null

  await db.assetMeter.update({ where: { id: meter.id }, data: { value: reading } })

  const plans = await db.maintenancePlan.findMany({
    where: { assetId, organizationId, triggerType: 'meter_based' },
    select: { id: true, meterThreshold: true },
  })
  for (const plan of plans) {
    if (plan.meterThreshold) {
      await db.maintenancePlan.update({
        where: { id: plan.id },
        data: { nextMeterValue: reading + plan.meterThreshold },
      })
    }
  }
  return meter
}
```

---

## State of the Art

| Ancien | Actuel Phase 9 | Impact |
|--------|---------------|--------|
| Maintenance déclenchée uniquement par date (`nextDueAt`) | Maintenance déclenchée par valeur compteur (`nextMeterValue`) | PMs basés sur usage réel plutôt que calendrier |
| `recordMeterReading` uniquement depuis un BT ouvert | `recordMeterReadingOnAsset` depuis page actif directement | Technicien peut mettre à jour compteur sans ouvrir un BT |
| `generateWorkOrderFromPlan` manuel uniquement | Auto-génération via cron horaire | Ferme la boucle — zéro intervention manuelle |

---

## Assumptions Log

| # | Claim | Section | Risque si faux |
|---|-------|---------|----------------|
| A1 | Intégrer la saisie compteur dans la liste actifs existante (modal/drawer) plutôt qu'une page détail dédiée | Architecture | Faible — peut basculer vers page détail sans impact sur COND-01 |
| A2 | Fréquence cron horaire suffisante pour déclenchement meter_based | Standard Stack | Faible — tous les actifs industriels accumulent des heures sur des jours, pas des minutes |
| A3 | Extraire `generateWorkOrderFromPlanInternal` dans un helper lib plutôt que dupliquer la logique dans le cron | Architecture | Moyen — si l'équipe préfère une duplication contrôlée, acceptable |

---

## Open Questions

1. **AssetMeter : un seul compteur par actif ou plusieurs ?**
   - Ce qu'on sait : `AssetMeter` a une relation `asset` → `AssetMeter[]` (multiple possible). `recordMeterReading` et `WorkOrderMeterReading` prennent `meters[0]` — seulement le premier.
   - Ce qui est flou : Phase 9 devrait-elle supporter plusieurs compteurs (km + heures moteur sur le même actif) ?
   - Recommandation : Rester sur `meters[0]` pour Phase 9 (YAGNI). Un actif = un compteur principal. Multi-compteurs = Phase future.

2. **Unité du seuil : le formulaire affiche "h" en dur dans maintenance-plan-list.tsx:218**
   - Ce qu'on sait : `meterThreshold` est un `Float` sans unité stockée.
   - Ce qui est flou : Si l'actif a un compteur en "km", l'affichage "X h" est incorrect.
   - Recommandation : Lire l'unité depuis `AssetMeter.unit` dans la liste maintenance pour afficher correctement.

---

## Environment Availability

Toutes les dépendances de Phase 9 sont déjà disponibles. Aucune installation requise.

| Dépendance | Requis par | Disponible | Version |
|-----------|-----------|-----------|---------|
| Prisma Client | Actions DB | ✓ | déjà en place |
| Vercel Cron | COND-02 auto-trigger | ✓ | vercel.json configuré avec 2 crons actifs |
| `CRON_SECRET` env var | Auth cron endpoint | ✓ | Dans `.env.example` |
| `AssetMeter` model | COND-01, COND-02 | ✓ | schema.prisma:255 |

**Aucune migration de schéma Prisma nécessaire pour Phase 9.** [VERIFIED: schema.prisma — tous les champs requis existent]

---

## Validation Architecture

### Test Framework
| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest + jsdom |
| Config | `vitest.config.mts` |
| Quick run | `npx vitest run --reporter=verbose` |
| Full suite | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande | Fichier |
|--------|-------------|-------------|---------|---------|
| COND-01 | `recordMeterReadingOnAsset` met à jour `AssetMeter.value` | unit | `npx vitest run src/lib/meter-utils.test.ts` | ❌ Wave 0 |
| COND-01 | `recordMeterReadingOnAsset` recalcule `nextMeterValue` sur les plans liés | unit | `npx vitest run src/lib/meter-utils.test.ts` | ❌ Wave 0 |
| COND-02 | Cron crée un BT quand `meter.value >= nextMeterValue` | unit (logic) | `npx vitest run src/app/api/cron/meter-threshold-check/route.test.ts` | ❌ Wave 0 |
| COND-02 | Cron ne crée pas de doublon si BT actif existe déjà | unit (idempotence) | même fichier | ❌ Wave 0 |
| COND-02 | Cron avance `nextMeterValue` après génération | unit | même fichier | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `src/lib/meter-utils.test.ts` — couvre helper `updateMeterAndPlans` (COND-01)
- [ ] `src/app/api/cron/meter-threshold-check/route.test.ts` — couvre logique de détection et idempotence (COND-02)

---

## Security Domain

### Applicable ASVS Categories

| Catégorie ASVS | Applicable | Contrôle standard |
|---------------|-----------|------------------|
| V2 Authentication | oui | Clerk `auth()` sur Server Actions ; `Bearer CRON_SECRET` sur Route Handler cron |
| V4 Access Control | oui | `getOrgAndMembership()` — scoping org avant toute opération DB |
| V5 Input Validation | oui | `Number.isFinite(reading) && reading >= 0` — déjà dans `recordMeterReading`, à répliquer dans `recordMeterReadingOnAsset` |

### Threat model — Phase 9

| Menace | STRIDE | Mitigation |
|--------|--------|-----------|
| Technicien modifie le compteur d'un actif d'une autre org | Tampering | `db.asset.findFirst({ where: { id, organizationId } })` avant update |
| Cron déclenché manuellement par un acteur externe | Elevation of Privilege | `Bearer CRON_SECRET` — pattern identique aux crons existants |
| Compteur saisi avec valeur négative ou Infinity | Tampering | `Number.isFinite(reading) && reading >= 0` — throw si invalide |
| Génération de BTs en masse par dépassement de seuil (DoS interne) | DoS | Guard idempotence : skip si BT actif existe pour ce plan |

---

## Sources

### Primary (HIGH confidence — verified in this session)
- `prisma/schema.prisma` — modèles `AssetMeter`, `MaintenancePlan`, `WorkOrder` (champs vérifiés ligne par ligne)
- `src/actions/work-orders.ts:464` — `recordMeterReading` implémentation complète
- `src/actions/maintenance.ts:136` — `generateWorkOrderFromPlan` implémentation + appel `auth()`
- `src/app/api/cron/urgent-escalation/route.ts` — pattern cron avec auth Bearer
- `src/app/api/cron/maintenance-reminder/route.ts` — pattern cron time_based
- `vercel.json` — 2 crons actifs à `"0 * * * *"`
- `src/components/work-orders/work-order-detail.tsx:388-396` — `WorkOrderMeterReading` rendu conditionnel
- `src/components/maintenance/maintenance-plan-list.tsx:217-219` — affichage `nextMeterValue`
- `node_modules/next/package.json` — Next.js 16.2.6

### Secondary (MEDIUM confidence)
- Pattern `generateWorkOrderFromPlanInternal` — recommandation d'architecture basée sur l'analyse du code, non prescrite par un document officiel

---

## Metadata

**Confidence breakdown:**
- Infrastructure existante (COND-01 partiel) : HIGH — vérifiée ligne par ligne
- Gap analysis (ce qui manque) : HIGH — vérifiée par grep + lecture du code
- Pattern cron (COND-02) : HIGH — deux crons identiques existent
- Guard idempotence : HIGH — pitfall évident, solution claire
- Schema changes requis : AUCUN — HIGH

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (stack stable)
