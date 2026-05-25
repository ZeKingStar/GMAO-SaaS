# Phase 7 : Analytique de fiabilité — Research

**Researched:** 2026-05-25
**Domain:** Agrégations Prisma, tabs Server Component Next.js, rapports MTTR/coût/fiabilité
**Confidence:** HIGH

---

<user_constraints>
## Contraintes utilisateur (issues de CONTEXT.md)

### Décisions verrouillées

- **D-01:** Renommer `faultDescription` → `faultProblem` via migration Prisma (`ALTER TABLE RENAME COLUMN`). Pas de perte de données.
- **D-02:** Ajouter deux nouveaux champs nullable à `WorkOrder` : `faultCause` (String?) et `faultRemedy` (String?).
- **D-03:** "Top pannes récurrentes" groupe par `faultProblem` + `faultCategory`.
- **D-04:** 4 rapports intégrés dans `/rapports` via tabs : "Vue générale" (contenu actuel) + "Top pannes" + "MTTR" + "Coût actifs" + "Planifié vs Réel".
- **D-05:** Filtrage temporel par périodes prédéfinies : Ce mois / 3 mois / 6 mois / Cette année. Pas de date picker personnalisé.
- **D-06:** Tab "Planifié vs Réel" contient 3 sous-onglets : Par BT | Par technicien | Par type d'actif.

### Discrétion de Claude

- Calcul MTTR : somme des `WorkOrderTimeLog.minutes` ÷ 60 par actif (exclure les BTs sans `timeLogs`).
- Plan gating : même pattern que `/rapports` existant — `requirePlan(['growth', 'enterprise'])`.
- Design : réutiliser Card, Badge, Tabs de shadcn/ui existants ; pas de librairie de charts si les données peuvent être rendues en tableau trié.
- État vide de chaque rapport : message informatif indiquant la condition manquante.

### Idées différées (HORS PÉRIMÈTRE)

