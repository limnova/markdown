# Architecture Research

**Domain:** local-first desktop Markdown editor
**Researched:** 2026-04-16
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                            React UI Layer                           │
├──────────────────────────────────────────────────────────────────────┤
│  App Shell   Workspace Tree   Editor Screen   Search Panel   Theme  │
│      │             │               │              │            │     │
├──────┴─────────────┴───────────────┴──────────────┴────────────┴─────┤
│                       Frontend Domain Modules                        │
├──────────────────────────────────────────────────────────────────────┤
│  editor/     document/     workspace/     search/     theme/        │
│  session/    commands/     selectors/     query UI     settings/    │
├──────────────────────────────────────────────────────────────────────┤
│                         Typed Tauri Gateway                          │
├──────────────────────────────────────────────────────────────────────┤
│  commands.ts     events.ts     path codecs     error mapping         │
├──────────────────────────────────────────────────────────────────────┤
│                      Native / Rust Application Core                  │
├──────────────────────────────────────────────────────────────────────┤
│  Workspace FS   Save Pipeline   Search Index   Image Assets   Store  │
│      │               │               │              │           │     │
├──────┴───────────────┴───────────────┴──────────────┴───────────┴─────┤
│                       Tauri Plugins + Capabilities                   │
├──────────────────────────────────────────────────────────────────────┤
│  dialog           fs            store         events         security │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `editor` | Own the live editing surface, ProseMirror transactions, schema, node views, keymaps, and Markdown conversion | Milkdown on top of ProseMirror, isolated from React re-render churn |
| `document/session` | Track open document metadata, dirty state, save lifecycle, cursor restoration, and conflict status | Small TS store plus commands; do not mirror full editor state on every keystroke |
| `workspace` | Own the selected root, file tree, path validation, CRUD operations, and folder-scoped policies | Rust-native file services exposed through a typed Tauri client |
| `search` | Build and query a workspace-wide text index without blocking typing | Background Rust task or async service [Inference] |
| `theme` | Apply base tokens, editor chrome styles, content typography, and code highlighting themes | CSS-variable-based theme packs plus persisted preference |
| `tauri gateway` | Be the only place the frontend crosses into native code | `invoke` wrappers, event subscriptions, typed request/response models |

## Recommended Project Structure

```text
src/
├── app/                      # App bootstrap, layout shell, route-less composition
│   ├── App.tsx
│   ├── providers.tsx
│   └── shell/
├── editor/                   # Editing engine only
│   ├── components/           # EditorHost, toolbar fragments, status bar
│   ├── milkdown/             # Editor factory, schema, plugins, node views
│   ├── commands/             # Toggle list, heading, quote, table, paste-image hooks
│   ├── serialization/        # Markdown import/export adapters
│   └── types/
├── document/                 # Active document/session lifecycle
│   ├── store/                # Dirty state, save status, current file id/path
│   ├── services/             # Open, close, save, autosave, restore session
│   └── selectors/
├── workspace/                # Root folder and tree operations
│   ├── store/
│   ├── services/
│   ├── tree/
│   └── types/
├── search/                   # Search query state and results UI
│   ├── store/
│   ├── services/
│   └── components/
├── theme/                    # Theme selection and editor theming
│   ├── store/
│   ├── services/
│   └── tokens/
├── tauri/                    # Narrow IPC boundary
│   ├── client.ts             # Typed command wrappers
│   ├── events.ts             # Native -> frontend event subscriptions
│   ├── contracts.ts          # Shared request/response types mirrored in Rust
│   └── errors.ts
├── shared/                   # Generic helpers, no domain ownership
│   ├── ui/
│   ├── utils/
│   └── types/
├── styles/
│   ├── base.css              # App-wide reset and tokens
│   ├── editor.css            # Shared editor typography/layout
│   ├── code.css              # Syntax highlighting base
│   └── themes/
│       ├── github.css
│       ├── vue.css
│       └── one-dark.css
└── main.tsx

src-tauri/
└── src/
    ├── commands/             # IPC handlers only
    │   ├── workspace.rs
    │   ├── documents.rs
    │   ├── search.rs
    │   └── settings.rs
    ├── services/             # Native business logic
    │   ├── workspace_fs.rs
    │   ├── search_index.rs
    │   ├── image_assets.rs
    │   └── settings_store.rs
    ├── models/               # Serde DTOs shared with commands
    ├── events.rs             # File/index change events
    ├── lib.rs
    └── main.rs
```

### Structure Rationale

