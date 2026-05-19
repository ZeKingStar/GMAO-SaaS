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

## v2 Requirements (Milestone 3 — Croissance)

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

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 1 | Pending |
| BRAND-02 | Phase 1 | Pending |
| BRAND-03 | Phase 1 | Pending |
| GATE-01 | Phase 2 | Pending |
| GATE-02 | Phase 2 | Pending |
| GATE-03 | Phase 2 | Pending |
| NOTIF-01 | Phase 3 | Pending |
| NOTIF-02 | Phase 3 | Pending |
| NOTIF-03 | Phase 3 | Pending |
| API-01 | Phase 4 | Pending |
| API-02 | Phase 4 | Pending |
| API-03 | Phase 4 | Pending |
| API-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-19*
*Last updated: 2026-05-19 after initialization*
