---
phase: 05-portail-de-demandes-de-travail
verified: 2026-05-25T12:55:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
gaps: []
deferred:
  - truth: "Le formulaire public inclut un champ photo optionnelle"
    addressed_in: "Phase non planifiée — différée explicitement"
    evidence: "05-RESEARCH.md section 'Open Question A1': 'La photo est optionnelle et peut être différée au-delà du MVP. Le champ WorkOrderAttachment existe déjà dans le schéma pour une implémentation future.' Aucun plan de Phase 5 n'a inclus ce champ en scope."
---

# Phase 5: Portail de demandes de travail — Verification Report

**Phase Goal:** Permettre à n'importe quel employé (sans compte Korvia) de soumettre une demande de maintenance via une URL publique par site, gérée par les admins.
**Verified:** 2026-05-25T12:55:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Le modèle Site possède `portalToken` (String? @unique) et `portalEnabled` (Boolean @default(false)) | ✓ VERIFIED | `prisma/schema.prisma` L152-153 + L161 `@@index([portalToken])` |
| 2 | Le middleware Clerk laisse passer `/portail(.*)` et `/api/portal(.*)` sans authentification | ✓ VERIFIED | `src/proxy.ts` L16-17 dans `createRouteMatcher` |
| 3 | Un admin/manager peut activer/désactiver et régénérer le `portalToken` d'un site via Server Action | ✓ VERIFIED | `src/actions/sites.ts` — `enablePortal`, `disablePortal`, `regeneratePortalToken` exportées, `requireAdminOrManager()` appliqué, `crypto.randomUUID()` utilisé |
| 4 | Une fonction utilitaire crée un BT `service_request` à partir de siteId/organizationId résolus par token, sans appel à `auth()` | ✓ VERIFIED | `src/lib/portal-work-order.ts` — `createPortalWorkOrder()` exportée, `type: 'service_request'`, zéro import de `@clerk/nextjs` |
| 5 | Une fonction `sendPortalConfirmationEmail` envoie un email via Resend avec le numéro de BT au demandeur | ✓ VERIFIED | `src/lib/email.ts` L63-76 — `sendPortalConfirmationEmail()` exportée, sujet `[Korvia] Votre demande #${number} a été reçue` |
| 6 | GET `/portail/{token-valide}` retourne 200 et affiche le nom du site + formulaire | ✓ VERIFIED | `src/app/(public)/portail/[siteToken]/page.tsx` — lookup par `portalToken`, `notFound()` si absent/désactivé, `<PortalForm>` rendu |
| 7 | GET `/portail/{token-invalide}` ou désactivé retourne 404 | ✓ VERIFIED | `src/app/(public)/portail/[siteToken]/page.tsx` L21: `if (!site \|\| !site.portalEnabled) notFound()` |
| 8 | POST `/api/portal/{token}` avec body valide crée un BT en DB et retourne 201 + numéro BT, `organizationId`/`siteId` issus de la DB | ✓ VERIFIED | `src/app/api/portal/[siteToken]/route.ts` L58: `organizationId: site.organizationId` — jamais depuis le body |
| 9 | POST `/api/portal/{token}` avec honeypot rempli retourne 204 sans créer de BT (anti-spam) | ✓ VERIFIED | `src/app/api/portal/[siteToken]/route.ts` L36-42 — honeypot vérifié sur `rawBody` avant création |
| 10 | Le formulaire client utilise `useActionState` et affiche le numéro BT après succès | ✓ VERIFIED | `src/app/(public)/portail/[siteToken]/portal-form.tsx` L3 `useActionState`, L44 `useActionState<ActionState, FormData>`, état `success` affiche `#${state.workOrderNumber}` |
| 11 | L'admin voit la section "Portails publics" dans `/parametres/organisation`, gating admin/manager | ✓ VERIFIED | `src/app/(app)/parametres/organisation/page.tsx` — `canManagePortals`, `db.site.findMany`, `<PortalSitesSection initialSites={portalSites} />` conditionnel |
| 12 | Le groupe de routes `(public)` n'importe aucun composant Clerk | ✓ VERIFIED | `grep -rn "@clerk/nextjs" src/app/(public)/` → 0 résultat |

