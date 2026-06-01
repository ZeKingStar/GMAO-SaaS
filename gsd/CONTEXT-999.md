# Phase 999 — Migration Auth Canadienne (Clerk → Better Auth)

## Objectif

Remplacer Clerk par Better Auth auto-hébergé afin d'assurer une conformité totale
à la Loi 25 (Québec) et au PIPEDA. Toutes les données d'authentification résident
exclusivement dans notre PostgreSQL canadien (Neon ca-central-1).

## Décisions architecturales (implémentées)

- **Pas de plugin `organization` de Better Auth** — il crée ses propres tables `organization`/`member` qui entrent en conflit avec notre modèle `Organization`/`Membership` existant.
- **`Session.activeOrganizationId`** stocke directement l'`Organization.id` (UUID Prisma). Élimine le lookup `clerkId → Organization` qui existait avant.
- **`Organization.clerkId` supprimé** — plus de champ pont externe. L'org est créée directement via `POST /api/organizations` et l'ID Prisma est la seule clé.
- **`Membership.clerkUserId → userId`** avec FK vers `User.id` (table Better Auth).
- **Pas de `customSession` plugin** — le plugin causait une inférence de type cassée. On utilise `as unknown as AuthSession` avec un type manuel.
- **`switchOrganization`** = `db.session.update({ data: { activeOrganizationId } })` direct.
- **Webhook Clerk supprimé** — Better Auth n'a pas besoin de webhooks pour synchroniser utilisateurs/orgs. Tout se passe en-process.

## Stack cible

| Service     | Avant           | Après                      |
|-------------|-----------------|----------------------------|
| Auth        | Clerk (US)      | Better Auth self-hosted    |
| Hébergement | Vercel (US)     | Fly.io Toronto `yyz`       |
| PostgreSQL  | Neon (US)       | Neon `aws-ca-central-1`    |
| Email       | Resend (US)     | AWS SES `ca-central-1`     |

---

## 999.1 — Prisma Schema ✅

**Fichiers modifiés :**
- `prisma/schema.prisma`
- `prisma/migrations/20260601000000_better_auth_remove_clerk/migration.sql`

**Ce qui a été fait :**
- Supprimé `Organization.clerkId String @unique` et son index
- Renommé `Membership.clerkUserId → userId`, ajout FK `user User @relation(...)`
- Ajouté `sessions Session[]` à Organization
- Ajouté tables Better Auth : `User`, `Session` (avec `activeOrganizationId String?`), `Account`, `Verification`
- Migration SQL créée manuellement (Prisma 7 ne supporte plus `--to-schema-datamodel`)

---

## 999.2 — Installation et configuration Better Auth ✅

**Fichiers créés :**
- `src/lib/better-auth.ts` — config serveur avec adaptateur Prisma, `AuthSession` type manuel
- `src/lib/better-auth-client.ts` — `createAuthClient` avec `NEXT_PUBLIC_APP_URL`
- `src/app/api/auth/[...all]/route.ts` — handler `toNextJsHandler(auth)`

**Fichiers modifiés :**
- `src/app/layout.tsx` — supprimé `<ClerkProvider localization={frFR}>`

**Variables d'env requises :**
```bash
BETTER_AUTH_SECRET=   # openssl rand -base64 32
BETTER_AUTH_URL=      # https://votre-domaine.ca
NEXT_PUBLIC_APP_URL=  # https://votre-domaine.ca
```

---

## 999.3 — Middleware (`src/proxy.ts`) ✅

**Fichier réécrit :** `src/proxy.ts`

Routes publiques : `/`, `/tarifs`, `/fonctionnalites`, `/a-propos`, `/aide`,
`/sign-in`, `/sign-up`, `/api/auth`, `/api/webhooks`.

Pattern : `auth.api.getSession({ headers: req.headers })` — redirection `/sign-in` si null.

---

## 999.4 — Couche auth centrale (`src/lib/auth.ts`) ✅

**Interface publique (inchangée pour les consommateurs) :**
```typescript
getAuth()                  // → { userId, orgId }  (orgId = Organization.id direct)
getOrganizationMembership() // → Membership + organization + subscription | null
requireOrgAccess()          // → Membership ou throw
requireRole(roles)          // → Membership ou throw
syncUserToDb()              // → upsert Membership depuis session
```

**Changements clés vs avant :**
- `auth()` Clerk → `getAuth()` Better Auth
- `orgId` = `Organization.id` direct, plus de `findUnique({ clerkId })` nulle part
- `Membership` lookup utilise `userId` (BA User.id) au lieu de `clerkUserId`

**Fichiers d'actions mis à jour (18 fichiers) :**
`assets.ts`, `sites.ts`, `categories.ts`, `inventory.ts`, `work-orders.ts`,
`maintenance.ts`, `settings.ts` + 11 pages app.

