---
phase: 4
slug: api-publique
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | API-01 | T-4-01 | SHA-256 hash stored, not raw key | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | API-01 | T-4-02 | Bearer token validated on every request | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | API-02 | — | Work orders returned scoped to org | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | API-02 | T-4-03 | POST creates WO only for authed org | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | API-03 | — | Swagger UI loads without auth | e2e | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 2 | API-04 | — | Key generate+revoke UI renders | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/api/api-key.test.ts` — stubs for API-01 key auth
- [ ] `src/__tests__/api/work-orders.test.ts` — stubs for API-02 endpoints
- [ ] `src/__tests__/api/swagger.test.ts` — stubs for API-03 docs
- [ ] `src/__tests__/api/api-key-ui.test.ts` — stubs for API-04 key management UI

*Wave 0 installs test stubs before implementation tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swagger UI renders correctly in browser | API-03 | Visual rendering check | Open /api/docs in browser, verify all endpoints documented |
| API key copy-to-clipboard on creation | API-04 | Clipboard API hard to automate | Create key in settings UI, verify secret shown once and copy works |
| External system integration e2e | API-01, API-02 | Requires real external caller | Use curl with generated key to create WO, verify in GMAO dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
