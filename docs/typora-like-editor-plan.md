# Typora-Like Markdown Editor Plan

## Goal

Build a local-first desktop Markdown editor inspired by Typora.

Current scope is intentionally narrow:

- editing Markdown documents
- managing folders and files from a local workspace
- switching between a small set of classic themes

Not in scope for the first phase:

- sync
- collaboration
- plugin marketplace
- tags or database-driven notes
- full-text search
- mobile support

## Product Direction

The app should feel like a writing tool, not a generic code editor.

Core experience:

- open a folder as a workspace
- browse folders and `.md` files in a left sidebar
- edit the current file in the center pane
- render Markdown in a near-WYSIWYG way while typing
- save changes directly back to the local file
- switch themes without changing document content

The primary interaction model is:

1. user opens a local folder
2. app builds a file tree from that folder
3. user opens a Markdown file
4. editor loads Markdown content
5. edits are saved back to disk

## Recommended Tech Stack

### Desktop Runtime

- `Tauri 2`
- `Rust`

Why:

- strong fit for local desktop software
- official filesystem, dialog, and store plugins
- smaller and simpler desktop packaging than Electron for this use case
- Rust is available when frontend-only file operations are not enough

### Frontend

- `React 19`
- `TypeScript`
- `Vite`

Why:

- already matches the current project
- fast iteration during UI work
- strong ecosystem for editor integration and state management

### Editor Core

- `Milkdown`

Why:

- Markdown-first editing model
- closer to Typora-style editing than plain text editors
- better product fit than Monaco
- more aligned with this app than a split preview approach

Fallback option if implementation risk becomes too high:

- `CodeMirror 6` for editing
- custom preview only where needed

That fallback is easier technically, but it moves the UX away from Typora.

### Tauri Plugins

- `@tauri-apps/plugin-dialog`
- `@tauri-apps/plugin-fs`
- `@tauri-apps/plugin-store`
- `@tauri-apps/plugin-opener`

Purpose:

- `dialog`: choose workspace folders and files
- `fs`: read, write, create, rename, and delete local files
- `store`: persist UI preferences and recent workspace info
- `opener`: reveal a file or folder in the system file manager when needed

### State Management

- `Zustand`

Why:

- enough for local app state without adding unnecessary structure
- clean fit for workspace tree, current document, dirty state, and theme state

### Styling

- `CSS Modules`
- `CSS custom properties`

Why:

- themes are easier to maintain with CSS variables
- no need for a heavy UI framework in the first phase
- easier to build a more intentional desktop look than a default component library

## Architecture

## High-Level Modules

### 1. Workspace Module

Responsibilities:

- open a folder as the current workspace
- remember recently opened workspaces
- load and refresh the file tree

Main data:

- current workspace root path
- recent workspace list
- expanded folder ids

### 2. File Tree Module

Responsibilities:

- display folders and Markdown files
- create file
- create folder
- rename file or folder
- delete file or folder
- select current file

Rules:

- first phase only needs `.md` files in the editor flow
- non-Markdown files can be hidden or shown as read-only nodes later

### 3. Editor Module

Responsibilities:

- load Markdown content into the editor
- support common Markdown structures
- keep cursor and selection stable during edits
- track dirty state
- save content back to disk

Required Markdown support for v1:

- headings
- paragraphs
- bold and italic
- blockquotes
- ordered and unordered lists
- task lists
- fenced code blocks
- inline code
- links
- horizontal rules

Good-to-have for v1.1:

- tables
- images
- frontmatter awareness

### 4. Theme Module

Responsibilities:

- switch between bundled themes
- persist current theme
- apply consistent colors to sidebar, editor, selection, code blocks, and typography

Recommended built-in themes:

- `GitHub Light`
- `One Dark`
- `Sepia`
- `Paper`

### 5. Settings Module

Responsibilities:

- persist simple user preferences
- restore last session state where safe

Suggested settings:

- current theme
- recent workspaces
- sidebar width
- last opened file
- expanded folders

## Data Model

The app should stay file-based.

### Source of Truth

- document content: local `.md` files
- app preferences: local Tauri store file

