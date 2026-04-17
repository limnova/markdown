# Phase 2: File Tree & Document Safety - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase turns the trusted workspace shell into a usable local document workflow: users can browse the workspace tree, create files and folders, rename, move, delete, open Markdown documents, save them safely, and see clear dirty/save status without losing work. It does not yet deliver the Typora-like rich editing engine, search, image paste handling, or theme switching beyond carrying forward the existing shell language.

</domain>

<decisions>
## Implementation Decisions

### File Tree Presentation
- **D-01:** The sidebar tree shows folders, Markdown files, and non-Markdown files together inside the workspace instead of hiding non-Markdown entries entirely.
- **D-02:** Non-Markdown entries are visually weakened informational nodes rather than first-class editor targets.
- **D-03:** Clicking a non-Markdown entry must stay in-app and show that this file type is not supported for opening yet; do not silently hand it off to the OS in this phase.

### Create And Open Flow
- **D-04:** Creating a file or folder starts by inserting an inline pending-name row directly in the tree rather than opening a naming modal first.
- **D-05:** If the pending-name row is abandoned or submitted empty, the app assigns a default name instead of cancelling the action or forcing an error state.
- **D-06:** Creating a Markdown file opens it immediately after creation so the user can start writing at once.

### Rename, Move, And Delete
- **D-07:** Reorganizing the workspace should support drag-and-drop movement rather than requiring only menu-based target selection.
- **D-08:** Deletion should prefer recycle-bin semantics rather than immediate permanent removal when the platform allows it.
- **D-09:** Destructive deletes still require explicit user confirmation before the operation runs.
- **D-10:** If the currently open document is renamed or moved, the editor session stays open and follows the document seamlessly to its new path instead of closing or blocking the operation.

### Dirty-State Protection
- **D-11:** Dirty-state protection should default to save-preserving behavior rather than offering a casual "discard changes" path in common transitions.
- **D-12:** For routine transitions such as switching files or closing the workspace view, the app should auto-save first and continue only after the save succeeds.
- **D-13:** Dangerous actions against the currently edited document, especially delete, must still stop for an explicit confirmation step rather than silently auto-completing.
- **D-14:** When delete targets the currently edited dirty document, the confirmation flow should preserve the work-first rule: save the latest content before deletion, or cancel the delete.

### Save Status Visibility
- **D-15:** The UI should show a clearly visible save-status area rather than relying only on subtle title markers or implicit dirty cues.
- **D-16:** Save status should use color-distinct tags for states such as unsaved, saving, saved, and save-failed so the user can read trust state at a glance.

### the agent's Discretion
- Exact folder expansion defaults, as long as the tree remains easy to scan and does not hide the current document context.
- Exact copy for unsupported non-Markdown entries, as long as it clearly says the file type is not openable in-app yet.
- Exact default fallback names for untitled file and folder creation, as long as they are predictable and collision-safe.
- Exact drag handles, hover states, and drop-indicator visuals for move operations.
- Exact color palette and placement of save-status tags, as long as the status area stays clearly visible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope And Product Constraints
- `.planning/ROADMAP.md` — Phase 2 goal, dependency on Phase 1, and success criteria covering tree browsing, CRUD, save, and dirty-state protection.
- `.planning/REQUIREMENTS.md` — `FILE-01` through `FILE-06`, `EDIT-05`, `EDIT-06`, and `PERF-02`, which define the required tree, CRUD, save, and work-protection behaviors.
- `.planning/PROJECT.md` — product constraints for local-first behavior, single-root scope, maintainable module boundaries, and writer-first UX restraint.

### Prior Locked Decisions
- `.planning/phases/01-workspace-boundary-root-safety/01-CONTEXT.md` — inherited rules for trusted-root enforcement, invalid-workspace handling, and out-of-root entries staying non-interactive.
- `.planning/phases/01-workspace-boundary-root-safety/01-UI-SPEC.md` — approved shell language, spacing, typography, and boundary-error treatment that Phase 2 UI should extend rather than replace arbitrarily.

### Architecture And Feature Direction
- `docs/typora-like-editor-plan.md` — product draft covering left sidebar tree, local file CRUD, explicit `Ctrl+S` saving, and the recommendation to avoid aggressive autosave before the editor is stable.
- `.planning/research/ARCHITECTURE.md` — recommended boundaries between `workspace`, `document/session`, and the typed Tauri gateway, including root-relative APIs and debounced persistence guidance.
- `.planning/research/FEATURES.md` — feature-level rationale for reliable open/edit/save flow, dirty-state protection, and file-management trust as table-stakes for this product.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/workspace/components/WorkspaceHeader.tsx` — existing trusted-root status header can evolve into the top area of the Phase 2 shell.
- `src/features/workspace/components/WorkspaceOverview.tsx` — current entry list is the natural starting point for a real tree view and already encodes visual distinction for `external-link` entries.
- `src/features/workspace/components/WorkspaceBanner.tsx` — reusable inline banner pattern for non-destructive boundary or unsupported-file feedback.
- `src/features/workspace/useWorkspaceController.ts` — current shell controller already owns restore/loading/invalid states and is the seam where tree loading and document lifecycle can branch out.
- `src/features/workspace/workspace-client.ts` — existing typed dialog/store/invoke wrapper is the right client edge for additional workspace and document commands.
- `src-tauri/src/workspace.rs` — authoritative Rust-side workspace path validation and entry classification should remain the root of file-tree and CRUD safety logic.

### Established Patterns
- Phase 1 already moved workspace boundary authority into Rust and keeps the frontend on typed payloads rather than raw filesystem access; Phase 2 should keep that split for CRUD and document operations.
- The frontend has already started a `src/features/workspace/` slice, so Phase 2 should extend that feature structure instead of collapsing behavior back into `src/App.tsx`.
- The current UI language is custom React + CSS variables with no component framework, and Phase 2 should preserve that approved shell vocabulary rather than introducing unrelated styling systems.
- Existing workspace payloads use sanitized display paths and explicit entry kinds; future tree/document contracts should stay typed and avoid leaking arbitrary absolute paths through the UI.

### Integration Points
- `src/App.tsx` remains the shell composition point where Phase 2 can replace the overview-only ready state with sidebar + document-session composition.
- `src/features/workspace/types.ts` is the current contract home for workspace payloads and can expand to tree/document metadata.
- `src-tauri/src/lib.rs` is still the single registration seam for new file-tree, document, save, move, rename, and delete commands.
- `src/App.css` currently owns the active shell tokens and patterns, so Phase 2 visual additions should either extend this vocabulary or deliberately extract it into feature/global style layers without breaking Phase 1 continuity.

</code_context>

<specifics>
## Specific Ideas

- Phase 2 should feel like the existing trusted workspace shell growing into a usable writer sidebar, not like switching into a different app.
- File creation should feel immediate and inline: insert the row, name it in place, and land directly in the new Markdown document.
- Non-Markdown files can be visible for orientation, but they should not feel like supported editor targets yet.
- Save trust should be obvious: users should always be able to tell whether the current document is unsaved, saving, saved, or blocked by an error.
- Keeping the current document open through rename and move matters more than rigidly tying the session to the old path.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-file-tree-document-safety*
*Context gathered: 2026-04-17*
