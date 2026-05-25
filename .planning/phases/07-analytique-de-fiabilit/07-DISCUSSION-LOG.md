# Phase 7 : Analytique de fiabilité - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 07-analytique-de-fiabilité
**Areas discussed:** Structure P/C/R, Navigation des rapports

---

## Structure P/C/R

| Option | Description | Selected |
|--------|-------------|----------|
| 3 champs structurés | faultProblem + faultCause + faultRemedy — groupement riche dans le rapport Top pannes | ✓ |
| Texte libre unique | Garder faultDescription, grouper uniquement par faultCategory (4 valeurs) | |

**User's choice:** 3 champs structurés

---

| Option | Description | Selected |
|--------|-------------|----------|
| Renommer en faultProblem | Migration ALTER TABLE RENAME COLUMN — propre, sans doublon | ✓ |
| Garder faultDescription + ajouter 3 nouveaux | Compatibilité ascendante mais champ redondant | |

**User's choice:** Renommer faultDescription → faultProblem

---

## Navigation des rapports

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs dans /rapports | Vue générale + 4 onglets analytiques — tout en un seul endroit | ✓ |
| Sous-pages dédiées | /rapports/top-pannes, /rapports/mttr, etc. — plus de profondeur, 2 clics | |
| Sections verticales | Page longue, tout visible — simple mais chargement lourd | |

**User's choice:** Tabs dans /rapports

---

| Option | Description | Selected |
|--------|-------------|----------|
| Périodes prédéfinies | Ce mois / 3 mois / 6 mois / Cette année | ✓ |
| Sélecteur de dates personnalisé | Date début + fin — flexible mais UI lourde | |
| Les deux | Raccourcis + option période personnalisée | |

**User's choice:** Périodes prédéfinies

---

| Option | Description | Selected |
|--------|-------------|----------|
| 3 sous-onglets dans le tab | Par BT \| Par technicien \| Par type d'actif — vue commutée | ✓ |
| 3 tableaux empilés | Tous visibles simultanément — dense mais complet | |

**User's choice:** 3 sous-onglets dans le tab "Planifié vs Réel"

---

## Claude's Discretion

- Calcul du MTTR : somme WorkOrderTimeLog.minutes ÷ 60 (non demandé en discussion, assumé cohérent avec Phase 6)
- Plan gating : growth + enterprise (même que /rapports existant)
- Design composants : shadcn/ui existant

## Deferred Ideas

- Export CSV
- Date picker personnalisé
- MTTR rolling average
