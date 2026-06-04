# Milestones

## v1.0 — Compétitivité & Données (Shipped: 2026-05-29)

**Phases completed:** 9 phases, 32 plans · ~210 commits · ~63 595 lignes TypeScript
**Audited:** 2026-06-02 (`gaps_found` — dette de vérification, code sain) · **Closed:** 2026-06-04

**Key accomplishments:**

- **Rebrand Korvia** — landing page refondue en thème dark (navy #0F1C2E + ambre #E8830C), logo SVG, identité visuelle complète (Phase 1)
- **Feature gating Stripe** — `requirePlan()` + `UpgradeGate` RSC verrouillent les features par tier d'abonnement (Démarrage/Croissance/Entreprise) (Phase 2)
- **Notifications email Resend** — alertes automatiques (BT assigné, maintenance due, stock bas) via cron horaire et détection de transition de seuil (Phases 3, 9)
- **API REST publique** — endpoints v1 + documentation OpenAPI/Scalar + gestion des clés API (Phase 4)
- **Portail de demandes public** — URL par site → création de BT sans compte (Phase 5)
- **Données terrain & fiabilité** — codes panne P/C/R, minuterie/coûts, analytique MTTR + top pannes + coût/actif (Phases 6, 7)
- **Productivité technicien & maintenance conditionnelle** — job plans, checklists PM, escalade BT urgents, compteurs d'actifs → BT automatique (Phases 8, 9)

**Migration infra :** Clerk → Better Auth mergée le 2026-06-01 (`tsc --noEmit` = 0 erreur).

### Known Gaps (acceptés comme dette de vérification — voir `milestones/v1.0-MILESTONE-AUDIT.md`)

Aucune exigence en échec ; les écarts sont documentaires/vérification sur un milestone déjà en production.

- **VERIFICATION.md manquant** : Phases 1 (Identité), 4 (API), 6 (Terrain) — fonctionnellement live mais sans artefact de vérification formel.
- **UAT humains en attente** : Phases 2 (Gating), 3 (Notifs), 4 (API), 6 (Terrain), 9 (Conditionnelle) — tests automatisés verts, confirmation humaine non faite.
- **Dette technique** : `src/lib/api-auth.test.ts` importe encore `@clerk` après la migration Better Auth — à migrer ou retirer en v2.0.
- **Vérifs auth pré-migration** : l'évidence de vérification des Phases 2 et 5 référence Clerk (écrite avant le 1ᵉʳ juin) — gating/rôles non re-vérifiés contre Better Auth.

---
