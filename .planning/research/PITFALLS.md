# Pitfalls Research

**Domain:** Local-first Typora-like Markdown desktop editor
**Researched:** 2026-04-16
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Editor Lag Becomes the Product

**What goes wrong:**
Typing, cursor movement, selection, paste, or scroll starts stuttering once documents get moderately large. The app still "works", but the core promise of a writing-first tool is already broken.

**Why it happens:**
Headless editor stacks such as Milkdown and ProseMirror are powerful, but they are also transaction- and plugin-driven. Teams often attach too much logic to every transaction, re-render React state on each keystroke, or recompute full document decorations, outline data, and metrics synchronously. This is an inference from the verified note that Milkdown is plugin-driven/headless and ProseMirror is transaction/plugin-based.

**How to avoid:**
- Keep the editor as the hot path and move non-editing work off the keystroke path.
- Separate editor state from sidebar/search/theme UI state.
- Treat plugin count and plugin responsibilities as budgeted architecture, not convenience hooks.
- Benchmark with realistic long documents before adding autosave, live outline, search highlighting, or syntax extras.
- Prefer incremental parsing/decorations and debounced derived state.

**Warning signs:**
- Input latency is visible on headings, lists, or code blocks.
- Cursor jumps or selection flickers after formatting actions.
- CPU spikes while typing in a 5k-10k line document.
- Paste of large Markdown or images freezes the UI thread.

**Phase to address:**
Phase 3: Editor Core and performance budget definition.

---

### Pitfall 2: Markdown Corruption Through Round-Trip Editing

**What goes wrong:**
Saving a file changes content the user did not intend to change: list numbering shifts, blank lines collapse, fenced code blocks mutate, reference links reorder, or unsupported syntax disappears. The editor looks polished but silently damages source files.

**Why it happens:**
Near-WYSIWYG editors often normalize document structure through parser/serializer cycles. If the supported Markdown subset is narrower than real user files, or if save always serializes the full document instead of preserving untouched source structure, fidelity breaks.

**How to avoid:**
- Define a strict Markdown compatibility contract before shipping save.
- Test round-trip fidelity on real-world files: tables, mixed lists, blockquotes, fenced code, HTML blocks, frontmatter, and odd spacing.
- Preserve unsupported constructs rather than "cleaning them up".
- Version and gate serializer changes with fixture-based regression tests.
- Do not enable aggressive autosave until round-trip safety is proven.

**Warning signs:**
- Git diffs show many unrelated formatting changes after small edits.
- Reopening a saved file changes rendering unexpectedly.
- Pasting Markdown from external tools loses structure after save.
- Users avoid saving because they do not trust the editor.

**Phase to address:**
Phase 3: Editor Core, with regression verification before any autosave work.

---

### Pitfall 3: Unsafe File Operations Escape the Workspace Boundary

**What goes wrong:**
Rename, move, delete, or open actions operate outside the user-selected root directory, follow unsafe paths, or expose broader filesystem access than intended. In a local desktop app, this becomes a direct trust failure.

**Why it happens:**
It is easy to treat filesystem APIs as generic utilities instead of a capability-scoped boundary. The verified Tauri note implies filesystem access should stay permission-scoped and capability-driven. The common mistake is validating only on the frontend, or normalizing paths inconsistently across Windows path variants.

**How to avoid:**
- Make the selected root directory the only authority for content operations.
- Enforce path boundary checks in the trusted backend layer, not only in React.
- Canonicalize paths before comparison and reject operations that resolve outside root.
- Minimize Tauri permissions/capabilities to the exact folder workflow the product needs.
- Require explicit confirmation and undo-safe design for destructive actions.

**Warning signs:**
- File actions accept arbitrary absolute paths from the UI or IPC.
- Delete/move code uses string-prefix checks instead of canonical path resolution.
- Capabilities are broad enough to access more than the chosen workspace.
- Bugs differ between `C:\foo\bar` and mixed-separator or case-variant paths.

**Phase to address:**
Phase 1: Security and capability model; Phase 2: Workspace and file-tree operations.

---

### Pitfall 4: Relative Image Paths Break on Rename, Move, or Paste

**What goes wrong:**
Pasted images save successfully at first, then break after moving a note, renaming folders, changing workspace root, or importing existing docs. Users end up with orphaned assets or invalid Markdown image references.

**Why it happens:**
Typora-like workflows depend on simple local image handling. The verified note implies users expect smart paste/image handling and document-adjacent `assets/` behavior. Teams often implement paste-to-disk as a one-off write path without designing rename/move semantics for both document and asset references.

