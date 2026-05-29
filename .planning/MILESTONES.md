# Milestones

## v1.0 Compétitivité et Données (Shipped: 2026-05-29)

**Phases completed:** 10 phases, 32 plans, 14 tasks

**Key accomplishments:**

- One-liner:
- One-liner:
- Landing page intégralement refondue en thème dark Korvia (navy #0F1C2E + accents ambre #E8830C) avec KorviaLogo variant white dans la navbar, copy contractuelle UI-SPEC au caractère près, et isolation du thème via wrapper `<div className="dark">`.
- One-liner:
- requirePlan() server helper + UpgradeGate RSC implementing subscription-tier access control with amber banner and blur preview
- Three pages gated with requirePlan()+UpgradeGate and sidebar updated with Lock icon for starter users, with userPlan threaded from async server layout through Header to SidebarSheet
- Dashboard subscription widget co-loading plan/status/renewal via nested Prisma select, rendering 4 states in Canadian French with billing portal action
- One-liner:
- One-liner:
- Vercel Cron Job running hourly that queries MaintenancePlan.nextDueAt in a 47-49h window and emails each org's admin members via Resend.
- Threshold-crossing detection in inventory server actions fires sendLowStockAlertEmail to org admins via read-before-write pattern — non-blocking, transition-only, null-guarded.
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- OverviewTab
- Requête Prisma (1 findMany → 3 vues) :
- One-liner:
- One-liner:
- One-liner:
- Correction du bubbling de submit qui fermait le dialog plan lors de l'ajout de pièces, et re-sync du state dialog à l'ouverture pour afficher immédiatement la section "Pièces requises"
- SparePartPickerDialog
- Tâche 1 — WorkOrderList
- Helper `updateMeterAndPlans`
- Helper `generateWorkOrderFromPlanInternal`

---