- Export CSV des rapports
- Date picker personnalisé (plage arbitraire)
- Calcul MTTR par fenêtre glissante (rolling average)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIAB-01 | Codes de panne (P/C/R) saisis à la clôture, agrégés en "Top pannes récurrentes" | Migration schema + groupBy faultProblem/faultCategory + WorkOrderFaultForm étendu |
| FIAB-02 | MTTR par actif calculé automatiquement depuis heures d'arrêt sur BTs correctifs | Agrégation WorkOrderTimeLog.minutes groupé par assetId, filtré type=corrective |
| FIAB-03 | "Coût de maintenance par actif" (main-d'œuvre + pièces), trié par coût décroissant | WorkOrderPart._sum(unitCost×quantity) + WorkOrderTimeLog._sum(minutes) × Membership.hourlyRate |
| FIAB-04 | "Planifié vs Réel" : estimatedHours vs heures réelles, par BT / technicien / type d'actif | Delta estimatedHours vs sum(timeLogs.minutes÷60) sur WorkOrder avec estimatedHours non null |
</phase_requirements>

---

## Résumé

La Phase 7 est entièrement construite sur l'infrastructure de données posée en Phase 6 : `WorkOrderTimeLog`, `WorkOrderPart`, `WorkOrder.faultCategory`/`faultDescription`, et `Membership.hourlyRate` existent tous dans le schéma. La seule modification de schéma requise est le renommage de `faultDescription` → `faultProblem` et l'ajout de `faultCause`/`faultRemedy`.

Les quatre rapports sont des agrégations Prisma pures rendues server-side dans des Server Components Next.js. Le pattern de base est déjà établi dans `/rapports/page.tsx` : `db.workOrder.groupBy()`, `db.workOrderTimeLog.aggregate()`, composants shadcn Card/Badge. Le principal défi technique est de rendre les filtres de période (Ce mois / 3 mois / 6 mois / Cette année) interactifs sans transformer la page entière en Client Component.

**Recommandation principale:** Implémenter la sélection de période via `searchParams` (URL query param `?period=30d`) — la page reste Server Component, le sélecteur de période est un Client Component léger qui pousse l'URL. Pattern identique à ce qui est utilisé dans d'autres routes Next.js App Router du projet.

---

## Stack standard

### Existant — réutiliser tel quel

| Élément | Version/Source | Usage Phase 7 |
|---------|---------------|---------------|
| `@prisma/client` (généré dans `src/generated/prisma`) | Phase 6 | Toutes les agrégations SQL |
| `src/lib/db.ts` | Existant | Instance Prisma partagée |
| `requirePlan(['growth', 'enterprise'])` | `src/lib/auth.ts` | Gating page /rapports |
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | `src/components/ui/card.tsx` | Layout de chaque rapport |
| `Badge` | `src/components/ui/badge.tsx` | Catégorie de panne, coûts |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `src/components/ui/tabs.tsx` | Navigation entre rapports |
| `UpgradeGate` | `src/components/upgrade-gate/` | Wrapper gating existant |

**Point critique:** Le composant `Tabs` utilise `@base-ui/react/tabs` (pas Radix). L'API diffère de Radix : la prop active s'appelle `value` sur `TabsPrimitive.Root`, et l'état actif sur un Tab est exposé via `data-active` (pas `data-state="active"`). [VERIFIED: lecture de tabs.tsx]

### À créer (nouveaux)

| Fichier | Rôle |
|---------|------|
| `src/components/rapports/period-selector.tsx` | Client Component — select `<Ce mois / 3 mois / 6 mois / Cette année>` → pousse `?period=` dans l'URL |
| `src/components/rapports/top-faults-tab.tsx` | Server Component — rapport FIAB-01 |
| `src/components/rapports/mttr-tab.tsx` | Server Component — rapport FIAB-02 |
| `src/components/rapports/cost-tab.tsx` | Server Component — rapport FIAB-03 |
| `src/components/rapports/planned-vs-real-tab.tsx` | Server Component — rapport FIAB-04 avec sous-tabs |

### Pas nécessaire (ne pas installer)

| Librairie | Raison |
|-----------|--------|
| recharts / chart.js / nivo | Les données sont rendues en tableaux triés — pas de visualisation graphique Phase 7 |
| react-datepicker | Périodes prédéfinies uniquement (D-05) |
| date-fns / dayjs | JavaScript natif `Date` suffit pour les 4 fenêtres prédéfinies |

---

## Architecture Patterns

### Pattern 1 : Tabs server-rendus avec filtre de période via searchParams

La page `/rapports` est un Server Component. Le changement de période ne peut pas utiliser `useState` directement. Pattern établi dans Next.js App Router : le sélecteur de période est un Client Component qui pousse `?period=30d` dans l'URL via `router.push()`, et la page server relit `searchParams.period`.

```typescript
// src/app/(app)/rapports/page.tsx
export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>
}) {
  const { tab = 'vue-generale', period = '30d' } = await searchParams
  const { membership, hasAccess } = await requirePlan(['growth', 'enterprise'])
  // ...
}
```

**Note AGENTS.md:** Lire `node_modules/next/dist/docs/` avant d'écrire du code Next.js — les searchParams sont maintenant une `Promise` dans Next.js 15 App Router. [ASSUMED — vérifier dans la doc locale si la version du projet utilise bien Next.js 15]

### Pattern 2 : Calcul de la fenêtre temporelle

```typescript
// [VERIFIED: pattern issu de rapports/page.tsx existant]
function getPeriodStart(period: string): Date {
  const now = new Date()
  switch (period) {
    case '7d':  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case '90d': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '6m':  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case '12m': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:    return new Date(now.getFullYear(), now.getMonth(), 1) // Ce mois
  }
}
```

### Pattern 3 : Agrégation "Top pannes" (FIAB-01)

```typescript
// groupBy faultProblem + faultCategory, compter les occurrences
// [VERIFIED: schéma — faultCategory + faultDescription(→faultProblem) sur WorkOrder]
const topFaults = await db.workOrder.groupBy({
  by: ['faultProblem', 'faultCategory'],
  where: {
    organizationId: orgId,
    faultProblem: { not: null },
    completedAt: { gte: periodStart },
  },
  _count: { _all: true },
  orderBy: { _count: { _all: 'desc' } },
  take: 10,
})
```

**Limitation Prisma groupBy:** `groupBy` ne supporte pas les `include` (relations). Pour récupérer le nom de l'actif ou du technicien après un groupBy, il faut une seconde requête `findMany` avec `where: { id: { in: [...] } }`. C'est le pattern déjà utilisé dans `/rapports/page.tsx` pour `topAssetGroups` → `assetNames`. [VERIFIED: lecture du code existant]

### Pattern 4 : Calcul MTTR par actif (FIAB-02)

Le MTTR ne peut pas être calculé avec un simple `groupBy` + `aggregate` en une seule requête Prisma car il faut grouper par `assetId` sur `WorkOrder` tout en sommant les `WorkOrderTimeLog.minutes` de chaque BT. Approche en deux étapes :

```typescript
// Étape 1 : récupérer les BTs correctifs avec leurs timeLogs et assetId
const orders = await db.workOrder.findMany({
  where: {
    organizationId: orgId,
    type: 'corrective',
    assetId: { not: null },
    completedAt: { gte: periodStart },
    timeLogs: { some: { minutes: { not: null } } },
  },
  select: {
    assetId: true,
    timeLogs: { select: { minutes: true } },
  },
})

// Étape 2 : agréger en mémoire (nombre de BTs faible — acceptable)
const mttrByAsset = Map<assetId, { totalMinutes, count }>
// MTTR = totalMinutes / count / 60 (en heures)
```

**Justification agrégation mémoire:** Le nombre de BTs par organisation est typiquement < 5 000. L'agrégation JS est préférable à une raw query SQL pour garder la cohérence avec le reste du codebase. [ASSUMED — valider si certaines orgs ont des volumes > 10k BTs]

### Pattern 5 : Calcul du coût par actif (FIAB-03)

Le coût combine deux sources : `WorkOrderPart` (coût pièces) et `WorkOrderTimeLog` (coût main-d'œuvre via `Membership.hourlyRate`). Prisma ne peut pas faire ce calcul en une seule requête — deux requêtes + agrégation JS :

```typescript
// Pièces : unitCost × quantity par workOrder
const parts = await db.workOrderPart.findMany({
  where: { workOrder: { organizationId: orgId, completedAt: { gte: periodStart } } },
  select: { workOrder: { select: { assetId: true } }, quantity: true, unitCost: true },
})

// Main-d'œuvre : minutes × hourlyRate du membre
const timeLogs = await db.workOrderTimeLog.findMany({
  where: { workOrder: { organizationId: orgId, completedAt: { gte: periodStart } } },
  select: {
    minutes: true,
    workOrder: { select: { assetId: true } },
    membership: { select: { hourlyRate: true } },
  },
})
// Coût MO = (minutes / 60) × hourlyRate — null hourlyRate → 0
```

### Pattern 6 : Rapport Planifié vs Réel (FIAB-04) — sous-tabs

Le tab FIAB-04 contient 3 sous-vues (Par BT / Par technicien / Par type). Les sous-tabs utilisent un second searchParam `?subtab=bt|technician|type`. La logique de filtrage est identique — seul le groupement change :

- **Par BT:** liste des BTs avec `estimatedHours` non null, delta = `estimatedHours - sum(timeLogs.minutes)/60`
- **Par technicien:** grouper par `assignee.membershipId`, agréger les deltas
- **Par type d'actif:** grouper par `asset.categoryId`, agréger les deltas

```typescript
// BTs avec estimatedHours seulement (exclure les BTs sans estimation)
const orders = await db.workOrder.findMany({
  where: {
    organizationId: orgId,
    estimatedHours: { not: null },
    completedAt: { gte: periodStart },
  },
  select: {
    id: true, number: true, title: true, estimatedHours: true, type: true,
    asset: { select: { categoryId: true, category: { select: { name: true } } } },
    assignees: { select: { membership: { select: { id: true, firstName: true, lastName: true } } } },
    timeLogs: { select: { minutes: true } },
  },
})
```

### Pattern 7 : Navigation tabs — pattern du projet (base-ui)

Le projet utilise `@base-ui/react/tabs` (pas Radix). L'API correcte pour les tabs contrôlés :

```tsx
// [VERIFIED: lecture de src/components/ui/tabs.tsx]
<Tabs defaultValue="vue-generale">
  <TabsList>
    <TabsTrigger value="vue-generale">Vue générale</TabsTrigger>
    <TabsTrigger value="top-pannes">Top pannes</TabsTrigger>
    {/* ... */}
  </TabsList>
  <TabsContent value="vue-generale">
    {/* contenu existant */}
  </TabsContent>
</Tabs>
```

**Attention:** Avec searchParams pour le filtre de période, les tabs eux-mêmes peuvent rester contrôlés par état local (Client Component wrapper) ou par URL. La décision la plus simple : wrapper la section tabs dans un `'use client'` léger qui gère `activeTab` localement + `period` via URL.

### Structure de fichiers recommandée

```
src/
├── app/(app)/rapports/
│   └── page.tsx                    # Modifier : ajouter searchParams, Tabs, imports
├── components/rapports/
│   ├── period-selector.tsx         # NOUVEAU — Client Component, select période
│   ├── top-faults-tab.tsx          # NOUVEAU — Server Component FIAB-01
│   ├── mttr-tab.tsx                # NOUVEAU — Server Component FIAB-02
│   ├── cost-tab.tsx                # NOUVEAU — Server Component FIAB-03
│   └── planned-vs-real-tab.tsx     # NOUVEAU — Server Component FIAB-04
├── lib/
│   ├── closure-requirements.ts     # MODIFIER : faultDescription → faultProblem
│   └── report-utils.ts             # NOUVEAU — getPeriodStart(), formatCost()
└── actions/work-orders.ts          # MODIFIER : setWorkOrderFault (faultProblem/Cause/Remedy)
prisma/
├── schema.prisma                   # MODIFIER : rename + 2 nouveaux champs
└── migrations/
    └── YYYYMMDD_phase7_fault_pcr/  # NOUVELLE migration
        └── migration.sql
```

---

## Ne pas recréer manuellement

| Problème | Ne pas construire | Utiliser plutôt | Raison |
|----------|------------------|-----------------|--------|
| Calcul de période | Librairie date | `new Date()` natif | 4 périodes fixes, pas de complexité timezone |
| Tables de données | Tableau HTML custom | HTML `<table>` avec classes Tailwind existantes | Pattern déjà utilisé dans /rapports (lowStockParts) |
| Graphiques bars | Composant chart custom | Barres CSS avec `style={{ width: X% }}` | Pattern déjà établi dans /rapports (workOrdersByStatus) |
| Gating | Logique custom | `requirePlan` + `UpgradeGate` existants | [VERIFIED: déjà en place] |

---

## Pièges courants

### Piège 1 : Prisma `groupBy` et relations

**Ce qui se passe:** `db.workOrder.groupBy({ by: ['assetId'], include: { asset: true } })` — ERREUR. Prisma refuse les `include` dans un `groupBy`.

**Pourquoi:** Limitation ORM, pas contournable sans raw query.

**Comment éviter:** Pattern deux étapes : groupBy → collecter les IDs → `findMany({ where: { id: { in: ids } } })`. Déjà utilisé dans le code existant de `/rapports`. [VERIFIED: lignes 108-118 de rapports/page.tsx]

### Piège 2 : searchParams comme Promise en Next.js 15

**Ce qui se passe:** Accéder à `searchParams.period` directement (sans `await`) lève un avertissement ou erreur en Next.js 15 App Router.

**Comment éviter:** Déclarer `searchParams: Promise<{...}>` et faire `const { period } = await searchParams`. [ASSUMED — vérifier la version Next.js dans package.json avant d'écrire le code]

### Piège 3 : Tabs base-ui vs Radix

**Ce qui se passe:** Copier des exemples shadcn/ui docs (qui utilisent Radix) dans ce projet qui utilise `@base-ui/react/tabs` — les props diffèrent (`data-state` vs `data-active`, `onValueChange` vs `onTabChange`, etc.).

**Comment éviter:** Utiliser uniquement les composants définis dans `src/components/ui/tabs.tsx`. Ne pas importer directement depuis `@base-ui/react/tabs` dans les pages. [VERIFIED: lecture de tabs.tsx]

### Piège 4 : hourlyRate null sur les membres

**Ce qui se passe:** Certains membres n'ont pas de `hourlyRate` configuré. Multiplier `minutes × null` donne `NaN` ou `null`.

**Comment éviter:** Traiter explicitement `hourlyRate ?? 0` dans le calcul de coût MO. Afficher un indicateur "taux non configuré" dans le rapport si des BTs ont un coût MO = 0 malgré des heures loggées. [VERIFIED: champ `hourlyRate Float?` dans schema.prisma]

### Piège 5 : faultDescription renommé — impact sur les validations de clôture

**Ce qui se passe:** `closure-requirements.ts` référence `faultDescription` dans `ClosureCheckInput` et `validateClosure`. Après la migration DB, le champ Prisma s'appelle `faultProblem` — le code de validation échouera silencieusement si non mis à jour.

**Comment éviter:** Mettre à jour `closure-requirements.ts`, `work-orders.ts` (setWorkOrderFault), `work-order-fault-form.tsx`, et `work-order-detail.tsx` en même temps que la migration. Ces fichiers sont identifiés précisément. [VERIFIED: grep sur la codebase]

### Piège 6 : Filtrer les BTs sans assetId pour MTTR et Coût

**Ce qui se passe:** `WorkOrder.assetId` est nullable. Les BTs sans actif (ex: demandes générales) ne peuvent pas être groupés par actif.

**Comment éviter:** Toujours inclure `assetId: { not: null }` dans les requêtes MTTR et Coût. Afficher un compteur "X BTs sans actif associé exclus" si pertinent.

---

## Exemples de code vérifiés

### Pattern requirePlan + UpgradeGate (existant, réutiliser)
```typescript
// [VERIFIED: src/app/(app)/rapports/page.tsx lignes 44-46]
const { membership, hasAccess } = await requirePlan(['growth', 'enterprise'])
const orgId = membership.organization.id
// ...
return (
  <UpgradeGate hasAccess={hasAccess} requiredPlan="growth">
    {/* contenu */}
  </UpgradeGate>
)
```

### Barre de progression CSS (pattern existant pour les rapports)
```tsx
// [VERIFIED: src/app/(app)/rapports/page.tsx lignes 222-227]
<div className="h-2 rounded-full bg-muted overflow-hidden">
  <div
    className="h-full rounded-full transition-all bg-blue-500"
    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
  />
</div>
```

### Navigation tabs via lien (pattern actifs)
```tsx
// [VERIFIED: src/app/(app)/actifs/layout.tsx — pattern link-based tabs]
// Alternative : shadcn Tabs avec defaultValue pour tabs sans URL
<Tabs defaultValue="top-pannes">
  <TabsList>
    <TabsTrigger value="vue-generale">Vue générale</TabsTrigger>
    <TabsTrigger value="top-pannes">Top pannes</TabsTrigger>
    <TabsTrigger value="mttr">MTTR</TabsTrigger>
    <TabsTrigger value="cout-actifs">Coût actifs</TabsTrigger>
    <TabsTrigger value="planifie-reel">Planifié vs Réel</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## Migrations Prisma — contexte existant

Le projet utilise des migrations Prisma classiques (répertoire `prisma/migrations/`). Trois migrations existent : init, asset_hierarchy, add_spare_parts. La Phase 6 a utilisé `prisma db push` (pas de migration formelle — confirmé par les commits). [VERIFIED: `ls prisma/migrations/`]

**Décision pour Phase 7:** La Phase 7 doit créer une migration formelle pour le renommage `faultDescription → faultProblem` car un renommage de colonne ne peut pas être fait sûrement via `db push` (Prisma interprète rename = drop + create, perte de données). La migration SQL doit contenir :

```sql
-- [ASSUMED: syntaxe PostgreSQL — vérifier la version exacte installée]
ALTER TABLE "WorkOrder" RENAME COLUMN "faultDescription" TO "faultProblem";
ALTER TABLE "WorkOrder" ADD COLUMN "faultCause" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "faultRemedy" TEXT;
```

Puis `prisma migrate resolve --applied <migration_name>` pour synchroniser si `db push` a déjà été utilisé en développement. OU créer la migration proprement avec `prisma migrate dev --name phase7_fault_pcr`.

---

## État vide — comportement prescrit

Chaque rapport doit afficher un message d'état vide actionnable (décision Claude's Discretion) :

| Rapport | Condition vide | Message |
|---------|---------------|---------|
| Top pannes | `faultProblem` null sur tous les BTs de la période | "Aucun code de panne saisi sur la période. Configurez les exigences de clôture dans Paramètres." |
| MTTR | Aucun BT correctif avec timeLogs sur la période | "Aucune session de temps enregistrée sur des BTs correctifs." |
| Coût actifs | Aucun BT complété avec actif associé | "Aucun bon de travail complété sur la période avec un actif associé." |
| Planifié vs Réel | Aucun BT avec `estimatedHours` non null | "Aucun bon de travail avec durée estimée sur la période." |

---

## Inventaire des fichiers à modifier (impact Phase 6)

| Fichier | Modification | Impact si oublié |
|---------|-------------|-----------------|
| `prisma/schema.prisma` | `faultDescription → faultProblem`, +`faultCause`, +`faultRemedy` | Client Prisma généré invalide |
| `src/lib/closure-requirements.ts` | `ClosureCheckInput.faultDescription → faultProblem` | Validation clôture échoue |
| `src/actions/work-orders.ts` | `setWorkOrderFault` : prop + DB field rename | Action server retourne erreur |
| `src/components/work-orders/work-order-fault-form.tsx` | Props + champs `faultDescription → faultProblem`, +`faultCause`, +`faultRemedy` | UI ne sauvegarde plus |
| `src/components/work-orders/work-order-detail.tsx` | Prop passée à `WorkOrderFaultForm` | TypeScript error |
| `src/components/work-orders/work-order-closure-banner.tsx` | Référence `faultDescription` si présente | TypeScript error |

---

## Disponibilité environnement

Step 2.6 : IGNORÉ — phase purement code/schema, pas de dépendances externes nouvelles. PostgreSQL et Prisma déjà opérationnels (Phase 6 complète).

---

## Architecture de validation

### Infrastructure de tests existante

```
src/lib/closure-requirements.test.ts  ✅ — existe (Phase 6)
```

### Mapping requirements → tests

| Req ID | Comportement | Type | Automatisable |
|--------|-------------|------|---------------|
| FIAB-01 | groupBy faultProblem retourne top N | Unit (logique agrégation) | Difficile sans DB — vérification humaine UI |
| FIAB-02 | MTTR calculé = sum(minutes) / count / 60 | Unit (fonction pure) | ✅ `getPeriodStart()`, calcul MTTR en isolation |
| FIAB-03 | Coût = pièces + MO, null hourlyRate → 0 | Unit (calcul) | ✅ fonctions utilitaires dans report-utils.ts |
| FIAB-04 | Delta = estimatedHours - realHours | Unit (calcul delta) | ✅ fonctions utilitaires |

Les vérifications UI (données s'affichent correctement dans les tabs) sont des checkpoints humains — pas de framework E2E dans ce projet.

---

## Domaine sécurité

Aucune nouvelle surface d'attaque : les rapports sont des Server Components gated derrière `requirePlan`. Pas de nouveaux endpoints publics. Les données sont filtrées par `organizationId` (multi-tenancy). Pas d'input utilisateur direct dans les agrégations (les périodes sont validées côté serveur par switch/case).

---

## Journal des hypothèses

| # | Hypothèse | Section | Risque si faux |
|---|-----------|---------|----------------|
| A1 | Next.js 15 App Router — `searchParams` est une `Promise` et doit être `await`-é | Architecture Patterns | TypeScript error ou comportement inattendu — vérifier `package.json` `next` version avant d'écrire le code |
| A2 | `prisma migrate dev` disponible en développement (pas seulement `db push`) | Migrations Prisma | Si seul `db push` est utilisé, adapter le plan de migration |
| A3 | Volume de BTs par organisation < 10k — agrégation mémoire acceptable pour MTTR/coût | Patterns 4 et 5 | Performance dégradée sur gros volumes — raw SQL nécessaire |

---

## Sources

### Primaires (HIGH confidence — code existant vérifié)
- `prisma/schema.prisma` — Modèles `WorkOrder`, `WorkOrderTimeLog`, `WorkOrderPart`, `Membership` vérifiés
- `src/app/(app)/rapports/page.tsx` — Pattern requirePlan, groupBy, aggregate, rendu UI
- `src/lib/auth.ts` — `requirePlan()` pattern exact
- `src/components/ui/tabs.tsx` — API base-ui Tabs confirmée
- `src/lib/closure-requirements.ts` — Champs faultCategory/faultDescription actuels
- `src/actions/work-orders.ts` — `setWorkOrderFault`, timer actions
- `src/app/(app)/actifs/layout.tsx` — Pattern tabs de navigation du projet
- `prisma/migrations/` — 3 migrations existantes confirmées

### Secondaires (MEDIUM confidence)
- CONTEXT.md Phase 7 — Décisions architecturales validées par l'utilisateur

---

## Métadonnées

**Breakdown de confiance:**
- Standard stack : HIGH — tout est vérifié dans le code existant
- Patterns d'architecture : HIGH pour le pattern DB ; MEDIUM pour searchParams Next.js 15 (A1)
- Pièges : HIGH — identifiés par lecture directe du code concerné

**Date de recherche:** 2026-05-25
**Valide jusqu'à:** 2026-06-25 (stack stable)
