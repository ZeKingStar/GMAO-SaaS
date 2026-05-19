# Requirements: Korvia

**Defined:** 2026-05-19
**Core Value:** Un technicien peut créer un bon de travail, scanner un actif QR et accéder à son historique en moins de 60 secondes, sur mobile ou bureau.

## v1 Requirements (Milestone 2 — SaaS Ready)

### Branding

- [ ] **BRAND-01**: L'interface affiche le nom "Korvia" et le logo SVG partout (navbar, favicon, emails)
- [ ] **BRAND-02**: La landing page reflète l'identité visuelle Korvia (couleurs, typographie distinctives)
- [ ] **BRAND-03**: Le logo SVG est utilisable en blanc/couleur selon le contexte (fond sombre/clair)

### Feature Gating

- [ ] **GATE-01**: Les fonctionnalités avancées (rapports, API) sont bloquées pour le tier Démarrage
- [ ] **GATE-02**: Un message clair invite à upgrader quand une feature gated est tentée
- [ ] **GATE-03**: Le dashboard affiche le tier actif et la date de renouvellement

### Notifications

- [ ] **NOTIF-01**: Un email est envoyé au technicien assigné lors de la création d'un bon de travail
- [ ] **NOTIF-02**: Un email de rappel est envoyé 48h avant une maintenance préventive due
- [ ] **NOTIF-03**: L'admin reçoit un email quand le niveau de stock d'une pièce passe sous le seuil

### API Publique

- [ ] **API-01**: Un endpoint REST authentifié permet de lister les bons de travail
- [ ] **API-02**: Un endpoint REST permet de créer un bon de travail depuis un système externe
- [ ] **API-03**: La documentation API est accessible publiquement (Swagger/OpenAPI)
- [ ] **API-04**: Les clés API sont gérables depuis les paramètres organisation

## v2 Requirements (Milestone 3 — Compétitivité & Données)

### Portail de demandes (Phase 5)

- [ ] **PORTAL-01**: Une URL publique par site permet à n'importe qui de soumettre une demande de maintenance sans compte Korvia
- [ ] **PORTAL-02**: La soumission crée automatiquement un BT et envoie une confirmation email au demandeur avec le numéro de BT

### Données terrain (Phase 6)

- [ ] **TERRAIN-01**: Les champs requis à la clôture d'un BT sont configurables par l'admin (code de panne, temps passé, pièces)
- [ ] **TERRAIN-02**: Le technicien peut démarrer/arrêter une minuterie sur un BT; les heures réelles et le coût (heures × taux horaire) sont calculés automatiquement

### Analytique de fiabilité (Phase 7)

- [ ] **FIAB-01**: Les codes de panne (Problème / Cause / Remède) sont saisis à la clôture et disponibles dans un rapport "Top pannes récurrentes"
- [ ] **FIAB-02**: Le journal de panne calcule automatiquement le MTTR par actif à partir des heures d'arrêt saisies sur les BTs correctifs
- [ ] **FIAB-03**: Le rapport "Coût de maintenance par actif" affiche (main-d'œuvre + pièces) par actif sur une période choisie, trié par coût décroissant
- [ ] **FIAB-04**: Le rapport "Planifié vs Réel" compare durée estimée vs réelle par BT, par technicien et par type d'actif

### Productivité technicien (Phase 8)

- [ ] **PROD-01**: Les plans de travail (job plans) définissent étapes, pièces requises et durée estimée; attachés à un PM, ils pré-remplissent le BT généré
- [ ] **PROD-02**: Les checklists PM permettent des étapes numérotées avec cases à cocher, champs de mesure et photos sur mobile
- [ ] **PROD-03**: Un BT de priorité "Urgente" non résolu après un délai configurable déclenche une notification au superviseur

### Maintenance conditionnelle (Phase 9)

- [ ] **COND-01**: Un technicien peut saisir un relevé de compteur (heures moteur, cycles, km) à la clôture d'un BT ou directement sur un actif
- [ ] **COND-02**: Un PM configuré avec un seuil de compteur génère automatiquement un BT lorsque l'actif atteint ce seuil

## v3 Requirements (Milestone 4 — Croissance multi-marchés)

### Multi-langue

- **I18N-01**: Interface disponible en anglais (EN-CA)
- **I18N-02**: L'utilisateur peut choisir sa langue dans son profil
- **I18N-03**: Les emails respectent la langue préférée de l'utilisateur

### Intégrations

- **INT-01**: Webhook sortant configurable pour les événements clés (bon créé, clôturé)
- **INT-02**: Export CSV/Excel des bons de travail et actifs
- **INT-03**: Import CSV pour migration d'actifs depuis un autre système

### Mobile avancé

- **MOB-01**: Notifications push PWA pour les bons assignés
- **MOB-02**: Mode hors-ligne complet pour les bons de travail en cours

## Out of Scope

| Feature | Reason |
|---------|--------|
| App native iOS/Android | PWA suffisant pour v1, coût de maintenance x2 |
| Marketplace pièces | Trop complexe, hors cœur de métier |
| Intégration ERP (SAP/Oracle) | Marché PME n'en a pas besoin en v1 |
| Vidéo/AR pour maintenance | Overkill pour PME québécoises |
| Chat interne | Slack/Teams déjà utilisés par les clients |

## Traceability

| Requirement | Phase | Milestone | Status |
|-------------|-------|-----------|--------|
| BRAND-01 | Phase 1 | M2 | Pending |
| BRAND-02 | Phase 1 | M2 | Pending |
| BRAND-03 | Phase 1 | M2 | Pending |
| GATE-01 | Phase 2 | M2 | Pending |
| GATE-02 | Phase 2 | M2 | Pending |
| GATE-03 | Phase 2 | M2 | Pending |
| NOTIF-01 | Phase 3 | M2 | Pending |
| NOTIF-02 | Phase 3 | M2 | Pending |
| NOTIF-03 | Phase 3 | M2 | Pending |
| API-01 | Phase 4 | M2 | Pending |
| API-02 | Phase 4 | M2 | Pending |
| API-03 | Phase 4 | M2 | Pending |
| API-04 | Phase 4 | M2 | Pending |
| PORTAL-01 | Phase 5 | M3 | Pending |
| PORTAL-02 | Phase 5 | M3 | Pending |
| TERRAIN-01 | Phase 6 | M3 | Pending |
| TERRAIN-02 | Phase 6 | M3 | Pending |
| FIAB-01 | Phase 7 | M3 | Pending |
| FIAB-02 | Phase 7 | M3 | Pending |
| FIAB-03 | Phase 7 | M3 | Pending |
| FIAB-04 | Phase 7 | M3 | Pending |
| PROD-01 | Phase 8 | M3 | Pending |
| PROD-02 | Phase 8 | M3 | Pending |
| PROD-03 | Phase 8 | M3 | Pending |
| COND-01 | Phase 9 | M3 | Pending |
| COND-02 | Phase 9 | M3 | Pending |

**Coverage:**
- M2 requirements: 13 total — Mapped: 13 ✓
- M3 requirements: 13 total — Mapped: 13 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-19*
*Last updated: 2026-05-19 after initialization*
