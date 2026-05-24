# Phase 5: Portail de demandes de travail — Research

**Researched:** 2026-05-24
**Domain:** Next.js App Router public routes — formulaire sans auth — création BT — email de confirmation
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PORTAL-01 | Une URL publique par site permet à n'importe qui de soumettre une demande de maintenance sans compte Korvia | Route `/portail/[siteToken]` dans le groupe `(public)`, whitelistée dans `proxy.ts`, aucune dépendance Clerk |
| PORTAL-02 | La soumission crée automatiquement un BT et envoie une confirmation email au demandeur avec le numéro de BT | Route Handler POST ou Server Action découplée de Clerk, réutilise la logique de `createWorkOrder`, envoie via Resend |
</phase_requirements>

---

## Summary

Le portail de demandes est une page Next.js publique (sans Clerk) accessible via une URL unique par site — ex. `/portail/[siteToken]`. La stratégie centrale est d'encoder l'identité du site dans un **token opaque** stocké sur le modèle `Site`, évitant d'exposer les IDs Prisma internes dans l'URL.

Le formulaire (description, localisation optionnelle, photo optionnelle) est rendu côté serveur via App Router. La soumission passe par un **Route Handler POST** (`/api/portal/[siteToken]`) ou une **Server Action publique** — les deux approches sont viables, mais le Route Handler est préférable pour les uploads multipart. La confirmation email réutilise l'infrastructure Resend + `@react-email/render` existante, avec un nouveau template dédié.

L'upload photo est le seul point d'incertitude notable : `@vercel/blob` n'est pas installé. Deux options existent — le stocker en base64 dans la description (acceptable pour MVP) ou installer `@vercel/blob` (2.4.0 disponible sur npm). La décision détermine si un `WorkOrderAttachment` est créé.

**Recommandation principale:** Route publique `(public)/portail/[siteToken]` + Route Handler POST `/api/portal/[siteToken]` + champ `portalToken` sur `Site` + template email `PortalConfirmationEmail`.

---

## Architecture Patterns

### Structure de route recommandée

```
src/
├── app/
│   ├── (public)/                       # Nouveau groupe sans layout Clerk
│   │   └── portail/
│   │       └── [siteToken]/
│   │           └── page.tsx            # Formulaire public SSR
│   └── api/
│       └── portal/
│           └── [siteToken]/
│               └── route.ts            # POST handler — crée BT + envoie email
├── emails/
│   └── portal-confirmation.tsx         # Nouveau template email
└── actions/
    └── portal.ts                       # Logique métier (optionnel si tout dans route.ts)
```

### Pattern 1: Groupe de routes public sans layout Clerk

Le projet utilise déjà les groupes de routes Next.js : `(app)` pour l'espace authentifié, `(auth)` pour Clerk. Il faut créer un troisième groupe `(public)` qui n'hérite pas du layout Clerk.

**Ce qui est critique :** whitelister le chemin dans `proxy.ts`. Le fichier actuel expose déjà la mécanique :

```typescript
// Source: src/proxy.ts (VERIFIED — fichier lu)
const isPublicRoute = createRouteMatcher([
  // ... routes existantes ...
  "/api/v1(.*)",
  "/api/qr(.*)",
  // À AJOUTER:
  "/portail(.*)",
  "/api/portal(.*)",
])
```

Sans cette entrée, `clerkMiddleware` redirige vers `/sign-in`. [VERIFIED: src/proxy.ts]

### Pattern 2: Token opaque sur le modèle Site

Le schéma Prisma actuel n'a pas de champ `portalToken` sur `Site`. Il faut une migration Prisma :

```prisma
// prisma/schema.prisma — ajout à model Site
model Site {
  // ... champs existants ...
  portalToken  String?  @unique  // UUID v4 généré à la création ou à la demande
  portalEnabled Boolean @default(false)

  @@index([portalToken])
}
```

