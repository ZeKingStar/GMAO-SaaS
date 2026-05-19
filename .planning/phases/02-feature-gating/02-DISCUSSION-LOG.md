# Phase 2: Feature Gating - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 02-feature-gating
**Areas discussed:** Périmètre des gates, Stratégie de gate, UX page bloquée, Widget dashboard

---

## Périmètre des gates

| Option | Description | Selected |
|--------|-------------|----------|
| Rapports + Inventaire + QR → Croissance+ | Gater les 3 features existantes growth+ | ✓ |
| Rapports seulement | Gater uniquement /rapports | |
| Inclure API en Phase 2 | Gater l'API maintenant | |

**User's choice:** Matrice confirmée — Rapports, Inventaire, QR codes → Croissance+. API → Phase 4 directement gated.

**Notes:** Discussion étendue pour établir la matrice complète des tiers. Analyse comparative GuideTi/Maximo réalisée pour identifier les features à valeur ajoutée. 12 nouvelles features identifiées, ajoutées au roadmap comme Phases 5-9 (Milestone 3).

---

## Stratégie de gate

| Option | Description | Selected |
|--------|-------------|----------|
| Helper requirePlan() dans chaque page | Extension de requireOrgAccess() dans auth.ts | ✓ |
| Middleware Next.js | Interception centralisée via middleware.ts | |

**User's choice:** Helper requirePlan() — cohérent avec le pattern existant, pas de requête DB dans Edge Runtime.

---

## UX page bloquée

| Option | Description | Selected |
|--------|-------------|----------|
| Page avec banner upgrade + contenu flou | Banner amber Korvia + blur sur le contenu | ✓ |
| Redirection vers /parametres/organisation | Redirection directe vers billing | |

**User's choice:** Banner upgrade avec contenu flou — l'utilisateur voit ce qu'il rate, meilleure conversion.

---

## Widget tier dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Widget dans le dashboard principal | Carte plan actif + statut + renouvellement | ✓ |
| Paramètres seulement | Info dans billing-section.tsx uniquement | |

**User's choice:** Widget dashboard — visible à chaque connexion, pas besoin d'aller chercher l'info.

---

## Claude's Discretion

- Wording exact du banner upgrade
- Design du composant UpgradeGate
- Gestion du cas subscription null

## Deferred Ideas

- Gate sur quotas d'actifs (50/200/illimité) — planifier séparément
- Gate sur quotas d'utilisateurs (5/15/illimité) — planifier séparément
- Import/export Excel — Milestone 3+
