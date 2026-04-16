# Stack Research

**Domain:** Windows-only local-first Markdown desktop editor
**Researched:** 2026-04-16
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri | 2.x | Desktop shell, IPC boundary, native filesystem/dialog integration | The repo already runs on Tauri 2, and the official v2 plugin ecosystem covers the exact local-desktop needs here: dialogs, persisted settings, scoped filesystem access, and Windows packaging. |
| React | 19.1.x | Application shell, panes, settings UI, file tree, search UI | Already installed in the repo and a good fit for a headless editor approach where the editor engine is embedded inside a larger desktop UI. |
| TypeScript | 5.8.x | Typed editor commands, app state, and frontend/native contracts | Already installed in the repo; keep it as the boundary language so editor state, file models, and Tauri command payloads do not drift. |
| Milkdown (`@milkdown/core`, `@milkdown/react`, `@milkdown/preset-commonmark`) | 7.15.5 | Primary editor engine for live-preview Markdown editing | This is the best fit for a Typora-like product. Milkdown positions itself as plugin-driven, headless, and WYSIWYG-oriented, which maps directly to a single-pane live-preview editor better than code-editor-first stacks do. Pin all Milkdown packages to the same exact version line. |
| `@shikijs/core` | 3.12.2 | Code fence syntax highlighting for rendered Markdown blocks | Shiki gives you high-quality tokenization and theme fidelity. `@shikijs/core` is the right choice here because the app only needs a curated language/theme set, not a kitchen-sink browser bundle. |
| CSS theme files plus CSS variables | repo-managed | Theme system for GitHub, Vue, One Dark, and future themes | Typora’s own theme model is CSS-file based. That makes plain CSS theme files the right mental model for this product too: easy to ship, easy to inspect, and easy to extend without binding the product to a runtime theming framework. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tauri-apps/plugin-dialog` | current major `2` | Native folder picker, open/save dialogs, destructive-action confirmations | Use now for selecting the single workspace root and for save/open flows. Keep it on the same major as Tauri core. |
| `@tauri-apps/plugin-fs` | current major `2` | Scoped file reads/writes, directory operations, and path-safe filesystem access | Use now for straightforward file operations from the frontend where Tauri’s scoped FS API is sufficient. For heavier workspace crawling or search, prefer Rust-side commands. |
| `@tauri-apps/plugin-store` | current major `2` | Persist app settings such as last workspace, active theme, window/editor preferences | Use now. This is the right persistence layer for lightweight app settings; do not overbuild a database for preferences. |
| `@milkdown/plugin-history` | 7.15.5 | Undo/redo behavior inside the editor | Use now. This is table stakes for a writing tool. |
| `@milkdown/plugin-listener` | 7.15.5 | Observe document/markdown changes and sync saves, outline, dirty state, word count | Use now. It is the cleanest way to bridge editor changes into React/Tauri app state. |
| `@milkdown/plugin-upload` | 7.15.5 | Intercept image paste/drop and hand off asset persistence to your app logic | Use now if you want image paste to feel first-class. Replace the default base64 behavior with a custom uploader that writes to document-adjacent `assets/` folders. |
| `zustand` | 5.0.8 | App-level UI/workspace state outside the editor engine | Use now for selected root, open document, search panel state, theme choice, and transient UI state. Keep editor document state in Milkdown/ProseMirror, not duplicated in Zustand. |
| `@tanstack/react-virtual` | 3.13.12 | Virtualized file trees and long search result lists | Use later when the workspace tree or search results become large enough to cause visible rendering cost. Not required on day one if the initial file browser remains small and simple. |
| Rust-side search/watch crates (`ignore`, `grep-searcher`, `notify`) | current major | File tree crawling, incremental workspace updates, and full-text search that stays off the webview thread | Use now for performance-critical local indexing/search paths. Exact crate versions are intentionally left at `current major` here because this recommendation is an inference from the Rust/Tauri ecosystem, not a pinned-source package audit. |
| `@codemirror/lang-markdown` | 6.3.4 | Fallback source-mode Markdown editing only | Use later only if you deliberately add an optional raw Markdown/source mode, command palette preview, or conflict-resolution editor. It should not be the primary Typora-like editing experience. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite 7 | Frontend dev server and production build | Already in the repo. Keep it; it is fast enough and already wired into `tauri.conf.json`. |
| `@tauri-apps/cli` 2.x | Desktop dev/build workflow | Already in the repo. Add plugins through the Tauri CLI so JS and Rust sides stay aligned. |
| Vitest (`current major`) | Unit/integration tests for editor commands, serialization, theme logic, and state stores | Add early. Focus tests on markdown transformations, path logic, and save semantics rather than pixel-perfect editor DOM snapshots. |
| Playwright (`current major`) | End-to-end verification for workspace selection, file operations, paste-image flow, and theme switching | Add once the first vertical slice exists. Use it to validate the real desktop flow or the webview shell, not just isolated components. |
| pnpm | Package manager consistency | `tauri.conf.json` already calls `pnpm dev` and `pnpm build`; do not mix npm/yarn into this repo. |

## Installation

```bash
# Core
pnpm add @milkdown/core@7.15.5 @milkdown/react@7.15.5 @milkdown/preset-commonmark@7.15.5 @shikijs/core@3.12.2 zustand@5.0.8

# Supporting
pnpm add @milkdown/plugin-history@7.15.5 @milkdown/plugin-listener@7.15.5 @milkdown/plugin-upload@7.15.5 @tauri-apps/plugin-dialog@^2 @tauri-apps/plugin-fs@^2 @tauri-apps/plugin-store@^2