**How to avoid:**
- Define image path policy early: document-adjacent `assets/`, relative links only, deterministic file naming.
- Treat note rename/move as content migration events when relative asset paths depend on location.
- Normalize Windows path separators when generating Markdown.
- Add conflict handling for duplicate asset names and repeated paste operations.
- Validate pasted images, asset writes, and path rewrites with fixture workspaces.

**Warning signs:**
- Same image appears with different relative path formats across files.
- Moved notes render broken image icons after reopen.
- Asset folders accumulate duplicate files with timestamp-only names.
- External image paste works on one machine but breaks when the folder is shared.

**Phase to address:**
Phase 2: Workspace/file operations and Phase 3: Editor paste pipeline.

---

### Pitfall 5: Search Index Goes Stale Faster Than Users Notice

**What goes wrong:**
Full-text search returns deleted files, misses recent edits, shows stale snippets, or blocks the UI while rebuilding. Search looks complete in demos but is unreliable in daily use.

**Why it happens:**
Local-first apps often underestimate indexing lifecycle complexity. If indexing is added after file operations and editor save logic without clear ownership, it drifts from filesystem truth. This is also consistent with the existing plan note that large-folder performance is a risk area.

**How to avoid:**
- Decide whether search is file-system-truth-first or index-first; do not mix models casually.
- Trigger index updates from all mutation paths: save, rename, move, delete, create, and external refresh.
- Store enough metadata to detect staleness cheaply.
- Make indexing asynchronous and observable to users.
- Support "search unavailable/updating" states instead of pretending results are current.

**Warning signs:**
- Search results disagree with current file content after save.
- Renamed files remain searchable by old path.
- Rebuilds happen on the UI thread or on every keystroke.
- Large workspaces require full reindex after routine changes.

**Phase to address:**
Phase 4: Search and indexing.

---

### Pitfall 6: Theme and Rendering Drift Split the Product in Two

**What goes wrong:**
Themes look consistent in body text but not in code blocks, tables, quotes, selection, focus rings, dialogs, or file-tree states. Markdown rendering and chrome styling drift apart, making the app feel unfinished and harder to maintain.

**Why it happens:**
Typora-like products depend on visual coherence. The verified note implies users expect CSS-theme simplicity. Drift happens when editor content styles, app shell styles, and syntax highlighting tokens evolve independently instead of from one semantic theme contract.

**How to avoid:**
- Define a small semantic token set first and force both shell and editor rendering to consume it.
- Keep theme files mostly declarative; avoid per-component overrides as the default strategy.
- Test every built-in theme against the same fixture document set.
- Include code highlighting, tables, blockquotes, selection, and empty states in theme acceptance criteria.

**Warning signs:**
- Themes require one-off CSS exceptions to look acceptable.
- The same Markdown element renders differently in edit vs. persisted view states.
- Adding one theme breaks contrast or spacing in another.
- Syntax highlighting colors ignore the active theme.

**Phase to address:**
Phase 1: Theme token contract; Phase 5: Theme and polish verification.

---

### Pitfall 7: Scope Creep Produces a Worse Typora, Not a Better One

**What goes wrong:**
The roadmap accumulates export, tabs, plugin system, backlinks, database metadata, AI helpers, or multi-window features before the writing loop is stable. Delivery continues, but the product never becomes trustworthy for daily writing.

**Why it happens:**
Markdown tools attract adjacent feature ideas quickly. This project explicitly values writing feel and stability over breadth, but pressure to "catch up" to general note apps can override that constraint unless phase gates are strict.

**How to avoid:**
- Make "open folder -> open file -> write -> paste image -> save -> search -> rename/move safely" the only v1 success path.
- Reject features that do not improve that loop measurably.
- Add phase exit criteria tied to latency, save fidelity, and file workflow safety.
- Track backlog ideas separately from milestone scope.

**Warning signs:**
- New features land before editor regression and file workflow tests exist.
- Product demos emphasize capability count instead of writing feel.
- Architecture discussions center on extensibility before core reliability is proven.
- Team starts building plugin hooks to compensate for missing core polish.

