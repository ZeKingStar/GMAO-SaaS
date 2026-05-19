# Roadmap: Korvia

**Milestone 2 — SaaS Ready**
*Objectif: Transformer le projet GMAO en produit commercial Korvia prêt à vendre*

## Phases

| # | Phase | Objectif | Requirements | Critères de succès |
|---|-------|----------|--------------|-------------------|
| 1 | Identité Korvia | Rebrand complet + logo SVG | BRAND-01, BRAND-02, BRAND-03 | 3 |
| 2 | Feature Gating | Verrouiller les features par tier | GATE-01, GATE-02, GATE-03 | 3 |
| 3 | Notifications Email | Alertes automatiques aux bons moments | NOTIF-01, NOTIF-02, NOTIF-03 | 3 |
| 4 | API Publique | Permettre les intégrations tierces | API-01, API-02, API-03, API-04 | 4 |

---

## Phase 1: Identité Korvia

**Objectif:** Remplacer "GMAO SaaS" par la marque Korvia dans toute l'interface — logo, couleurs, typographie, landing page.

**Requirements:** BRAND-01, BRAND-02, BRAND-03

**Success criteria:**
1. Le logo SVG Korvia s'affiche dans la navbar, le favicon et les emails transactionnels
2. La landing page a une identité visuelle distinctive (pas un template shadcn générique)
3. Le nom "GMAO SaaS" n'apparaît nulle part dans l'interface utilisateur

**UI hint**: yes

---

## Phase 2: Feature Gating

**Objectif:** Contrôler l'accès aux fonctionnalités avancées selon le tier d'abonnement Stripe actif.

**Requirements:** GATE-01, GATE-02, GATE-03

**Success criteria:**
1. Un utilisateur Démarrage ne peut pas accéder aux rapports avancés ni à l'API
2. Un banner "Upgrader pour accéder" s'affiche sur les features bloquées
3. Le dashboard affiche clairement le plan actif et sa date de renouvellement

---

## Phase 3: Notifications Email

**Objectif:** Envoyer les bonnes notifications aux bonnes personnes au bon moment.

**Requirements:** NOTIF-01, NOTIF-02, NOTIF-03

**Success criteria:**
1. Le technicien reçoit un email dans les 2 minutes suivant l'assignation d'un bon de travail
2. Un rappel email est envoyé 48h avant chaque maintenance préventive due
3. L'admin reçoit une alerte quand le stock d'une pièce passe sous son seuil minimum

---

## Phase 4: API Publique

**Objectif:** Exposer une API REST documentée pour permettre les intégrations avec des systèmes tiers.

**Requirements:** API-01, API-02, API-03, API-04

**Success criteria:**
1. Un développeur externe peut s'authentifier avec une clé API et lister les bons de travail
2. Un bon de travail peut être créé via l'API depuis un système externe (ex: formulaire web)
3. La documentation Swagger est accessible publiquement sans authentification
4. Les clés API sont générables et révocables depuis les paramètres organisation

---

## Milestone 3 Preview — Croissance

- Multi-langue FR/EN
- Webhooks sortants configurables
- Export CSV/Excel
- Notifications push PWA
- Mode hors-ligne complet
