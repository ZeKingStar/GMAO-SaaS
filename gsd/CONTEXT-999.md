# Phase 999 — Migration Auth Canadienne (Clerk → Better Auth)

## Objectif

Remplacer Clerk par Better Auth auto-hébergé afin d'assurer une conformité totale
à la Loi 25 (Québec) et au PIPEDA. Toutes les données d'authentification doivent
résider exclusivement dans notre PostgreSQL canadien (Neon ca-central-1).

## Décisions architecturales

- **Better Auth** avec le plugin `organization` natif remplace Clerk 1-pour-1
- Les sessions sont stockées dans Postgres via l'adaptateur Prisma de Better Auth
- `Organization.clerkId` → `Organization.authId` (ID généré par Better Auth)
- `Membership.clerkUserId` → `Membership.userId`
- Le webhook Clerk (`/api/webhooks/clerk`) est supprimé — Better Auth gère les
  événements org/user directement via sa propre logique
- Le `OrganizationSwitcher` Clerk est remplacé par un composant custom minimal
- French localization recréée manuellement dans les pages sign-in/sign-up

## Stack cible

| Service        | Avant               | Après                        |
|----------------|---------------------|------------------------------|
| Auth           | Clerk (US)          | Better Auth self-hosted       |
| Hébergement    | Vercel (US)         | Fly.io Toronto `yyz`         |
| PostgreSQL     | Neon (US)           | Neon `aws-ca-central-1`      |
| Email          | Resend (US)         | AWS SES `ca-central-1`       |

---

## 999.1 — Prisma Schema : retirer les champs Clerk

**Fichier :** `prisma/schema.prisma`

### Changements

```prisma
// Organization : clerkId → authId
model Organization {
  authId  String  @unique   // était clerkId
  @@index([authId])         // était @@index([clerkId])
}

// Membership : clerkUserId → userId
model Membership {
  userId  String            // était clerkUserId
  @@unique([organizationId, userId])
  @@index([userId])
}
```

Aussi ajouter les tables Better Auth dans le schema (user, session, account,
verification) — générées via `npx better-auth generate`.

### Migration DB

```bash
npx prisma migrate dev --name remove-clerk-ids
```

### Critères d'acceptation
- [ ] Aucune référence à `clerkId` ou `clerkUserId` dans le schema
- [ ] Migration SQL générée et appliquée sans erreur
- [ ] Les tables Better Auth existent en DB

---

## 999.2 — Installation et configuration Better Auth

**Fichiers :** `src/lib/better-auth.ts` (nouveau), `src/lib/better-auth-client.ts` (nouveau)

### Installation

```bash
npm install better-auth
```

### Configuration serveur (`src/lib/better-auth.ts`)

```typescript
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins"
import { db } from "@/lib/db"

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "admin",
    }),
  ],
})
```

### Configuration client (`src/lib/better-auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [organizationClient()],
})
```

### Variables d'environnement à remplacer

```bash
# Retirer
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Ajouter
BETTER_AUTH_SECRET=        # openssl rand -base64 32
BETTER_AUTH_URL=           # https://votre-domaine.ca
```

### Critères d'acceptation
- [ ] `better-auth` installé
- [ ] Auth server et client configurés
- [ ] Route API `src/app/api/auth/[...all]/route.ts` créée

---

## 999.3 — Middleware (`src/proxy.ts`)

**Fichier :** `src/proxy.ts`

### Avant
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
export const proxy = clerkMiddleware(async (auth, req) => { ... })
```

### Après
```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/better-auth"

const PUBLIC_ROUTES = ["/", "/tarifs", "/fonctionnalites", "/a-propos",
  "/aide", "/sign-in", "/sign-up", "/api/webhooks", "/api/auth"]

export async function proxy(req: NextRequest) {
  const isPublic = PUBLIC_ROUTES.some(r => req.nextUrl.pathname.startsWith(r))
  if (isPublic) return NextResponse.next()

  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.redirect(new URL("/sign-in", req.url))

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

### Critères d'acceptation
- [ ] Aucune dépendance `@clerk/nextjs` dans le middleware
- [ ] Routes publiques accessibles sans session
- [ ] Redirection vers `/sign-in` si non authentifié

---

## 999.4 — Couche auth centrale (`src/lib/auth.ts`)

**Fichier :** `src/lib/auth.ts`

C'est le fichier le plus critique — 18 pages/actions en dépendent.
L'interface publique (`getOrganizationMembership`, `requireOrgAccess`,
`requireRole`) doit rester identique.

### Après

```typescript
import { auth as betterAuth } from "@/lib/better-auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import type { MemberRole } from "@/generated/prisma/enums"

async function getSession() {
  return betterAuth.api.getSession({ headers: await headers() })
}

export async function getOrganizationMembership() {
  const session = await getSession()
  if (!session?.user || !session?.session.activeOrganizationId) return null

  return db.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { authId: session.session.activeOrganizationId },
    },
    include: { organization: { include: { subscription: true } } },
  })
}

export async function requireOrgAccess() {
  const membership = await getOrganizationMembership()
  if (!membership) throw new Error("Unauthorized")
  return membership
}

export async function requireRole(roles: MemberRole[]) {
  const membership = await requireOrgAccess()
  if (!roles.includes(membership.role)) throw new Error("Forbidden")
  return membership
}