**Phase to address:**
Phase 0/Planning and every phase review gate.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store canonical document content in both editor internals and multiple React/Zustand mirrors | Fast feature wiring | Divergent truth, save races, stale UI, hard-to-reproduce corruption bugs | Only for derived read-only state, never for authoritative content |
| Use broad Tauri fs permissions to "unblock development" | Faster implementation | Harder security review, workspace boundary leaks, dangerous future features | Never beyond short-lived local prototypes |
| Full tree scan and full search reindex on every refresh | Simple logic | Large-folder lag, battery/CPU cost, unusable workspace open times | Acceptable only in tiny fixture workspaces during early prototypes |
| Theme styling via component-specific hardcoded colors | Quick visual progress | Theme drift, high maintenance cost, inconsistent rendering | Acceptable only for throwaway exploration, not for shipped themes |
| Autosave before serializer fidelity is proven | Feels modern in demos | Silent file damage at scale | Never |
| Timestamp-only asset naming for pasted images | Easy to implement | Duplicate assets, merge confusion, broken references on move/import | Acceptable only if combined with deterministic folder policy and conflict checks |

## Integration Gotchas

Common mistakes when connecting domain subsystems and platform services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React UI + Milkdown/ProseMirror | Driving editor transactions from global app state on each keystroke | Keep editor-local transaction flow isolated and sync outward only through controlled, debounced boundaries |
| Tauri FS + workspace UI | Letting UI-selected paths become trusted backend paths | Re-resolve and validate every path against the selected root in the trusted layer |
| File tree + editor dirty state | Allowing rename/delete/move without a dirty-document policy | Define save/discard/cancel flows before destructive navigation ships |
| Paste pipeline + filesystem | Writing image bytes first and figuring out Markdown path later | Resolve final relative path and conflict policy before committing file writes |
| Search index + external file changes | Assuming internal edits are the only source of truth | Plan explicit refresh/reconcile behavior for out-of-band filesystem changes |
| Themes + syntax highlighting | Treating code theme as a separate concern | Bind syntax colors to the same semantic theme contract as the rest of the UI |

## Performance Traps

Patterns that work at small scale but fail in realistic local workspaces. Thresholds below are heuristic and should be treated as inferred test targets, not guarantees.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recompute full document-derived UI on every transaction | Typing lag, scroll jitter, CPU spikes | Incremental derivation, debounce, background work where possible | Commonly visible on long notes around 5k-10k lines or large pasted blocks |
| Eager recursive folder loading | Slow workspace open, frozen sidebar, long initial blank screen | Lazy expansion, cached node metadata, background hydration | Often painful on roots with thousands of files/folders |
| Full search rebuild after every save or rename | Search blocks typing, fans spin up, stale UI | Incremental indexing and batched updates | Breaks quickly once workspace size moves beyond a small personal folder |
| Rendering all tree nodes and search hits at once | Sidebar/search panels jank during navigation | Virtualize long lists and cap expensive previews | Becomes obvious in large documentation or notes repositories |
| Saving via non-atomic overwrite only | Corrupted or truncated files after crash/interruption | Use atomic-save strategy where feasible and verify on Windows behaviors | Breaks during crashes, antivirus interference, or concurrent file access |
| Unbounded syntax highlighting or decoration passes | Code blocks become hotspots | Cap expensive highlighting work and defer non-essential decoration | Large code fences or long mixed-format docs expose it early |

## Security Mistakes

Domain-specific security issues beyond generic web concerns.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Overbroad filesystem capabilities in Tauri | App can access more than the chosen workspace, increasing damage radius | Keep permissions capability-driven and root-scoped; audit them per phase |
| Trusting frontend path checks | Path traversal or unintended file access via IPC misuse | Canonicalize and validate paths in the trusted backend boundary |
| Rendering raw HTML or unsafe links without policy | Malicious local Markdown can execute or open dangerous content unexpectedly | Define HTML/link handling policy explicitly; sanitize or restrict risky behaviors |
| Destructive file actions without recoverability | Permanent local data loss | Use confirmations, reversible UX where possible, and clear error handling |
| Persisting absolute paths or recent workspaces carelessly | Leaks sensitive local directory information in logs/store/screenshots | Minimize stored path data and keep diagnostics opt-in and local |
| Opening external resources automatically from Markdown | Local phishing or unsafe file execution flows | Require explicit user intent before opening links/files outside the editor |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Shipping a split editor/preview mental model while claiming Typora-like behavior | Product feels like another Markdown IDE, not a writing tool | Optimize for single-pane writing first and keep structural affordances subtle |
| Hiding save state or dirty state | Users do not trust whether work is safe | Make save/dirty/failed-save state obvious without cluttering writing space |
| Overeager formatting transformations | Writer loses cursor position or feels the editor "fights back" | Prefer predictable transformations and preserve selection/caret stability |
| File-tree operations that interrupt writing flow | Rename/move/delete feels risky, users avoid organizing notes | Design file operations with strong confirmation and state continuity |
| Search results without freshness cues | Users distrust results after missed hits | Show indexing/rebuild status and allow manual refresh/reconcile |
| Themes optimized for screenshots, not long writing sessions | Visual fatigue and lower daily usability | Validate typography, contrast, code blocks, and selection over sustained reading/writing |

