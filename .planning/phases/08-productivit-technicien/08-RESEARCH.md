# Phase 8: Productivité technicien — Recherche

**Date de recherche:** 2026-05-26
**Domaine:** GMAO — templates de travail, checklists PM, escalade urgence
**Confiance globale:** HIGH (base de code analysée directement)

---

## Résumé

La Phase 8 introduit trois fonctionnalités complémentaires pour réduire la charge mentale des techniciens : les **job plans** (plans de travail réutilisables attachés aux PM), les **checklists interactives** sur les BTs générés par PM, et l'**escalade automatique** des BTs urgents non résolus après un délai configurable.

Le projet dispose déjà de fondations solides : `MaintenancePlan` avec `MaintenanceTask[]` (étapes textuelles simples), une infrastructure email Resend éprouvée, un cron Vercel (`/api/cron/maintenance-reminder`) opérationnel, et un modèle de config JSON admin (`closureRequirements`) qui sert de patron pour le délai d'escalade configurable. Ces fondations permettent d'éviter toute réarchitecture et de se concentrer sur des extensions ciblées.

Les deux défis principaux sont : (1) la distinction conceptuelle entre `MaintenanceTask` (liste de référence dans le PM = "job plan") et `WorkOrderChecklistItem` (instance interactive dans le BT généré = "checklist"), et (2) la détection des BTs urgents non résolus dans le cron sans dégradation de performance.

**Recommandation principale:** Étendre le schéma Prisma avec `WorkOrderChecklistItem` (rattaché au BT, coché indépendamment), ajouter `maintenancePlanId` sur `WorkOrder` pour tracer l'origine, stocker le délai d'escalade dans `Organization.escalationConfig` (Json — même pattern que `closureRequirements`), et ajouter un second cron `/api/cron/urgent-escalation`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Support de recherche |
|----|-------------|----------------------|
| PROD-01 | Job plans : étapes + pièces requises + durée estimée attachés à un PM, pré-remplissent le BT généré | `MaintenancePlan` a déjà `estimatedHours` et `MaintenanceTask[]`. Ajouter `MaintenancePlanPart[]` pour les pièces. Lier BT généré au plan via `maintenancePlanId` sur `WorkOrder`. Copier tasks → `WorkOrderChecklistItem` à la génération. |
| PROD-02 | Checklists PM : étapes numérotées avec cases à cocher, champs de mesure, photos sur mobile | Nouveau modèle `WorkOrderChecklistItem` avec `checked`, `measureValue`, `photoUrl`. UI mobile-first avec `<input type="checkbox">` natif + Server Actions. |
| PROD-03 | BT priorité "Urgente" non résolu après X heures (configurable) → notification superviseur | Nouveau cron Vercel + `escalationConfig` Json dans `Organization`. Superviseur = membres `admin` ou `manager`. Email via Resend (pattern identique à `urgent-escalation`). |
</phase_requirements>

---

## Contraintes projet (depuis CLAUDE.md)

- Lire `node_modules/next/dist/docs/` avant d'écrire tout code Next.js — APIs peuvent différer des versions connues
- Respecter les notices de dépréciation Next.js
- Ce projet utilise **Next.js 16.2.6**, React 19, Prisma 7.8, Tailwind 4, TypeScript strict

---

## Stack standard

### Core (déjà en place — VERIFIED: codebase)
| Bibliothèque | Version | Usage Phase 8 |
|--------------|---------|---------------|
| Next.js | 16.2.6 | App Router, Server Actions, Route Handlers (cron) |
| Prisma | 7.8.0 | Nouvelles migrations: WorkOrderChecklistItem, champs escalade |
| Resend | 6.12.3 | Email escalade superviseur (template à créer) |
| @react-email/render | 2.0.8 | Rendu HTML du template email escalade |
| Vercel Cron | — | Second cron `/api/cron/urgent-escalation` (schedule: `0 * * * *`) |
| Vitest | 4.1.6 | Tests unitaires : parse/validate escalation config, checklist logic |
| Sonner | 2.0.7 | Toast feedback actions checklist |
| Lucide React | 1.16.0 | Icônes : `CheckSquare`, `Clock`, `AlertTriangle` |

