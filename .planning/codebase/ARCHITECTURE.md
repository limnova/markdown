# Architecture

**Analysis Date:** 2026-04-16

## Pattern Overview

**Overall:** Two-process desktop app with a single-root React frontend embedded in a Tauri shell.

**Key Characteristics:**
- The web UI is mounted once from `index.html` into `src/main.tsx`, and all current application behavior lives inside the root component in `src/App.tsx`.
- Native functionality is exposed through Tauri IPC: the frontend calls `invoke()` from `@tauri-apps/api/core` in `src/App.tsx`, and Rust commands are registered in `src-tauri/src/lib.rs`.
- Build orchestration is split by responsibility: Vite owns the frontend bundle (`vite.config.ts`, `package.json`), while Tauri owns the desktop window, permissions, and packaging (`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`).

## Layers

**HTML/Vite Bootstrap:**
- Purpose: Start the browser-side application and point the page at the React entry module.
- Location: `index.html`, `src/main.tsx`, `vite.config.ts`
- Contains: The root `<div id="root">`, the module script that loads `src/main.tsx`, and Vite dev-server settings tailored for Tauri.
- Depends on: React DOM, Vite, the Tauri dev host environment variable in `vite.config.ts`.
- Used by: `pnpm dev`, `pnpm build`, and Tauri's `beforeDevCommand` / `beforeBuildCommand` in `src-tauri/tauri.conf.json`.

**Frontend UI Layer:**
- Purpose: Render the desktop UI and hold browser-side interaction state.
- Location: `src/App.tsx`, `src/App.css`, `src/assets/react.svg`, `public/vite.svg`, `public/tauri.svg`
- Contains: The greeting form, logo links, local state via `useState`, and CSS for layout and theme response.
- Depends on: React hooks, Tauri API calls, static assets, and browser form events.
- Used by: The root render in `src/main.tsx`.

**Tauri IPC Boundary:**
- Purpose: Define what the frontend may call into the native layer and under which permissions.
- Location: `src/App.tsx`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`
- Contains: `invoke("greet", { name })` on the frontend, the `#[tauri::command] fn greet(...)` command on the Rust side, and the `default` capability that grants `core:default` plus `opener:default`.
- Depends on: `@tauri-apps/api/core`, `tauri`, `tauri-plugin-opener`.
- Used by: Any browser-side code that needs native execution. At present, only the greet flow uses it.

**Native Runtime Layer:**
- Purpose: Start the Tauri runtime, attach plugins, register commands, and create the desktop application process.
- Location: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`
- Contains: The binary entry point in `main.rs`, the reusable `run()` function in `lib.rs`, the opener plugin registration, and the invoke handler registration.
- Depends on: Tauri runtime context generated from `src-tauri/tauri.conf.json`.
- Used by: The desktop binary produced from `src-tauri/Cargo.toml`.

**Desktop Configuration Layer:**
- Purpose: Centralize app metadata, window properties, packaging, build handoff, and Cargo build behavior.
- Location: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `.cargo/config.toml`, `package.json`, `pnpm-workspace.yaml`
- Contains: App identifier and window size, frontend build hooks, Rust dependencies, Tauri build-script invocation, and the Cargo target-dir override.
- Depends on: Tauri CLI, Cargo, pnpm, and Vite.
- Used by: Local development, packaging, and desktop startup.

## Data Flow

**Desktop Startup Flow:**

1. Tauri reads `src-tauri/tauri.conf.json`, runs `pnpm dev` or `pnpm build`, and points the webview at `http://localhost:1420` in dev or `../dist` in build output.
2. `index.html` loads `src/main.tsx`, which creates a React root and renders `<App />` inside `<React.StrictMode>`.
3. The desktop binary enters through `src-tauri/src/main.rs`, delegates to `react_tauri_app_lib::run()`, and `src-tauri/src/lib.rs` starts `tauri::Builder`, registers `tauri_plugin_opener`, and exposes the `greet` command through `generate_handler!`.

**Greeting Command Flow:**

