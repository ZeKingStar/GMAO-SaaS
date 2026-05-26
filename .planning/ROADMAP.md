# Roadmap: Korvia

**Milestone 2 — SaaS Ready**
*Objectif: Transformer le projet GMAO en produit commercial Korvia prêt à vendre*

## Phases

| # | Phase | Objectif | Requirements | Critères de succès |
|---|-------|----------|--------------|-------------------|
| 1 | Identité Korvia | Rebrand complet + logo SVG | BRAND-01, BRAND-02, BRAND-03 | 3 |
| 2 | Feature Gating | Verrouiller les features par tier | GATE-01, GATE-02, GATE-03 | 3 |
| 3 | Notifications Email | Alertes automatiques aux bons moments | NOTIF-01, NOTIF-02, NOTIF-03 | 3 |
| 4 | API Publique | 2/3 | In Progress|  |

---

## Phase 1: Identité Korvia

**Objectif:** Remplacer "GMAO SaaS" par la marque Korvia dans toute l'interface — logo, couleurs, typographie, landing page.

**Requirements:** BRAND-01, BRAND-02, BRAND-03

**Success criteria:**
1. Le logo SVG Korvia s'affiche dans la navbar, le favicon et les emails transactionnels
2. La landing page a une identité visuelle distinctive (pas un template shadcn générique)
3. Le nom "GMAO SaaS" n'apparaît nulle part dans l'interface utilisateur

**UI hint**: yes

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Fondations brand : tokens CSS Korvia (oklch) + composant KorviaLogo + favicon SVG App Router
- [x] 01-02-PLAN.md — Rebrand layout authentifié : layout.tsx (Inter + metadata), sidebar/header/sidebar-sheet, onboarding, manifest PWA
- [x] 01-03-PLAN.md — Landing page Korvia dark navy + checkpoint visuel humain

---

## Phase 2: Feature Gating

**Objectif:** Contrôler l'accès aux fonctionnalités avancées selon le tier d'abonnement Stripe actif.

**Requirements:** GATE-01, GATE-02, GATE-03

**Success criteria:**
1. Un utilisateur Démarrage ne peut pas accéder aux rapports avancés ni à l'API
2. Un banner "Upgrader pour accéder" s'affiche sur les features bloquées
3. Le dashboard affiche clairement le plan actif et sa date de renouvellement

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — requirePlan() helper + composant UpgradeGate (fondations Wave 1)
- [x] 02-02-PLAN.md — Gate pages rapports/inventaire/scan + cadenas sidebar (Wave 2)
- [x] 02-03-PLAN.md — Widget abonnement dashboard + checkpoint visuel humain (Wave 2)

---

## Phase 3: Notifications Email

**Objectif:** Envoyer les bonnes notifications aux bonnes personnes au bon moment.

**Requirements:** NOTIF-01, NOTIF-02, NOTIF-03

**Success criteria:**
1. Le technicien reçoit un email dans les 2 minutes suivant l'assignation d'un bon de travail
2. Un rappel email est envoyé 48h avant chaque maintenance préventive due
3. L'admin reçoit une alerte quand le stock d'une pièce passe sous son seuil minimum

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Infrastructure email : client Resend + 3 templates HTML en français (Wave 1)
- [x] 03-02-PLAN.md — NOTIF-01 : email d'assignation bon de travail (Wave 2)
- [x] 03-03-PLAN.md — NOTIF-02 : rappel maintenance 48h via Vercel Cron (Wave 2)
- [x] 03-04-PLAN.md — NOTIF-03 : alerte stock faible (Wave 2)

---

## Phase 4: API Publique

**Objectif:** Exposer une API REST documentée pour permettre les intégrations avec des systèmes tiers.

**Requirements:** API-01, API-02, API-03, API-04

**Success criteria:**
1. Un développeur externe peut s'authentifier avec une clé API et lister les bons de travail
2. Un bon de travail peut être créé via l'API depuis un système externe (ex: formulaire web)
3. La documentation Swagger est accessible publiquement sans authentification
4. Les clés API sont générables et révocables depuis les paramètres organisation

**Plans:** 2/3 plans executed

Plans:
- [x] 04-01-PLAN.md — Fondations API : modèle ApiKey + helpers api-auth (validateApiKey, requireApiPlan) + Server Actions clés (Wave 1)
- [x] 04-02-PLAN.md — Endpoints REST : GET + POST /api/v1/work-orders + whitelist proxy Clerk (Wave 2)
- [ ] 04-03-PLAN.md — Documentation Swagger publique (/api/docs) + UI gestion clés API + checkpoint visuel humain (Wave 2)

---

---

## Milestone 3 — Compétitivité & Données
*Objectif: Ajouter les fonctionnalités qui différencient Korvia des GMAO légères et justifient les tiers Croissance et Entreprise*

## Phases

| # | Phase | Objectif | Requirements | Critères de succès |
|---|-------|----------|--------------|-------------------|
| 5 | Portail de demandes | Permettre les demandes sans compte | PORTAL-01, PORTAL-02 | 3 |
| 6 | Données terrain | Fiabiliser la saisie des techniciens | TERRAIN-01, TERRAIN-02 | 3 |
| 7 | Analytique de fiabilité | MTBF, MTTR, coûts par actif | FIAB-01, FIAB-02, FIAB-03, FIAB-04 | 4 |
| 8 | Productivité technicien | Checklists, job plans, escalade | PROD-01, PROD-02, PROD-03 | 3 |
| 9 | Maintenance conditionnelle | PM déclenchée par compteur | COND-01, COND-02 | 2 |