## "Looks Done But Isn't" Checklist

- [ ] **Editor save:** Often missing round-trip fidelity coverage. Verify fixture files reopen byte-safe or with explicitly approved diffs only.
- [ ] **Folder workflows:** Often missing rename/move/delete interactions with dirty documents. Verify save/discard/cancel behavior across all destructive operations.
- [ ] **Image paste:** Often missing document move/rename handling. Verify relative links still resolve after reorganizing folders.
- [ ] **Search:** Often missing stale-index detection. Verify search reflects create, edit, rename, move, delete, and external refresh cases.
- [ ] **Themes:** Often missing parity across code blocks, tables, blockquotes, selection, dialogs, and sidebar states. Verify every built-in theme against the same fixture document.
- [ ] **Workspace security:** Often missing backend path enforcement. Verify IPC cannot operate outside the selected root even with crafted inputs.
- [ ] **Large workspace behavior:** Often missing realistic fixtures. Verify startup, tree expansion, search, and typing with a large folder and long documents, not just toy samples.
- [ ] **Crash safety:** Often missing interrupted-save behavior. Verify files are not truncated after forced shutdown or write failure.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Markdown corruption after save | HIGH | Stop autosave/save rollout, diff against backups or VCS, add minimal serializer fix, add regression fixture before reopening feature flags |
| Workspace boundary bug | HIGH | Disable offending command path, narrow capabilities, add canonical-path enforcement in trusted layer, audit all file IPC handlers |
| Broken relative image references | MEDIUM | Add repair command to rescan adjacent assets, detect missing targets, and rewrite resolvable relative paths with preview before apply |
| Stale or broken search index | MEDIUM | Mark search as rebuilding/unavailable, trigger full integrity rebuild, log index mismatch metrics locally for diagnosis |
| Theme drift across surfaces | LOW | Re-baseline semantic tokens, remove ad hoc overrides, rerun theme fixture review across all bundled themes |
| Large-folder performance collapse | MEDIUM | Introduce lazy loading, virtualization, incremental indexing, and profile hot paths before adding more features |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Editor lag becomes the product | Phase 3: Editor Core | Measured typing/scroll/paste responsiveness on long-document fixtures before phase exit |
| Markdown corruption through round-trip editing | Phase 3: Editor Core | Serializer regression suite passes on real-world Markdown corpus |
| Unsafe file operations escape workspace boundary | Phase 1 and Phase 2 | Crafted path tests cannot read/write/move outside selected root |
| Relative image paths break on rename/move/paste | Phase 2 and Phase 3 | Asset links survive note create, paste, rename, move, and reopen flows |
| Search index goes stale | Phase 4: Search and indexing | Search results match file-system truth after create/edit/rename/move/delete/refresh scenarios |
| Theme and rendering drift | Phase 1 and Phase 5 | Same fixture document renders acceptably in every built-in theme across shell and editor surfaces |
| Scope creep produces a worse Typora | Planning gate for every phase | Each phase can justify how it improves the core writing loop or it does not enter milestone scope |

## Sources

- `.planning/PROJECT.md` — primary product constraints, scope, and quality bar.
- `docs/typora-like-editor-plan.md` — existing plan; explicitly flags Typora-like UX difficulty, file-tree complexity, and large-folder performance as risks.
- User-provided verified source note: Tauri official docs imply filesystem access should stay permission-scoped and capability-driven.
- User-provided verified source note: Typora docs imply users expect live preview, folder workflows, smart paste/image handling, and CSS-theme simplicity.
- User-provided verified source note: Milkdown is plugin-driven/headless; ProseMirror is transaction/plugin-based.

## Inference Notes

- The performance and state-complexity conclusions for Milkdown/ProseMirror are inferences from their plugin/transaction architecture, combined with this product's requirement for Typora-like responsiveness.
- The path-safety recommendations are inferences from the Tauri capability model plus the project's single-root workspace requirement.
- The image, theme, and search pitfalls are product-architecture inferences grounded in the verified workflow expectations and the existing local-first plan.
- Document-size and workspace-size thresholds in this file are heuristic test targets, not claims from official documentation.

---
*Pitfalls research for: local-first Typora-like Markdown desktop editor*
*Researched: 2026-04-16*
