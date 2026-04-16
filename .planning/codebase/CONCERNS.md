# Codebase Concerns

**Analysis Date:** 2026-04-16

## Tech Debt

**Starter Template Instead Of Product Shell:**
- Issue: The app implementation is the stock Tauri greeting demo rather than the editor architecture described in `docs/typora-like-editor-plan.md`.
- Files: `src/App.tsx`, `src/App.css`, `src/main.tsx`, `src-tauri/src/lib.rs`, `docs/typora-like-editor-plan.md`
- Impact: Product work starts from a throwaway scaffold. Planned modules such as workspace, file tree, editor, theme, and settings do not exist, so every feature phase begins with structural replacement instead of incremental extension.
- Fix approach: Replace the demo `greet` flow with a real app shell and introduce the planned module boundaries under `src/` before adding product features.

**Missing Engineering Guardrails:**
- Issue: `package.json` defines only `dev`, `build`, `preview`, and `tauri` scripts. No lint, format, test, or typecheck-only workflow is exposed, and no `eslint.config.*`, `.eslintrc*`, `.prettierrc*`, `vitest.config.*`, or `jest.config.*` files are detected at the repo root.
- Files: `package.json`
- Impact: Regressions, style drift, and dead code are caught only during manual review or full builds. Developer feedback loops are weaker than they need to be for a desktop app that spans TypeScript and Rust.
- Fix approach: Add explicit linting, formatting, and test commands to `package.json`, then introduce matching config files and CI checks.

**Build Artifacts Mixed Into The Workspace:**
- Issue: `src-tauri/target/` exists inside the project tree and `.gitignore` does not ignore `src-tauri/target`. The directory contains 446 files and about 117850716 bytes in the current workspace.
- Files: `.gitignore`, `src-tauri/target/`
- Impact: Repository scans, backups, and agent exploration are noisier and slower than necessary. If the directory is ever committed outside this workspace copy, repo size and review quality degrade immediately.
- Fix approach: Ignore `src-tauri/target` in `.gitignore` and keep generated Rust build output out of source-control-facing workflows.

## Known Bugs

**Frontend Command Failure Has No Recovery Path:**
- Symptoms: The UI awaits `invoke("greet", { name })` directly and updates state only on success. Any rejected command call surfaces as an unhandled promise rejection with no user-facing error state.
- Files: `src/App.tsx`, `src-tauri/src/lib.rs`
- Trigger: Rename or remove the `greet` command in `src-tauri/src/lib.rs`, or make the backend command fail.
- Workaround: Reload the app after fixing the backend error; the current UI provides no retry or error message mechanism.

## Security Considerations

**Desktop CSP Disabled:**
- Risk: Tauri window security explicitly sets `"csp": null`, so the webview runs without a defined Content Security Policy.
- Files: `src-tauri/tauri.conf.json`
- Current mitigation: Tauri capabilities are limited to `core:default` and `opener:default` in `src-tauri/capabilities/default.json`.
- Recommendations: Define a real CSP before adding richer UI, third-party content, or markdown rendering. Keep the policy aligned with the exact assets and IPC paths the app needs.

**Permission Model Is Ready For Broader Access Than The Product Uses:**
- Risk: The app initializes `tauri_plugin_opener` and grants `opener:default`, while the UI only exposes static documentation links.
- Files: `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `src/App.tsx`
- Current mitigation: Only one plugin is enabled and there are no custom filesystem commands.
- Recommendations: Narrow permissions to the smallest allowed opener capability once real app flows are defined, especially before adding user-controlled URLs or file paths.

## Performance Bottlenecks

**Workspace Noise From Generated Rust Output:**
- Problem: Tooling that recursively scans the repo must traverse `src-tauri/target/` unless it is explicitly excluded.
- Files: `src-tauri/target/`, `.gitignore`
- Cause: Generated build artifacts live under the project root and are not ignored at the repo level.
- Improvement path: Exclude `src-tauri/target/` from source-control and code-search workflows, and keep analysis focused on `src/`, `src-tauri/src/`, and config files.

## Fragile Areas

**Single-Component Frontend Architecture:**
- Files: `src/App.tsx`, `src/main.tsx`
- Why fragile: All frontend behavior lives in one component with local state and inline async side effects. Adding workspace state, editor state, keyboard shortcuts, and persistence on top of this shape will force broad rewrites.
- Safe modification: Introduce feature-level modules before shipping product behavior. Keep IPC calls and state transitions out of the root render component.
- Test coverage: No project tests are detected for `src/`.

**Process-Level Failure Handling In Rust Entrypoint:**
- Files: `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`
- Why fragile: `run()` terminates with `.expect("error while running tauri application")`. Startup failures crash the process without structured logging, recovery hooks, or typed error boundaries.
- Safe modification: Wrap startup and future command handlers in explicit error handling paths before adding filesystem and persistence logic.
- Test coverage: No Rust tests are detected for `src-tauri/src/`.

## Scaling Limits

**Codebase Capacity Is Demo-Sized:**
- Current capacity: One React component, one Rust command, one Tauri plugin, and no persistent application state.
- Limit: The structure does not have clear seams for the product modules described in `docs/typora-like-editor-plan.md`, such as workspace browsing, markdown editing, settings persistence, or theme management.
- Scaling path: Add module boundaries under `src/` and `src-tauri/src/`, then introduce shared state, IPC wrappers, and plugin-specific service layers before building the editor flows.

## Dependencies at Risk

**Planned Desktop Capabilities Are Not Installed Yet:**
- Risk: The roadmap in `docs/typora-like-editor-plan.md` depends on dialog, filesystem, and store plugins, but the manifests only include opener support.
- Impact: Future phases that assume local workspace access and persisted preferences cannot start from the current dependency set.
- Migration plan: Add the missing Tauri plugins to `package.json` and `src-tauri/Cargo.toml`, then define matching permissions in `src-tauri/capabilities/default.json`.

## Missing Critical Features

**Local-First Editor Foundations Are Absent:**
- Problem: The implementation does not include a workspace chooser, file tree, markdown editor, save flow, theme switching, or persisted settings.
- Blocks: The stated product goal in `docs/typora-like-editor-plan.md` cannot be exercised from the current UI in `src/App.tsx` and `src/App.css`.

**No Testing Surface For Core Flows:**
- Problem: No project-owned `*.test.*` or `*.spec.*` files are detected under `src/` or `src-tauri/`.
- Blocks: There is no safety net for future editor behavior, filesystem mutations, theme persistence, or IPC contracts.

## Test Coverage Gaps

**Entire Frontend And Backend Are Untested:**
- What's not tested: React rendering, form submission behavior, Tauri invoke wiring, Rust command behavior, and Tauri startup configuration.
- Files: `src/App.tsx`, `src/main.tsx`, `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`
- Risk: Any feature addition can break IPC wiring or window startup without fast feedback.
- Priority: High

**Configuration Drift Has No Verification:**
- What's not tested: Tauri capability definitions and config security settings.
- Files: `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`, `package.json`, `src-tauri/Cargo.toml`
- Risk: Permission mismatches and insecure defaults can ship unnoticed because there are no config assertions or smoke tests.
- Priority: Medium

---

*Concerns audit: 2026-04-16*
