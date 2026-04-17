---
phase: 01
slug: workspace-boundary-root-safety
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-17
---

# Phase 01 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none - compiler/build checks plus targeted manual desktop verification |
| **Config file** | none |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && cargo check --manifest-path src-tauri/Cargo.toml` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build && cargo check --manifest-path src-tauri/Cargo.toml`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | WORK-03 | T-01-01 / T-01-02 | Only dialog/store plugins and explicit workspace commands are exposed to the main window | build | `pnpm build && cargo check --manifest-path src-tauri/Cargo.toml` | yes | pending |
| 01-01-02 | 01 | 1 | WORK-02 | T-01-01 / T-01-03 | Rust canonicalization and root snapshot logic reject out-of-root resolution before the UI renders it | build + grep | `cargo check --manifest-path src-tauri/Cargo.toml` and `rg -n "canonicalize|starts_with|external-link" src-tauri/src/workspace.rs` | yes | pending |
| 01-02-01 | 02 | 1 | WORK-01 | -- | Welcome, invalid, and active-shell components render the exact Phase 1 copy contract | build + grep | `pnpm build` and `rg -n "Choose workspace folder|Open one workspace folder|This workspace is no longer available" src` | yes | pending |
| 01-02-02 | 02 | 1 | WORK-02 | T-02-01 | External-link rows and boundary banners are visually non-destructive and non-interactive | build + grep | `pnpm build` and `rg -n "external-link|outside the current workspace" src` | yes | pending |
| 01-03-01 | 03 | 2 | WORK-01 / WORK-03 | T-03-01 | Successful workspace selection persists only after backend validation and restore loads on startup | build + grep | `pnpm build` and `rg -n "LazyStore|load_workspace|lastWorkspacePath" src` | yes | pending |
| 01-03-02 | 03 | 2 | WORK-02 / PERF-03 | T-03-02 / T-03-03 | Invalid remembered roots stay blocked, current shell stays intact on rejection, and out-of-root attempts surface inline feedback | build + grep | `pnpm build` and `rg -n "workspace invalid|boundary banner|outside the current workspace" src` | yes | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- None - existing TypeScript, Vite, and Cargo build commands are sufficient for this phase's execution feedback loop.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Choose a workspace directory through the desktop UI | WORK-01 | Native folder picker behavior cannot be proven by grep alone | Run the Tauri app, click `Choose workspace folder`, pick a real folder, and confirm the active shell shows the selected path. |
| Restore the last workspace root after relaunch | WORK-03 | Requires desktop restart behavior and persisted state | Close and reopen the app after a successful selection; confirm the previous workspace appears without a confirmation prompt. |
| Show blocked invalid-workspace state when the remembered root is missing | WORK-03 | Requires manipulating a real folder between launches | Select a workspace, close the app, rename or remove the folder on disk, relaunch, and confirm the blocked invalid state shows the broken path and a reselect CTA. |
| Keep out-of-root or external-link content non-interactive | WORK-02 / PERF-03 | Needs visual confirmation that informational rows do not behave like workspace content | Use a workspace containing a junction/symlink or a `.lnk` file that points elsewhere; confirm the row is informational only and does not open or expand. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or explicit manual-only coverage
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 dependencies are satisfied by existing build tooling
- [x] No watch-mode flags are required
- [x] Feedback latency stays under 30 seconds for automated checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
