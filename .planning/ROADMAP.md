# Roadmap: Korvia

## Milestones

- ✅ **v1.0 — Compétitivité & Données** — Phases 1–9 (livré 2026-05-29) · [Archive](.planning/milestones/v1.0-ROADMAP.md)
- 📋 **v2.0 — Croissance multi-marchés** — Phases 10+ (planifié)

---

<details>
<summary>✅ v1.0 — Compétitivité & Données (Phases 1–9) — LIVRÉ 2026-05-29</summary>

### Milestone 2 — SaaS Ready
*Transformer le projet GMAO en produit commercial Korvia prêt à vendre*

- [x] Phase 1 : Identité Korvia — Rebrand complet + logo SVG (3/3 plans)
- [x] Phase 2 : Feature Gating — Verrouiller les features par tier Stripe (3/3 plans)
- [x] Phase 3 : Notifications Email — Alertes automatiques via Resend (4/4 plans)
- [x] Phase 4 : API Publique — REST + documentation OpenAPI/Scalar (3/3 plans)

### Milestone 3 — Compétitivité & Données
*Ajouter les fonctionnalités qui différencient Korvia des GMAO légères*

- [x] Phase 5 : Portail de demandes — URL publique → BT sans compte (3/3 plans)
- [x] Phase 6 : Intégrité données terrain — Codes panne P/C/R, minuterie coûts (3/3 plans)
- [x] Phase 7 : Analytique de fiabilité — MTTR, top pannes, coût/actif, plan vs réel (4/4 plans)
- [x] Phase 8 : Productivité technicien — Job plans, checklists, escalade urgences (6/6 plans)
- [x] Phase 9 : Maintenance conditionnelle — Compteurs → BT automatique (2/2 plans)

**Total : 9 phases · 32 plans · 210 commits · 63 595 lignes TypeScript**

</details>

---

## Milestone 4 — Croissance multi-marchés (Planifié)

*Ouvrir Korvia aux marchés anglophones et renforcer l'intégration avec les systèmes existants*

| # | Phase | Objectif | Priorité |
|---|-------|----------|----------|
| 10 | Multi-langue FR/EN | Interface disponible en anglais canadien | Haute |
| 11 | Export CSV/Excel | Export BTs et actifs pour rapports externes | Haute |
| 12 | Import assisté IA | Migration données depuis Excel/ancien GMAO | Moyenne |
| 13 | Notifications push PWA | Alertes mobiles pour BTs assignés | Moyenne |
| 14 | Webhooks sortants | Intégrations avec systèmes tiers | Basse |
| 15 | Mode hors-ligne complet | Saisie BTs sans connexion internet | Basse |

---

## Backlog

### Phase 999.1 : Import assisté IA (BACKLOG)

**Goal:** Macro + AI pour aider le client à transformer ses données existantes (Excel maison, ancien GMAO) vers le template d'import Korvia. Suggestion de mapping colonnes, détection de doublons, rapport d'import.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promouvoir avec /gsd-review-backlog quand prêt)

### Phase 999.2 : Invitation membres depuis l'app (PLANIFIÉ)

**Goal:** Permettre aux admins/gestionnaires d'inviter des membres directement depuis `/parametres/organisation` sans passer par le dashboard Clerk. Choix du rôle à l'invitation (scopé par rang, D-06), liste des invitations en attente, révocation possible.
**Requirements:** D-01..D-07 (CONTEXT.md). Clerk Organizations Backend API (`createOrganizationInvitation`, `getOrganizationInvitationList`, `revokeOrganizationInvitation`). Enforcement serveur du scoping de rôles + validation email.
**Plans:** 2/2 plans complete

Plans:
- [x] 999.2-01-PLAN.md — Server actions (inviteMember/revokeInvitation/listPendingInvitations) + utilitaire scoping de rôles + tests TDD
- [x] 999.2-02-PLAN.md — UI : InviteDialog + PendingInvitationsSection + intégration page organisation

### Phase 999.3 : Role-switcher dev panel (BACKLOG)

**Goal:** Panel flottant visible uniquement pour cybersag@gmail.com hors production — dropdown permettant de simuler n'importe quel rôle UI (admin/manager/technician/requester/viewer) via cookie. N'affecte pas les server actions (le vrai rôle Clerk reste intact).
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promouvoir avec /gsd-review-backlog quand prêt)