Do not introduce a database in phase 1.

Suggested frontend shapes:

```ts
type WorkspaceState = {
  rootPath: string | null;
  recentRoots: string[];
  expandedPaths: string[];
  selectedPath: string | null;
};

type FileNode = {
  path: string;
  name: string;
  kind: "file" | "directory";
  children?: FileNode[];
};

type DocumentState = {
  path: string | null;
  content: string;
  savedContent: string;
  isDirty: boolean;
  lastSavedAt: number | null;
};

type ThemeId = "github-light" | "one-dark" | "sepia" | "paper";
```

## File System Strategy

Use Tauri plugin APIs first.

Preferred operations:

- choose workspace folder with `dialog`
- read directory tree with `fs`
- read file content with `fs`
- write file content with `fs`
- create, rename, and remove entries with `fs`

Only add custom Rust commands when one of these becomes true:

- performance is not acceptable for large trees
- atomic save behavior needs tighter control
- OS-specific behavior is required
- a watcher or background task needs Rust ownership

## Save Model

Recommended first implementation:

- open file loads content into editor state
- changes mark document as dirty
- `Ctrl+S` saves immediately
- optional debounced autosave can be added later

Do not start with aggressive autosave until editor behavior is stable.

Typora-like feeling matters, but silent save bugs are worse than one extra shortcut.

## Theme Strategy

Use semantic CSS variables rather than hardcoded component colors.

Example variable groups:

- background
- panel background
- text primary
- text muted
- border
- accent
- selection
- code background
- blockquote border

This allows theme changes without rewriting component styles.

## Suggested Directory Structure

```text
src/
  app/
    App.tsx
    providers/
    router/
  features/
    workspace/
    file-tree/
    editor/
    theme/
    settings/
  components/
    layout/
    common/
  stores/
    workspace-store.ts
    editor-store.ts
    ui-store.ts
  lib/
    tauri/
    markdown/
    utils/
  styles/
    globals.css
    themes.css
    tokens.css
src-tauri/
  capabilities/
  permissions/
```

## Implementation Plan

### Phase 1: Project Foundation

- install Tauri plugins: dialog, fs, store, opener
- add Zustand
- define app shell layout
- set up theme tokens and base desktop styling

### Phase 2: Workspace and File Tree

- open folder action
- build sidebar tree
- file selection
- create, rename, delete flows
- remember recent workspaces

### Phase 3: Editor

- integrate Milkdown
- load and save Markdown files
- dirty state
- keyboard shortcuts

### Phase 4: Themes and Polish

- ship four bundled themes
- improve typography and spacing
- add empty states and save indicators

## Risks

### 1. Typora-like UX is harder than plain Markdown editing

The closer the app gets to true WYSIWYG Markdown editing, the more editor behavior matters.

Mitigation:

- keep formatting scope limited at first
- avoid adding advanced embedded widgets too early

### 2. File tree complexity grows quickly

Rename, delete, refresh, and unsaved file transitions can create edge cases.

Mitigation:

- define path ownership and update rules early
- keep one clear store for workspace and selection state

### 3. Large folder performance

Recursive tree reads can become slow on large note vaults.

Mitigation:

- lazy-load folders when expanded
- debounce refreshes
- add Rust support only if needed

## Recommended Immediate Next Step

Implement the MVP in this order:

1. app shell layout
2. workspace open dialog
3. file tree rendering
4. open and save Markdown files
5. integrate Milkdown
6. theme switching

This keeps the first milestone shippable:

- open folder
- open file
- edit
- save
- switch theme

## References

- Tauri Dialog: https://v2.tauri.app/plugin/dialog/
- Tauri FS: https://v2.tauri.app/reference/javascript/fs/
- Tauri Store: https://v2.tauri.app/plugin/store/
- Tauri Permissions: https://v2.tauri.app/security/permissions/
- Tauri Capabilities: https://v2.tauri.app/security/capabilities/
- Milkdown: https://milkdown.dev/
- ProseMirror Markdown Example: https://prosemirror.net/examples/markdown/
- Tiptap Markdown Docs: https://tiptap.dev/docs/editor/markdown