- **`src/editor/`:** Keep Milkdown and ProseMirror code physically separate from file tree, search, and theme logic. This is the hottest performance path.
- **`src/document/`:** Session state is not the same as editor implementation. This boundary lets the app swap editor internals later without rewriting save/dirty/conflict flows.
- **`src/workspace/`:** A single-root app benefits from a dedicated workspace module that understands only root-relative paths and tree operations.
- **`src/search/`:** Search is feature-level UI on the frontend, but the indexing engine should remain replaceable behind a service boundary. [Inference]
- **`src/tauri/`:** Prevent ad hoc `invoke()` calls from leaking across components. This preserves testability and keeps permissions reviewable.
- **`src-tauri/src/commands` vs `services`:** Commands should translate requests; services should perform path validation, disk I/O, indexing, and settings persistence.
- **`src/styles/themes/`:** Typora’s theming model is CSS-first, so theme files should stay data-like and swappable rather than encoded into editor logic.

## Architectural Patterns

### Pattern 1: Editor-As-Island

**What:** Treat the editor runtime as an isolated state machine. React mounts it, passes coarse-grained inputs, and listens to debounced outputs.
**When to use:** Always for the main writing surface.
**Trade-offs:** Best typing performance and modularity; slightly more adapter code than a fully React-controlled editor.

**Example:**
```typescript
type EditorSnapshot = {
  markdown: string
  dirty: boolean
}

const editor = createMilkdownEditor({
  onTransaction: ({ docChanged, markdown }) => {
    if (!docChanged) return
    sessionStore.markDirty()
    saveQueue.enqueue(markdown)
  },
})
```

### Pattern 2: Root-Relative Workspace API

**What:** The UI never owns absolute disk paths after root selection. It passes root-relative paths or opaque document IDs to the native layer.
**When to use:** For open, create, rename, delete, move, paste-image, and search-result navigation.
**Trade-offs:** Slightly more translation code; much safer and easier to reason about than arbitrary path passing.

**Example:**
```typescript
await tauri.workspace.rename({
  from: "notes/daily/2026-04-16.md",
  to: "notes/daily/2026-04-17.md",
})
```

### Pattern 3: Debounced Persistence + Async Index Invalidation

**What:** Writing, Markdown serialization, and search-index updates happen off the keystroke path.
**When to use:** On every editing session and on external file-change events.
**Trade-offs:** Requires explicit queueing and status UI; dramatically reduces typing jitter.

**Example:**
```typescript
saveQueue.schedule(currentDocId, snapshot.markdown, { delayMs: 400 })

saveQueue.onCommitted((doc) => {
  searchService.invalidateDocument(doc.path)
})
```

### Pattern 4: CSS-Token Theme Layers

**What:** Keep theme selection in CSS variables and classes, not in editor node logic.
**When to use:** For app chrome, prose typography, code blocks, selection colors, and dark/light variants.
**Trade-offs:** Requires disciplined token naming; far easier to extend than inline style mutation.

## Data Flow

### Request Flow

```text
[User types]
    ↓
[Milkdown Editor]
    ↓ transaction
[editor adapter] → [document session] → [debounced save queue] → [Rust save service]
    ↓                          ↓                    ↓                    ↓
[paint stays local]      [dirty badge]       [search invalidation]   [disk write]
```

### State Management

```text
[Editor internal state]
    ↓ emits snapshots/events
[Feature stores: document/workspace/search/theme]
    ↓ selectors
[React components]
    ↓ user actions
[Commands/services]
```

### Key Data Flows

1. **Open document:** Workspace tree selection calls the Tauri client, Rust loads file contents, the editor imports Markdown into Milkdown, and session state stores only metadata plus save/version markers.
2. **Typing and autosave:** ProseMirror transactions mutate editor state locally; debounced serialization updates the save queue; the queue commits to disk and then invalidates the search index. [Inference]
3. **Paste image:** The editor intercepts paste, passes binary payload plus current document path to native code, native code writes into sibling `assets/`, then the editor inserts the relative Markdown image path.
4. **Workspace switch:** Dialog plugin selects a root folder, workspace service rebuilds the file tree, search resets/rebuilds, and the document session closes or offers recovery for dirty files.
5. **Theme change:** Theme store persists the selected theme via store plugin or native settings service, app root toggles a `data-theme` attribute, and editor/body styles update without rebuilding the editor instance.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 active doc, <1k files | Single process is fine; search can be a simple background task and the file tree can load eagerly |
| 1 active doc, 1k-20k files | Add incremental indexing, virtualize the tree/search result lists, and avoid full workspace rescans on each save |
| Large docs or very large workspaces | Prioritize chunked indexing, external file watchers, and strict debounce/queue discipline before considering new subsystems |

