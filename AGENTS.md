<!-- GSD:project-start source:PROJECT.md -->
## Project

**Typora-Like Markdown Editor**

这是一个面向 Windows 的本地 Markdown 桌面编辑器，目标是在公司环境中替代 Typora，保留接近 Typora 的单栏、所见即所得、流畅书写体验。它围绕用户手动指定的单个根目录工作，负责文档编辑、基础文件管理、全文搜索、图片粘贴落盘，以及少量高质量内置主题。

产品定位不是“功能很多的知识库”或“通用代码编辑器”，而是一个本地优先、顺手、稳定、视觉体验不错的 Markdown 写作工具。架构上要求开源、模块化、可扩展，但 v1 优先把核心写作体验和本地文件流转做好。

**Core Value:** 用户可以在 Windows 上用一个本地、顺手、稳定的 Markdown 编辑器，获得接近 Typora 的流畅写作体验，而不依赖商业授权、云服务或复杂外部系统。

### Constraints

- **Platform**: Windows only for v1 — 先把单平台桌面体验打磨到可长期日用，再考虑跨平台
- **Architecture**: Keep existing React + TypeScript + Tauri foundation unless proven insufficient — 当前代码骨架和桌面打包链路已存在，优先在现有基础上演进
- **Performance**: Editing feel must stay smooth for large documents — 用户把流畅写作体验放在第一优先级，不能为了堆功能牺牲输入手感
- **Workspace Model**: One user-selected root directory is the only content scope — 文件管理、搜索、图片和状态都要围绕单根目录设计
- **Product Scope**: Local-only Markdown workflow — 不引入云同步、协作、插件市场、导出等非核心能力
- **UX**: Single-pane near-WYSIWYG writing experience — 不采用明显的双栏编辑/预览切换作为核心交互模型
- **Maintainability**: Modular and open-source friendly implementation — 编辑器、文件系统、主题、搜索、状态和设置要保持边界清晰
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript `5.8.3` locked in `pnpm-lock.yaml` and configured in `tsconfig.json`; application code lives in `src/main.tsx` and `src/App.tsx`.
- Rust `edition = "2021"` in `src-tauri/Cargo.toml`; the desktop shell and native command bridge live in `src-tauri/src/lib.rs` and `src-tauri/src/main.rs`.
- HTML is used for the web entry document in `index.html`.
- CSS is used for UI styling in `src/App.css`.
- JSON is used for desktop configuration and permissions in `src-tauri/tauri.conf.json` and `src-tauri/capabilities/default.json`.
- SVG and PNG assets are bundled from `public/`, `src/assets/`, and `src-tauri/icons/`.
## Runtime
- Node.js is required for the frontend toolchain. `vite@7.3.2` in `pnpm-lock.yaml` declares `^20.19.0 || >=22.12.0`. The local environment reports `node v22.21.1`.
- Rust/Cargo is required for the desktop shell. The local environment reports `cargo 1.94.0` and `rustc 1.94.0`.
- Tauri desktop runtime is configured through `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.
- Use `pnpm` at the repo root. `pnpm-lock.yaml` is present and `pnpm-workspace.yaml` exists, although only the root package is currently defined.
- Use Cargo for the native shell in `src-tauri/`. `src-tauri/Cargo.lock` is present.
- The local environment reports `pnpm 10.33.0`.
## Frameworks
- React `^19.1.0` in `package.json`, locked to `19.2.5` in `pnpm-lock.yaml` - UI framework mounted in `src/main.tsx` and implemented in `src/App.tsx`.
- Tauri `2` in `src-tauri/Cargo.toml`, locked to `tauri 2.10.3` in `src-tauri/Cargo.lock` - native desktop container, IPC bridge, and bundling layer.
- Vite `^7.0.4` in `package.json`, locked to `7.3.2` in `pnpm-lock.yaml` - frontend dev server and production bundler configured in `vite.config.ts`.
- Not detected. `package.json` has no test script, there is no frontend test dependency, and no test config file is present at the repo root.
- TypeScript compiler `~5.8.3` in `package.json`, locked to `5.8.3` in `pnpm-lock.yaml` - type-checking during `pnpm build`.
- `@vitejs/plugin-react` `^4.6.0` in `package.json`, locked to `4.7.0` in `pnpm-lock.yaml` - React transform plugin loaded in `vite.config.ts`.
- `@tauri-apps/cli` `^2` in `package.json`, locked to `2.10.1` in `pnpm-lock.yaml` - desktop dev/build command surface exposed through the `tauri` script in `package.json`.
- `tauri-build` `2` in `src-tauri/Cargo.toml`, locked to `2.5.6` in `src-tauri/Cargo.lock` - build script executed by `src-tauri/build.rs`.
## Key Dependencies
- `@tauri-apps/api` `^2` in `package.json`, locked to `2.10.1` in `pnpm-lock.yaml` - frontend IPC client used by `src/App.tsx` via `invoke("greet", ...)`.
- `tauri` `2` in `src-tauri/Cargo.toml`, locked to `2.10.3` in `src-tauri/Cargo.lock` - Rust-side application builder and command registration in `src-tauri/src/lib.rs`.
- `react-dom` `^19.1.0` in `package.json`, locked to `19.2.5` in `pnpm-lock.yaml` - browser renderer used in `src/main.tsx`.
- `@tauri-apps/plugin-opener` `^2` in `package.json`, locked to `2.5.3` in `pnpm-lock.yaml` - desktop opener bridge available to the app.
- `tauri-plugin-opener` `2` in `src-tauri/Cargo.toml`, locked to `2.5.3` in `src-tauri/Cargo.lock` - plugin initialized in `src-tauri/src/lib.rs`.
- `serde` `1` and `serde_json` `1` in `src-tauri/Cargo.toml`, locked to `1.0.228` and `1.0.149` in `src-tauri/Cargo.lock` - serialization support for Rust-side command payloads.
## Configuration
- The only detected environment variable read is `TAURI_DEV_HOST` in `vite.config.ts`. It controls the dev server host and HMR host when running under Tauri.
- No `.env`, `.env.local`, `.env.development`, `.env.production`, `src-tauri/.env`, or `src-tauri/.env.local` files are present.
- The repo does not pin Node via `.nvmrc` and does not declare a `packageManager` field in `package.json`.
- `package.json` defines `dev`, `build`, `preview`, and `tauri` scripts.
- `vite.config.ts` fixes the dev server to port `1420`, HMR to `1421` when `TAURI_DEV_HOST` is set, and ignores `src-tauri/**` during file watching.
- `tsconfig.json` enables strict TypeScript checks with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- `tsconfig.node.json` covers Node-side typing for `vite.config.ts`.
- `src-tauri/tauri.conf.json` wires Tauri to `pnpm dev`, `pnpm build`, and the built frontend output in `dist/`.
- `.cargo/config.toml` overrides Cargo's `target-dir` to `D:/env/cargo-targets/react-tauri-app`.
- `src-tauri/build.rs` delegates build metadata generation to `tauri_build::build()`.
## Platform Requirements
- Frontend work requires Node.js plus `pnpm` at the repo root (`package.json`, `pnpm-lock.yaml`).
- Desktop work requires Rust and Cargo under `src-tauri/` (`src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`).
- Tauri development expects the Vite dev server at `http://localhost:1420` (`src-tauri/tauri.conf.json`) and the matching Vite server config in `vite.config.ts`.
- The deliverable is a bundled desktop application, not a deployed web server. `src-tauri/tauri.conf.json` sets `"bundle.active": true` and `"targets": "all"`.
- Desktop window metadata is defined in `src-tauri/tauri.conf.json` and icon assets are sourced from `src-tauri/icons/`.
- The frontend build output consumed by Tauri is the static `dist/` directory referenced by `src-tauri/tauri.conf.json`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use PascalCase for React component files that export a component, matching `src/App.tsx`.
- Use lowercase entry and config filenames for bootstrap code, matching `src/main.tsx`, `vite.config.ts`, `src-tauri/src/main.rs`, and `src-tauri/src/lib.rs`.
- Keep stylesheet filenames aligned with the component they style, matching `src/App.css`.
- Use PascalCase for React component functions, matching `function App()` in `src/App.tsx`.
- Use camelCase for frontend helpers and event-driven actions, matching `greet` in `src/App.tsx`.
- Use snake_case or lowercase Rust function names for Tauri commands and startup functions, matching `greet` and `run` in `src-tauri/src/lib.rs`.
- Use camelCase for local variables and React state, matching `greetMsg`, `setGreetMsg`, `name`, and `setName` in `src/App.tsx`.
- Pair React state setters with the same base name as the state value, matching `name` and `setName` in `src/App.tsx`.
- Use lowercase class names and kebab-case IDs in markup and CSS, matching `className="container"`, `className="row"`, `className="logo react"`, and `id="greet-input"` in `src/App.tsx` and `src/App.css`.
- No project-defined `interface`, `type`, or shared model files are detected under `src/` or `src-tauri/src/`.
- Rely on inference for most frontend values and use narrow assertions only at boundaries, matching `document.getElementById("root") as HTMLElement` in `src/main.tsx`.
- Keep ambient declarations in dedicated `.d.ts` files, matching `src/vite-env.d.ts`.
## Code Style
- No `.prettierrc*`, `prettier.config.*`, `biome.json`, or `.editorconfig` files are detected at the repo root next to `package.json`.
- Source files in `src/` and `src-tauri/src/` use 2-space indentation, double quotes in TypeScript, semicolons, and trailing commas in multiline calls, matching `src/App.tsx`, `src/main.tsx`, and `vite.config.ts`.
- Rust files in `src-tauri/src/` follow standard `rustfmt`-style indentation and chained builder formatting, matching `src-tauri/src/lib.rs` and `src-tauri/src/main.rs`.
- No `eslint.config.*`, `.eslintrc*`, `biome.json`, `clippy.toml`, or `rustfmt.toml` files are detected.
- TypeScript strictness is enforced through `tsconfig.json`, including `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- `vite.config.ts` uses a documented `@ts-expect-error` for the Node `process` global, so type suppressions are explicit and commented when required.
## Import Organization
- No path aliases are configured in `tsconfig.json`.
- Use relative imports such as `./App`, `./App.css`, and `./assets/react.svg`, matching `src/main.tsx` and `src/App.tsx`.
## Component and Style Patterns
- Keep React UI in function components rather than classes, matching `src/App.tsx`.
- Define small file-local handlers inside the component when the logic is only used by that component, matching `greet` in `src/App.tsx`.
- Use inline event handlers for simple form behavior, matching the `onSubmit` and `onChange` callbacks in `src/App.tsx`.
- Use a plain global stylesheet imported by the component, matching `src/App.css` imported from `src/App.tsx`.
- Style with class selectors, element selectors, and targeted IDs rather than CSS Modules or CSS-in-JS, matching `.container`, `.row`, `.logo.react`, `a:hover`, and `#greet-input` in `src/App.css`.
- Keep responsive or theme-specific overrides in the same stylesheet via media queries, matching `@media (prefers-color-scheme: dark)` in `src/App.css`.
## Error Handling
- Frontend async calls currently await Tauri IPC directly without `try/catch`, matching `setGreetMsg(await invoke("greet", { name }))` in `src/App.tsx`.
- Native startup fails fast with `.expect(...)` during Tauri boot, matching `.expect("error while running tauri application")` in `src-tauri/src/lib.rs`.
- Form events prevent default behavior inline before calling async work, matching the `onSubmit` handler in `src/App.tsx`.
## Logging
- Runtime behavior is documented with source comments rather than logs, matching the environment note in `vite.config.ts` and platform note in `src-tauri/src/main.rs`.
- No structured logger, error reporter, or debug helper module is present under `src/` or `src-tauri/src/`.
## Comments
- Add comments for platform-specific or environment-specific behavior, matching the Tauri host and file-watching comments in `vite.config.ts`.
- Add comments for framework-required attributes that would otherwise look arbitrary, matching the Windows subsystem comment in `src-tauri/src/main.rs`.
- JSDoc and TSDoc comments are not detected in `src/`.
- Rust doc comments are not detected in `src-tauri/src/`.
## Function Design
- Prefer inferred React event types from JSX handlers, matching `e.currentTarget.value` and `e.preventDefault()` in `src/App.tsx`.
- Use borrowed string inputs for simple Rust Tauri commands, matching `fn greet(name: &str) -> String` in `src-tauri/src/lib.rs`.
- React components return JSX trees, matching `App` in `src/App.tsx`.
- Frontend async helpers update component state instead of returning a separate result object, matching `greet` in `src/App.tsx`.
- Rust commands return owned values suitable for IPC serialization, matching the `String` return in `src-tauri/src/lib.rs`.
## Module Design
- Use a single default export for the file's primary React component, matching `export default App` in `src/App.tsx`.
- Use default export for Vite configuration, matching `export default defineConfig(...)` in `vite.config.ts`.
- Keep Rust bootstrap wiring in the library crate and call it from the binary entrypoint, matching `pub fn run()` in `src-tauri/src/lib.rs` and `react_tauri_app_lib::run()` in `src-tauri/src/main.rs`.
- Barrel files are not detected under `src/` or `src-tauri/src/`.
- Modules are imported directly from their implementation file paths.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- The web UI is mounted once from `index.html` into `src/main.tsx`, and all current application behavior lives inside the root component in `src/App.tsx`.
- Native functionality is exposed through Tauri IPC: the frontend calls `invoke()` from `@tauri-apps/api/core` in `src/App.tsx`, and Rust commands are registered in `src-tauri/src/lib.rs`.
- Build orchestration is split by responsibility: Vite owns the frontend bundle (`vite.config.ts`, `package.json`), while Tauri owns the desktop window, permissions, and packaging (`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`).
## Layers
- Purpose: Start the browser-side application and point the page at the React entry module.
- Location: `index.html`, `src/main.tsx`, `vite.config.ts`
- Contains: The root `<div id="root">`, the module script that loads `src/main.tsx`, and Vite dev-server settings tailored for Tauri.
- Depends on: React DOM, Vite, the Tauri dev host environment variable in `vite.config.ts`.
- Used by: `pnpm dev`, `pnpm build`, and Tauri's `beforeDevCommand` / `beforeBuildCommand` in `src-tauri/tauri.conf.json`.
- Purpose: Render the desktop UI and hold browser-side interaction state.
- Location: `src/App.tsx`, `src/App.css`, `src/assets/react.svg`, `public/vite.svg`, `public/tauri.svg`
- Contains: The greeting form, logo links, local state via `useState`, and CSS for layout and theme response.
- Depends on: React hooks, Tauri API calls, static assets, and browser form events.
- Used by: The root render in `src/main.tsx`.
- Purpose: Define what the frontend may call into the native layer and under which permissions.
- Location: `src/App.tsx`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`
- Contains: `invoke("greet", { name })` on the frontend, the `#[tauri::command] fn greet(...)` command on the Rust side, and the `default` capability that grants `core:default` plus `opener:default`.
- Depends on: `@tauri-apps/api/core`, `tauri`, `tauri-plugin-opener`.
- Used by: Any browser-side code that needs native execution. At present, only the greet flow uses it.
- Purpose: Start the Tauri runtime, attach plugins, register commands, and create the desktop application process.
- Location: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`
- Contains: The binary entry point in `main.rs`, the reusable `run()` function in `lib.rs`, the opener plugin registration, and the invoke handler registration.
- Depends on: Tauri runtime context generated from `src-tauri/tauri.conf.json`.
- Used by: The desktop binary produced from `src-tauri/Cargo.toml`.
- Purpose: Centralize app metadata, window properties, packaging, build handoff, and Cargo build behavior.
- Location: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `.cargo/config.toml`, `package.json`, `pnpm-workspace.yaml`
- Contains: App identifier and window size, frontend build hooks, Rust dependencies, Tauri build-script invocation, and the Cargo target-dir override.
- Depends on: Tauri CLI, Cargo, pnpm, and Vite.
- Used by: Local development, packaging, and desktop startup.
## Data Flow
- Browser-side state is local component state only: `name` and `greetMsg` are managed by `useState` inside `src/App.tsx`.
- There is no router, global store, React context, reducer, cache layer, or persistence mechanism under `src/`.
- Native-side state is effectively stateless: `src-tauri/src/lib.rs` registers a pure command and does not hold shared application data.
## Key Abstractions
- Purpose: Own the entire rendered UI and the only frontend state flow.
- Examples: `src/App.tsx`
- Pattern: One top-level function component with inline event handlers and local hooks.
- Purpose: Represent a callable native capability that can be triggered from the webview.
- Examples: `src-tauri/src/lib.rs`
- Pattern: Annotate Rust functions with `#[tauri::command]` and include them in `tauri::generate_handler![...]`.
- Purpose: Assemble plugins, commands, and the generated app context before the desktop event loop starts.
- Examples: `src-tauri/src/lib.rs`
- Pattern: Keep startup composition inside `pub fn run()` and call it from `src-tauri/src/main.rs`.
- Purpose: Bound IPC access for the main window.
- Examples: `src-tauri/capabilities/default.json`
- Pattern: Window-scoped capability document listing named permission sets.
## Entry Points
- Location: `index.html`
- Triggers: Browser load in Vite dev mode or Tauri webview load.
- Responsibilities: Provide the root mount node and load `src/main.tsx`.
- Location: `src/main.tsx`
- Triggers: Module load from `index.html`.
- Responsibilities: Create the React root and render the single app component.
- Location: `src/App.tsx`
- Triggers: Initial render from `src/main.tsx` and subsequent React state updates.
- Responsibilities: Render the UI, manage input/result state, and call Tauri IPC.
- Location: `src-tauri/src/main.rs`
- Triggers: Desktop app launch.
- Responsibilities: Hide the extra Windows console in release builds and delegate startup into the shared library entry.
- Location: `src-tauri/src/lib.rs`
- Triggers: Call from `src-tauri/src/main.rs`.
- Responsibilities: Build the Tauri application, register plugins and commands, and run the native event loop.
## Error Handling
- `src/App.tsx` awaits `invoke("greet", ...)` directly and does not catch or surface IPC failures; an invoke rejection would bubble as an unhandled promise from the submit path.
- `src-tauri/src/lib.rs` ends startup with `.expect("error while running tauri application")`, so runtime startup failures terminate the process rather than being recovered.
## Cross-Cutting Concerns
- Keep webview-only concerns in `src/`; browser code currently reaches native functionality only through `invoke()` in `src/App.tsx`.
- Keep command registration centralized in `src-tauri/src/lib.rs`; any new native callable should be added there or in Rust modules re-exported there so `generate_handler!` stays authoritative.
- Keep security scope aligned with actual IPC usage via `src-tauri/capabilities/default.json`; the current main window has `core:default` and `opener:default`, and no broader capability files are present.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## Local Packaging Notes

- 本机本地桌面打包使用 `pnpm tauri build`。
- Cargo target 目录固定为 `C:/Users/18114/.cargo-targets/react-tauri-app`，配置写在 `.cargo/config.toml`。
- 旧路径 `D:/env/cargo-targets/react-tauri-app` 在本机 release 打包时会被 Windows 应用程序控制策略拦截 `schemars_derive-*.dll`，不要再切回去。
- 当前已确认 `pnpm tauri build` 可以走通并产出安装包，但单独执行 `cargo check --manifest-path src-tauri/Cargo.toml` 仍可能在 debug build-script 阶段被本机策略拦截。
- 如果只是临时覆盖 target 目录，可在 PowerShell 里运行 `$env:CARGO_TARGET_DIR='C:\Users\18114\.cargo-targets\react-tauri-app'; pnpm tauri build`。
- 当前本机成功产物位置：
  - `C:\Users\18114\.cargo-targets\react-tauri-app\release\bundle\msi\react-tauri-app_0.1.0_x64_en-US.msi`
  - `C:\Users\18114\.cargo-targets\react-tauri-app\release\bundle\nsis\react-tauri-app_0.1.0_x64-setup.exe`