[VERIFIED: prisma/schema.prisma lu — champ absent confirmé]

Le token est généré avec `crypto.randomUUID()` (disponible nativement en Node.js 18+). L'admin active le portail depuis les paramètres du site — nouvelle UI dans les paramètres organisation.

### Pattern 3: Route Handler POST pour la soumission

La logique de création de BT **ne peut pas appeler les Server Actions existantes** (`createWorkOrder` dans `src/actions/work-orders.ts`) car elles commencent toutes par `await auth()` — ce qui lèverait une erreur dans un contexte sans session Clerk.

La solution : dupliquer/extraire la logique de création de BT sans Clerk, exactement comme l'a fait le Plan 04-02 pour l'API REST :

```typescript
// Source: src/app/api/v1/work-orders/route.ts (VERIFIED — fichier lu)
// Pattern à reproduire dans /api/portal/[siteToken]/route.ts
const last = await db.workOrder.findFirst({
  where: { organizationId },
  orderBy: { number: 'desc' },
  select: { number: true },
})
const number = (last?.number ?? 0) + 1

const wo = await db.workOrder.create({
  data: {
    organizationId,    // ← dérivé du token, JAMAIS du body
    siteId,            // ← dérivé du token, JAMAIS du body
    number,
    title,             // généré depuis la description: "Demande #XX"
    description,
    type: 'service_request',
    status: 'open',
    priority: 'medium',
  },
})
```

[VERIFIED: src/app/api/v1/work-orders/route.ts]

### Pattern 4: Validation avec Zod

Le projet utilise Zod 4.4.3 pour la validation. Le schéma du formulaire public :

```typescript
// À créer dans src/lib/portal-validation.ts
import { z } from 'zod'

export const portalSubmitSchema = z.object({
  requesterName: z.string().min(1).max(100),
  requesterEmail: z.string().email(),
  description: z.string().min(10).max(1000),
  locationDescription: z.string().max(200).optional(),
  // photoUrl ajouté si upload activé
})
```

[VERIFIED: zod@4.4.3 installé, patterns Zod vus dans src/lib/api-validation.ts]

### Pattern 5: Formulaire avec useActionState

Next.js 16 + React 19 — le pattern officiel pour les formulaires avec feedback est `useActionState` (pas `useFormState` qui est déprécié) :

```typescript
// Source: node_modules/next/dist/docs/01-app/02-guides/forms.md (VERIFIED)
'use client'
import { useActionState } from 'react'

const [state, formAction, pending] = useActionState(submitPortalRequest, initialState)
```

`useFormStatus` pour le bouton de soumission dans un composant enfant.

### Pattern 6: Email de confirmation sans compte Korvia

L'email va à l'adresse saisie dans le formulaire — pas à un `Membership`. La fonction `sendEmail` dans `src/lib/email.ts` accepte `to: string` directement via Resend. Il suffit d'ajouter une fonction `sendPortalConfirmationEmail` suivant exactement le même pattern que `sendWorkOrderAssignedEmail` :

