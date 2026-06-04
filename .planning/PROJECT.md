# Korvia

## What This Is

Korvia est un logiciel SaaS de gestion de maintenance assistée par ordinateur (GMAO) conçu pour les PME québécoises. Il permet de gérer les actifs, les bons de travail, la maintenance préventive, l'inventaire de pièces et les rapports — le tout en français, depuis n'importe quel appareil.

## Core Value

Un technicien de maintenance peut créer un bon de travail, scanner un actif QR et accéder à son historique complet en moins de 60 secondes, sur mobile ou bureau.

## Requirements

### Validated (v1.0)

- ✓ Authentification multi-organisation via Clerk — Phase 1 (existant)
- ✓ Gestion des actifs (équipements) avec catégories et sites — Phase 1 (existant)
- ✓ Bons de travail avec statuts, priorités et assignation — Phase 1 (existant)
- ✓ Plans de maintenance préventive — Phase 1 (existant)
- ✓ Inventaire de pièces de rechange — Phase 1 (existant)
- ✓ Scan QR code pour accès rapide aux actifs — Phase 1 (existant)
- ✓ Dashboard avec KPIs en temps réel — Phase 2 (existant)
- ✓ Rapports & indicateurs avec graphiques — Phase 2 (existant)
- ✓ Abonnements Stripe avec 3 tiers (Démarrage/Croissance/Entreprise) — Phase 2 (existant)
- ✓ PWA avec support hors-ligne — Phase 2 (existant)
- ✓ Onboarding organisation multi-étapes — Phase 1 (existant)
- ✓ Rebrand complet Korvia : logo SVG, landing page dark navy, identité visuelle — v1.0 Phase 1
- ✓ Feature gating selon tier d'abonnement Stripe (requirePlan, UpgradeGate) — v1.0 Phase 2
- ✓ Notifications email automatiques via Resend (BT assigné, maintenance due, stock bas) — v1.0 Phase 3
- ✓ API REST publique avec documentation OpenAPI/Scalar et gestion clés API — v1.0 Phase 4
- ✓ Portail de demandes public par site (URL → BT sans compte) — v1.0 Phase 5
- ✓ Intégrité données terrain : codes panne P/C/R, minuterie, calcul coûts — v1.0 Phase 6
- ✓ Analytique de fiabilité : MTTR, top pannes, coût/actif, planifié vs réel — v1.0 Phase 7
- ✓ Productivité technicien : job plans, checklists PM, escalade BT urgents — v1.0 Phase 8
- ✓ Maintenance conditionnelle : compteurs d'actifs + cron déclencheur BT auto — v1.0 Phase 9

### Active (v2.0 — Croissance multi-marchés)

- [ ] Multi-langue FR/EN-CA (I18N-01, I18N-02, I18N-03)
- [ ] Export CSV/Excel des BTs et actifs (INT-02)
- [ ] Import assisté IA depuis Excel/ancien GMAO (INT-03 + backlog 999.1)
- [ ] Notifications push PWA pour BTs assignés (MOB-01)
- [ ] Mode hors-ligne complet pour BTs en cours (MOB-02)
- [ ] Webhooks sortants configurables (INT-01)

### Out of Scope

- Application mobile native (iOS/Android) — PWA suffit pour v1
- Marketplace de pièces — trop complexe pour v1
- Intégration ERP (SAP, etc.) — v3+

## Context

- Stack: Next.js 15, TypeScript, Prisma, PostgreSQL (Neon), Clerk, Stripe, Tailwind v4, shadcn/ui
- Déployé sur VPS (2 vCPU / 2 GB RAM) avec accès port 3000
- Codebase avancé au-delà du Milestone 1 — plusieurs fonctionnalités Milestone 2 déjà livrées
- Marché cible: PME québécoises francophones (industrie, immobilier, municipal)
- Compétiteurs: Limble CMMS, UpKeep, Fracttal (tous en anglais — avantage concurrentiel FR)

## Constraints

- **Langue**: Interface 100% français (québécois) pour le marché cible
- **VPS**: 2 GB RAM — éviter les dépendances lourdes en build
- **Stripe**: Intégration déjà en place — respecter la structure des webhooks existants
- **Clerk**: Auth multi-org déjà configuré — ne pas modifier le flux d'auth

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nom: Korvia | Évoque "corvée" (travail/maintenance), K moderne, libre dans le SaaS | — Pending |
| shadcn/ui + Tailwind v4 | Rapidité de développement, composants accessibles | ✓ Good |
| Neon PostgreSQL | Serverless, SSL natif, plan gratuit généreux | ✓ Good |
| Clerk pour auth | Multi-org out of the box, webhooks fiables | ✓ Good |
| PWA vs app native | Réduit coût de maintenance, iOS/Android via navigateur | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-04 — v1.0 milestone clôturé et archivé (9 phases, 32 plans ; gaps de vérification acceptés en dette)*
