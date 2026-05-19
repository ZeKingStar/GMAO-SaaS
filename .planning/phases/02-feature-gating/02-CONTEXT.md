# Phase 2: Feature Gating - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Contrôler l'accès aux fonctionnalités avancées selon le tier d'abonnement Stripe actif pour les features **existantes** dans le codebase. Les nouvelles features (portail, minuterie, checklists) sont hors scope — elles seront construites directement avec leur gate dans les Phases 5-9.

</domain>

<decisions>
## Implementation Decisions

### Matrice des gates (périmètre Phase 2)

- **D-01:** `/rapports` → requiert tier `growth` ou `enterprise`
- **D-02:** `/inventaire` → requiert tier `growth` ou `enterprise`
- **D-03:** `/actifs/scan/[qrCode]` → requiert tier `growth` ou `enterprise`
- **D-04:** API publique → hors scope Phase 2 (sera construite directement gated en Phase 4)
- **D-05:** Les abonnements expirés (`past_due`, `canceled`, `unpaid`) sont traités comme tier `starter`

### Mécanisme de gate

- **D-06:** Étendre `src/lib/auth.ts` avec un helper `requirePlan(plans: SubscriptionPlan[])` — cohérent avec `requireOrgAccess()` existant
- **D-07:** Chaque page Server Component gated appelle `requirePlan(['growth', 'enterprise'])` en début de fonction — pas de middleware Edge Runtime
- **D-08:** `requirePlan()` lit `membership.organization.subscription` (déjà chargé par `getOrganizationMembership()`) — zéro requête DB supplémentaire

### UX page bloquée (GATE-02)

- **D-09:** La page s'affiche avec un banner Korvia amber en haut: "Passez à Croissance pour accéder" + CTA "Voir les plans" → `/parametres/organisation`
- **D-10:** Le contenu de la page sous le banner est rendu avec `blur` (CSS `filter: blur`) pour montrer ce que l'utilisateur rate
- **D-11:** Créer un composant réutilisable `<UpgradeGate requiredPlan="growth">` qui wrap le contenu gated — utilisable dans toutes les phases futures

### Widget tier dashboard (GATE-03)

- **D-12:** Ajouter un widget en bas du dashboard principal (`/dashboard`): plan actif + badge statut (Actif/Essai/En retard) + date de renouvellement + lien "Gérer l'abonnement"
- **D-13:** Le widget utilise la palette Korvia navy/amber — cohérent avec l'identité Phase 1
- **D-14:** Si aucun abonnement actif, afficher "Aucun abonnement actif — Choisir un plan" avec CTA

### Sidebar navigation

- **D-15:** Les items de navigation gated (Inventaire, Rapports) affichent un cadenas `🔒` discret pour les utilisateurs Démarrage — le lien reste cliquable (mène à la page avec le banner)

### Claude's Discretion

- Wording exact du banner upgrade
- Design du composant `<UpgradeGate>` (couleurs, icône, disposition)
- Gestion du cas `null` subscription (organisation sans abonnement enregistré = traiter comme starter)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Feature Gating — GATE-01, GATE-02, GATE-03 (définitions officielles)
- `.planning/ROADMAP.md` §Phase 2 — objectif et critères de succès

### Code existant à étendre
- `src/lib/auth.ts` — Pattern `requireOrgAccess()` à étendre avec `requirePlan()`
- `src/components/settings/billing-section.tsx` — Composant billing existant, types Plan/SubscriptionStatus définis ici
- `src/actions/billing.ts` — Actions `createCheckoutSession` et `createBillingPortalSession`
- `src/app/(app)/dashboard/page.tsx` — Page dashboard à modifier pour le widget tier
- `src/generated/prisma/models/Subscription.ts` — Modèle Subscription avec champs `plan`, `status`, `currentPeriodEnd`

### Pages à gater
- `src/app/(app)/rapports/page.tsx`
- `src/app/(app)/inventaire/page.tsx`
- `src/app/(app)/actifs/scan/[qrCode]/page.tsx`

### Navigation
- `src/components/layout/sidebar.tsx` — Ajouter indicateur cadenas sur items gated
- `src/components/layout/sidebar-sheet.tsx` — Même modification pour mobile

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getOrganizationMembership()` dans `auth.ts` — charge déjà `organization.subscription` → base de `requirePlan()`
- `BillingSection` dans `billing-section.tsx` — types `Plan` et `SubscriptionStatus` réutilisables
- `Button`, `Card`, `Badge` dans `src/components/ui/` — composants pour le banner upgrade et le widget dashboard

### Established Patterns
- Auth guards: `requireOrgAccess()` → lancer une `Error("Unauthorized")` ou `redirect()` en début de Server Component
- Plans Stripe: `starter` | `growth` | `enterprise` (enum `SubscriptionPlan` en DB)
- Statuts: `trialing` | `active` | `past_due` | `canceled` | `unpaid`
- Couleur amber Korvia: `#E8830C` / `amber-500` — à utiliser pour le banner upgrade

### Integration Points
- `getOrganizationMembership()` retourne `membership.organization.subscription.plan` → point d'entrée naturel pour `requirePlan()`
- Dashboard (`/dashboard`) charge déjà l'`orgId` depuis Clerk — ajouter la subscription à la requête DB existante
- Sidebar reçoit aucune prop actuellement — lire le plan côté serveur et passer aux nav items ou utiliser un Client Component avec contexte

</code_context>

<specifics>
## Specific Ideas

- Le composant `<UpgradeGate>` doit être suffisamment générique pour être réutilisé dans les Phases 5-9 sans modification — chaque nouvelle feature gated n'aura qu'à le wrapper
- Le cadenas dans la sidebar doit être discret (pas d'alerte agressive) — l'utilisateur navigue librement et découvre le banner à l'arrivée

</specifics>

<deferred>
## Deferred Ideas

- Import/export Excel — noté pour Phase 7+ (Milestone 3)
- Gate sur le nombre d'actifs (50/200/illimité) — logique de quota différente des gates de pages; à planifier séparément
- Gate sur le nombre d'utilisateurs (5/15/illimité) — idem, quota Clerk à intégrer

</deferred>

---

*Phase: 02-feature-gating*
*Context gathered: 2026-05-19*
