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
| 16 | **Déploiement Production** | Fly.io (yyz) + Neon CA + domaine + go-live | **Go-Live** |

### Phase 10 : Multi-langue FR/EN (PLANIFIÉ)

**Goal:** Rendre l'interface Korvia disponible en anglais canadien pour ouvrir les marchés anglophones. Toutes les pages de l'application, les emails, et les messages d'erreur doivent être disponibles dans les deux langues. Le choix de langue est persisté par utilisateur.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD

### Phase 11 : Export CSV/Excel (PLANIFIÉ)

**Goal:** Permettre aux utilisateurs d'exporter les bons de travail et les actifs en CSV/Excel pour rapports externes et intégration avec d'autres outils.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD

### Phase 12 : Import assisté IA (PLANIFIÉ)

**Goal:** Faciliter la migration des données depuis Excel/ancien GMAO vers Korvia avec assistance IA pour le mapping de colonnes et la détection de doublons.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD

### Phase 13 : Notifications push PWA (PLANIFIÉ)

**Goal:** Envoyer des alertes mobiles aux techniciens pour les BTs assignés via les notifications push PWA.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD

### Phase 14 : Webhooks sortants (PLANIFIÉ)

**Goal:** Permettre l'intégration avec des systèmes tiers via webhooks sortants configurables par les admins.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD

### Phase 15 : Mode hors-ligne complet (PLANIFIÉ)

**Goal:** Permettre la saisie de bons de travail sans connexion internet avec synchronisation différée.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD

### Phase 16 : Déploiement Production (GO-LIVE)

**Goal:** Mettre l'application en production sur infrastructure canadienne. Fly.io Toronto (yyz), Neon Postgres ca-central-1 (Montréal), domaine app.korvia.ca branché, variables d'env configurées, migrations DB exécutées.
**Requirements:** Fly.io account, Neon account, domaine DNS configuré, tous les secrets prêts (BETTER_AUTH_SECRET ✓, DATABASE_URL, STRIPE_*, RESEND_API_KEY).
**Plans:** 0 plans

Plans:
- [ ] TBD — faire en dernier, quand toutes les features MVP sont complètes

---

## Backlog

### Phase 999.2 : Invitation membres depuis l'app (BACKLOG)

**Goal:** Permettre aux admins/gestionnaires d'inviter des membres directement depuis `/parametres/organisation`. Choix du rôle à l'invitation (scopé par rang), liste des invitations en attente, révocation possible.
**Requirements:** À réimplémenter avec Better Auth APIs (les plans originaux utilisaient Clerk — désactivé depuis migration). CONTEXT.md disponible (D-01..D-07).
**Plans:** 0 plans actifs (anciens plans Clerk archivés)

Plans:
- [ ] TBD — réimplémenter avec Better Auth

### Phase 999.3 : Role-switcher dev panel (BACKLOG)

**Goal:** Panel flottant visible uniquement pour cybersag@gmail.com hors production — dropdown permettant de simuler n'importe quel rôle UI (admin/manager/technician/requester/viewer) via cookie. N'affecte pas les server actions (le vrai rôle Better Auth reste intact).
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promouvoir avec /gsd-review-backlog quand prêt)