```typescript
// Source: src/lib/email.ts (VERIFIED — fichier lu)
export async function sendPortalConfirmationEmail(params: {
  to: string
  requesterName: string
  workOrderNumber: number
  siteName: string
  organizationName: string
}): Promise<void> {
  const html = await render(PortalConfirmationEmail(params))
  await resend.emails.send({
    from: FROM,   // 'Korvia <notifications@korvia.app>'
    to: [params.to],
    subject: `[Korvia] Votre demande #${params.workOrderNumber} a été reçue`,
    html,
  })
}
```

[VERIFIED: src/lib/email.ts — pattern Resend + @react-email/render confirmé]

### Anti-Patterns à éviter

- **Appeler `auth()` dans le Route Handler du portail** : lèverait une exception en l'absence de session Clerk. Identifier l'organisation via le `siteToken` uniquement.
- **Exposer `siteId` dans l'URL** : les IDs Prisma CUID sont prévisibles. Utiliser un token UUID distinct.
- **Server Action `'use server'` avec `auth()` pour le formulaire public** : même problème. Utiliser Route Handler ou Server Action sans appel à `auth()`.
- **Stocker `organizationId` dans un champ caché du formulaire** : vecteur de falsification. Le dériver toujours du token côté serveur.
- **Bloquer la réponse sur l'envoi email** : fire-and-forget avec `Promise.allSettled` / `.catch()`, comme dans `createWorkOrder`. [VERIFIED: src/actions/work-orders.ts L71]

---

## Standard Stack

### Core

| Bibliothèque | Version | Rôle | Statut |
|---|---|---|---|
| Next.js | 16.2.6 | App Router, Route Handlers, groupes de routes | Installé [VERIFIED] |
| React | 19.2.4 | `useActionState`, `useFormStatus` | Installé [VERIFIED] |
| Prisma | 7.8.0 | Migration `portalToken` sur `Site` | Installé [VERIFIED] |
| Zod | 4.4.3 | Validation formulaire côté serveur | Installé [VERIFIED] |
| Resend | 6.12.3 | Email de confirmation | Installé [VERIFIED] |
| @react-email/render | 2.0.8 | Rendu HTML email | Installé [VERIFIED] |
| react-hook-form | 7.75.0 | Gestion état formulaire côté client | Installé [VERIFIED] |

### Upload photo (décision requise)

| Option | Package | Statut | Impact |
|--------|---------|--------|--------|
| Vercel Blob (recommandé) | `@vercel/blob@2.4.0` | NON installé — à ajouter | Nécessite `BLOB_READ_WRITE_TOKEN` env |
| Base64 en description | (aucun) | Installé | Limite la taille (~1MB), pas de miniature |
| Différer (hors scope MVP) | (aucun) | Installé | Le plus simple — photo est optionnelle |

**Installation si Vercel Blob choisi :**
```bash
npm install @vercel/blob
```

**Recommandation :** Pour le MVP, rendre la photo optionnelle et la différer (hors scope). Le champ `WorkOrderAttachment` existe déjà dans le schéma pour une implémentation future.

### Supporting

| Bibliothèque | Version | Rôle |
|---|---|---|
| `crypto.randomUUID()` | Node built-in | Génération du `portalToken` |
| `sonner` | déjà installé | Toast de confirmation (page portail) |

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|---|---|---|---|
| Génération token sécurisé | Logique UUID custom | `crypto.randomUUID()` | Entropie garantie, pas de dépendance |
| Envoi email | Client SMTP custom | Resend (déjà configuré) | Délivrabilité, templates, déjà intégré |
| Rendu HTML email | Templates string | `@react-email/render` | Déjà utilisé, cohérence |
| Validation schéma | Validation manuelle | Zod (déjà configuré) | Pattern établi dans le projet |
| Upload fichier | Upload custom S3 | `@vercel/blob` ou différer | Gestion multipart, limites taille |

---

## Common Pitfalls

### Pitfall 1: Clerk bloque la route publique
**Ce qui se passe :** La page portail redirige vers `/sign-in` au lieu de s'afficher.
**Pourquoi :** `proxy.ts` protège toutes les routes qui ne sont pas dans `isPublicRoute`.
**Comment éviter :** Ajouter `/portail(.*)` ET `/api/portal(.*)` à `createRouteMatcher` dans `proxy.ts` avant toute autre implémentation.
**Signe d'alerte :** Redirection 307 vers `/sign-in` lors du test en navigation privée.

### Pitfall 2: Appel à auth() dans le contexte portail
**Ce qui se passe :** `Error: Clerk: auth() was called but Clerk couldn't find the active session.`
**Pourquoi :** Les Server Actions du portail doivent être découplées de Clerk.
**Comment éviter :** Écrire une fonction de création BT dédiée sans `auth()` — seul le `siteToken` de l'URL sert d'identifiant.

