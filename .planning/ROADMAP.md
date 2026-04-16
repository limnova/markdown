# Roadmap: Typora-Like Markdown Editor

## Overview

This roadmap turns the existing React + TypeScript + Tauri scaffold into a Windows-only, root-bound Markdown editor by sequencing work around user trust: first the workspace boundary, then safe file lifecycle, then Typora-like editing feel, then search and image workflows, and finally bundled theme polish. Modular architecture is treated as a constraint in every phase rather than a separate milestone, and each phase is sized to execute on its own phase branch under the configured per-phase branching workflow.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Workspace Boundary & Root Safety** - Establish the single-root workspace model, persistence, and Windows-safe path guardrails.
- [ ] **Phase 2: File Tree & Document Safety** - Make browsing, CRUD, save, and dirty-state flows trustworthy inside the selected workspace.
- [ ] **Phase 3: Typora-Like Editor Core** - Deliver the single-pane Markdown writing experience and performance bar that define the product.
- [ ] **Phase 4: Search & Image Workflow** - Add practical daily-writing retrieval and asset flows without breaking relative-path integrity.
- [ ] **Phase 5: Themes & Windows Release Polish** - Finish the experience with bundled themes, persisted appearance, and end-user polish for daily desktop use.

## Phase Details

### Phase 1: Workspace Boundary & Root Safety
**Goal**: Users can choose and reopen one trusted workspace root, and every file-facing action stays inside that boundary on Windows.
**Depends on**: Nothing (first phase)
**Requirements**: WORK-01, WORK-02, WORK-03, PERF-03
**Success Criteria** (what must be TRUE):
  1. User can choose a local folder as the current workspace root from the app.
  2. User can relaunch the app and resume from the last workspace root without reselecting it.
  3. User can only browse and operate on content inside the selected root, and out-of-root attempts are rejected clearly.
  4. Workspace-scoped actions behave correctly with Windows paths, separators, and canonicalization rules.
**Plans**: TBD
**UI hint**: yes

### Phase 2: File Tree & Document Safety
**Goal**: Users can browse, create, reorganize, and save Markdown documents inside the workspace without losing work.
**Depends on**: Phase 1
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, FILE-06, EDIT-05, EDIT-06, PERF-02
**Success Criteria** (what must be TRUE):
  1. User can browse the workspace tree, open Markdown files, and create new files or folders from the app interface.
  2. User can rename, move, and delete workspace files or folders, with an explicit confirmation before destructive actions.
  3. User can press `Ctrl+S` to save the current document, reopen it, and see intact Markdown content on disk.
  4. User sees unsaved-change indicators and is protected before closing, switching, or deleting a document with pending edits.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Typora-Like Editor Core
**Goal**: Users can write in a single-pane Markdown editor that feels close to Typora and remains smooth on realistic long documents.
**Depends on**: Phase 2
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, PERF-01
**Success Criteria** (what must be TRUE):
  1. User edits Markdown in a single-pane writing surface instead of working through a split edit/preview layout.
  2. User sees headings, quotes, lists, task items, tables, inline code, and fenced code blocks rendered in-flow close to final formatting while editing.
  3. User can use familiar editing shortcuts for save, undo, redo, and find without breaking writing flow.
  4. User can keep typing and navigating through larger Markdown documents without obvious keystroke lag or viewport jitter.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Search & Image Workflow
**Goal**: Users can quickly find content and paste local images into notes while keeping workspace-relative links consistent.
**Depends on**: Phase 3
**Requirements**: IMAG-01, IMAG-02, IMAG-03, SEAR-01, SEAR-02, SEAR-03
**Success Criteria** (what must be TRUE):
  1. User can paste an image from the clipboard and have it saved into the current document's adjacent `assets/` folder automatically.
  2. User sees a correct relative Markdown image reference inserted into the document immediately after paste.
  3. User can rename or move Markdown documents managed by the app without silently breaking the image references the app created.
  4. User can search the current workspace by file name and file content, open a result, and jump back into editing from the match.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Themes & Windows Release Polish
**Goal**: Users can finish the writing workflow in polished built-in themes that persist across restarts and feel coherent in daily Windows use.
**Depends on**: Phase 4
**Requirements**: THEM-01, THEM-02, THEM-03
**Success Criteria** (what must be TRUE):
  1. User can switch between the `GitHub`, `Vue`, and `One Dark` built-in themes from the app interface.
  2. Theme changes update document typography, sidebar chrome, and code block highlighting together instead of partially.
  3. User can restart the app and see the previously selected theme restored automatically.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Workspace Boundary & Root Safety | 0/TBD | Not started | - |
| 2. File Tree & Document Safety | 0/TBD | Not started | - |
| 3. Typora-Like Editor Core | 0/TBD | Not started | - |
| 4. Search & Image Workflow | 0/TBD | Not started | - |
| 5. Themes & Windows Release Polish | 0/TBD | Not started | - |
