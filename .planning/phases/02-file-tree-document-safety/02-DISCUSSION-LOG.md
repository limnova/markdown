# Phase 2: File Tree & Document Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 02-file-tree-document-safety
**Areas discussed:** File tree presentation, create/open flow, rename/move/delete, dirty-state protection, save-status visibility

---

## File Tree Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Hide non-Markdown files | Keep the tree Markdown-only and reduce noise | |
| Show non-Markdown files as weak nodes | Keep them visible for orientation but not first-class | ✓ |
| Promote all files equally | Treat every file type as a normal open target | |

**User's choice:** Show non-Markdown files as weakened nodes in the tree.
**Notes:** Follow-up decision: clicking a weakened non-Markdown node should stay in-app and show that this file type is not supported yet, rather than opening it with the OS.

---

## Create And Open Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt in a modal first | Ask for the name before adding anything to the tree | |
| Insert inline pending-name row | Create directly in the tree and let the user name it in place | ✓ |
| Create immediately with generated name | Skip inline naming on creation | |

**User's choice:** Insert an inline pending-name row in the tree.
**Notes:** Follow-up decisions: new Markdown files should auto-open immediately; if the pending row loses focus or stays empty, assign a default fallback name instead of cancelling or forcing an error state.

---

## Rename, Move, And Delete

| Option | Description | Selected |
|--------|-------------|----------|
| Menu-only reorganization | Use dialogs or menus instead of direct drag operations | |
| Drag-and-drop movement | Let users reorganize tree items by dragging them | ✓ |
| Disable move in v1 | Keep rename/delete only and defer move | |

**User's choice:** Support drag-and-drop movement.
**Notes:** Deletion should prefer recycle-bin semantics, still require explicit confirmation, and renaming or moving the currently open document should keep the editor session open on the new path.

---

## Dirty-State Protection

| Option | Description | Selected |
|--------|-------------|----------|
| Save / discard / cancel dialog everywhere | Explicit tri-state choice on all risky transitions | |
| Always force manual save first | Block transitions until the user saves | |
| Save-preserving automatic path | Auto-save for common transitions, explicit confirm on dangerous delete cases | ✓ |

**User's choice:** Save-preserving automatic path.
**Notes:** Routine transitions should auto-save first; delete of the current dirty document still needs an explicit confirmation path that preserves the latest work or cancels the delete.

---

## Save-Status Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal cue only | Rely on subtle title or dirty-dot changes | |
| Clear status area with tags | Show visible status tags using different colors per state | ✓ |
| Full-width banner status | Surface save state as large banners | |

**User's choice:** Clear visible status area with colored tags.
**Notes:** The status area should make `unsaved`, `saving`, `saved`, and failure states legible at a glance.

---

## the agent's Discretion

- Exact unsupported-file copy.
- Exact fallback untitled names and collision handling.
- Exact drag-and-drop affordances and tag visuals.
- Exact default expansion behavior for the file tree.

## Deferred Ideas

None.