---

## Phase 5: Portail de demandes de travail

**Objectif:** Permettre à n'importe quel employé (sans compte Korvia) de soumettre une demande de maintenance via une URL publique par site.

**Requirements:** PORTAL-01, PORTAL-02

**Success criteria:**
1. Un employé sans compte ouvre l'URL du portail, remplit un formulaire (description + photo optionnelle + localisation) et soumet
2. La demande crée automatiquement un bon de travail en statut "Ouvert" dans Korvia, assigné au bon site
3. Le demandeur reçoit une confirmation par email avec le numéro de BT (sans avoir besoin d'un compte)

**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — Fondations portail : schema Site (portalToken/portalEnabled) + db push + proxy whitelist + Server Actions sites + helpers BT/email (Wave 1)
- [x] 05-02-PLAN.md — Route Handler POST /api/portal/[siteToken] + page SSR publique /portail/[siteToken] + formulaire useActionState avec honeypot (Wave 2)
- [x] 05-03-PLAN.md — UI admin PortalSitesSection dans /parametres/organisation + checkpoint humain end-to-end (Wave 2)

---

## Phase 6: Intégrité des données terrain

**Objectif:** Fiabiliser les données saisies par les techniciens à la clôture des bons de travail et automatiser le suivi du temps.

**Requirements:** TERRAIN-01, TERRAIN-02

**Success criteria:**
1. Un BT ne peut pas être marqué "Complété" sans que les champs configurés soient remplis (code de panne, temps passé, pièces utilisées)
2. Un technicien peut démarrer/arrêter une minuterie sur un BT — les heures réelles sont calculées automatiquement
3. Le coût de main-d'œuvre est calculé automatiquement (heures réelles × taux horaire configuré par technicien)

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Fondations Phase 6 : schema (WorkOrderPart + faultCategory/faultDescription + closureRequirements + hourlyRate) + db push + Server Actions (timer, pièces, validation clôture, config admin) (Wave 1)
- [x] 06-02-PLAN.md — UI page BT : timer live, formulaire pièces hybride, fault form, banner closure, coût main-d'œuvre + checkpoint humain (Wave 2)
- [x] 06-03-PLAN.md — UI admin /parametres/organisation : section exigences de clôture + colonne taux horaire dans TeamTable (Wave 2)

---

## Phase 7: Analytique de fiabilité

**Objectif:** Donner aux gestionnaires les données pour prendre des décisions d'achat/réparation et identifier les actifs problématiques.

**Requirements:** FIAB-01, FIAB-02, FIAB-03, FIAB-04

**Success criteria:**
1. Les codes de panne (Problème / Cause / Remède) sont saisis à la clôture et agrégés en rapport "Top 5 pannes récurrentes"
2. Le journal de panne calcule automatiquement le MTTR par actif à partir des heures d'arrêt saisies
3. Le rapport "Coût par actif" affiche (main-d'œuvre + pièces) par actif sur une période choisie
4. Le rapport "Planifié vs Réel" compare la durée estimée vs réelle par BT, technicien et type d'actif

**Plans:** 4 plans

Plans:
- [ ] 07-01-PLAN.md — Migration schema P/C/R + utilitaires rapports + fix Phase 6 callers (Wave 1)
- [ ] 07-02-PLAN.md — Restructuration /rapports en tabs + period-selector + FIAB-01 Top pannes (Wave 2)
- [ ] 07-03-PLAN.md — FIAB-02 MTTR par actif + FIAB-03 Coût par actif (Wave 3)
- [ ] 07-04-PLAN.md — FIAB-04 Planifié vs Réel + checkpoint humain (Wave 3)

---

## Phase 8: Productivité technicien

**Objectif:** Réduire la variabilité et la charge mentale des techniciens avec des templates réutilisables et des alertes automatiques.

**Requirements:** PROD-01, PROD-02, PROD-03

**Success criteria:**
1. Un plan de travail (job plan) définit les étapes, pièces requises et durée estimée — attaché à un PM, il pré-remplit le BT généré
2. Les checklists PM permettent des étapes numérotées avec cases à cocher, champs de mobile
3. Un BT de priorité "Urgente" non résolu après X heures (configurable) déclenche une notification au superviseur

---

## Phase 9: Maintenance conditionnelle

**Objectif:** Déclencher les maintenances préventives sur des seuils métriques (heures, cycles, km) plutôt que sur calendrier uniquement.

**Requirements:** COND-01, COND-02

**Success criteria:**
1. Un technicien peut saisir un relevé de compteur (heures moteur, cycles, km) lors de la clôture d'un BT ou directement sur un actif
2. Un PM configuré avec un seuil de compteur génère automatiquement un BT quand l'actif atteint ce seuil

---

## Milestone 4 Preview — Croissance multi-marchés

- Multi-langue FR/EN
- Export CSV/Excel
- Mode hors-ligne complet (PWA)
- Notifications push PWA
- Webhooks sortants configurables