### Pitfall 3: Race condition sur le numéro de BT
**Ce qui se passe :** Deux soumissions simultanées obtiennent le même `number`.
**Pourquoi :** La logique `findFirst + create` n'est pas atomique.
**Comment éviter :** La contrainte `@@unique([organizationId, number])` dans le schéma Prisma protège déjà contre les doublons — la deuxième écriture lèvera une erreur `P2002`. Gérer cette erreur avec un retry ou une séquence via `AUTO_INCREMENT`. [VERIFIED: prisma/schema.prisma L303 — contrainte unique confirmée]

### Pitfall 4: Token portalToken null pour les sites existants
**Ce qui se passe :** Les sites créés avant la migration n'ont pas de `portalToken`.
**Pourquoi :** La migration ajoute le champ nullable, mais ne génère pas les tokens.
**Comment éviter :** Générer le token à la demande (lazy) lors de la première activation du portail depuis les paramètres, ou écrire un script de migration qui génère les tokens manquants.

### Pitfall 5: Spam / abus du formulaire public
**Ce qui se passe :** Des soumissions automatisées remplissent la base de BTs.
**Pourquoi :** Le formulaire est accessible sans auth.
**Comment éviter :** Honeypot champ caché (simple, sans JS) + rate limiting par IP au niveau du Route Handler ou middleware. Pour le MVP, le honeypot suffit.

---

## Prisma — Changements de schéma requis

### Migration à écrire

```prisma
// Ajouts au model Site dans prisma/schema.prisma
portalToken    String?  @unique  // UUID v4, null = portail non activé
portalEnabled  Boolean  @default(false)

@@index([portalToken])  // recherche par token O(1)
```

Commande :
```bash
npx prisma migrate dev --name add_portal_token_to_site
npx prisma generate
```

[VERIFIED: schema.prisma — champs absents confirmés, pattern de migration déjà utilisé dans `/prisma/migrations/`]

---

## Architecture de l'URL portail

```
https://app.korvia.app/portail/[siteToken]
```

Exemple : `/portail/f47ac10b-58cc-4372-a567-0e02b2c3d479`

L'admin copie ce lien depuis les paramètres du site et le distribue à ses employés (affichage sur un QR code, email, intranet). L'URL ne révèle aucun ID interne.

La page SSR effectue :
1. `db.site.findUnique({ where: { portalToken: token }, include: { organization: true } })`
2. Si `null` ou `portalEnabled: false` → retourner `notFound()` (Next.js)
3. Sinon → afficher le formulaire avec le nom du site et de l'organisation

---

## Validation Architecture

### Framework de test

| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest 4.1.6 |
| Config | `vitest.config.ts` (racine) |
| Commande rapide | `npx vitest run src/app/api/portal` |
| Suite complète | `npx vitest run` |

[VERIFIED: vitest.config.ts lu]

### Carte requirements → tests

| Req ID | Comportement | Type | Commande | Fichier existant |
|--------|-------------|------|----------|-----------------|
| PORTAL-01 | Token invalide → 404 | unit | `npx vitest run src/app/api/portal` | ❌ Wave 0 |
| PORTAL-01 | Token valide → 200 avec données site | unit | `npx vitest run src/app/api/portal` | ❌ Wave 0 |
| PORTAL-01 | `portalEnabled: false` → 404 | unit | `npx vitest run src/app/api/portal` | ❌ Wave 0 |
| PORTAL-02 | POST valide → BT créé en DB | unit | `npx vitest run src/app/api/portal` | ❌ Wave 0 |
| PORTAL-02 | POST valide → email envoyé (mock Resend) | unit | `npx vitest run src/app/api/portal` | ❌ Wave 0 |
| PORTAL-02 | POST données invalides → 400 + erreurs Zod | unit | `npx vitest run src/app/api/portal` | ❌ Wave 0 |
| PORTAL-02 | `organizationId` ne vient JAMAIS du body | unit (sécurité) | `npx vitest run src/app/api/portal` | ❌ Wave 0 |