### Supporting
| Bibliothèque | Version | Usage |
|--------------|---------|-------|
| react-hook-form | 7.75.0 | Formulaire config escalade dans paramètres |
| zod | 4.4.3 | Validation schéma config escalade |

### Pas d'ajout de dépendances
La phase entière peut être livrée sans installer de nouveaux packages. Tout est déjà présent.
[VERIFIED: package.json analysé]

---

## Architecture patterns

### Structure recommandée

```
prisma/schema.prisma                    ← + WorkOrderChecklistItem, WorkOrder.maintenancePlanId,
                                           + MaintenancePlanPart, Organization.escalationConfig
src/lib/
  escalation-config.ts                  ← parse/validate EscalationConfig (JSON)
  escalation-config.test.ts             ← unit tests (même patron que closure-requirements.test.ts)
src/actions/
  maintenance.ts                        ← + generateWorkOrderFromPlan(), + addPlanPart(), deletePlanPart()
  work-orders.ts                        ← + toggleChecklistItem(), setChecklistMeasure()
  settings.ts                           ← + updateEscalationConfig()
src/app/api/cron/
  urgent-escalation/route.ts            ← nouveau cron (même patron que maintenance-reminder/route.ts)
src/emails/
  urgent-escalation.tsx                 ← template email (même patron que work-order-assigned.tsx)
src/lib/email.ts                        ← + sendUrgentEscalationEmail()
src/components/
  maintenance/
    maintenance-plan-form-dialog.tsx    ← étendre : section pièces requises du job plan
    maintenance-plan-list.tsx           ← afficher pièces requises dans l'accordéon
  work-orders/
    work-order-checklist.tsx            ← nouveau : liste interactive cases à cocher + mesures
    work-order-detail.tsx               ← intégrer WorkOrderChecklist si BT issu d'un PM
  settings/
    escalation-config-section.tsx       ← nouveau : config délai + toggle activé/désactivé
src/app/(app)/parametres/organisation/
  page.tsx                              ← ajouter section EscalationConfigSection
```

### Pattern 1 : Schéma Prisma — extensions minimales

