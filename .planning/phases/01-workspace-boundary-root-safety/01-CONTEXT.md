# Phase 1: Workspace Boundary & Root Safety - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes one trusted workspace root for the desktop app, restores that root across launches, and ensures every file-facing action stays inside that boundary under Windows path rules. It does not yet deliver full file-tree CRUD, search, or editor behavior beyond what is needed to choose, remember, and defend the workspace root.

</domain>

<decisions>
## Implementation Decisions

### Workspace Entry
- **D-01:** First launch uses a dedicated welcome state with a single primary action to choose the workspace directory.
- **D-02:** The first-launch state should stay minimal rather than acting like a multi-step setup flow.

### Restore Behavior
- **D-03:** App relaunch restores the last selected workspace path automatically with no confirmation step.
- **D-04:** If the remembered workspace path is missing, moved, inaccessible, or otherwise invalid, the app enters a blocked "workspace invalid" state and requires the user to reselect a root instead of silently clearing the saved path.

### Boundary Enforcement
- **D-05:** Any attempt to access content outside the selected workspace root must be rejected clearly and non-destructively.
- **D-06:** Workspace boundary checks must be based on Windows-safe canonicalized paths rather than raw user-facing path strings.

### External Links Inside Workspace
- **D-07:** Filesystem entries inside the workspace that resolve outside the root (such as symlinks, junctions, or shortcuts) may be shown as external-link nodes for awareness.
- **D-08:** External-link nodes are not treated as workspace content: they are not expanded, opened, edited, searched, or used as valid targets for workspace operations.

### the agent's Discretion
- Exact UI treatment for out-of-root rejection states, as long as the rejection is clear and non-destructive.
- Exact wording and visual design of the welcome state and the invalid-workspace state.
- Exact iconography and labeling for external-link nodes that point outside the workspace root.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope And Constraints
- `.planning/ROADMAP.md` — Phase 1 goal, dependency position, and success criteria for workspace root selection and root-bound enforcement.
- `.planning/REQUIREMENTS.md` — `WORK-01`, `WORK-02`, `WORK-03`, and `PERF-03`, which define root selection, root-only operations, restoration, and boundary safety.
- `.planning/PROJECT.md` — product-level constraints for Windows-only delivery, single-root workspace model, local-first behavior, and maintainable modular architecture.

### Product Direction
- `docs/typora-like-editor-plan.md` — prior product draft covering open-folder workflow, workspace persistence, file-system strategy, and the recommendation to prefer Tauri dialog/fs/store plugins before custom Rust commands.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx` — existing root React component can be replaced with the initial workspace shell and any invalid-workspace fallback state.
- `src/App.css` — current global stylesheet entry point can host the first phase's shell, welcome state, and boundary-status presentation until a richer structure is introduced.
- `src-tauri/src/lib.rs` — centralized Tauri command registration point for any root-safety or path-validation commands that need to live in Rust.

### Established Patterns
- Frontend code is currently a single root component with local React state and inline handlers, so Phase 1 will likely introduce the first meaningful UI/module split.
- Native IPC is currently centralized through `invoke(...)` on the frontend and `tauri::generate_handler![...]` in Rust, which is the natural seam for any native boundary checks.
- The app currently ships only the `opener` plugin and default capability, so Phase 1 is also the point where dialog/fs/store permissions and boundaries need to be introduced deliberately.

### Integration Points
- `src/App.tsx` is the main integration point for the workspace-selection welcome flow, current-root shell, and invalid-root fallback.
- `src-tauri/tauri.conf.json` and `src-tauri/capabilities/default.json` are the configuration boundaries for any new plugin access needed by workspace selection and persistence.
- `package.json` and dependency manifests are where dialog/fs/store support will be introduced if Phase 1 chooses plugin-first filesystem handling.

</code_context>

<specifics>
## Specific Ideas

- First launch should feel like a simple "choose your workspace directory" screen, not a setup wizard.
- Relaunch should feel immediate: restore the last workspace path without asking again.
- If the remembered path breaks, the app should say so explicitly and stop in a recoverable invalid-workspace state instead of silently forgetting the previous root.
- Out-of-root linked entries were discussed; the accepted direction is visible-but-non-interactive external-link nodes rather than partial read access.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-workspace-boundary-root-safety*
*Context gathered: 2026-04-16*
