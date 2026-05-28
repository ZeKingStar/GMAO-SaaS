---
phase: 08-productivit-technicien
verified: 2026-05-28T12:00:00Z
status: human_needed
score: 11/12 must-haves verified
gaps: []
human_verification:
  - test: "Valider PROD-02 — photos sur mobile (champ photoUrl)"
    expected: "La checklist devrait permettre d'attacher une photo à un item (PROD-02 mentionne 'photos sur mobile')"
    why_human: "Le champ photoUrl existe dans le schéma (WorkOrderChecklistItem.photoUrl) mais aucun composant UI de capture photo n'a été implémenté en Phase 8. Confirmé 'known stub' dans 08-01-SUMMARY. Besoin d'un regard humain pour évaluer si la exigence PROD-02 est satisfaite sans la photo, ou si c'est un gap réel vs fonctionnalité intentionnellement reportée."
  - test: "Valider le comportement du cron avec escalationConfig null (filtre { not: undefined })"
    expected: "Les organisations sans escalationConfig configurée ne reçoivent aucun email d'escalade"
    why_human: "Le cron utilise un workaround 'escalationConfig: { not: undefined }' (au lieu de null) car le client Prisma n'était pas régénéré dans le worktree au moment de l'exécution. Ce filtre pourrait charger toutes les organisations (y compris celles sans config) mais parseEscalationConfig retourne enabled:false par défaut, créant une double sécurité. Besoin d'une validation humaine que le comportement en production est correct après régénération du client Prisma."
  - test: "Valider le checkpoint end-to-end PROD-01/02/03 (25 étapes du protocole)"
    expected: "Les 25 étapes documentées dans 08-03-PLAN.md Task 4 produisent les résultats attendus"
    why_human: "Le checkpoint humain (Task 4 du plan 08-03) était EN ATTENTE dans le SUMMARY 08-03. La vérification automatique ne peut pas remplacer le parcours utilisateur réel sur l'application démarrée."
---

# Phase 8 : Productivité Technicien — Rapport de Vérification

**Objectif de phase :** Productivité technicien — plans de maintenance avec pièces requises, checklist interactive sur BT issu d'un plan, escalade automatique des BTs urgents
**Vérifié :** 2026-05-28T12:00:00Z
**Statut :** human_needed
**Re-vérification :** Non — vérification initiale

---

## Atteinte de l'objectif

### Vérités observables

| # | Vérité | Statut | Preuve |
|---|--------|--------|--------|
| 1 | La DB contient les tables WorkOrderChecklistItem et MaintenancePlanPart | ✓ VÉRIFIÉE | `grep "^model (MaintenancePlanPart\|WorkOrderChecklistItem)"` dans schema.prisma — 2 modèles présents |
| 2 | WorkOrder.maintenancePlanId et escalationSentAt existent (nullable) | ✓ VÉRIFIÉE | `maintenancePlanId String?` et `escalationSentAt DateTime?` présents dans schema.prisma |
| 3 | Organization.escalationConfig (Json?) existe | ✓ VÉRIFIÉE | `escalationConfig Json?` présent dans schema.prisma |
| 4 | Le module escalation-config parse et valide une config JSON | ✓ VÉRIFIÉE | 4 exports confirmés : EscalationConfig, DEFAULT_ESCALATION_CONFIG, ESCALATION_FIELD_LABELS, parseEscalationConfig |
| 5 | PROD-01 : Sur un plan de maintenance, l'admin peut ajouter/voir/supprimer des pièces requises | ✓ VÉRIFIÉE | PlanPartsSection (plan-parts-section.tsx) câblé à addPlanPart/deletePlanPart, intégré dans MaintenancePlanFormDialog avec `plan && PlanPartsSection` |
| 6 | PROD-01 : Un bouton "Générer un BT" crée un BT pré-rempli (tasks → checklistItems, pièces → parts) | ✓ VÉRIFIÉE | GenerateWorkOrderButton appelle generateWorkOrderFromPlan, qui copie tasks en checklistItems et planParts en parts (confirmé dans actions/maintenance.ts) |
| 7 | PROD-02 : Sur un BT issu d'un plan, une section Checklist s'affiche (cases à cocher + mesures) | ✓ VÉRIFIÉE | WorkOrderChecklist intégré dans work-order-detail.tsx avec condition `maintenancePlanId || checklistItems.length > 0` |
| 8 | PROD-02 : Sur les BTs sans plan, aucune section Checklist ne s'affiche | ✓ VÉRIFIÉE | Condition conditionnelle + `if (items.length === 0) return null` dans WorkOrderChecklist |
| 9 | PROD-02 : La coche persiste (toggle → server action) | ✓ VÉRIFIÉE | toggleChecklistItem appelé dans WorkOrderChecklist avec org-scoping via `workOrder: { organizationId }` |
| 10 | PROD-03 : Le cron /api/cron/urgent-escalation filtre les BTs urgents + envoie emails | ✓ VÉRIFIÉE | Route Handler existe, filtre priority:'urgent', status in [open, in_progress, on_hold], escalationSentAt:null, envoie sendUrgentEscalationEmail |
| 11 | PROD-03 : Idempotence — après envoi, escalationSentAt est mis à jour | ✓ VÉRIFIÉE | `escalationSentAt: new Date()` dans db.workOrder.update après envoi réussi |
| 12 | PROD-03 : L'admin peut configurer l'escalade dans /parametres/organisation | ✓ VÉRIFIÉE | EscalationConfigSection intégré dans la page avec garde `canManageEscalation` (admin|manager) |

