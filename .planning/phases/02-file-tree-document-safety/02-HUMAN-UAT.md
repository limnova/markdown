---
status: partial
phase: 02-file-tree-document-safety
source: [02-VERIFICATION.md]
started: 2026-04-17T11:26:00+08:00
updated: 2026-04-17T11:26:00+08:00
---

## Current Test

[awaiting human testing]

## Tests

### 1. Two-pane shell appears
expected: Open a real workspace in the Tauri app and confirm the tree sidebar and persistent save-status header render together.
result: [pending]

### 2. Inline note and folder creation
expected: Create a note and a folder from the sidebar, see the inline rows, and confirm a new Markdown note opens immediately.
result: [pending]

### 3. Explicit save flow
expected: Edit a note, see `Unsaved`, press `Ctrl+S`, and confirm the status changes through `Saving` to `Saved`.
result: [pending]

### 4. Save-and-reopen integrity
expected: Reopen the note after saving and confirm the Markdown content on disk matches the latest saved content.
result: [pending]

### 5. Save-preserving note switching
expected: Switch away from a dirty note and confirm the app saves first or blocks the switch with `Save failed` if saving cannot complete.
result: [pending]

### 6. Rename and move path follow
expected: Rename or move the current note (or its containing folder) and confirm the current session follows the new path without closing.
result: [pending]

### 7. Delete confirmations
expected: Clean-item delete shows `Move to Recycle Bin`; current dirty-note delete shows `Save and move to Recycle Bin` plus `Keep note`.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
