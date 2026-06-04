# Korvia — Living Retrospective

## Milestone: v1.0 — Compétitivité & Données

**Shipped:** 2026-05-29 · **Closed:** 2026-06-04
**Phases:** 9 | **Plans:** 32 | **~210 commits · ~63 595 lignes TypeScript**

### What Was Built

Transformation d'un GMAO générique en produit commercial Korvia prêt à vendre : rebrand complet (identité dark navy/ambre, logo SVG), feature gating Stripe par tier, notifications email Resend, API REST publique documentée (OpenAPI/Scalar), portail de demandes public sans compte, intégrité des données terrain (codes panne, minuterie, coûts), analytique de fiabilité (MTTR, top pannes, coût/actif), productivité technicien (job plans, checklists, escalade) et maintenance conditionnelle (compteurs → BT automatique via cron).

### What Worked

- **Découpage en 9 phases livrables** : chaque phase a produit de la valeur isolée et déployable.
- **Patterns serveur réutilisables** : `requirePlan()` + `UpgradeGate` RSC ont standardisé le gating sur toutes les pages.
- **Cron + détection de transition de seuil** : infra email (Phase 3) réutilisée par les Phases 5, 8, 9 sans refonte.
- **Migration Clerk → Better Auth** menée à 0 erreur TypeScript en cours de milestone.

### What Was Inefficient

- **Dette de vérification** : 3 phases sans VERIFICATION.md (01/04/06) et 5 UAT humains jamais complétés (02/03/04/06/09) — le code était livré et testé en automatique, mais l'artefact formel a été sauté.
- **Audit retardé** : milestone shippé le 29 mai, mais audité seulement le 2 juin et clôturé le 4 juin (archivage partiel fait à la main entre-temps).
- **Dette de migration** : `api-auth.test.ts` importe encore `@clerk` après la bascule Better Auth ; évidence de vérification des Phases 2/5 écrite en monde pré-migration.
- **Production fragile** : incident 502 (build `.next` interrompu sans BUILD_ID) sur le VPS 2 Go — voir mémoire `incident-502-buildid`.

### Patterns Established

- Gating d'abonnement via helper serveur + composant RSC.
- Notifications transactionnelles centralisées sur Resend, déclenchées par cron horaire ou transition d'état (read-before-write).
- QR → URL publique (`/api/qr`) pour accès actif sans scanner in-app.

### Key Lessons

- **Écrire VERIFICATION.md / UAT au fil de l'eau**, pas en fin de milestone — sinon ça devient une dette qu'on accepte par défaut.
- **Auditer avant de marquer shipped**, pas après.
- **Builder hors du VPS 2 Go** (ou augmenter le swap) pour éviter les builds OOM/corrompus en production.

### Cost Observations

- Sessions : multiples (mai–juin 2026), modèle principal Opus/Sonnet via GSD.
- Notable : la dette de vérification a coûté un cycle d'audit + clôture séparé plutôt qu'une clôture en un temps.

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Shipped | Dette principale |
|-----------|--------|-------|---------|------------------|
| v1.0 | 9 | 32 | 2026-05-29 | Vérification (VERIFICATION/UAT) + migration `@clerk` |

*À enrichir à chaque milestone.*