**Score : 12/12 vérités automatiquement vérifiables — TOUTES VÉRIFIÉES**

> Note : Le score automatique est 12/12 mais le statut est `human_needed` en raison de 3 éléments non vérifiables automatiquement (voir section dédiée).

---

### Artefacts requis

| Artefact | Fournit | Statut | Détails |
|----------|---------|--------|---------|
| `prisma/schema.prisma` | Schéma étendu Phase 8 | ✓ VÉRIFIÉE | 2 nouveaux modèles + 3 nouvelles colonnes + index |
| `src/lib/escalation-config.ts` | Type EscalationConfig + parser | ✓ VÉRIFIÉE | 4 exports confirmés |
| `src/lib/escalation-config.test.ts` | Suite de tests unitaires | ✓ VÉRIFIÉE | Fichier présent (9/9 tests passants selon SUMMARY 08-01) |
| `src/actions/maintenance.ts` | generateWorkOrderFromPlan, addPlanPart, deletePlanPart | ✓ VÉRIFIÉE | 3 nouvelles fonctions exportées confirmées |
| `src/actions/work-orders.ts` | toggleChecklistItem, setChecklistMeasure | ✓ VÉRIFIÉE | Lignes 427 et 443 — avec org-scoping |
| `src/actions/settings.ts` | updateEscalationConfig | ✓ VÉRIFIÉE | Présent avec validation delayHours ]0,168] |
| `src/components/maintenance/plan-parts-section.tsx` | UI pièces requises d'un job plan | ✓ VÉRIFIÉE | Substantif — addPlanPart, deletePlanPart, handleAddPart, SparePartPickerDialog, mode séquentiel |
| `src/components/maintenance/spare-part-picker-dialog.tsx` | Modal picker scalable | ✓ VÉRIFIÉE | SparePartPickerDialog avec search + filtre fournisseur + useMemo |
| `src/components/maintenance/generate-work-order-button.tsx` | Bouton génération BT | ✓ VÉRIFIÉE | Appelle generateWorkOrderFromPlan + redirect + toast |
| `src/components/work-orders/work-order-checklist.tsx` | Checklist interactive | ✓ VÉRIFIÉE | toggleChecklistItem + setChecklistMeasure + readOnly + return null si vide |
| `src/emails/urgent-escalation.tsx` | Template email escalade | ✓ VÉRIFIÉE | UrgentEscalationEmail avec "Bon de travail urgent non résolu" |
| `src/lib/email.ts` | sendUrgentEscalationEmail helper | ✓ VÉRIFIÉE | Fonction exportée présente |
| `src/app/api/cron/urgent-escalation/route.ts` | Route cron Vercel | ✓ VÉRIFIÉE | CRON_SECRET auth + filtres BT + idempotence escalationSentAt |
| `src/components/settings/escalation-config-section.tsx` | UI config escalade | ✓ VÉRIFIÉE | updateEscalationConfig + dirty-check + validation delayHours > 168 |
| `vercel.json` | Schedule cron horaire | ✓ VÉRIFIÉE | 2 entrées : maintenance-reminder + urgent-escalation, schedule "0 * * * *" |

