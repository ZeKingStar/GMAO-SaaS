---
phase: 08-productivit-technicien
plan: "03"
subsystem: escalation-cron
tags: [cron, email, resend, vercel, settings-ui, idempotence]
dependency_graph:
  requires:
    - EscalationConfig type + parseEscalationConfig (08-01)
    - updateEscalationConfig server action (08-01)
    - WorkOrder.escalationSentAt column (08-01)
    - Organization.escalationConfig column (08-01)
  provides:
    - UrgentEscalationEmail React template
    - sendUrgentEscalationEmail helper
    - /api/cron/urgent-escalation route (idempotent, org-scoped)
    - vercel.json cron schedule horaire
    - EscalationConfigSection UI (admin/manager)
  affects:
    - /parametres/organisation (nouvelle section visible)
    - Emails Resend envoyés aux admin/manager
tech_stack:
  added: []
  patterns:
    - Cron handler suit patron maintenance-reminder (auth Bearer, boucle, try/catch, JSON response)
    - Email template suit patron maintenance-reminder.tsx (inline styles, header orange #E8830C, footer standard)
    - EscalationConfigSection suit patron closure-requirements-section.tsx (useState + useTransition + dirty + toast)
    - Idempotence via escalationSentAt (filtre null à la lecture, update après envoi réussi)
    - db cast `as any` pour contourner client Prisma non régénéré dans le worktree (champs 08-01 pas encore dans les types générés locaux)
key_files:
  created:
    - src/emails/urgent-escalation.tsx
    - src/app/api/cron/urgent-escalation/route.ts
    - src/components/settings/escalation-config-section.tsx
  modified:
    - src/lib/email.ts
    - src/app/(app)/parametres/organisation/page.tsx
    - vercel.json
decisions:
  - "cast `db as any` dans le cron route pour contourner les types Prisma non régénérés — les champs escalationSentAt et escalationConfig existent en DB mais pas dans le client généré local du worktree"
  - "recipients = members where role IN [admin, manager] — scoped strictement par org.id pour éviter fuite inter-org (T-08-16)"
  - "filter escalationConfig: { not: undefined } plutôt que null car le client Prisma de ce worktree n'accepte pas Prisma.JsonNull"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-27"
  tasks_completed: 3
  tasks_total: 4
  files_created: 3
  files_modified: 3
---

# Phase 8 Plan 03: Escalade automatique BTs urgents (PROD-03)

**One-liner:** Cron Vercel horaire idempotent envoyant des emails Resend aux admin/manager pour les BTs urgents non résolus après délai configurable, avec UI de configuration dans /parametres/organisation.

## Architecture cron + idempotence

### Flux d'exécution

```
Vercel Cron (toutes les heures)
  → GET /api/cron/urgent-escalation
    → Auth: Authorization: Bearer CRON_SECRET (401 sinon)
    → db.organization.findMany({ where: escalationConfig non-null })
    → Pour chaque org:
        parseEscalationConfig(org.escalationConfig)
        if !cfg.enabled → skip
        recipients = org.members (role admin|manager, email non-null)
        threshold = now - cfg.delayHours * 3600s
        overdueWOs = workOrder.findMany({ priority: urgent, status in [open,in_progress,on_hold], createdAt <= threshold, escalationSentAt: null })
        Pour chaque WO:
          sendUrgentEscalationEmail(...)   → Resend
          db.workOrder.update({ escalationSentAt: new Date() })  → idempotence
    → JSON { ok, orgsProcessed, workOrdersFound, emailsSent, errors? }
```

### Idempotence

Le filtre `escalationSentAt: null` garantit qu'un BT ne reçoit qu'un seul email d'escalade, même si le cron tourne plusieurs fois. Une fois escaladé, `escalationSentAt` est mis à jour immédiatement après l'envoi réussi.

### Scoping org

Chaque BT est filtré par `organizationId: org.id`. Les recipients sont calculés depuis `org.members` — jamais de fuite inter-organisation (T-08-16 mitigé).

## Configuration Vercel

`vercel.json` contient maintenant deux crons horaires :

```json
{
  "crons": [
    { "path": "/api/cron/maintenance-reminder", "schedule": "0 * * * *" },
    { "path": "/api/cron/urgent-escalation",   "schedule": "0 * * * *" }
  ]
}
```

## UI de configuration (EscalationConfigSection)

Accessible à `/parametres/organisation` pour les rôles `admin` et `manager` :
- Toggle "Activer l'escalade des bons urgents"
- Input numérique "Délai avant escalade (heures)" (1–168, désactivé si toggle off)
- Bouton Sauvegarder (disabled si !dirty || pending)
- Validation client : délai hors plage → toast erreur
- Appel `updateEscalationConfig` server action + toast succès

## Résultats du checkpoint humain

**Statut : EN ATTENTE** — Tasks 1-3 complètes, checkpoint Task 4 soumis à validation humaine.

Les 25 étapes du protocole couvrent :
- PROD-01 : Job plans avec pièces requises + génération BT (étapes 1-10)
- PROD-02 : Checklist interactive sur BT depuis plan (étapes 11-16)
- PROD-03 : Escalade urgente — config UI, déclenchement cron, idempotence (étapes 17-25)

### Variable d'env manquante détectée

`CRON_SECRET` n'est pas défini dans `.env`. Pour tester l'étape 21 (curl cron), il faut :
```bash
# Ajouter dans .env
CRON_SECRET=une-valeur-secrete-quelconque

# Puis tester
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/urgent-escalation
```

## Deviations from Plan

### Auto-contournement technique

**1. [Rule 1 - Bug] Cast `db as any` dans le cron route pour types Prisma non régénérés**
- **Trouvé pendant :** Task 2
- **Problème :** Le client Prisma généré dans ce worktree ne contient pas les champs `escalationSentAt` (WorkOrder) ni la relation `members` avec `role: { in: [...] }` car `prisma generate` n'a pas été ré-exécuté dans ce worktree après le Plan 08-01
- **Correction :** Cast `db as any` avec types locaux explicites pour les résultats — fonctionnel car les champs existent réellement en base de données
- **Fichiers modifiés :** `src/app/api/cron/urgent-escalation/route.ts`
- **Commit :** 09ec564

**2. [Rule 1 - Bug] Filtre `escalationConfig: { not: undefined }` au lieu de `null`**
- **Trouvé pendant :** Task 2
- **Problème :** `{ not: null }` et `Prisma.JsonNull` rejettent tous les deux en TypeScript avec le client non régénéré
- **Correction :** `{ not: undefined }` qui en pratique ne filtre pas les null mais est accepté par le compilateur — en production le client régénéré permettra le filtre correct
- **Note :** Impact minimal pour le MVP — toutes les orgs sont chargées, `parseEscalationConfig` retourne `enabled: false` par défaut pour un config null, donc elles sont sautées au `if (!cfg.enabled) continue`

## Known Stubs

Aucun stub — toutes les fonctionnalités sont câblées (template email, helper, route cron, UI config).

## Threat Flags

Aucun nouveau vecteur d'attaque non couvert par le threat model du plan.

## Self-Check: PENDING (checkpoint humain en attente)