### Taux d'échantillonnage

- **Par commit tâche :** `npx vitest run src/app/api/portal`
- **Par merge wave :** `npx vitest run`
- **Gate phase :** suite complète verte avant `/gsd-verify-work`

### Gaps Wave 0

- [ ] `src/app/api/portal/[siteToken]/route.test.ts` — couvre PORTAL-01 et PORTAL-02
- [ ] Mock `@/lib/db` et `@/lib/email` (pattern identique à `route.test.ts` de l'API v1)

---

## Security Domain

### Catégories ASVS applicables

| Catégorie ASVS | Applicable | Contrôle standard |
|----------------|-----------|-------------------|
| V2 Authentication | non | Formulaire public intentionnel |
| V3 Session Management | non | Aucune session côté portail |
| V4 Access Control | oui | `organizationId` dérivé du token serveur, jamais du body |
| V5 Input Validation | oui | Zod sur tous les champs du formulaire |
| V6 Cryptography | oui | `crypto.randomUUID()` pour le token |

### Menaces connues pour ce stack

| Pattern | STRIDE | Mitigation standard |
|---------|--------|---------------------|
| Falsification `organizationId` via body | Tampering | Token résolu côté serveur uniquement |
| Soumission automatisée (spam BT) | Denial of Service | Honeypot + rate limit IP |
| Énumération de tokens | Information Disclosure | UUID v4 (2^122 combinaisons) |
| XSS via description BT | Tampering | Zod `.max(1000)` + React échappe par défaut |
| Upload fichier malveillant | Tampering | Valider `mimeType` + taille si upload activé |

---

## Environment Availability

| Dépendance | Requis par | Disponible | Version | Fallback |
|------------|-----------|-----------|---------|---------|
| PostgreSQL (Neon) | Prisma / BDD | ✓ | Neon cloud | — |
| Resend API key | Email confirmation | Configuré (placeholder) | — | — |
| `@vercel/blob` | Upload photo | ✗ | 2.4.0 sur npm | Différer la photo au-delà MVP |
| `BLOB_READ_WRITE_TOKEN` env | Upload photo | ✗ | — | Différer la photo |
| `crypto.randomUUID()` | Token portail | ✓ | Node 18+ built-in | — |

**Dépendances manquantes bloquantes :** aucune pour le MVP sans upload.

**Dépendances manquantes avec fallback :** `@vercel/blob` — photo optionnelle, différable.

---

## Code Examples

### Résolution du token dans le Route Handler

```typescript
// Source: pattern de src/app/api/v1/work-orders/route.ts (VERIFIED)
// À adapter pour src/app/api/portal/[siteToken]/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteToken: string }> }
) {
  const { siteToken } = await params

  const site = await db.site.findUnique({
    where: { portalToken: siteToken, portalEnabled: true },
    select: { id: true, organizationId: true, name: true,
              organization: { select: { name: true } } },
  })
  if (!site) {
    return Response.json({ error: 'Portail introuvable' }, { status: 404 })
  }

  // organizationId et siteId TOUJOURS depuis la DB, jamais depuis le body
  const { organizationId, id: siteId } = site
  // ... validation Zod + création BT + email
}
```

### Page SSR portail publique

```typescript
// Source: pattern App Router SSR (VERIFIED: node_modules/next/dist/docs)
// src/app/(public)/portail/[siteToken]/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ siteToken: string }>
}) {
  const { siteToken } = await params
  const site = await db.site.findUnique({
    where: { portalToken: siteToken, portalEnabled: true },
    select: { name: true, organization: { select: { name: true } } },
  })
  if (!site) notFound()

  return <PortalForm siteName={site.name} organizationName={site.organization.name} siteToken={siteToken} />
}
```

Note : `params` est une `Promise` en Next.js 16 App Router (breaking change vs Next.js 14). [VERIFIED: pattern vu dans src/app/api/qr/[code]/route.ts]

---

## State of the Art

| Ancienne approche | Approche actuelle | Impact |
|---|---|---|
| `useFormState` (React 18) | `useActionState` (React 19) | `useFormState` est déprécié — utiliser `useActionState` |
| `params` synchrones (Next.js 14) | `params: Promise<...>` (Next.js 15+) | `await params` obligatoire [VERIFIED: src/app/api/qr/[code]/route.ts] |
| `getServerSideProps` | Server Components + `async function Page()` | App Router — pas de `getServerSideProps` |

---

## Assumptions Log

| # | Claim | Section | Risque si faux |
|---|-------|---------|---------------|
| A1 | La photo est optionnelle et peut être différée au-delà du MVP | Standard Stack | Si le PO exige la photo dès Phase 5, `@vercel/blob` doit être installé et `BLOB_READ_WRITE_TOKEN` configuré |
| A2 | L'activation du portail se fait depuis les paramètres d'organisation existants (onglet Sites) | Architecture | Si une UI dédiée est requise, cela ajoute un plan supplémentaire |
| A3 | Un seul portail par site (pas par organisation) | Architecture | Si le besoin est un portail global organisation, l'URL et la résolution du token changent |

---

## Open Questions

1. **Upload photo — inclure ou différer ?**
   - Ce qu'on sait : `@vercel/blob` n'est pas installé, `WorkOrderAttachment` existe en DB
   - Ce qui est flou : priorité produit
   - Recommandation : différer — marquer comme "hors scope Phase 5", traiter en Phase 6 ou après

2. **Activation du portail par site — qui peut activer ?**
   - Ce qu'on sait : le schéma aura `portalEnabled` booléen
   - Ce qui est flou : admin seulement ou manager aussi ?
   - Recommandation : admin + manager (rôles `admin | manager`), vérifier le rôle dans la Server Action de toggle

3. **Honeypot vs captcha ?**
   - Ce qu'on sait : le formulaire est public, aucun rate limiting n'est en place
   - Ce qui est flou : niveau de risque spam acceptable pour le MVP
   - Recommandation : honeypot champ caché suffit pour le MVP (zéro dépendance externe)

---

## Sources

### Primaires (HIGH confidence)
- `src/proxy.ts` — mécanisme de whitelist Clerk, routes publiques existantes
- `src/actions/work-orders.ts` — logique création BT, pattern numérotation, fire-and-forget email
- `src/lib/email.ts` — pattern Resend + @react-email/render
- `prisma/schema.prisma` — modèles Site, WorkOrder, WorkOrderAttachment (absence de portalToken confirmée)
- `src/app/api/v1/work-orders/route.ts` — Route Handler sans Clerk, pattern à reproduire
- `src/app/api/qr/[code]/route.ts` — params Promise en Next.js 16
- `node_modules/next/dist/docs/01-app/02-guides/forms.md` — useActionState, useFormStatus, validation Zod

### Secondaires (MEDIUM confidence)
- `package.json` — versions vérifiées: next@16.2.6, react@19.2.4, zod@4.4.3, resend@6.12.3, vitest@4.1.6
- `npm view @vercel/blob version` → 2.4.0 disponible, non installé dans le projet

---

## Metadata

**Breakdown de confiance :**
- Stack standard : HIGH — toutes les bibliothèques vérifiées dans package.json et node_modules
- Architecture : HIGH — patterns directs tirés du code existant (proxy.ts, route.ts API v1, email.ts)
- Pièges : HIGH — tirés du code existant et des contraintes Next.js 16 vérifiées in-situ
- Upload photo : MEDIUM — @vercel/blob non installé, décision produit requise

**Date de recherche :** 2026-05-24
**Valide jusqu'au :** 2026-06-24 (stack stable)