---

### Liaisons clés (Key Links)

| De | Vers | Via | Statut | Détails |
|----|------|-----|--------|---------|
| PlanPartsSection | addPlanPart / deletePlanPart | onClick handler (pas onSubmit) | ✓ CÂBLÉE | `handleAddPart(keepFormOpen: boolean)` — aucun `<form>` (grep retourne 0) |
| MaintenancePlanFormDialog | PlanPartsSection | import + rendu conditionnel `{plan && ...}` | ✓ CÂBLÉE | Ligne 199 du dialog |
| GenerateWorkOrderButton | generateWorkOrderFromPlan | useTransition + import action | ✓ CÂBLÉE | Ligne 8 et 20 du composant |
| maintenance/page.tsx | PlanPartsSection (via MaintenancePlanList) | spareParts chargées + planParts inclus dans plans | ✓ CÂBLÉE | Promise.all avec 4 requêtes dont spareParts |
| WorkOrderChecklist (toggle) | toggleChecklistItem | onChange avec useTransition | ✓ CÂBLÉE | Ligne 73 : type="checkbox" + handler |
| WorkOrderChecklist (mesure) | setChecklistMeasure | onBlur si valeur changée | ✓ CÂBLÉE | Ligne 95 : `onBlur={e => handleMeasureBlur(...)}` |
| WorkOrderDetail | WorkOrderChecklist | rendu conditionnel `maintenancePlanId || items.length > 0` | ✓ CÂBLÉE | Ligne 268 avec readOnly basé sur status |
| bons-de-travail/[id]/page.tsx | checklistItems (Prisma) | `include: { checklistItems: { select, orderBy } }` | ✓ CÂBLÉE | Lignes 49-52 |
| vercel.json | /api/cron/urgent-escalation | schedule "0 * * * *" | ✓ CÂBLÉE | 2ème entrée crons |
| cron route | sendUrgentEscalationEmail | appel direct après filtre | ✓ CÂBLÉE | Ligne ~70 du route handler |
| cron route | WorkOrder.escalationSentAt | db.workOrder.update après envoi | ✓ CÂBLÉE | `escalationSentAt: new Date()` |
| EscalationConfigSection | updateEscalationConfig | Server Action via useTransition | ✓ CÂBLÉE | Import + appel dans handleSubmit |
| parametres/organisation/page.tsx | EscalationConfigSection | import + `canManageEscalation` + render | ✓ CÂBLÉE | Lignes 12, 40, 130-138 |
| SparePartPickerDialog | PlanPartsSection.selectedSparePartId | callback onSelect(id, name) | ✓ CÂBLÉE | `setPickerOpen(true)` + onSelect callback |

---

### Trace de flux de données (Niveau 4)