---

## 999.5 — Pages auth UI ✅

**Fichiers créés/réécrits :**
- `src/app/(auth)/sign-in/page.tsx` — RHF + Zod, `authClient.signIn.email()`
- `src/app/(auth)/sign-up/page.tsx` — RHF + Zod, `authClient.signUp.email()`
- `src/app/(auth)/onboarding/page.tsx` — `fetch("/api/organizations", { method: "POST" })`

**Fichiers supprimés :**
- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

**`POST /api/organizations`** (`src/app/api/organizations/route.ts`) :
- Crée `Organization` + `Membership` + `Subscription` en transaction Prisma
- Met à jour `session.activeOrganizationId` via `db.session.update()`

---

## 999.6 — Composants Header ✅

**Fichiers créés/réécrits :**
- `src/components/layout/header.tsx` — Server Component async, fetch user/org/memberships, rend `<HeaderClient>`
- `src/components/layout/header-client.tsx` — Client Component : OrgSwitcher dropdown + UserMenu avatar
- `src/actions/auth.ts` — `switchOrganization(orgId)` server action

**Pattern `switchOrganization` :**
1. `auth.api.getSession()` → vérifie session
2. `db.membership.findFirst()` → vérifie appartenance
3. `db.session.update({ data: { activeOrganizationId: orgId } })`
4. `revalidatePath("/", "layout")`

---

## 999.7 — Nettoyage Clerk ✅

**Supprimé :**
- `src/app/api/webhooks/clerk/route.ts`

**Désinstallé :**
- `@clerk/nextjs`, `@clerk/localizations`, `svix` (11 packages, ~`npm uninstall`)

**État TS :** 0 erreur liée à Clerk. Seule erreur restante : `@/actions/billing`
(fichier Stripe non encore créé — hors scope phase 999).

---

## 999.8 — Infrastructure Canadienne ⬜ EN ATTENTE

### Fly.io (Toronto `yyz`)

```bash
curl -L https://fly.io/install.sh | sh
fly launch --region yyz --no-deploy
```

`fly.toml` :
```toml
[env]
  PRIMARY_REGION = "yyz"

[[services]]
  # internal_port, protocol, etc.
```

### Neon PostgreSQL (`aws-ca-central-1` — Montréal)

1. Créer projet Neon → région **Canada (Central)** = `aws-ca-central-1`
2. `DATABASE_URL` = nouvelle connection string Neon CA
3. `npx prisma migrate deploy` sur le nouveau cluster

### AWS SES (`ca-central-1`) — si email transactionnel requis

```bash
npm install @aws-sdk/client-ses
```

Better Auth peut envoyer des emails de vérification via un callback custom :
```typescript
// src/lib/better-auth.ts
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    // SESClient({ region: "ca-central-1" })
  }
}
```

> Pour le MVP, les emails de vérification peuvent être désactivés
> (`requireEmailVerification: false`) et activés plus tard.

### Variables d'env prod

```bash
DATABASE_URL=             # Neon ca-central-1
BETTER_AUTH_SECRET=       # openssl rand -base64 32
BETTER_AUTH_URL=          # https://app.votre-domaine.ca
NEXT_PUBLIC_APP_URL=      # https://app.votre-domaine.ca
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Critères d'acceptation
- [ ] `fly.toml` avec région `yyz` committé
- [ ] `DATABASE_URL` pointant vers Neon `aws-ca-central-1`
- [ ] `BETTER_AUTH_URL` = domaine `.ca`
- [ ] Aucune donnée utilisateur traitée hors Canada
- [ ] `npx prisma migrate deploy` passé sur le cluster CA

---

## État global

- [x] 999.1 Prisma schema — suppression Clerk, tables Better Auth
- [x] 999.2 Better Auth setup — lib, client, route handler
- [x] 999.3 Middleware — proxy.ts sans Clerk
- [x] 999.4 Couche auth centrale — lib/auth.ts + 18 fichiers consommateurs
- [x] 999.5 Pages auth UI — sign-in, sign-up, onboarding
- [x] 999.6 Header — OrgSwitcher + UserMenu custom
- [x] 999.7 Nettoyage Clerk — packages désinstallés, webhook supprimé
- [ ] 999.8 Infra canadienne — Fly.io yyz + Neon ca-central-1

## Notes post-implémentation

**Ce qui diffère du plan initial :**
- On n'utilise PAS le plugin `organization` de Better Auth (conflit de modèles)
- `Organization.authId` n'existe pas — l'`id` Prisma est la seule clé
- `Session.activeOrganizationId` est notre propre colonne custom, pas celle du plugin BA
- Le type `AuthSession` est défini manuellement (cast `as unknown as AuthSession`)

**Prochaine phase :** 999.8 (infra) ou phase 1 (fonctionnalités métier GMAO)
