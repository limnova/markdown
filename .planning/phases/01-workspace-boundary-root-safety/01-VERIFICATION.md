---
phase: 01
status: human_needed
updated: 2026-04-17T10:06:00+08:00
requirements: [WORK-01, WORK-02, WORK-03, PERF-03]
---

# Phase 01 Verification

## Goal

Users can choose and reopen one trusted workspace root, and every file-facing action stays inside that boundary on Windows.

## Automated Checks

- `pnpm build` — passed
- `cargo check --manifest-path src-tauri/Cargo.toml` — blocked by Windows application control while executing `tauri-plugin-dialog` build script (`os error 4551`)

## Requirement Traceability

| Requirement | Status | Evidence |
|-------------|--------|----------|
| WORK-01 | Human verify | `workspace-client.ts`, `useWorkspaceController.ts`, `App.tsx` wire the choose-workspace flow through Tauri dialog + Rust command |
| WORK-02 | Human verify | `src-tauri/src/workspace.rs` canonicalizes roots and marks out-of-root resolutions as `external-link`; `WorkspaceOverview.tsx` renders them as muted informational rows |
| WORK-03 | Human verify | `useWorkspaceController.ts` restores `lastWorkspacePath` on startup and only persists on `ready` payloads |
| PERF-03 | Human verify | Rust-side boundary classification and controller state prevent stale or out-of-root results from replacing trusted workspace content |

## Verification Verdict

The implementation satisfies the planned code-level contract, but the phase cannot be marked complete automatically because native runtime validation is incomplete in this Windows environment. Human verification is required.

## Human Verification

1. Launch the Tauri app, choose a real local folder, and confirm the ready shell appears immediately with top-level entries rendered.
2. Restart the app and confirm the same workspace restores automatically without prompting again.
3. Modify the stored workspace so it points to a missing or inaccessible folder, relaunch, and confirm the invalid-workspace panel shows the broken path instead of silently clearing state.
4. Place a symlink or junction inside the workspace that resolves outside the root, relaunch, and confirm it appears as a muted `External link` row rather than actionable workspace content.

## Notes

- The active shell already reserves a banner region for future boundary rejection feedback.
- No automated regression suite exists yet for this repo; frontend verification currently relies on `pnpm build`.
