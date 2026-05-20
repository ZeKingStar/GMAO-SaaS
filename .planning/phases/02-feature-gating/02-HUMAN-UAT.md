---
status: partial
phase: 02-feature-gating
source: [02-VERIFICATION.md]
started: 2026-05-20T19:16:00Z
updated: 2026-05-20T19:16:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Starter user on gated routes
expected: Amber upgrade banner + blurred content visible on /rapports, /inventaire, /actifs/scan/* for a starter-tier account
result: [pending]

### 2. Growth/enterprise user on gated routes
expected: No banner, full page content visible for growth/enterprise accounts
result: [pending]

### 3. Desktop sidebar lock icons
expected: Grey lock icon on Inventaire and Rapports nav items for starter user; lock absent for growth/enterprise
result: [pending]

### 4. Mobile sidebar lock icons
expected: Same lock icon behaviour as desktop when opened via hamburger menu (SidebarSheet)
result: [pending]

### 5. Dashboard subscription widget — all 4 states
expected: Null subscription shows "Aucun abonnement actif" + CTA; active shows plan name + green badge + renewal date; past_due shows yellow badge + billing update; canceled shows red badge + plan selector
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
