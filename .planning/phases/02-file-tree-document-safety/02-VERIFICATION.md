---
phase: 02
status: human_needed
updated: 2026-04-17T11:26:00+08:00
requirements: [FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, FILE-06, EDIT-05, EDIT-06, PERF-02]
---

# Phase 02 Verification

## Goal

Users can browse, create, reorganize, and save Markdown documents inside the workspace without losing work.

## Automated Checks

- `pnpm build` — passed
- `cargo test --manifest-path src-tauri/Cargo.toml` — passed
- `cargo test --manifest-path src-tauri/Cargo.toml workspace` — passed
- `cargo check --manifest-path src-tauri/Cargo.toml` — blocked by Windows application control while executing the `tauri-plugin-dialog` build script (`os error 4551`)

## Requirement Traceability

| Requirement | Status | Evidence |
|-------------|--------|----------|
| FILE-01 | Human verify | `WorkspaceTree.tsx`, `WorkspaceTreeRow.tsx`, and `useWorkspaceController.ts` render and hydrate a recursive workspace tree from `list_workspace_tree` |
| FILE-02 | Human verify | `useWorkspaceTreeController.ts` calls `createWorkspaceItem(..., "markdown")` and opens the new note via `beforeSelectPath` |
| FILE-03 | Human verify | `useWorkspaceTreeController.ts` exposes inline folder creation through `createWorkspaceItem(..., "directory")` |
| FILE-04 | Human verify | `rename_workspace_item` returns authoritative result paths, and `followCurrentDocumentPath` keeps the current note attached after rename |
| FILE-05 | Human verify | `move_workspace_item` plus valid-only drag/drop affordances route moves through native wrappers and keep the current note attached |
| FILE-06 | Human verify | `WorkspaceConfirmDialog.tsx` adds explicit recycle-bin confirmation before delete actions |
| EDIT-05 | Human verify | `useDocumentSession.ts` handles `Ctrl+S` through the native `saveDocument` wrapper and keeps save state visible |
| EDIT-06 | Human verify | `attemptSaveBefore`, `beforeSelectPath`, and `deleteCurrentDocument` block risky transitions when save fails and preserve the current note |
| PERF-02 | Automated + human verify | `documents.rs` uses temp/backup swap saves and native tests prove save-reopen integrity; runtime reopen behavior still needs manual confirmation in the Tauri shell |

## Verification Verdict

The code-level contract for Phase 2 is in place and the native tests that exist for save and path safety pass. The phase still requires human verification because the desktop runtime behaviors (`Ctrl+S`, drag/drop feel, delete confirmations, and note-switch blocking on save failure) have not been exercised in the Tauri shell from this session, and `cargo check` remains environment-blocked rather than code-blocked.

## Human Verification

1. Launch the Tauri app, open a real workspace, and confirm the two-pane shell appears with the tree in the sidebar and the persistent save-status area in the document header.
2. Create a new note and a new folder from the sidebar, confirm the inline rows appear in place, and verify the new note opens immediately in the document pane.
3. Type into a Markdown note, confirm the status changes to `Unsaved`, press `Ctrl+S`, and confirm the status moves through `Saving` to `Saved`.
4. Reopen the saved note and confirm the Markdown content on disk is intact.
5. Switch to another note while the current note is dirty and confirm the app saves first or blocks the transition with `Save failed` if saving cannot complete.
6. Rename and move the current note (or a containing folder) and confirm the document session follows the new path without closing.
7. Delete a clean item and confirm the explicit `Move to Recycle Bin` dialog appears before the action runs.
8. Delete the current dirty note and confirm the primary action is `Save and move to Recycle Bin`, with `Keep note` as the non-destructive alternative.

## Notes

- Phase 1 still has pending human verification, so Phase 2 should not be treated as product-complete until both phases' runtime checks are closed.
- The repo still has no frontend automated test harness, so React behavior is verified through build checks plus manual runtime confirmation.
