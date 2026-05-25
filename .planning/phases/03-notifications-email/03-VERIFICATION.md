---
phase: 03-notifications-email
verified: 2026-05-21T21:00:00Z
status: human_needed
score: 10/10 must-haves verified
human_verification:
  - test: "Send a real work order assignment email"
    expected: "Technician receives a French-language email with amber header band, work order number, title, priority, and due date (if set) within 2 minutes of assignment"
    why_human: "Requires live Resend API key, real database records, and a real email inbox to confirm delivery, formatting, and content in the actual email client"
  - test: "Trigger the maintenance reminder cron endpoint manually"
    expected: "GET /api/cron/maintenance-reminder with correct Authorization: Bearer header returns 200 JSON {ok:true, plansFound: N, emailsSent: N}; admin receives email; calling without the header returns 401"
    why_human: "Requires a deployed Vercel environment with CRON_SECRET set, live DB with a MaintenancePlan whose nextDueAt falls in the 47-49h window, and an email inbox to confirm receipt"
  - test: "Decrement a spare part below its minimum threshold"
    expected: "Org admin receives a low-stock alert email with part name, part number, current quantity, and minimum threshold — email fires once on the crossing event, not again on the next decrement"
    why_human: "Requires live Resend API, a real SparePart record with quantityMin set, and an email inbox to confirm the fire-once behavior across two consecutive adjustments"
---

# Phase 3: Notifications Email — Verification Report

