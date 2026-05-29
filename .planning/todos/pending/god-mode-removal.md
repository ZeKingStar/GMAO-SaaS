---
id: god-mode-removal
priority: critical
created: 2026-05-25
---

# Remove God Mode Before Public Launch

**MUST DO before going to production.**

## What to remove

1. `src/lib/auth.ts` — delete the `GOD_MODE` constant, `isGodMode()` export, and the conditional bypasses in `requireRole()` and `requirePlan()`
2. `.env` / `.env.local` — remove `ENABLE_GOD_MODE` line
3. `.env.example` — remove the commented god mode block

## How to verify it's gone

```bash
grep -r "GOD_MODE\|isGodMode\|ENABLE_GOD_MODE" src/ .env* && echo "STILL PRESENT" || echo "Clean"
```
