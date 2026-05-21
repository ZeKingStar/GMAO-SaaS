---
status: partial
phase: 03-notifications-email
source: [03-VERIFICATION.md]
started: 2026-05-21T21:00:00Z
updated: 2026-05-21T21:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Work order assignment email delivery
expected: Create a work order with an assigned technician — French-language email arrives in inbox within 2 minutes with correct Korvia branding and content.
result: [pending]

### 2. Maintenance reminder cron (auth + delivery)
expected: GET /api/cron/maintenance-reminder returns 401 without Authorization header; returns 200 and delivers email to org admins when called with correct Bearer token and a maintenance plan in the 47–49h window.
result: [pending]

### 3. Low-stock alert fire-once behavior
expected: Decrement a spare part across its minimum threshold → exactly one email fires. Decrement again below threshold → no second email fires.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