| Artefact | Variable de données | Source | Données réelles | Statut |
|----------|---------------------|--------|-----------------|--------|
| WorkOrderChecklist | items (ChecklistItem[]) | bons-de-travail/[id]/page.tsx → Prisma workOrderChecklistItem | Requête DB avec select + orderBy order:asc | ✓ FLUENT |
| PlanPartsSection | parts (MaintenancePlanPart[]) | maintenance-plan-form-dialog.tsx → plan.planParts ?? [] | Chargées depuis maintenance/page.tsx avec include planParts | ✓ FLUENT |
| GenerateWorkOrderButton | wo (id, number) | generateWorkOrderFromPlan → db.workOrder.create | Crée réellement en DB avec checklistItems + parts depuis plan | ✓ FLUENT |
| EscalationConfigSection | escalationCfg (EscalationConfig) | parametres/organisation/page.tsx → parseEscalationConfig(org.escalationConfig) | Chargé depuis DB Organization.escalationConfig | ✓ FLUENT |
| cron route | overdueWOs | db.workOrder.findMany({ priority: urgent, escalationSentAt: null }) | Requête DB avec 4 filtres réels | ✓ FLUENT (avec réserve — voir ci-dessous) |
| SparePartPickerDialog | spareParts (SparePartFull[]) | maintenance/page.tsx → db.sparePart.findMany | Chargées avec 6 champs (id, name, partNumber, description, quantityOnHand, supplier) | ✓ FLUENT |

**Réserve sur le cron :** Le filtre `escalationConfig: { not: undefined }` est un workaround documenté (le client Prisma n'était pas régénéré dans le worktree au moment de l'exécution de 08-03). En pratique, le `parseEscalationConfig` retourne `enabled: false` pour les orgs sans config, ce qui les exclut via `if (!cfg.enabled) continue`. La double sécurité fonctionne mais ce n'est pas le comportement idéal — le filtre DB devrait exclure les orgs sans config dès la requête.

---

### Vérifications comportementales (Spot-checks)

| Comportement | Commande | Résultat | Statut |
|-------------|---------|---------|--------|
| Module escalation-config exports | `node -e "..."` sur le fichier .ts | parseEscalationConfig: true, DEFAULT: true, type: true | ✓ PASS |
| vercel.json valide + 2 crons | `node -e "require('./vercel.json')"` | 2 entrées : maintenance-reminder + urgent-escalation | ✓ PASS |
| toggleChecklistItem exporté | grep dans work-orders.ts | Ligne 427 avec org-scoping | ✓ PASS |
| Aucun `<form>` dans plan-parts-section | `grep -c "<form"` | 0 | ✓ PASS |
| handleAddPart(keepFormOpen) présent | grep dans plan-parts-section | Lignes 60, 86, 195, 203 | ✓ PASS |
| SortHeader dans les 2 listes | grep dans work-order-list + maintenance-plan-list | 2 fichiers | ✓ PASS |
| hover:bg-muted/80 absent (remplacé) | grep dans work-order-list | 0 occurrences | ✓ PASS |
| Tests Vitest | Rapporté dans SUMMARY 08-01 | 9/9 tests passants | ✓ PASS (selon SUMMARY) |

---

### Couverture des exigences

| Exigence | Description | Statut | Preuve |
|----------|-------------|--------|--------|
| PROD-01 | Les plans de travail (job plans) définissent étapes, pièces requises et durée estimée ; attachés à un PM, ils pré-remplissent le BT généré | ✓ SATISFAITE | PlanPartsSection + GenerateWorkOrderButton + generateWorkOrderFromPlan → tasks→checklistItems + planParts→parts |
| PROD-02 | Les checklists PM permettent des étapes numérotées avec cases à cocher, champs de mesure et **photos sur mobile** | ? PARTIELLE | Cases à cocher ✓, champs de mesure ✓, **photos : champ photoUrl dans le schéma mais aucune UI de capture photo implémentée** |
| PROD-03 | Un BT de priorité "Urgente" non résolu après un délai configurable déclenche une notification au superviseur | ✓ SATISFAITE | Cron horaire + filtre correct + email Resend + UI config admin + idempotence escalationSentAt |

---

### Anti-patterns détectés