### Scaling Priorities

1. **First bottleneck:** Keystroke-to-render latency. Fix by keeping ProseMirror state local, avoiding React-controlled content, and pushing save/index work off the hot path.
2. **Second bottleneck:** Workspace-wide scans and search refresh. Fix by maintaining an incremental index and only re-indexing changed documents.

## Anti-Patterns

### Anti-Pattern 1: React-Controlled Rich Text

**What people do:** Keep the full Markdown string in React state and re-render the editor subtree on every input.
**Why it's wrong:** It destroys typing performance, creates selection bugs, and fights ProseMirror’s persistent state model.
**Do this instead:** Let Milkdown/ProseMirror own live editor state and emit debounced snapshots into session services.

### Anti-Pattern 2: Scattered Native Calls

**What people do:** Call `invoke()` or plugin APIs directly from arbitrary components.
**Why it's wrong:** Permission scope becomes opaque, error handling diverges, and refactors become dangerous.
**Do this instead:** Route all native access through `src/tauri/client.ts` and typed feature services.

### Anti-Pattern 3: Absolute Paths in UI State

**What people do:** Pass raw Windows paths through components, stores, and editor plugins.
**Why it's wrong:** It leaks filesystem concerns everywhere and makes workspace changes, tests, and validation harder.
**Do this instead:** Store root-relative paths in the frontend and resolve/validate absolute paths only in native services.

### Anti-Pattern 4: Re-index On Every Keystroke

**What people do:** Trigger full-text indexing directly from editor change handlers.
**Why it's wrong:** Search work competes with typing and scales poorly with larger workspaces.
**Do this instead:** Update search on save, on explicit idle windows, or from filesystem watcher events. [Inference]

### Anti-Pattern 5: Theme Logic Embedded In Editor Commands

**What people do:** Mix theme colors, syntax highlighting, and node styling into editor plugin code.
**Why it's wrong:** Themes become hard to extend and editor behavior becomes coupled to presentation.
**Do this instead:** Keep editor semantics in plugins and presentation in `styles/` theme layers.

## Integration Points

### External Libraries / Native Facilities

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Milkdown | Frontend editor engine behind `src/editor/milkdown` | Officially plugin-driven and headless, which fits a modular Typora-like surface |
| ProseMirror | Internal editor state/transaction model | Treat as the hot-path state machine; do not duplicate it in app stores |
| Tauri dialog plugin | Root-folder pickers, save/open dialogs | Use for explicit user-driven path selection |
| Tauri filesystem and Rust FS services | Workspace CRUD, image writes, bulk file enumeration | Prefer native services for path validation and heavier operations |
| Tauri store plugin | Persist lightweight preferences like theme and recent workspace | Keep it for small settings, not for live document buffers |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `editor ↔ document` | Adapter callbacks and typed commands | Editor emits debounced content/status; document module decides save policy |
| `document ↔ workspace` | API calls by relative path | Workspace owns file existence and rename/move semantics |
| `document ↔ search` | Save/index invalidation events | Search should consume committed content, not transient keystrokes |
| `theme ↔ editor` | CSS class / data attribute only | Avoid imperative restyling of editor internals |
| `frontend ↔ tauri` | Typed request/response contracts | One gateway keeps capability review and testing manageable |

## Sources

- `.planning/PROJECT.md` in this repo for product scope, constraints, and current scaffold
- Milkdown official site: https://milkdown.dev
- ProseMirror guide: https://prosemirror.net/docs/guide/
- Tauri dialog plugin docs: https://v2.tauri.app/plugin/dialog/
- Tauri file system plugin docs: https://v2.tauri.app/plugin/file-system/
- Tauri store plugin docs: https://v2.tauri.app/plugin/store/
- Tauri capabilities docs: https://v2.tauri.app/security/capabilities/
- Typora custom CSS docs: https://support.typora.io/Add-Custom-CSS/

**Inference labels used above:** Search-index placement, save/index trigger timing, and exact folder/module split are design recommendations inferred from the current scaffold, local-first scope, and the documented capabilities of Milkdown, ProseMirror, Tauri, and Typora-style CSS theming.

---
*Architecture research for: local-first desktop Markdown editor*
*Researched: 2026-04-16*
