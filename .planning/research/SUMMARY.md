# Project Research Summary

**Project:** Typora-Like Markdown Editor
**Domain:** Windows-only local-first Markdown desktop editor
**Researched:** 2026-04-16
**Confidence:** MEDIUM

## Executive Summary

This project is a narrow, writer-first desktop product: a Windows-only local Markdown editor intended to replace Typora for daily company use, not a general note platform or Markdown IDE. The research converges on a single recommendation: keep the product local-first, root-folder-scoped, single-pane, and biased toward writing feel over breadth. Experts build this kind of tool by isolating the editor hot path from the rest of the UI, pushing filesystem/search work into the native layer, and treating themes as CSS-driven presentation rather than application logic.

The recommended implementation path is to stay on the existing React 19 + TypeScript + Tauri 2 foundation, use Milkdown as the live-preview editor core, keep a typed Tauri gateway as the only frontend/native boundary, and organize the app by domain modules rather than one large app shell. The roadmap should not start with "feature count". It should start with safe workspace boundaries, trustworthy file lifecycle, and an editor that survives realistic long documents without lag or Markdown corruption.

The main risks are not exotic. They are the predictable failure modes of this product category: editor lag, lossy Markdown round-tripping, unsafe path handling, broken relative image links after rename/move, and stale search state. The mitigation is equally clear from the research: define a strict Markdown compatibility contract, keep editor state off the React hot path, validate all file operations in Rust against the selected root, make image/search pipelines explicit instead of incidental, and gate every later phase against the core loop of open -> write -> paste image -> save -> search -> organize.

## Key Findings

### Recommended Stack

The stack recommendation is conservative and aligned with the existing repo. Keep Tauri 2, React 19.1.x, TypeScript 5.8.x, and Vite 7 as the platform baseline. Add Milkdown 7.15.5 as the primary editor engine because it matches the live-preview, plugin-driven Typora-like interaction model better than Monaco or a CodeMirror-first source editor. Use Tauri dialog/fs/store plugins on major `2`, Shiki for code highlighting, and plain CSS theme files with variables for bundled and future themes.

The strongest stack guidance is about boundaries, not libraries: pin all Milkdown packages to the exact same version, keep Tauri plugins on major `2`, use Rust-side services for heavier workspace crawling and search, and avoid introducing a DB, plugin platform, or heavyweight theming system in v1. The recommendation that Rust-side search/indexing should own larger-workspace performance is partly an architectural inference in the source docs, not a pinned-package audit.

**Core technologies:**
- `Tauri 2.x` : desktop shell, capabilities, native dialogs/filesystem/settings boundary — already present and directly matches local desktop needs.
- `React 19.1.x` : app shell, sidebar, search, settings, theme UI — fits a headless editor embedded in a larger desktop interface.
- `TypeScript 5.8.x` : typed contracts between editor/app/native layers — reduces drift in editor commands, path models, and IPC payloads.
- `Milkdown 7.15.5` : primary live-preview Markdown editor — strongest fit for single-pane Typora-like editing.
- `@shikijs/core 3.12.2` : syntax highlighting for rendered code fences — high-quality highlighting without an oversized browser bundle.
- `CSS theme files + CSS variables` : theme system — matches Typora's mental model and keeps extensibility cheap.

### Expected Features

The research is consistent that v1 must feel complete for daily writing, not merely demoable. Table stakes are single-pane live preview, root-folder workspace, reliable open/edit/save with dirty-state protection, core Markdown blocks, folder-scoped search, local image paste/drop with relative paths, and bundled theme switching. If any of these are weak, the app will read as an unfinished editor rather than a Typora replacement.

Differentiation comes from restraint and execution quality, not extra subsystems. The strongest differentiators are typing/scroll stability on real documents, opinionated local file ergonomics, and a fast path from open folder to writing. Features that look tempting but should remain out of the roadmap unless the product direction changes are cloud sync, collaboration, backlinks/graph/tag database features, plugin marketplace work, IDE-style multi-pane UI, and export breadth.

**Must have (table stakes):**
- Single-pane live preview editing — this is the core replacement value, not a nice-to-have.
- Folder-scoped workspace with sidebar tree — the product boundary for all file operations.
- Reliable open/edit/save with dirty-state cues and shortcuts — trust is more important than advanced formatting.
- Core Markdown authoring blocks — headings, lists, quotes, links, code fences, task lists.
- Workspace-wide search — expected once the user opens a folder, not optional polish.
- Image paste/drop to adjacent `assets/` with relative links — practical daily-writing feature, not edge functionality.
- Bundled theme switching with syntax highlighting — part of the expected product surface.

