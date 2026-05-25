# Phase 6: Intégrité des données terrain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 06-int-grit-des-donn-es-terrain
**Areas discussed:** Code de panne, Pièces utilisées

---

## Code de panne

| Option | Description | Selected |
|--------|-------------|----------|
| Texte libre | Champ texte simple, aucune structure | |
| Liste fixe configurable | L'admin définit les codes, dropdown pour le technicien | |
| Texte libre + catégorie | Catégorie fixe + texte libre | ✓ |

**User's choice:** Texte libre + catégorie

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fixes dans le code | Mécanique / Électrique / Hydraulique / Autre hard-codées | ✓ |
| Configurables par l'admin | L'admin ajoute/modifie les catégories | |

**User's choice:** Fixes dans le code

---

| Option | Description | Selected |
|--------|-------------|----------|
| Catégorie obligatoire si 'code de panne' activé | Les deux sous-champs requis | ✓ |
| Catégorie optionnelle, texte obligatoire | Catégorie peut être vide | |

**User's choice:** Catégorie obligatoire si activé

---

## Pièces utilisées

| Option | Description | Selected |
|--------|-------------|----------|
| Sélection depuis l'inventaire | Lié à SparePart, déduction de stock | |
| Saisie libre uniquement | Texte libre, pas de déduction | |
| Hybride | Les deux dans la même interface | ✓ |

**User's choice:** Hybride — "Je ne veux pas bloquer le travail si la pièce n'est pas en inventaire (peu fréquent chez le public cible), on doit pouvoir faire les 2, inventaire et libre"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Déduction automatique | quantityOnHand -= qté utilisée à la clôture | ✓ |
| Inventaire manuel | Pas de déduction automatique | |

**User's choice:** Oui, déduction automatique (pour pièces inventaire uniquement)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Nom + quantité | Capture minimale pour pièces libres | ✓ |
| Nom + quantité + coût unitaire | Le technicien peut saisir un coût | |

**User's choice:** Nom + quantité uniquement

---

## Claude's Discretion

- Minuterie technicien (non discuté) : utiliser `WorkOrderTimeLog` existant, sessions multiples supportées, live timer côté client, admin peut fermer session ouverte.
- Taux horaire (non discuté) : champ `hourlyRate` sur `Membership`, calcul à la volée, affiche "—" si non configuré.
- Gating plan : suivre pattern Phase 2 `requirePlan(['growth', 'enterprise'])`.

## Deferred Ideas

- Catégories de panne configurables — backlog
- Stockage persistant du coût calculé — évaluer Phase 7