# Later, when UI scale justifies it
pnpm add @tanstack/react-virtual@3.13.12

# Dev dependencies
pnpm add -D vitest @playwright/test
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Milkdown 7.15.5 as the primary editor | `@codemirror/lang-markdown` 6.3.4 plus a CodeMirror-first editor | Use CodeMirror only if you decide the product is actually a source-editor-first Markdown tool with preview affordances, not a Typora-like live-preview writer. |
| Tauri plugin store for preferences | `localStorage` or a custom JSON settings layer | Only use the alternative for throwaway prototypes. For a desktop product, plugin-store is cleaner and survives restarts without inventing another persistence format. |
| `@shikijs/core` | A lighter custom highlighter or plain text code fences | Only use the alternative if startup cost becomes more important than high-quality highlighting and theme fidelity. |
| Rust-side search/watch services | Frontend-only recursive scanning with the JS filesystem APIs | Use the JS-only route only for tiny workspaces or early prototypes. For a real local editor, search and crawling should not compete with typing/rendering on the webview thread. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Monaco or a VS Code-style code editor as the primary editor core | It optimizes for source editing, not Typora-like live preview. It will push the product toward a code-editor feel instead of a writing-tool feel. | Milkdown as the primary editor; optionally add CodeMirror later as a secondary source mode. |
| Split-pane edit/preview architecture as the default UX | It violates the stated product goal. The core interaction should be a single writing surface with live formatting feedback. | Milkdown live-preview editing in a single pane. |
| Tailwind as the primary theme system | This product needs user-recognizable, file-backed themes closer to Typora’s CSS model. Utility-class theming adds indirection without helping the theme authoring story. | CSS theme files plus CSS variables under a dedicated theme directory. |
| SQLite/FTS as a v1 requirement for search/settings | It adds schema and migration overhead before the product even proves its basic workspace and search flows. | Tauri plugin-store for preferences and Rust-side file scanning/search for v1. |

## Stack Patterns by Variant

**If the goal remains strict Typora-like live preview in v1:**
- Use Milkdown as the only editor surface.
- Keep Markdown as the source of truth and style it through CSS theme files.
- Route image paste/drop through `@milkdown/plugin-upload` into Tauri FS commands that write to document-adjacent `assets/`.

**If you later add an optional source mode:**
- Add CodeMirror 6 only for that secondary mode.
- Reuse the same document/file services and theme tokens.
- Do not fork command handling or persistence into a separate stack.

**If workspaces become very large:**
- Move more file crawling, watch, and search work into Rust services.
- Add list virtualization in React.
- Add an indexed search engine later only after measuring that streaming search is insufficient.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `react@19.1.x` | `vite@7.x`, `typescript@5.8.x`, `@milkdown/react@7.15.5` | This matches the current repo baseline; no stack replacement is needed. |
| `tauri@2.x` | `@tauri-apps/plugin-dialog@^2`, `@tauri-apps/plugin-fs@^2`, `@tauri-apps/plugin-store@^2` | Keep every Tauri plugin on major `2` to avoid runtime and permission mismatches. |
| `@milkdown/core@7.15.5` | `@milkdown/react@7.15.5`, `@milkdown/preset-commonmark@7.15.5`, `@milkdown/plugin-history@7.15.5`, `@milkdown/plugin-listener@7.15.5`, `@milkdown/plugin-upload@7.15.5` | Pin the entire Milkdown set to one exact version. Do not mix 7.15.x packages loosely. |
| `@shikijs/core@3.12.2` | Milkdown-rendered code blocks | Treat Shiki as a render/highlight concern, not as the editing engine. |
| `zustand@5.0.8` | React 19 app shell | Good fit for app chrome and workspace state; keep document editing state out of it. |

## Sources

- Local repo `package.json` and `src-tauri/Cargo.toml` — verified existing stack: React 19.1.x, TypeScript 5.8.x, Vite 7.x, Tauri 2.x
- Tauri Dialog docs: https://v2.tauri.app/plugin/dialog/ and JS reference https://v2.tauri.app/reference/javascript/dialog/
- Tauri Store docs: https://v2.tauri.app/plugin/store/
- Tauri FS JS reference: https://v2.tauri.app/reference/javascript/fs/
- Milkdown official site: https://milkdown.dev/
- npm: `@milkdown/react` https://www.npmjs.com/package/@milkdown/react
- npm: `@milkdown/core` https://www.npmjs.com/package/@milkdown/core
- npm: `@milkdown/preset-commonmark` https://www.npmjs.com/package/@milkdown/preset-commonmark
- npm: `@milkdown/plugin-history` https://www.npmjs.com/package/@milkdown/plugin-history
- npm: `@milkdown/plugin-listener` https://www.npmjs.com/package/@milkdown/plugin-listener
- npm: `@milkdown/plugin-upload` https://www.npmjs.com/package/@milkdown/plugin-upload
- Typora Quick Start: https://support.typora.io/Quick-Start/
- Typora About Themes: https://support.typora.io/About-Themes/
- npm: `@shikijs/core` https://www.npmjs.com/package/@shikijs/core
- npm: `zustand` https://www.npmjs.com/package/zustand
- npm: `@tanstack/react-virtual` https://www.npmjs.com/package/@tanstack/react-virtual
- npm: `@codemirror/lang-markdown` https://www.npmjs.com/package/@codemirror/lang-markdown

---
*Stack research for: Windows-only local-first Markdown desktop editor*
*Researched: 2026-04-16*