**Should have (competitive):**
- Typora-like feel under load — the real moat; it is a performance and behavior standard.
- Opinionated local file ergonomics — deterministic relative assets, transparent paths, one-root rules.
- CSS-file theme extensibility — good follow-on once bundled themes prove out the token model.
- Fast reopen path — recent workspace, last file, and low-friction navigation after the core loop is stable.

**Defer (v2+):**
- Export matrix — useful later, but not central to the stated daily-writing use case.
- Outline/focus/session complexity — worthwhile only after the core editor is trusted.
- Plugin marketplace, collaboration, cloud sync, graph/backlinks/database features — out of scope for this product shape.

### Architecture Approach

The architecture research recommends a modular, domain-oriented structure with a typed Tauri gateway between React and Rust. The important separation is between `editor` and everything else: Milkdown/ProseMirror own live editing state locally, while document/session, workspace, search, and theme each own their own narrower responsibilities. Filesystem, save, search, and image logic belong in trusted native services behind typed contracts. The exact module split for search/index ownership is explicitly identified as an inference in the source research, but the boundary itself is well supported.

**Major components:**
1. `editor` — live editing surface, keymaps, schema, serialization hooks, paste hooks, and performance-sensitive transaction flow.
2. `document/session` — open doc metadata, dirty state, save lifecycle, cursor/session restore, and conflict handling.
3. `workspace` — selected root, file tree, CRUD operations, root-relative path policies, and safety checks.
4. `search` — folder-scoped query UI plus native-backed indexing/query services.
5. `theme` — semantic tokens, bundled theme selection, syntax highlighting alignment, and persisted preference.
6. `tauri gateway` — the only frontend/native boundary, with typed commands, events, and error mapping.

### Critical Pitfalls

The most important pitfalls are all roadmap-shaping, not just implementation details. They define what should be phase-gated before new feature work is allowed in.

1. **Editor lag becomes the product** — keep editor state local, budget plugins, and move save/search/derived work off the keystroke path; validate on long-document fixtures early.
2. **Markdown corruption through round-trip editing** — define a Markdown compatibility contract and gate serializer changes with regression fixtures before autosave or advanced editing polish.
3. **Unsafe file operations escape the workspace boundary** — validate and canonicalize all paths in Rust against the chosen root, not only in the UI.
4. **Relative image paths break on rename/move/paste** — define the `assets/` policy early and treat file reorganization as content-migration events where needed.
5. **Search index goes stale** — decide clear search ownership, update on all mutation paths, and expose rebuilding/freshness states instead of pretending search is always current.

## Implications for Roadmap

Based on the combined research, the roadmap should be organized around trust and dependency order, not UI surface area. The right sequence for this markdown-editor product is: secure workspace model first, trustworthy document lifecycle second, editor fidelity and performance third, image/search integration fourth, and bundled-theme plus large-fixture polish last.

### Phase 1: Workspace Boundary and Native Contracts
**Rationale:** Everything else depends on a safe single-root model and a disciplined frontend/native boundary. This phase reduces the highest-risk filesystem and security mistakes before feature work spreads path logic through the app.
**Delivers:** Folder selection, persisted current workspace, typed Tauri client/contracts, root-relative path model, backend canonical-path enforcement, minimal theme token contract.
**Addresses:** Folder-scoped workspace foundation, theme-switching prerequisites.
**Avoids:** Unsafe file operations escaping the workspace, theme/rendering drift from ad hoc styling.

### Phase 2: Document Lifecycle and File Tree Trust
**Rationale:** Before a rich editor can feel trustworthy, the app must safely open, create, rename, move, delete, and save documents inside the workspace with explicit dirty-state behavior.
**Delivers:** Sidebar tree, create/rename/delete/move flows, open/save flow, dirty-state cues, save failure handling, atomic-save strategy where feasible, destructive-action policy.
**Addresses:** Reliable open/edit/save, file and folder operations, open folder -> open file -> start writing loop.
**Avoids:** Unsafe file actions, dirty-document surprises during navigation, crash/interruption data loss.

### Phase 3: Editor Core, Markdown Fidelity, and Performance Budget
**Rationale:** This is the product-defining phase. It should happen only after the file/session model is reliable enough to host the editor without corrupting documents or masking save problems.
**Delivers:** Milkdown integration, core Markdown block behavior, keyboard interactions close to Typora, serializer contract, regression fixtures, long-document performance budget, copy/paste baseline.
**Uses:** `Milkdown 7.15.5`, pinned plugin set, React shell as host, TypeScript contracts.
**Implements:** `editor` and `document/session` boundaries from the architecture research.
**Avoids:** Editor lag, Markdown corruption, React-controlled rich text anti-patterns.

