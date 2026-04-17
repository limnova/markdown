---
status: partial
phase: 01-workspace-boundary-root-safety
source: [01-VERIFICATION.md]
started: 2026-04-17T10:07:00+08:00
updated: 2026-04-17T10:07:00+08:00
---

## Current Test

awaiting human testing

## Tests

### 1. Choose workspace folder
expected: Choosing a real local folder opens the ready workspace shell immediately and shows top-level entries from the selected root.
result: pending

### 2. Restore remembered workspace
expected: Restarting the app restores the previously accepted workspace root without prompting again.
result: pending

### 3. Invalid remembered workspace
expected: A missing or inaccessible remembered root shows the invalid-workspace panel and keeps the broken path visible for recovery.
result: pending

### 4. Out-of-root link classification
expected: A symlink or junction inside the root that resolves outside the workspace is shown as a muted `External link` row instead of trusted workspace content.
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