| Fichier | Ligne | Pattern | Sévérité | Impact |
|---------|-------|---------|----------|--------|
| `src/app/api/cron/urgent-escalation/route.ts` | 26, 58, 85 | `db as any` (cast pour contourner client Prisma non régénéré) | ⚠️ Avertissement | Fonctionnel car les champs existent en DB ; le cast disparaîtra à la prochaine régénération du client Prisma. Pas un bloquant mais à nettoyer |
| `src/app/api/cron/urgent-escalation/route.ts` | 27 | `escalationConfig: { not: undefined }` (filtre inefficace) | ⚠️ Avertissement | En pratique masqué par `parseEscalationConfig` → `enabled:false` → `continue`, mais le filtre DB ne filtre pas réellement les orgs sans config. Double sécurité fonctionnelle |
| Aucun | — | Aucun TODO/FIXME/placeholder dans les fichiers clés | — | Propre |

---

### Vérification humaine requise

#### 1. Photos sur mobile dans la checklist (PROD-02)

**Test :** Sur la page d'un BT issu d'un plan, vérifier si les items de checklist permettent d'attacher une photo.
**Attendu selon PROD-02 :** "cases à cocher, champs de mesure et photos sur mobile"
**Résultat actuel :** Le schéma a `WorkOrderChecklistItem.photoUrl String?` mais le composant `WorkOrderChecklist` ne rend aucun input de type file ni aucun bouton photo.
**Pourquoi humain :** Décision à prendre : est-ce un gap PROD-02 (photos manquantes) ou une fonctionnalité intentionnellement reportée à une phase ultérieure ? Le SUMMARY 08-01 le documente comme "known stub" avec "extension future" mais sans engagement de phase.

#### 2. Comportement du cron avec le filtre `escalationConfig: { not: undefined }`

**Test :** Déclencher `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/urgent-escalation` et vérifier la réponse JSON avec une org sans escalationConfig configurée.
**Attendu :** `orgsProcessed: N` (toutes orgs), mais `emailsSent: 0` pour les orgs avec `enabled: false` ou sans config.
**Pourquoi humain :** Le workaround `{ not: undefined }` charge potentiellement toutes les orgs en DB. La double sécurité via `parseEscalationConfig` → `enabled:false` → `continue` doit être validée en environnement réel. À corriger en production en régénérant le client Prisma.

#### 3. Checkpoint end-to-end Phase 8 (25 étapes du protocole)

**Test :** Suivre les 25 étapes documentées dans 08-03-PLAN.md Task 4 :
- PROD-01 (étapes 1-10) : créer un plan, ajouter des pièces (inventaire + hors inventaire), générer un BT, vérifier le BT pré-rempli
- PROD-02 (étapes 11-16) : cocher des items, saisir des mesures, vérifier la persistance après refresh, vérifier l'absence de checklist sur un BT correctif manuel
- PROD-03 (étapes 17-25) : configurer l'escalade, créer un BT urgent, modifier createdAt en DB, déclencher le cron, vérifier l'email et l'idempotence
**Attendu :** Toutes les étapes produisent les résultats décrits dans le plan.
**Pourquoi humain :** Le checkpoint Task 4 était "EN ATTENTE" dans le SUMMARY 08-03. La vérification automatique ne peut pas remplacer le parcours utilisateur complet sur l'application en cours d'exécution.

---

## Résumé des gaps

Aucun gap bloquant identifié automatiquement.

Toutes les fonctionnalités vérifiables automatiquement sont présentes, substantielles et correctement câblées :
- PROD-01 est livré (PlanPartsSection fonctionnel avec picker scalable, GenerateWorkOrderButton)
- PROD-02 est livré sauf la fonctionnalité "photos sur mobile" (photoUrl dans le schéma, pas d'UI)
- PROD-03 est livré (cron horaire, email Resend, config admin, idempotence)

Le statut `human_needed` est dû à :
1. L'absence d'UI de capture photo (PROD-02 partiellement couvert)
2. Le workaround `db as any` dans le cron (fonctionnel mais à valider en prod)
3. Le checkpoint end-to-end non validé (Task 4 du plan 08-03 était en attente)

---

*Vérifié : 2026-05-28T12:00:00Z*
*Vérificateur : Claude (gsd-verifier)*