### Phase 4: Image Pipeline and Search Consistency
**Rationale:** Both features depend on known document paths, trusted file operations, and committed content. They belong after the editor and save pipeline are stable enough to act as source-of-truth producers.
**Delivers:** Paste/drop image flow to adjacent `assets/`, deterministic asset naming/conflict policy, relative link insertion, search indexing/query service, search UI, mutation-triggered index invalidation, freshness/rebuild states.
**Addresses:** Practical daily-writing image handling, workspace-wide search.
**Uses:** Tauri/Rust filesystem services, typed gateway, editor paste hooks.
**Implements:** `workspace`, `search`, and image asset services.
**Avoids:** Broken relative image links, stale search results, reindex-on-every-keystroke performance trap.

### Phase 5: Themes, Large-Workspace Polish, and Release Validation
**Rationale:** Theme quality and scaling polish matter, but they should refine a trustworthy product rather than hide instability in earlier phases.
**Delivers:** GitHub/Vue/One Dark built-in themes, syntax highlighting parity, theme fixture review, large-tree/search list virtualization if measurement justifies it, external-change/rebuild polish, end-to-end release validation on realistic workspaces.
**Addresses:** Bundled themes, final usability and perceived quality.
**Avoids:** Theme/rendering drift, large-workspace jank, screenshot-friendly but daily-use-poor UX.

### Phase Ordering Rationale

- Workspace boundary comes before file operations because path safety and permission scope are foundational, not cleanup work.
- File lifecycle comes before editor richness because users will not trust a polished editor if save, rename, move, or delete behavior is unsafe or lossy.
- Editor core comes before search and image pipelines because both depend on stable current-document identity and committed content.
- Image and search are grouped after core editing because both are integration-heavy and both can damage perceived product quality if bolted on too early.
- Theme implementation is split across the roadmap: token contract early, bundled-theme completion late. This avoids hardcoded styling without letting visual polish displace core reliability.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Milkdown schema/plugin decisions, Markdown fidelity boundaries, and serializer-preservation strategy need phase-level validation against real fixture files.
- **Phase 4:** Search architecture is partly inference-driven in current research; planner should verify whether initial search should be scan-based, indexed, or hybrid for the expected workspace sizes.
- **Phase 5:** Large-workspace thresholds, virtualization need, and external file-change reconciliation should be confirmed with real fixture measurements instead of assumed upfront.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Tauri root selection, typed IPC boundary, persisted lightweight settings, and capability scoping are well-documented patterns.
- **Phase 2:** File tree CRUD, dirty-state flows, and save/failure UX are standard product-engineering work once the workspace boundary is defined.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core repo stack is verified and editor/Tauri recommendations are grounded in official docs, but some Rust-side search recommendations are explicitly inference. |
| Features | MEDIUM | Table stakes are well supported by PROJECT.md, Typora docs, and competitive analysis, but prioritization beyond v1 reflects opinionated product judgment. |
| Architecture | MEDIUM | The modular boundaries are coherent and well matched to the product, but exact module splits and search ownership are design recommendations rather than verified existing architecture. |
| Pitfalls | MEDIUM | Risks are credible and strongly aligned with the domain, though several thresholds and mitigation details are heuristic rather than officially sourced. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Markdown compatibility contract:** The research names the risk clearly, but the exact supported syntax subset for v1 still needs an explicit acceptance contract and fixture corpus.
- **Search implementation threshold:** The docs recommend native/background search, but do not establish when scan-only is sufficient versus when an incremental index is required.
- **Image rename/move semantics:** The desired `assets/` policy is clear, but whether note rename/move should rewrite links, move assets, or prompt the user needs a product decision during planning.
- **External file change policy:** The research points to refresh/reconcile handling, but the v1 behavior for out-of-band edits is not fully settled.
- **Performance budgets:** Long-document and large-workspace expectations are described qualitatively; planning should turn them into concrete measurable exit criteria.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — product scope, constraints, and out-of-scope boundaries.
- `.planning/research/STACK.md` — stack recommendation, version pinning, and alternatives.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, MVP definition.
- `.planning/research/ARCHITECTURE.md` — module boundaries, patterns, data flow, anti-patterns.
- `.planning/research/PITFALLS.md` — failure modes, prevention strategies, phase mapping.

### Secondary (MEDIUM confidence)
- Tauri official docs — dialog, filesystem, store, and capability model referenced in the research set.
- Milkdown official site and npm package docs — editor engine capabilities and package/version guidance.
- ProseMirror guide — editor transaction/state model underlying performance cautions.
- Typora docs — live preview, file management, themes, image handling expectations.
- `docs/typora-like-editor-plan.md` — internal direction referenced by research docs.

### Tertiary (LOW confidence)
- Architecture/search threshold inferences inside the research docs — useful for planning, but should be validated during phase planning with real workspace fixtures.

---
*Research completed: 2026-04-16*
*Ready for roadmap: yes*