1. The user types into the uncontrolled `<input>` in `src/App.tsx`; `onChange` copies the current value into the `name` state variable.
2. The form submit handler in `src/App.tsx` prevents the browser default and calls the local async `greet()` function.
3. `greet()` calls `invoke("greet", { name })` from `@tauri-apps/api/core`, crossing from the webview into the Rust command registered in `src-tauri/src/lib.rs`.
4. Rust formats the response string in `fn greet(name: &str) -> String` and returns it through the IPC channel.
5. The frontend stores the returned string in `greetMsg` and React re-renders the `<p>{greetMsg}</p>` output.

**State Management:**
- Browser-side state is local component state only: `name` and `greetMsg` are managed by `useState` inside `src/App.tsx`.
- There is no router, global store, React context, reducer, cache layer, or persistence mechanism under `src/`.
- Native-side state is effectively stateless: `src-tauri/src/lib.rs` registers a pure command and does not hold shared application data.

## Key Abstractions

**Root App Component:**
- Purpose: Own the entire rendered UI and the only frontend state flow.
- Examples: `src/App.tsx`
- Pattern: One top-level function component with inline event handlers and local hooks.

**Tauri Command Function:**
- Purpose: Represent a callable native capability that can be triggered from the webview.
- Examples: `src-tauri/src/lib.rs`
- Pattern: Annotate Rust functions with `#[tauri::command]` and include them in `tauri::generate_handler![...]`.

**Runtime Bootstrap Function:**
- Purpose: Assemble plugins, commands, and the generated app context before the desktop event loop starts.
- Examples: `src-tauri/src/lib.rs`
- Pattern: Keep startup composition inside `pub fn run()` and call it from `src-tauri/src/main.rs`.

**Capability Manifest:**
- Purpose: Bound IPC access for the main window.
- Examples: `src-tauri/capabilities/default.json`
- Pattern: Window-scoped capability document listing named permission sets.

## Entry Points

**Browser Document Entry:**
- Location: `index.html`
- Triggers: Browser load in Vite dev mode or Tauri webview load.
- Responsibilities: Provide the root mount node and load `src/main.tsx`.

**Frontend Bootstrap Entry:**
- Location: `src/main.tsx`
- Triggers: Module load from `index.html`.
- Responsibilities: Create the React root and render the single app component.

**Frontend Application Entry:**
- Location: `src/App.tsx`
- Triggers: Initial render from `src/main.tsx` and subsequent React state updates.
- Responsibilities: Render the UI, manage input/result state, and call Tauri IPC.

**Desktop Binary Entry:**
- Location: `src-tauri/src/main.rs`
- Triggers: Desktop app launch.
- Responsibilities: Hide the extra Windows console in release builds and delegate startup into the shared library entry.

**Tauri Runtime Entry:**
- Location: `src-tauri/src/lib.rs`
- Triggers: Call from `src-tauri/src/main.rs`.
- Responsibilities: Build the Tauri application, register plugins and commands, and run the native event loop.

## Error Handling

**Strategy:** Minimal default behavior with no application-level recovery layer.

**Patterns:**
- `src/App.tsx` awaits `invoke("greet", ...)` directly and does not catch or surface IPC failures; an invoke rejection would bubble as an unhandled promise from the submit path.
- `src-tauri/src/lib.rs` ends startup with `.expect("error while running tauri application")`, so runtime startup failures terminate the process rather than being recovered.

## Cross-Cutting Concerns

**Logging:** Not detected in app code. There are no explicit `console.*` calls in `src/` and no Rust logging setup in `src-tauri/src/`.
**Validation:** Minimal browser-only input capture in `src/App.tsx`; there is no schema validation in either TypeScript or Rust.
**Authentication:** Not applicable. No auth provider, session handling, or identity layer is present.

**Tauri/Frontend Boundary Rules:**
- Keep webview-only concerns in `src/`; browser code currently reaches native functionality only through `invoke()` in `src/App.tsx`.
- Keep command registration centralized in `src-tauri/src/lib.rs`; any new native callable should be added there or in Rust modules re-exported there so `generate_handler!` stays authoritative.
- Keep security scope aligned with actual IPC usage via `src-tauri/capabilities/default.json`; the current main window has `core:default` and `opener:default`, and no broader capability files are present.

---

*Architecture analysis: 2026-04-16*
