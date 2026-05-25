# Phase 6: Intégrité des données terrain - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Fiabiliser les données saisies par les techniciens à la clôture des bons de travail et automatiser le suivi du temps. Comprend : champs de clôture configurables (code de panne, pièces, temps), minuterie intégrée au BT, et calcul automatique du coût de main-d'œuvre.

Ne comprend pas : rapports d'analytique (Phase 7), export CSV, notifications push.

</domain>

<decisions>
## Implementation Decisions

### Code de panne

- **D-01:** Saisie hybride : champ **texte libre** + **catégorie fixe** (enum hard-codé : Mécanique | Électrique | Hydraulique | Autre).
- **D-02:** Catégories fixes dans le code — pas de configuration admin pour Phase 6.
- **D-03:** Si l'admin active le champ "code de panne" dans les exigences de clôture, les deux sous-champs (catégorie + texte) sont **obligatoires**.
- **D-04:** Nouveaux champs sur `WorkOrder` : `faultCategory` (enum ou string) + `faultDescription` (String).

### Pièces utilisées

- **D-05:** Interface hybride : le technicien peut **sélectionner une pièce depuis l'inventaire SparePart** OU **saisir une pièce libre** (texte + quantité) — les deux dans la même UI, sans blocage si la pièce n'existe pas en inventaire.
- **D-06:** Nouveau modèle `WorkOrderPart` avec `sparePartId` optionnel, `name` (String), `quantity` (Float), `unitCost` (Float, optionnel — copié depuis SparePart si lié).
- **D-07:** Si `sparePartId` est renseigné, la déduction de stock (`quantityOnHand -= quantity`) est **automatique** à la validation/clôture du BT.
- **D-08:** Pour les pièces libres (sans `sparePartId`), on capture uniquement nom + quantité — pas de coût unitaire.

### Minuterie technicien

- **D-09:** S'appuyer sur le modèle `WorkOrderTimeLog` **existant** (`startedAt`, `endedAt`, `minutes`, `notes`) — aucune migration additive nécessaire pour la structure de base.
- **D-10:** Plusieurs sessions de minuterie par BT sont supportées naturellement (une ligne `WorkOrderTimeLog` par session).
- **D-11:** Le total des heures réelles = somme des `minutes` de toutes les sessions terminées du BT, converti en heures.

### Configuration des champs de clôture (TERRAIN-01)

- **D-12:** La configuration est stockée comme champ `Json` (`closureRequirements`) sur le modèle `Organization` — pas de modèle dédié pour Phase 6.
- **D-13:** Structure : `{ faultCode: boolean, timeSpent: boolean, partsUsed: boolean }` — défaut `false` pour chaque champ.
- **D-14:** L'admin configure dans `/parametres/organisation`. La validation est appliquée côté **serveur** dans la Server Action de changement de statut.
- **D-15:** Le blocage s'applique quand le statut passe à `resolved` ou `closed` (les deux états "terminés" dans l'enum existant).

### Taux horaire et coût de main-d'œuvre (TERRAIN-02)

- **D-16:** Nouveau champ `hourlyRate` (Float, optionnel) sur le modèle `Membership` — taux **par technicien**, configurable par l'admin dans la gestion d'équipe.
- **D-17:** Coût de main-d'œuvre = `(totalMinutes / 60) × hourlyRate`. Si aucun taux configuré → coût affiché comme "—" (non bloquant).
- **D-18:** Le coût est **calculé à la volée** (pas stocké), sauf si Phase 7 analytique en a besoin — décision renvoyée à Phase 7.

### Claude's Discretion

- UI du timer : bouton "Démarrer / Arrêter" visible sur la page BT quand le statut est `in_progress`. Affichage du temps écoulé en temps réel (client-side) pour la session active.
- Oubli d'arrêt de minuterie : l'admin/manager peut clore manuellement une session ouverte depuis la vue BT. Pas de fermeture auto par timeout.
- Gating plan : Phase 6 est dans Milestone 3 (Compétitivité & Données) — même logique que Phase 5. Appliquer `requirePlan(['growth', 'enterprise'])` si cohérent avec la décision de gating de Phase 2; sinon Claude décide selon le pattern établi.
- Affichage du résumé de clôture : le formulaire de clôture peut apparaître dans un dialog ou inline — Claude décide selon l'espace disponible dans `WorkOrderDetail`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 6 — Objectif, requirements TERRAIN-01/TERRAIN-02, success criteria
- `.planning/REQUIREMENTS.md` §Données terrain (Phase 6) — Critères d'acceptation TERRAIN-01, TERRAIN-02

### Schéma existant (à étendre)
- `prisma/schema.prisma` — Modèles `WorkOrder`, `WorkOrderTimeLog`, `Membership`, `Organization`, `SparePart` — base pour les extensions Phase 6

### Code existant à adapter
- `src/actions/work-orders.ts` — Server Actions existantes pour BT (pattern à étendre pour validation clôture)
- `src/app/(app)/bons-de-travail/[id]/page.tsx` — Page détail BT (intégrer timer + formulaire clôture)
- `src/lib/auth.ts` — Pattern `requirePlan()` pour gating éventuel

### Phase précédente (gating pattern)
- `.planning/phases/02-feature-gating/02-CONTEXT.md` — Décisions D-06 à D-11 sur le mécanisme de gate et `requirePlan()`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WorkOrderTimeLog` (prisma/schema.prisma) : modèle complet avec `startedAt`, `endedAt`, `minutes`, `notes` — pas de migration structurelle nécessaire pour la minuterie
- `SparePart` (prisma/schema.prisma) : `quantityOnHand`, `unitCost`, `partNumber` — base pour la sélection de pièces inventaire
- Pattern Server Actions (`src/actions/work-orders.ts`) : `getOrgAndMembership()` helper réutilisable
- `requirePlan()` (`src/lib/auth.ts`) : gating plan déjà implémenté

### Established Patterns
- Mutations via Server Actions (`'use server'`) — pas d'API route pour les actions internes
- Auth guard : `requireOrgAccess()` / `requirePlan()` en début de Server Action
- Relations Prisma : `onDelete: Cascade` systématique pour les sous-entités
- Revalidation : `revalidatePath('/bons-de-travail')` après mutation

### Integration Points
- `WorkOrderDetail` (`src/components/work-orders/work-order-detail`) : composant principal — ajouter sections timer, pièces, et formulaire de clôture
- `/parametres/organisation` : ajouter section "Exigences de clôture" pour config TERRAIN-01
- `Membership` → ajouter `hourlyRate` : visible dans `team-table.tsx` pour config admin
- La page BT charge déjà `timeLogs` — le composant reçoit les données, pas de changement de requête majeur

</code_context>

<specifics>
## Specific Ideas

- "Ne pas bloquer si la pièce n'est pas en inventaire" — le technicien peut saisir des pièces libres sans que cela soit une erreur. L'inventaire lié est un bonus, pas une contrainte.
- Hybride inventaire + libre dans la même interface pour les pièces utilisées.

</specifics>

<deferred>
## Deferred Ideas

- Stockage persistant du coût de main-d'œuvre calculé — évaluer en Phase 7 si l'analytique en a besoin
- Catégories de panne configurables par l'admin — Phase 8 ou backlog
- Notifications push PWA pour le timer — Milestone 4
- Export des données de clôture (CSV) — Milestone 4

</deferred>

---

*Phase: 06-int-grit-des-donn-es-terrain*
*Context gathered: 2026-05-25*
