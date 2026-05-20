---
phase: 02-feature-gating
verified: 2026-05-20T19:18:00Z
status: human_needed
score: 12/12 must-haves verified
gaps: []
human_verification:
  - test: "Starter user visits /rapports — verify amber banner + blurred content renders"
    expected: "Amber banner 'Passez au plan Croissance pour accéder à cette fonctionnalité' visible; 'Voir les plans' button present; page content blurred behind it"
    why_human: "Server Component rendering with live Clerk session + Prisma subscription read cannot be unit-tested — requires a browser with a real starter-tier org session"
  - test: "Starter user visits /inventaire — verify amber banner + blurred content renders"
    expected: "Same amber banner + blur pattern as /rapports"
    why_human: "Same as above — requires live session"
  - test: "Starter user visits /actifs/scan/[qrCode] — verify amber banner + blurred content renders"
    expected: "Amber banner visible; scanned asset data blurred below; cross-org QR returns 404"
    why_human: "Requires live session + valid QR code in DB"
  - test: "Growth/enterprise user visits all three gated pages — verify no banner, full content"
    expected: "No amber banner, no blur; full page content rendered normally"
    why_human: "Requires a live growth- or enterprise-tier org session"
  - test: "Desktop sidebar shows Lock icon on Inventaire and Rapports for starter user"
    expected: "Small grey lock (h-3 w-3) visible to the right of 'Inventaire' and 'Rapports' nav items; absent for growth/enterprise users; nav items remain clickable"
    why_human: "Visual rendering + client-side React with usePathname — requires browser"
  - test: "Mobile sidebar (hamburger) shows Lock icons on Inventaire and Rapports for starter user"
    expected: "Same lock icons as desktop sidebar after opening hamburger menu"
    why_human: "Mobile viewport + Sheet component interaction — requires browser"
  - test: "Dashboard subscription widget renders correctly for all 4 states"
    expected: "With null sub: 'Aucun abonnement actif' + 'Choisir un plan'; with active growth: 'Plan Croissance' + green 'Actif' badge + renewal date; with past_due: yellow warning + billing button; with canceled: red 'Annulé' + 'Choisir un plan'"
    why_human: "Widget renders server-side from live DB subscription record — requires accounts in each state or DB seeding"
---

# Phase 2: Feature Gating Verification Report

**Phase Goal:** Implement subscription-based feature gating so starter-tier users are blocked from gated features (rapports, inventaire, actifs/scan) with an upgrade prompt, while growth/enterprise users access them freely.
**Verified:** 2026-05-20T19:18:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | requirePlan(['growth','enterprise']) returns hasAccess: false for starter plan | VERIFIED | auth.ts line 29-46; 9 passing unit tests |
| 2 | requirePlan() returns hasAccess: false for null subscription (degrades to starter) | VERIFIED | auth.ts line 36-38; null-sub test passing |
| 3 | requirePlan() returns hasAccess: false for past_due/canceled/unpaid status | VERIFIED | ACTIVE_STATUSES = ['active','trialing']; 3 degradation tests passing |
| 4 | requirePlan() returns hasAccess: true for growth/enterprise with active/trialing status | VERIFIED | auth.ts hasAccess logic; 3 access tests passing |
| 5 | requirePlan() throws Unauthorized for unauthenticated user (null membership) | VERIFIED | auth.ts line 31; unauthenticated test passing |
| 6 | UpgradeGate renders amber banner + 'Voir les plans' CTA when hasAccess is false | VERIFIED | upgrade-gate.tsx confirmed; 5/6 RTL tests passing |
| 7 | UpgradeGate wraps children in blur-sm pointer-events-none select-none | VERIFIED | upgrade-gate.tsx line 34; RTL blur-sm test passing |
| 8 | UpgradeGate renders children directly when hasAccess is true | VERIFIED | upgrade-gate.tsx line 11; RTL pass-through test passing |
| 9 | /rapports calls requirePlan() and wraps content in UpgradeGate | VERIFIED | rapports/page.tsx lines 2,3,45,142; no double org lookup |
| 10 | /inventaire calls requirePlan() and wraps content in UpgradeGate | VERIFIED | inventaire/page.tsx lines 1,2,7,15; no double org lookup |
| 11 | /actifs/scan/[qrCode] calls requirePlan() and wraps content in UpgradeGate | VERIFIED | scan/page.tsx lines 1,2,14,37; cross-org isolation via internal id line 34 |
| 12 | Sidebar shows Lock icon for starter users on /inventaire and /rapports nav items | VERIFIED | sidebar.tsx lines 31,61-66; GATED_HREFS set; aria-label confirmed |
| 13 | SidebarSheet shows Lock icon for starter users on gated nav items | VERIFIED | sidebar-sheet.tsx lines 22,58-63; same GATED_HREFS pattern |
| 14 | AppLayout fetches plan server-side and passes userPlan to Sidebar and Header | VERIFIED | layout.tsx lines 3,8,12-15,19,21 |
| 15 | Dashboard shows subscription widget with plan name, status badge, renewal date | VERIFIED | dashboard/page.tsx lines 276-376; all 4 states implemented |
| 16 | Widget uses PLAN_NAMES and STATUS_LABELS constants | VERIFIED | dashboard/page.tsx lines 33-45 |
| 17 | Widget co-loads subscription via nested Prisma select (zero extra DB round-trips) | VERIFIED | dashboard/page.tsx lines 62-71; subscription nested in org query |