**Score:** 12/12 truths verified

### Deferred Items

Items not yet met but explicitly scoped out by the research phase.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Champ photo optionnelle dans le formulaire (ROADMAP SC-1 mentionne "photo optionnelle + localisation") | Différé hors MVP | `05-RESEARCH.md` Open Question A1 recommande de différer `@vercel/blob`, `WorkOrderAttachment` déjà dans le schéma pour implémentation future |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Champs `portalToken` + `portalEnabled` sur Site | ✓ VERIFIED | L152-153, index L161 |
| `src/proxy.ts` | Whitelist `/portail(.*)` et `/api/portal(.*)` | ✓ VERIFIED | L16-17 dans `createRouteMatcher` |
| `src/actions/sites.ts` | `enablePortal`, `disablePortal`, `regeneratePortalToken` | ✓ VERIFIED | L85, L105, L123 — contrôle de rôle admin|manager |
| `src/lib/portal-validation.ts` | `portalSubmitSchema` Zod | ✓ VERIFIED | 12 lignes, exports `portalSubmitSchema` + `PortalSubmitInput` |
| `src/lib/portal-work-order.ts` | `createPortalWorkOrder()` sans `auth()` | ✓ VERIFIED | Pas d'import Clerk, `type: 'service_request'`, `status: 'open'` |
| `src/lib/portal-work-order.test.ts` | Tests Vitest ≥7 | ✓ VERIFIED | 10 blocs test/it |
| `src/lib/email.ts` | `sendPortalConfirmationEmail()` | ✓ VERIFIED | L63-76, sujet conforme |
| `src/emails/portal-confirmation.tsx` | Template `PortalConfirmationEmail` français | ✓ VERIFIED | "Bonjour {requesterName}", "Demande #", "Korvia — Gestion de maintenance" |
| `src/app/api/portal/[siteToken]/route.ts` | POST handler public | ✓ VERIFIED | `export async function POST`, `params: Promise<...>`, 0 appel `auth()` |
| `src/app/api/portal/[siteToken]/route.test.ts` | Tests Vitest ≥9 | ✓ VERIFIED | 11 blocs test/it |
| `src/app/(public)/portail/[siteToken]/page.tsx` | Server Component SSR, `notFound()`, sans Clerk | ✓ VERIFIED | `await params`, lookup `portalToken`, `notFound()` |
| `src/app/(public)/portail/[siteToken]/portal-form.tsx` | Client Component, `useActionState`, honeypot | ✓ VERIFIED | `'use client'`, `useActionState`, `name="website"`, `fetch('/api/portal/...')` |
| `src/app/(public)/layout.tsx` | Layout public sans Clerk | ✓ VERIFIED | `PublicLayout`, 0 import `@clerk/nextjs` |
| `src/components/settings/portal-sites-section.tsx` | `PortalSitesSection` client | ✓ VERIFIED | `'use client'`, 3 Server Actions importées, `navigator.clipboard.writeText`, Dialog de confirmation |
| `src/components/settings/portal-sites-section.test.tsx` | Tests Vitest ≥7 | ✓ VERIFIED | 9 blocs test/it |
| `src/app/(app)/parametres/organisation/page.tsx` | Intégration `PortalSitesSection` + gating rôle | ✓ VERIFIED | `canManagePortals`, `db.site.findMany`, `<PortalSitesSection initialSites={portalSites} />` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/sites.ts` | `db.site.update` | `crypto.randomUUID()` pour `portalToken` | ✓ WIRED | L95 + L133 — deux appels `crypto.randomUUID()` |
| `src/lib/portal-work-order.ts` | `db.workOrder.create` | `type: 'service_request', status: 'open'` | ✓ WIRED | L33 + L34 |
| `src/lib/email.ts` | `PortalConfirmationEmail` | `@react-email/render` + Resend | ✓ WIRED | Import L6, render L70 |
| `src/app/(public)/portail/[siteToken]/page.tsx` | `db.site.findUnique` | `portalToken: siteToken`, sans `auth()` | ✓ WIRED | L14 `where: { portalToken: siteToken }`, check `portalEnabled` |
| `src/app/api/portal/[siteToken]/route.ts` | `createPortalWorkOrder` + `sendPortalConfirmationEmail` | fire-and-forget email après création BT | ✓ WIRED | L58 + L62 `.catch()` pattern |
| `src/app/(public)/portail/[siteToken]/portal-form.tsx` | `/api/portal/[siteToken]` | `fetch POST JSON` | ✓ WIRED | L26 `fetch(\`/api/portal/${siteToken}\`)` |
| `src/components/settings/portal-sites-section.tsx` | `enablePortal`/`disablePortal`/`regeneratePortalToken` | `useTransition` dans handlers | ✓ WIRED | L52, L66, L80 |
| `src/app/(app)/parametres/organisation/page.tsx` | `PortalSitesSection` | `canManagePortals` conditionnel | ✓ WIRED | L121 conditionnel + L127 `<PortalSitesSection initialSites={portalSites} />` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `portal-form.tsx` | `state.workOrderNumber` | `fetch POST /api/portal/` → `data.number` | Yes — BT créé en DB, numéro retourné par `route.ts` | ✓ FLOWING |
| `page.tsx` | `site.name`, `site.organization.name` | `db.site.findUnique({ where: { portalToken } })` | Yes — requête DB directe | ✓ FLOWING |
| `portal-sites-section.tsx` | `sites` | `initialSites` prop ← `db.site.findMany` dans page serveur | Yes — requête DB dans `parametres/organisation/page.tsx` L47 | ✓ FLOWING |
| `route.ts` | `wo.number`, `wo.id` | `createPortalWorkOrder` → `db.workOrder.create` | Yes — numéro auto-incrémenté calculé depuis `db.workOrder.findFirst` | ✓ FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — Requires running server and network (Resend API, Postgres). Human UAT covers all behavioral tests (10/10 passed).

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PORTAL-01 | 05-01, 05-02, 05-03 | URL publique par site, soumission sans compte | ✓ SATISFIED | Route `(public)/portail/[siteToken]`, proxy whitelist, `portalEnabled` lookup, formulaire accessible sans Clerk |
| PORTAL-02 | 05-01, 05-02 | Création automatique BT + email de confirmation | ✓ SATISFIED | `createPortalWorkOrder` + `sendPortalConfirmationEmail` + tests A4/A8 couvrant création + email |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|---------|--------|
| `portal-form.tsx` | 94 | `placeholder="Ex: 2e étage, salle B-203"` | ℹ️ Info | Attribut HTML `placeholder` standard — non un stub de code, aucun impact |

No blockers. No warnings.

---

## Human Verification Required

Human UAT completed 2026-05-25 — all 10 steps passed (see `05-HUMAN-UAT.md`):

1. Section "Portails publics" visible pour admin — PASSED
2. Activation portail → token UUID + URL affichée + toast — PASSED
3. Copie URL → icône "Copié" 2s — PASSED
4. Page publique accessible sans authentification (navigation privée) — PASSED
5. Soumission formulaire anonyme → message succès avec numéro BT — PASSED
6. BT créé dans /bons-de-travail avec statut Ouvert, données correctes — PASSED
7. Email de confirmation reçu avec numéro BT, site, organisation — PASSED
8. Désactivation → page 404 en navigation privée — PASSED
9. Régénération token → nouveau UUID, ancienne URL invalide — PASSED
10. Gating rôle → section absente pour technician/viewer — PASSED

---

## Gaps Summary

No gaps blocking goal achievement. All 12 must-haves verified. Human UAT complete (10/10).

**Photo optionnelle** (ROADMAP SC-1 wording) was explicitly scoped out by the research phase as a post-MVP item. The infrastructure (`WorkOrderAttachment` model) already exists for a future implementation. This is a deferred item, not a blocker.

---

_Verified: 2026-05-25T12:55:00Z_
_Verifier: Claude (gsd-verifier)_