**Phase Goal:** Deliver email notifications for key GMAO events — work order assignment, maintenance reminders, and low-stock alerts — using Resend as the provider.
**Verified:** 2026-05-21T21:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `sendWorkOrderAssignedEmail()` is callable from a Server Action and sends via Resend | VERIFIED | `src/lib/email.ts` exports the function; calls `resend.emails.send()` with rendered HTML; imported and called in `src/actions/work-orders.ts` at lines 7, 75, 169 |
| 2 | `sendMaintenanceReminderEmail()` is callable with plan name, asset name, due date, and admin emails | VERIFIED | Exported from `src/lib/email.ts` line 29; called in cron route at line 61 with correct params |
| 3 | `sendLowStockAlertEmail()` is callable with part name, part number, quantities, and admin emails | VERIFIED | Exported from `src/lib/email.ts` line 45; called in `src/actions/inventory.ts` at lines 104 and 143 |
| 4 | All emails render in French with Korvia amber (#E8830C) header band and Korvia name | VERIFIED | All three templates contain `lang="fr"`, `#E8830C` header `<td>` style, and "Korvia" brand span; no `className=` attributes (inline styles only) |
| 5 | RESEND_API_KEY and RESEND_FROM_EMAIL are documented in .env.example | VERIFIED | `.env.example` lines 2-3 contain both vars with placeholder values; CRON_SECRET also present at line 6 |
| 6 | Technician receives email when assigned to a work order (NOTIF-01) | VERIFIED | `createWorkOrder` dispatches via `Promise.allSettled` after DB commit (line 71); `assignMember` dispatches detached promise with `.catch` (line 169); both fire-and-forget with error logging |
| 7 | Email failures do not break work order creation | VERIFIED | `Promise.allSettled` + `.catch(err => console.error('[email] createWorkOrder notification failed:', err))` in `work-orders.ts`; email failure cannot propagate to caller |
| 8 | Maintenance reminder cron runs hourly, queries 47-49h window, emails org admins (NOTIF-02) | VERIFIED | `vercel.json` schedule `"0 * * * *"`; route queries `isActive: true`, `nextDueAt gte windowStart lte windowEnd` (47h/49h boundaries); filters `role: 'admin'` members |
| 9 | Cron route returns 401 if CRON_SECRET missing or wrong | VERIFIED | `route.ts` line 11: `return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })` before any DB query |
| 10 | Low-stock alert fires only on threshold crossing (above → at-or-below), not on every sub-threshold save (NOTIF-03) | VERIFIED | `updateSparePart`: `before.quantityOnHand >= effectiveMin && newQty < effectiveMin`; `adjustQuantity`: `before.quantityOnHand >= before.quantityMin && updated.quantityOnHand < before.quantityMin`; null-guarded (`effectiveMin !== null && effectiveMin > 0`) |

**Score: 10/10 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/email.ts` | Resend client + 3 send functions | VERIFIED | Exports `sendWorkOrderAssignedEmail`, `sendMaintenanceReminderEmail`, `sendLowStockAlertEmail`; `new Resend(process.env.RESEND_API_KEY)`; `renderToStaticMarkup` for all three |
| `src/emails/work-order-assigned.tsx` | HTML email template — bon de travail assigné | VERIFIED | Exports `WorkOrderAssignedEmail`; French content, `#E8830C` header, inline styles, `lang="fr"` |
| `src/emails/maintenance-reminder.tsx` | HTML email template — rappel maintenance préventive | VERIFIED | Exports `MaintenanceReminderEmail`; French content, `#E8830C` header, inline styles, `lang="fr"` |
| `src/emails/low-stock-alert.tsx` | HTML email template — alerte stock faible | VERIFIED | Exports `LowStockAlertEmail`; French content, `#E8830C` header + left border accent, inline styles, `lang="fr"` |
| `.env.example` | Documents RESEND_API_KEY and RESEND_FROM_EMAIL | VERIFIED | Both vars present with placeholder values; CRON_SECRET also documented |
| `src/app/api/cron/maintenance-reminder/route.ts` | Hourly cron GET handler | VERIFIED | `export async function GET`; 401 guard; 47h/49h window; admin filter; `sendMaintenanceReminderEmail` call; returns `{ok, plansFound, emailsSent}` |
| `vercel.json` | Cron schedule declaration | VERIFIED | Valid JSON; `"path": "/api/cron/maintenance-reminder"`, `"schedule": "0 * * * *"` |
| `src/actions/work-orders.ts` | Modified with email integration | VERIFIED | Import at line 7; `Promise.allSettled` in `createWorkOrder`; detached promise in `assignMember`; all 9 original exports preserved |
| `src/actions/inventory.ts` | Modified with threshold-crossing detection | VERIFIED | Import at line 6; `getOrgAdminEmails` helper; `sendLowStockAlertEmail` in `updateSparePart` and `adjustQuantity`; all 4 original exports preserved |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/email.ts` | resend npm package | `new Resend(process.env.RESEND_API_KEY)` | WIRED | Line 7: `const resend = new Resend(process.env.RESEND_API_KEY)` |
| `src/lib/email.ts` | `src/emails/*.tsx` | `renderToStaticMarkup()` | WIRED | Lines 20, 36, 53: all three templates rendered via `renderToStaticMarkup` before passing to `resend.emails.send()` |
| `src/actions/work-orders.ts (createWorkOrder)` | `src/lib/email.ts` | `Promise.allSettled` after `db.workOrder.create` | WIRED | Lines 71-88: `Promise.allSettled(assignees.filter(…).map(a => sendWorkOrderAssignedEmail(…).catch(…)))` |
| `src/actions/work-orders.ts (assignMember)` | `src/lib/email.ts` | after `db.workOrderAssignee.upsert` | WIRED | Lines 168-177: `sendWorkOrderAssignedEmail({…}).catch(err => console.error(…))` |
| `vercel.json cron schedule` | `src/app/api/cron/maintenance-reminder/route.ts` | Vercel Cron GET with Authorization header | WIRED | `"path": "/api/cron/maintenance-reminder"` matches route file path |
| `route.ts` | Prisma `MaintenancePlan` | `db.maintenancePlan.findMany where nextDueAt gte/lte` | WIRED | Lines 18-21: `isActive: true`, `nextDueAt: { gte: windowStart, lte: windowEnd }` |
| `src/actions/inventory.ts (updateSparePart)` | `src/lib/email.ts` | read-before-write threshold crossing | WIRED | Lines 67-113: reads `before`, updates DB, then checks `before.quantityOnHand >= effectiveMin && newQty < effectiveMin` before calling `sendLowStockAlertEmail` |
| `src/actions/inventory.ts (adjustQuantity)` | `src/lib/email.ts` | read-before-write threshold crossing | WIRED | Lines 119-153: reads `before`, increments with `select: { quantityOnHand: true }`, checks crossing, calls `sendLowStockAlertEmail` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/lib/email.ts → sendWorkOrderAssignedEmail` | `params` (to, recipientName, workOrderNumber…) | Caller (`work-orders.ts`) reads from DB: `workOrderAssignee.findMany` + membership include | Yes — DB-sourced member email and work order fields | FLOWING |
| `src/lib/email.ts → sendMaintenanceReminderEmail` | `params` (to[], planName, assetName, nextDueAt…) | `cron/route.ts` reads from `maintenancePlan.findMany` with org + asset include | Yes — DB-sourced plan data, admin emails from membership | FLOWING |
| `src/lib/email.ts → sendLowStockAlertEmail` | `params` (to[], partName, quantityOnHand, quantityMin…) | `inventory.ts` reads from `sparePart.findUnique` (before read) and `getOrgAdminEmails` | Yes — DB-sourced part state and admin emails | FLOWING |
| `src/emails/work-order-assigned.tsx` | `recipientName, workOrderNumber, workOrderTitle…` | Props from `sendWorkOrderAssignedEmail` | Yes — all props from DB queries in caller | FLOWING |
| `src/emails/maintenance-reminder.tsx` | `planName, assetName, nextDueAt, organizationName` | Props from `sendMaintenanceReminderEmail` | Yes — all props from DB queries in cron route | FLOWING |
| `src/emails/low-stock-alert.tsx` | `partName, partNumber, quantityOnHand, quantityMin` | Props from `sendLowStockAlertEmail` | Yes — all props from DB read-before-write in inventory actions | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `email.ts` exports 3 send functions | `node -e` content scan | All 3 `export async function send*` found | PASS |
| Templates contain branding | `grep E8830C *.tsx` | All 3 templates matched | PASS |
| `vercel.json` is valid JSON | File read and structure check | `{"crons":[{"path":…,"schedule":"0 * * * *"}]}` | PASS |
| Cron route returns 401 on bad auth | Code inspection | `status: 401` before any DB query when `authHeader !== Bearer ${CRON_SECRET}` | PASS |
| Transition detection in inventory | Code inspection | `before.quantityOnHand >= effectiveMin && newQty < effectiveMin` (updateSparePart); `before.quantityOnHand >= before.quantityMin && updated.quantityOnHand < before.quantityMin` (adjustQuantity) | PASS |
| All original exports preserved | `grep "^export async function"` | work-orders.ts: 9 exports; inventory.ts: 4 exports — all original functions intact | PASS |
| Commits documented in summaries exist | `git log --oneline` | 2045032, 959e8bb (03-01), cb4e838 (03-02), 7fb0e07 (03-03), a94fe73 (03-04) all present | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NOTIF-01 | 03-01, 03-02 | Email sent to assigned technician on work order creation/assignment | SATISFIED | `sendWorkOrderAssignedEmail` wired in `createWorkOrder` (Promise.allSettled) and `assignMember` (detached promise); fire-and-forget with error logging |
| NOTIF-02 | 03-01, 03-03 | Reminder email sent 48h before preventive maintenance due | SATISFIED | Cron route queries `nextDueAt` in 47-49h window hourly; emails org admins via `sendMaintenanceReminderEmail`; vercel.json declares `0 * * * *` schedule |
| NOTIF-03 | 03-01, 03-04 | Admin receives email when stock level drops below threshold | SATISFIED | Threshold-crossing detection in both `updateSparePart` and `adjustQuantity`; null-guarded; transition-only (not re-fire); `getOrgAdminEmails` queries admin-role memberships |

All 3 requirements mapped to Phase 3 in REQUIREMENTS.md are satisfied. No orphaned requirements detected.

---

### Anti-Patterns Found

No anti-patterns found in phase files. Scanned: `src/lib/email.ts`, `src/emails/*.tsx`, `src/actions/work-orders.ts`, `src/actions/inventory.ts`, `src/app/api/cron/maintenance-reminder/route.ts`.

- No TODO/FIXME/HACK comments
- No placeholder text or stub returns
- No hardcoded empty arrays/objects in rendering paths
- No `className=` attributes in email templates (inline styles only, as required for email clients)

---

### Human Verification Required

The following behaviors require a live environment with real credentials to confirm. All automated checks passed; these are final integration validations.

#### 1. Work Order Assignment Email Delivery

**Test:** Create a work order and assign it to a technician with a real email address (or use `assignMember` post-creation). Observe the technician's inbox within 2 minutes.
**Expected:** Technician receives a French-language email with the subject `[Korvia] Bon de travail #N — titre`, amber (#E8830C) header band with "Korvia" name, greeting "Bonjour {name}," work order number/title/priority, and due date if set.
**Why human:** Requires live `RESEND_API_KEY`, live database, and a real email inbox. Email rendering in mail clients (Gmail, Outlook) can differ from HTML source and cannot be verified statically.

#### 2. Maintenance Reminder Cron — Auth and Delivery

**Test A (auth):** Call `GET /api/cron/maintenance-reminder` without the `Authorization` header. Confirm HTTP 401 response.
**Test B (delivery):** Set a `MaintenancePlan.nextDueAt` to now+48h, then trigger the cron route with `Authorization: Bearer {CRON_SECRET}`. Confirm the org's admin members receive a French reminder email.
**Expected:** 401 without header; 200 JSON `{ok:true, plansFound:1, emailsSent:1}` with header; admin inbox shows the reminder email.
**Why human:** Requires deployed Vercel environment with `CRON_SECRET` env var, a live DB record in the exact time window, and an email inbox.

#### 3. Low-Stock Alert — Threshold-Crossing, Fire-Once Behavior

**Test:** Set a SparePart with `quantityOnHand: 10, quantityMin: 5`. Call `adjustQuantity(id, -6)` (crosses below threshold to 4). Check admin inbox. Then call `adjustQuantity(id, -1)` again (already below threshold, now 3). Confirm no second email.
**Expected:** First decrement triggers one email to org admins with part name, part number, current quantity (4), minimum threshold (5). Second decrement produces no email.
**Why human:** Requires live Resend API and a real email inbox to confirm the fire-once behavior. The transition logic is code-verified, but the actual send and the absence of a second send can only be confirmed end-to-end.

---

### Gaps Summary

No gaps found. All 10 observable truths verified, all artifacts exist and are substantive, all key links are wired, all data flows traced to real DB queries, and all 3 requirements (NOTIF-01, NOTIF-02, NOTIF-03) are satisfied.

The `human_needed` status reflects 3 items that require a live deployment with real credentials to fully confirm end-to-end email delivery and behavioral correctness. These are integration tests, not code deficiencies.

---

_Verified: 2026-05-21T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