export async function syncUserToDb() {
  const session = await getSession()
  if (!session?.user || !session.session.activeOrganizationId) return null

  return db.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: session.session.activeOrganizationId,
        userId: session.user.id,
      },
    },
    update: {
      email: session.user.email,
      firstName: session.user.name?.split(" ")[0] ?? null,
      lastName: session.user.name?.split(" ").slice(1).join(" ") || null,
      avatarUrl: session.user.image,
    },
    create: {
      userId: session.user.id,
      email: session.user.email,
      firstName: session.user.name?.split(" ")[0] ?? null,
      lastName: session.user.name?.split(" ").slice(1).join(" ") || null,
      avatarUrl: session.user.image,
      organization: { connect: { authId: session.session.activeOrganizationId } },
    },
  })
}
```

### Note importante
Les 18 fichiers qui font `const { orgId } = await auth()` doivent être mis à jour
pour utiliser `requireOrgAccess()` ou `getOrganizationMembership()` — vérifier
chaque usage et remplacer le pattern `auth()` direct.

### Critères d'acceptation
- [ ] Aucun import de `@clerk/nextjs/server` dans ce fichier
- [ ] Interface publique identique à l'original
- [ ] `getOrganizationMembership` retourne la même forme d'objet

---

## 999.5 — Pages auth UI

**Fichiers :**
- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` → `src/app/(auth)/sign-in/page.tsx`
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` → `src/app/(auth)/sign-up/page.tsx`
- `src/app/(auth)/onboarding/page.tsx`

### Sign-in / Sign-up
Remplacer les composants Clerk `<SignIn>` / `<SignUp>` par des formulaires React
Hook Form + Zod (déjà utilisés dans le projet) qui appellent `authClient.signIn.email()`
et `authClient.signUp.email()`.

Renommer les dossiers catch-all `[[...sign-in]]` → dossier simple `sign-in`.

### Onboarding
Remplacer `useOrganizationList` de Clerk par :
```typescript
const { data: session } = authClient.useSession()
// createOrganization via authClient.organization.create()
// setActive via authClient.organization.setActive()
```

### Critères d'acceptation
- [ ] Aucun dossier `[[...]]` catch-all Clerk
- [ ] Sign-in/sign-up fonctionnels avec email + mot de passe
- [ ] Création d'organisation possible à l'onboarding

---

## 999.6 — Composants Header

**Fichier :** `src/components/layout/header.tsx`

### Retirer
- `<UserButton>` de Clerk
- `<OrganizationSwitcher>` de Clerk

### Remplacer par

**OrgSwitcher custom** — dropdown listant les orgs de l'utilisateur :
```typescript
const { data: orgs } = authClient.organization.list()
// setActive via authClient.organization.setActive({ organizationId })
```

**UserMenu custom** — avatar + nom + déconnexion :
```typescript
const { data: session } = authClient.useSession()
// signOut via authClient.signOut()
```

Utiliser les composants shadcn/ui existants : `DropdownMenu`, `Avatar`.

### Critères d'acceptation
- [ ] Aucun import `@clerk/nextjs` dans le header
- [ ] Switch d'organisation fonctionnel
- [ ] Déconnexion fonctionnelle

---

## 999.7 — Nettoyage Clerk

**Fichiers à supprimer / vider :**
- `src/app/api/webhooks/clerk/route.ts` → supprimer
- `src/app/layout.tsx` → retirer `<ClerkProvider>` et `frFR`

**Dépendances à retirer :**
```bash
npm uninstall @clerk/nextjs @clerk/localizations svix
```

> `svix` peut être conservé si Better Auth webhooks l'utilisent, sinon retirer.

### Variables d'env à retirer
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
```

### Critères d'acceptation
- [ ] `@clerk/nextjs` absent de `package.json`
- [ ] Aucune référence Clerk dans `git grep -r "clerk" src/`
- [ ] Build TypeScript sans erreurs

---

## 999.8 — Infrastructure Canadienne

### Fly.io (Toronto)

```bash
# Installation CLI
curl -L https://fly.io/install.sh | sh

# Init app
fly launch --region yyz --no-deploy

# fly.toml — forcer région Canada
[[regions]]
  primary = "yyz"
```

### Neon PostgreSQL (ca-central-1 — Montréal)

1. Créer un projet Neon dans la région `aws-ca-central-1`
2. Mettre à jour `DATABASE_URL` avec la nouvelle connection string
3. Vérifier dans la console Neon : région = Canada Central

### AWS SES (ca-central-1)

Remplacer Resend par AWS SES pour l'email transactionnel :
```bash
npm install @aws-sdk/client-ses
```

Configurer Better Auth email :
```typescript
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    // AWS SES ca-central-1
  }
}
```

### Critères d'acceptation
- [ ] `fly.toml` avec région `yyz` committé
- [ ] `DATABASE_URL` pointant vers Neon `ca-central-1`
- [ ] Email transactionnel via AWS SES Canada
- [ ] Aucune donnée utilisateur traitée hors Canada

---

## Ordre d'exécution recommandé

```
999.1 (schema) → 999.2 (install) → 999.3 (middleware) →
999.4 (lib/auth) → 999.5 (pages) → 999.6 (header) →
999.7 (cleanup) → 999.8 (infra)
```

## État

- [ ] 999.1 Prisma schema
- [ ] 999.2 Better Auth setup
- [ ] 999.3 Middleware
- [ ] 999.4 lib/auth.ts
- [ ] 999.5 Pages auth UI
- [ ] 999.6 Header components
- [ ] 999.7 Nettoyage Clerk
- [ ] 999.8 Infra canadienne