**Score:** 17/17 truths VERIFIED (automated)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vitest.config.ts` | vitest config with jsdom, @/ alias, src/**/*.test glob | VERIFIED | jsdom environment confirmed in 02-00-SUMMARY |
| `src/lib/auth.ts` | exports requirePlan() with effectivePlan derivation | VERIFIED | Lines 27-46; ACTIVE_STATUSES, effectivePlan, hasAccess all present |
| `src/components/upgrade-gate/upgrade-gate.tsx` | UpgradeGate RSC with amber banner + blur | VERIFIED | 40 lines; no "use client"; border-amber-300, blur-sm, aria-hidden="true", href="/parametres/organisation" |
| `src/lib/auth.test.ts` | 9 unit tests for requirePlan() — GREEN | VERIFIED | 9/9 passing |
| `src/components/upgrade-gate/upgrade-gate.test.tsx` | 6 RTL tests for UpgradeGate — GREEN | VERIFIED | 6/6 passing |
| `src/app/(app)/rapports/page.tsx` | calls requirePlan(); wraps in UpgradeGate | VERIFIED | Lines 2,3,45,142; no db.organization.findUnique |
| `src/app/(app)/inventaire/page.tsx` | calls requirePlan(); wraps in UpgradeGate | VERIFIED | Lines 1,2,7,15; uses membership.organization.id |
| `src/app/(app)/actifs/scan/[qrCode]/page.tsx` | calls requirePlan(); wraps in UpgradeGate; cross-org isolation | VERIFIED | Lines 1,2,14,34,37; asset.organization.id === membership.organization.id |
| `src/components/layout/sidebar.tsx` | userPlan prop, GATED_HREFS, Lock icon with aria-label | VERIFIED | Lines 31-66 |
| `src/components/layout/sidebar-sheet.tsx` | userPlan prop, GATED_HREFS, Lock icon with aria-label | VERIFIED | Lines 22-63 |
| `src/app/(app)/layout.tsx` | async Server Component; getOrganizationMembership; passes userPlan | VERIFIED | Lines 3,7,8,12-15,19,21 |
| `src/app/(app)/dashboard/page.tsx` | subscription widget; PLAN_NAMES; STATUS_LABELS; formatRenewalDate | VERIFIED | Lines 33-53, 276-376 |
| `src/actions/billing.ts` | createBillingPortalSession() returns { url } | VERIFIED | Lines 73-91; queries Stripe customer; returns portal URL |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/lib/auth.ts requirePlan() | getOrganizationMembership() | direct internal call | WIRED | line 30: `const membership = await getOrganizationMembership()` |
| src/components/upgrade-gate/upgrade-gate.tsx | /parametres/organisation | Next.js Link CTA | WIRED | line 25-31: `href="/parametres/organisation"` |
| src/app/(app)/layout.tsx | sidebar.tsx | userPlan prop | WIRED | line 19: `<Sidebar userPlan={effectivePlan} />` |
| src/app/(app)/layout.tsx | header.tsx | userPlan prop | WIRED | line 21: `<Header userPlan={effectivePlan} />` |
| src/components/layout/header.tsx | sidebar-sheet.tsx | userPlan prop threading | WIRED | header.tsx threads userPlan to SidebarSheet per SUMMARY |
| src/app/(app)/rapports/page.tsx | upgrade-gate/upgrade-gate.tsx | UpgradeGate wrapper | WIRED | line 142: `<UpgradeGate hasAccess={hasAccess} requiredPlan="growth">` |
| src/app/(app)/inventaire/page.tsx | upgrade-gate/upgrade-gate.tsx | UpgradeGate wrapper | WIRED | line 15: `<UpgradeGate hasAccess={hasAccess} requiredPlan="growth">` |
| src/app/(app)/actifs/scan/[qrCode]/page.tsx | upgrade-gate/upgrade-gate.tsx | UpgradeGate wrapper | WIRED | line 37: `<UpgradeGate hasAccess={hasAccess} requiredPlan="growth">` |
| src/app/(app)/dashboard/page.tsx | db.organization subscription | nested Prisma select | WIRED | lines 62-71: subscription nested in org findUnique select |
| dashboard billing portal CTA | createBillingPortalSession | inline 'use server' form action | WIRED | lines 332-338: async inline server action wrapping createBillingPortalSession() + redirect(url) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| rapports/page.tsx | workOrdersByStatus, spareParts, etc. | db.workOrder.groupBy, db.sparePart.findMany (lines 62-106) | Yes — live Prisma queries scoped to orgId | FLOWING |
| inventaire/page.tsx | parts | db.sparePart.findMany (line 9) | Yes — live Prisma query | FLOWING |
| actifs/scan/[qrCode]/page.tsx | asset | db.asset.findUnique (line 18) | Yes — live Prisma query | FLOWING |
| dashboard/page.tsx | subscription | org.subscription nested select (lines 59-72) | Yes — co-loaded with org query | FLOWING |
| sidebar.tsx | userPlan | layout.tsx getOrganizationMembership → effectivePlan derivation | Yes — live DB read on every navigation | FLOWING |
| upgrade-gate.tsx | hasAccess | requirePlan() return value from caller | Yes — derived from live subscription in auth.ts | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| vitest finds both test files and runs all 15 tests | `npx vitest run --reporter=verbose` | 2 passed, 15 passed | PASS |
| No double org lookup in gated pages | `grep -c "db.organization.findUnique" rapports inventaire scan` | 0 matches | PASS |
| UpgradeGate has no "use client" | `grep -c '"use client"' upgrade-gate.tsx` | 0 | PASS |
| No TODO/FIXME anti-patterns in modified files | grep across all 9 modified files | 0 matches | PASS |
| requirePlan exported from auth.ts | present at line 29 | confirmed | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| GATE-01 | 02-00, 02-01, 02-02 | Les fonctionnalités avancées (rapports, API) sont bloquées pour le tier Démarrage | SATISFIED | requirePlan() blocks starter-tier; rapports, inventaire, scan all gated |
| GATE-02 | 02-00, 02-01, 02-02 | Un message clair invite à upgrader quand une feature gated est tentée | SATISFIED | UpgradeGate renders amber banner "Passez au plan Croissance" + "Voir les plans" CTA |
| GATE-03 | 02-03 | Le dashboard affiche le tier actif et la date de renouvellement | SATISFIED | Dashboard widget present with PLAN_NAMES, STATUS_LABELS, formatRenewalDate, all 4 states |

No orphaned requirements — all 3 GATE-* IDs are claimed by plans and verified above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| dashboard/page.tsx | 56-57 | Still uses `auth()` + `redirect('/sign-in')` at top (pre-existing pattern, not replaced by requirePlan) | Info | Dashboard is not a gated feature — retaining direct auth() is intentional per D-07. Not a blocker. |

No stub indicators, hardcoded empty returns, or placeholder text found in any phase-modified file.

### Human Verification Required

The automated layer is fully green (15/15 tests, all artifacts wired, data flows confirmed). The following require a browser session with real Clerk/Stripe data:

#### 1. Starter User — Gated Pages Show Amber Banner

**Test:** Log in as an org with a starter-tier active subscription (or no subscription). Visit /rapports, /inventaire, and /actifs/scan/[any-valid-qrcode].
**Expected:** Each page displays the amber banner "Passez au plan Croissance pour accéder à cette fonctionnalité" with a "Voir les plans" link; page content is visible but blurred behind the banner. Clicking "Voir les plans" navigates to /parametres/organisation.
**Why human:** Server Component rendering with live Clerk session + Prisma subscription cannot be exercised by vitest.

#### 2. Growth/Enterprise User — Gates Open

**Test:** Log in as an org with an active growth or enterprise subscription. Visit /rapports, /inventaire, and a scan URL.
**Expected:** No amber banner, no blurred content. Full page content renders normally.
**Why human:** Requires a live paid-tier Clerk org session.

#### 3. Desktop Sidebar Lock Icons — Starter vs Growth

**Test:** As a starter user, observe the desktop left sidebar.
**Expected:** A small grey lock icon (h-3 w-3) appears to the right of "Inventaire" and "Rapports" nav items. The icons are absent for growth/enterprise users. Clicking locked nav items navigates normally (no disabled state).
**Why human:** Client-side React rendering with usePathname + visual confirmation needed.

#### 4. Mobile Sidebar (SidebarSheet) Lock Icons

**Test:** As a starter user on mobile viewport, open the hamburger menu.
**Expected:** Same lock icons on Inventaire and Rapports items within the Sheet component.
**Why human:** Requires mobile viewport + Sheet open interaction.

#### 5. Dashboard Subscription Widget — All 4 States

**Test:** Visit /dashboard with accounts covering each state: (a) null subscription, (b) active growth, (c) past_due, (d) canceled.
**Expected:** (a) "Aucun abonnement actif" + "Débloquez les rapports, l'inventaire et le scan QR." + "Choisir un plan"; (b) "Plan Croissance" + green "Actif" badge + renewal date in French (e.g. "19 juin 2026") + "Gérer l'abonnement"; (c) plan name + yellow "Paiement en retard" badge + "Mettre à jour la facturation" button that opens Stripe portal; (d) red "Annulé" badge + "Choisir un plan".
**Why human:** Widget renders from live DB subscription record — requires accounts in each billing state or direct DB manipulation.

### Gaps Summary

No automated gaps found. All 17 truths verified, all 13 artifacts substantive and wired, all 3 key links from ROADMAP success criteria satisfied, 15/15 tests green, no anti-pattern blockers.

Status is `human_needed` because 5 visual/behavioral checks require a live browser session. These are not gaps in the implementation — they are confirmation steps that cannot be automated due to Clerk session + Stripe subscription dependencies.

---

_Verified: 2026-05-20T19:18:00Z_
_Verifier: Claude (gsd-verifier)_