```prisma
// PROD-01 : pièces requises dans le job plan
model MaintenancePlanPart {
  id                String   @id @default(cuid())
  maintenancePlanId String
  sparePartId       String?
  name              String
  quantity          Float
  createdAt         DateTime @default(now())

  maintenancePlan MaintenancePlan @relation(fields: [maintenancePlanId], references: [id], onDelete: Cascade)
  sparePart       SparePart?      @relation(fields: [sparePartId], references: [id], onDelete: SetNull)

  @@index([maintenancePlanId])
}

// Relation inverse dans MaintenancePlan
// planParts  MaintenancePlanPart[]

// PROD-01 + PROD-02 : instance checklist sur BT généré
model WorkOrderChecklistItem {
  id          String    @id @default(cuid())
  workOrderId String
  order       Int
  description String
  checked     Boolean   @default(false)
  checkedAt   DateTime?
  measureValue String?  // champ de mesure libre (PROD-02)
  photoUrl    String?   // PROD-02 — URL Vercel Blob ou similaire (hors scope Phase 8)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workOrder WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  @@index([workOrderId])
}

// Traçabilité origine PM → BT
// Sur WorkOrder : maintenancePlanId  String?
//                maintenancePlan     MaintenancePlan? @relation(...)

// PROD-03 : config escalade (sur Organization)
// escalationConfig  Json?   // { enabled: bool, delayHours: number }
```
[ASSUMED — structure proposée, non encore validée avec l'équipe]

### Pattern 2 : Génération BT depuis PM (PROD-01)

La génération d'un BT depuis un PM (action manuelle ou cron) doit copier les tasks et parts du plan dans le BT :

```typescript
// src/actions/maintenance.ts
export async function generateWorkOrderFromPlan(planId: string) {
  const { organizationId } = await getOrgAndMembership()

  const plan = await db.maintenancePlan.findFirst({
    where: { id: planId, organizationId },
    include: {
      tasks: { orderBy: { order: 'asc' } },
      planParts: true,
    },
  })
  if (!plan) throw new Error('Plan introuvable')

  const last = await db.workOrder.findFirst({
    where: { organizationId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  const number = (last?.number ?? 0) + 1

  const wo = await db.workOrder.create({
    data: {
      organizationId,
      number,
      title: plan.name,
      description: plan.description ?? undefined,
      type: 'preventive',
      priority: plan.priority,
      estimatedHours: plan.estimatedHours ?? undefined,
      assetId: plan.assetId ?? undefined,
      maintenancePlanId: planId,
      // Copie des tasks → checklistItems
      checklistItems: plan.tasks.length > 0 ? {
        create: plan.tasks.map(t => ({
          order: t.order,
          description: t.description,
        }))
      } : undefined,
      // Copie des pièces requises → WorkOrderPart (pré-rempli, non décompté du stock)
      parts: plan.planParts.length > 0 ? {
        create: plan.planParts.map(p => ({
          sparePartId: p.sparePartId ?? null,
          name: p.name,
          quantity: p.quantity,
        }))
      } : undefined,
    },
  })

  // Mettre à jour lastGeneratedAt sur le plan
  await db.maintenancePlan.update({
    where: { id: planId },
    data: { lastGeneratedAt: new Date() },
  })

  revalidatePath('/bons-de-travail')
  revalidatePath('/maintenance')
  return wo
}
```
[ASSUMED — pattern de génération à valider avec les décisions UX (manuel vs automatique)]

### Pattern 3 : Config escalade (PROD-03)

Même patron que `closureRequirements` — stocké comme `Json?` dans `Organization` :

```typescript
// src/lib/escalation-config.ts
export type EscalationConfig = {
  enabled: boolean
  delayHours: number  // par défaut : 4
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  enabled: false,
  delayHours: 4,
}

export function parseEscalationConfig(raw: unknown): EscalationConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_ESCALATION_CONFIG
  const r = raw as Record<string, unknown>
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : false,
    delayHours: typeof r.delayHours === 'number' && r.delayHours > 0 ? r.delayHours : 4,
  }
}
```
[VERIFIED: patron identique à closure-requirements.ts analysé en codebase]

### Pattern 4 : Cron escalade urgence (PROD-03)

```typescript
// src/app/api/cron/urgent-escalation/route.ts
// Même structure que maintenance-reminder/route.ts
export async function GET(request: NextRequest) {
  // Vérifier CRON_SECRET (identique au cron existant)

  const now = new Date()

  // BTs urgents ouverts/en cours depuis plus de X heures
  const orgsWithConfig = await db.organization.findMany({
    where: { escalationConfig: { not: null } },
    select: { id: true, name: true, escalationConfig: true,
              members: { where: { role: { in: ['admin', 'manager'] } }, select: { email: true } } },
  })

  for (const org of orgsWithConfig) {
    const cfg = parseEscalationConfig(org.escalationConfig)
    if (!cfg.enabled) continue

    const threshold = new Date(now.getTime() - cfg.delayHours * 60 * 60 * 1000)

    const overdueWOs = await db.workOrder.findMany({
      where: {
        organizationId: org.id,
        priority: 'urgent',
        status: { in: ['open', 'in_progress', 'on_hold'] },
        createdAt: { lte: threshold },
      },
      select: { id: true, number: true, title: true, createdAt: true },
    })
    // Envoyer emails aux superviseurs...
  }
}
```
[VERIFIED: pattern cron existant analysé — maintenance-reminder/route.ts]

### Anti-patterns à éviter

- **Ne pas stocker l'état "escalade envoyée" sans flag** : sans `escalationSentAt` sur `WorkOrder`, le cron renverra un email à chaque heure. Ajouter `escalationSentAt DateTime?` sur `WorkOrder` pour idempotence. [ASSUMED — décision de design à confirmer]
- **Ne pas décrementer le stock lors de la pré-saisie des pièces du job plan** : les `WorkOrderPart` créés depuis le job plan sont des suggestions, pas des consommations réelles. Le décompte de stock reste à la saisie manuelle (comportement Phase 6 conservé).
- **Ne pas dupliquer MaintenanceTask et WorkOrderChecklistItem** : ce sont deux modèles distincts — l'un est la définition (template PM), l'autre est l'instance interactive (BT).
- **Ne pas utiliser `photoUrl` sans stockage** : la Phase 8 peut inclure le champ `photoUrl` dans le schéma mais laisser sa mise à jour UI pour une phase ultérieure (éviter Vercel Blob hors scope).

---

## Ce qu'il ne faut pas réinventer

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|----------|-------------------|-----------------|----------|
| Email escalade | Système email maison | Resend + @react-email/render | Déjà fonctionnel pour 4 types d'emails |
| Cron scheduling | Scheduler custom | Vercel Cron (vercel.json) | Pattern éprouvé — maintenance-reminder opérationnel |
| Config admin | UI de config complexe | Pattern Json + Section composant | Patron closure-requirements réutilisable |
| Authentification cron | Auth maison | `CRON_SECRET` header bearer | Pattern sécurisé déjà en place |
| Gestion de rôle superviseur | Nouveau rôle | Membres `admin` + `manager` existants | Enum `MemberRole` couvre le besoin |

---

## Pièges courants

### Piège 1 : Génération BT manuelle vs automatique
**Ce qui se passe:** Si la génération reste manuelle (bouton "Générer BT"), le cron PM existant continue sans conflit. Si on l'automatise dans le cron, il faut tracker `lastGeneratedAt` pour éviter les doublons.
**Cause racine:** `MaintenancePlan.lastGeneratedAt` existe déjà — mais aucun cron ne génère actuellement de BTs.
**Comment éviter:** Phase 8 = génération manuelle depuis la fiche PM. La génération automatique peut attendre Phase 9 ou une phase dédiée. [ASSUMED — décision UX à confirmer]

### Piège 2 : Idempotence du cron d'escalade
**Ce qui se passe:** Le cron tourne toutes les heures. Sans flag, un BT urgent de 10h envoie 10 emails.
**Cause racine:** Pas de mécanisme "déjà notifié" dans le schéma actuel.
**Comment éviter:** Ajouter `escalationSentAt DateTime?` sur `WorkOrder`. Le cron n'envoie que si `escalationSentAt IS NULL AND createdAt <= threshold`.

### Piège 3 : Checklist sur BTs non-PM
**Ce qui se passe:** Si l'UI affiche la section checklist sur tous les BTs, elle est vide pour les BTs correctifs — confusion UX.
**Cause racine:** `WorkOrderChecklistItem` sera uniquement peuplé sur les BTs issus d'un PM.
**Comment éviter:** Afficher la section checklist conditionnellement — uniquement si `workOrder.maintenancePlanId !== null` OU si `checklistItems.length > 0`.

### Piège 4 : Pièces du job plan vs pièces réelles du BT
**Ce qui se passe:** Les pièces pré-remplies depuis le job plan ne doivent pas décrementer le stock à la création du BT.
**Cause racine:** `upsertWorkOrderPart` décrémente le stock à la création si `sparePartId` est présent (Phase 6 D-07).
**Comment éviter:** La fonction de génération BT crée les `WorkOrderPart` sans passer par `upsertWorkOrderPart`. Elle utilise directement `db.workOrder.create` avec `parts: { create: [...] }` — aucun décompte stock.

### Piège 5 : Prisma 7.x — `prisma db push` vs migration
**Ce qui se passe:** Ce projet utilise Prisma 7 avec `@prisma/adapter-pg`. Les migrations peuvent se comporter différemment.
**Cause racine:** Phases précédentes ont toutes utilisé `prisma db push` + `prisma generate` sans `prisma migrate`.
**Comment éviter:** Continuer avec `npx prisma db push && npx prisma generate` (cohérent avec toutes les phases précédentes). [VERIFIED: pattern observé dans les PLANs des phases 5, 6, 7]

---

## Exemples de code

### toggleChecklistItem (Server Action)
```typescript
// src/actions/work-orders.ts — extension
export async function toggleChecklistItem(itemId: string, checked: boolean) {
  const { organizationId } = await getOrgAndMembership()

  // Vérifier que l'item appartient à l'org via la relation WorkOrder
  const item = await db.workOrderChecklistItem.findFirst({
    where: { id: itemId, workOrder: { organizationId } },
    select: { id: true, workOrderId: true },
  })
  if (!item) throw new Error('Item introuvable')

  await db.workOrderChecklistItem.update({
    where: { id: itemId },
    data: { checked, checkedAt: checked ? new Date() : null },
  })
  revalidatePath(`/bons-de-travail/${item.workOrderId}`)
}
```
[VERIFIED: pattern identique aux autres Server Actions du projet]

### vercel.json étendu
```json
{
  "crons": [
    { "path": "/api/cron/maintenance-reminder", "schedule": "0 * * * *" },
    { "path": "/api/cron/urgent-escalation",   "schedule": "0 * * * *" }
  ]
}
```
[VERIFIED: vercel.json actuel analysé — ajout d'une entrée]

---

## Inventaire état runtime

> Phase 8 = ajout de fonctionnalités (greenfield sur base existante). Aucun rename, refactoring ou migration de données existantes.

**Rien à migrer.** Les nouvelles tables (`WorkOrderChecklistItem`, `MaintenancePlanPart`) et les nouveaux champs (`maintenancePlanId`, `escalationConfig`, `escalationSentAt`) sont tous nullable ou avec défaut — aucun backfill requis.

---

## Disponibilité environnement

> Phase 8 = code + config Vercel uniquement. Pas de nouvelles dépendances externes.

| Dépendance | Requise par | Disponible | Version | Fallback |
|------------|-------------|------------|---------|----------|
| PostgreSQL | Prisma | ✓ | — | — |
| Resend API | Email escalade | ✓ (déjà configuré) | — | — |
| Vercel Cron | urgent-escalation | ✓ (déjà utilisé) | — | — |
| CRON_SECRET env | Auth cron | ✓ (déjà configuré) | — | — |

**Aucune dépendance bloquante.**

---

## Architecture de validation

### Infrastructure de tests
| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest 4.1.6 |
| Config | `vitest.config.ts` (racine projet) |
| Commande rapide | `npx vitest run src/lib/escalation-config.test.ts` |
| Suite complète | `npx vitest run` |

### Mapping requirements → tests
| Req ID | Comportement | Type | Commande automatisée | Fichier |
|--------|-------------|------|----------------------|---------|
| PROD-01 | parseEscalationConfig valeurs par défaut | unit | `npx vitest run src/lib/escalation-config.test.ts` | ❌ Wave 0 |
| PROD-01 | parseEscalationConfig valeurs invalides | unit | `npx vitest run src/lib/escalation-config.test.ts` | ❌ Wave 0 |
| PROD-02 | toggleChecklistItem — vérification d'appartenance org | unit | `npx vitest run src/lib/escalation-config.test.ts` | ❌ Wave 0 |
| PROD-03 | Cron escalade — filtre BTs urgents non résolus | unit | `npx vitest run src/lib/escalation-config.test.ts` | ❌ Wave 0 |
| PROD-03 | Idempotence — escalationSentAt déjà défini | unit | `npx vitest run src/lib/escalation-config.test.ts` | ❌ Wave 0 |

### Fréquence d'échantillonnage
- **Par commit de tâche:** `npx vitest run src/lib/escalation-config.test.ts`
- **Par merge de wave:** `npx vitest run`
- **Gate phase:** Suite verte complète avant `/gsd-verify-work`

### Lacunes Wave 0
- [ ] `src/lib/escalation-config.test.ts` — couvre PROD-01 (parse/validate) et PROD-03 (logique cron)
- [ ] `src/lib/escalation-config.ts` — module à créer

*(L'infrastructure Vitest est déjà installée et configurée — aucune installation de framework requise)*

---

## Domaine sécurité

### Catégories ASVS applicables

| Catégorie ASVS | Applicable | Contrôle standard |
|----------------|-----------|-------------------|
| V2 Authentication | non | Clerk gère tout |
| V3 Session Management | non | Clerk |
| V4 Access Control | oui | `requireRole(['admin', 'manager'])` pour config escalade |
| V5 Input Validation | oui | `parseEscalationConfig()` — coerce et valide les types |
| V6 Cryptography | non | Pas de crypto phase 8 |

### Patterns de menace connus

| Pattern | STRIDE | Mitigation standard |
|---------|--------|---------------------|
| Config escalade malformée (delayHours=0 ou négatif) | Tampering | `parseEscalationConfig` rejette et retourne défaut |
| Cron appelé sans secret | Elevation of Privilege | Header `Authorization: Bearer CRON_SECRET` (pattern existant) |
| Checkbox coché pour BT d'une autre org | Tampering | `findFirst({ where: { id, workOrder: { organizationId } } })` |

---

## Journal des hypothèses

| # | Affirmation | Section | Risque si faux |
|---|-------------|---------|----------------|
| A1 | La génération de BT depuis PM est manuelle (bouton), pas automatique (cron) | Architecture | Si automatique → conflit avec nextDueAt et risk de BTs doublons |
| A2 | `photoUrl` inclus dans le schéma mais UI de capture hors scope Phase 8 | Schéma Prisma | Si requis → besoin Vercel Blob ou stockage externe, scope + important |
| A3 | `escalationSentAt` sur `WorkOrder` pour idempotence cron | Cron escalade | Si non choisi → envoyer via flag ailleurs (ex: table séparée) |
| A4 | Superviseur = membres role `admin` + `manager` (pas de nouveau rôle) | PROD-03 | Si rôle distinct requis → migration enum MemberRole |

---

## Questions ouvertes

1. **Déclenchement génération BT : manuel ou automatique ?**
   - Ce qu'on sait : le cron existant envoie des rappels 48h avant mais ne crée pas de BTs
   - Ce qui est flou : la Phase 8 doit-elle créer les BTs automatiquement (ex: à J-0), ou seulement pré-remplir quand le technicien appuie sur "Générer BT" ?
   - Recommandation : Manuel pour Phase 8 (moins risqué, meilleure UX de contrôle), automatique possible en Phase 9

2. **Pièces du job plan : décompte stock lors de la génération BT ?**
   - Ce qu'on sait : Phase 6 décrémente le stock à l'ajout d'une pièce au BT
   - Ce qui est flou : les pièces copiées depuis le job plan doivent-elles être des "réservations" ou juste des suggestions ?
   - Recommandation : Suggestions uniquement (pas de décompte à la génération) — le technicien confirme à l'exécution

3. **Champ de mesure checklist (PROD-02) : format libre ou structuré ?**
   - Ce qu'on sait : le requirement dit "champs de mesure"
   - Ce qui est flou : texte libre (String) ou nombre avec unité ?
   - Recommandation : `measureValue String?` (texte libre) — extensible sans migration si l'on veut ajouter une unité plus tard

---

## Sources

### Primaires (HIGH confidence — VERIFIED codebase)
- `prisma/schema.prisma` — modèles existants, relations, conventions de nommage
- `src/actions/maintenance.ts` — pattern Server Actions PM
- `src/actions/work-orders.ts` — pattern création BT, gestion pièces, timer
- `src/actions/settings.ts` — pattern config admin (getAdminOrg)
- `src/lib/closure-requirements.ts` — patron pour escalation-config.ts
- `src/components/settings/closure-requirements-section.tsx` — patron UI section config
- `src/app/api/cron/maintenance-reminder/route.ts` — patron cron Vercel
- `vercel.json` — config crons existante
- `src/lib/email.ts` — infrastructure email Resend
- `src/emails/work-order-assigned.tsx` — patron template email

### Secondaires (MEDIUM confidence)
- `package.json` — versions de toutes les dépendances
- Plans et summaries Phase 6 et 7 — patterns d'implémentation établis

---

## Métadonnées

**Répartition de confiance:**
- Stack standard : HIGH — codebase analysée directement
- Architecture : HIGH — basée sur 7 phases de patterns cohérents
- Pièges : HIGH — issus de l'analyse du code existant (stock, cron idempotence)
- Hypothèses A1-A4 : LOW à MEDIUM — décisions UX non encore confirmées

**Date de recherche:** 2026-05-26
**Valide jusqu'à:** 2026-06-26 (stack stable)
