---
phase: 2
slug: feature-gating
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — Wave 0 installs vitest + React Testing Library |
| **Config file** | `vitest.config.ts` — Wave 0 creates |
| **Quick run command** | `vitest run src/lib/auth.test.ts` |
| **Full suite command** | `vitest run` |
| **Estimated runtime** | ~5 seconds (unit tests only) |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/lib/auth.test.ts` (fast unit — pure function)
- **After every plan wave:** Run `vitest run` (full suite)
- **Before `/gsd-verify-work`:** Full suite green + manual visual check of all three gated pages
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | Wave 0 | 0 | GATE-01 | T-02-03 | null subscription → starter | unit | `vitest run src/lib/auth.test.ts` | ❌ W0 | ⬜ pending |
| 02-W0-02 | Wave 0 | 0 | GATE-02 | — | N/A | unit | `vitest run src/components/upgrade-gate/upgrade-gate.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-01 | requirePlan | 1 | GATE-01 | T-02-03 | null sub → starter | unit | `vitest run src/lib/auth.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | requirePlan | 1 | GATE-01 | T-02-01 | server-side only gate | unit | `vitest run src/lib/auth.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | UpgradeGate | 2 | GATE-02 | — | blur renders server-side | unit | `vitest run src/components/upgrade-gate/upgrade-gate.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-01 | /rapports gate | 3 | GATE-01 | T-02-02 | stale plan re-read on render | manual | Visual check: starter org → /rapports shows banner | — | ⬜ pending |
| 02-03-02 | /inventaire gate | 3 | GATE-01 | T-02-02 | same | manual | Visual check: starter org → /inventaire shows banner | — | ⬜ pending |
| 02-03-03 | /actifs/scan gate | 3 | GATE-01 | T-02-02 | same | manual | Visual check: starter org → /actifs/scan shows banner | — | ⬜ pending |
| 02-04-01 | Dashboard widget | 4 | GATE-03 | — | N/A | manual | Visual check: sub widget visible on /dashboard | — | ⬜ pending |
| 02-05-01 | Sidebar locks | 5 | GATE-02 | — | N/A | manual | Visual check: 🔒 on Rapports/Inventaire for starter | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom` — installed in 02-00 Task 1
- [x] `vitest.config.ts` — created in 02-00 Task 1
- [x] `src/lib/auth.test.ts` — created in 02-00 Task 2 (RED state, 9 test cases)
- [x] `src/components/upgrade-gate/upgrade-gate.test.tsx` — created in 02-00 Task 2 (RED state, 6 test cases)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Banner shows on /rapports for starter | GATE-01/GATE-02 | Server Component render — no DOM test runner reaches it | Log in as starter org, navigate to /rapports, confirm amber banner visible |
| Banner shows on /inventaire for starter | GATE-01/GATE-02 | Same | Navigate to /inventaire as starter |
| Banner shows on /actifs/scan/test for starter | GATE-01/GATE-02 | Same | Navigate to /actifs/scan/test as starter |
| Growth org: full access to all three pages | GATE-01 | Auth state | Log in as growth org, confirm no banner |
| Dashboard widget shows plan + renewal date | GATE-03 | Visual component | Check /dashboard, widget visible with plan name and renewal date |
| Dashboard widget shows "Aucun abonnement actif" | GATE-03 | Requires seeded no-sub org | Seed org without subscription row, check /dashboard |
| Sidebar 🔒 visible for starter | GATE-02 | Visual | Starter org: confirm lock icon on Rapports and Inventaire nav items |

---

## Threat Model

| Threat | STRIDE | Mitigation | Automated? |
|--------|--------|------------|-----------|
| T-02-01: Client-side CSS bypass (removing blur) | Spoofing / EoP | Gate in Server Component — no writes exposed; read-only preview acceptable | Unit: server renders gated content |
| T-02-02: Stale plan data after webhook | EoP | Fresh DB read on every Server Component render; no client caching | Manual: verify no stale caching |
| T-02-03: Null subscription treated as paid | EoP | `requirePlan()` explicitly handles null → starter | Unit: null subscription test case |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
