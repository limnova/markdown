# Coding Conventions

**Analysis Date:** 2026-04-16

## Naming Patterns

**Files:**
- Use PascalCase for React component files that export a component, matching `src/App.tsx`.
- Use lowercase entry and config filenames for bootstrap code, matching `src/main.tsx`, `vite.config.ts`, `src-tauri/src/main.rs`, and `src-tauri/src/lib.rs`.
- Keep stylesheet filenames aligned with the component they style, matching `src/App.css`.

**Functions:**
- Use PascalCase for React component functions, matching `function App()` in `src/App.tsx`.
- Use camelCase for frontend helpers and event-driven actions, matching `greet` in `src/App.tsx`.
- Use snake_case or lowercase Rust function names for Tauri commands and startup functions, matching `greet` and `run` in `src-tauri/src/lib.rs`.

**Variables:**
- Use camelCase for local variables and React state, matching `greetMsg`, `setGreetMsg`, `name`, and `setName` in `src/App.tsx`.
- Pair React state setters with the same base name as the state value, matching `name` and `setName` in `src/App.tsx`.
- Use lowercase class names and kebab-case IDs in markup and CSS, matching `className="container"`, `className="row"`, `className="logo react"`, and `id="greet-input"` in `src/App.tsx` and `src/App.css`.

**Types:**
- No project-defined `interface`, `type`, or shared model files are detected under `src/` or `src-tauri/src/`.
- Rely on inference for most frontend values and use narrow assertions only at boundaries, matching `document.getElementById("root") as HTMLElement` in `src/main.tsx`.
- Keep ambient declarations in dedicated `.d.ts` files, matching `src/vite-env.d.ts`.

## Code Style

**Formatting:**
- No `.prettierrc*`, `prettier.config.*`, `biome.json`, or `.editorconfig` files are detected at the repo root next to `package.json`.
- Source files in `src/` and `src-tauri/src/` use 2-space indentation, double quotes in TypeScript, semicolons, and trailing commas in multiline calls, matching `src/App.tsx`, `src/main.tsx`, and `vite.config.ts`.
- Rust files in `src-tauri/src/` follow standard `rustfmt`-style indentation and chained builder formatting, matching `src-tauri/src/lib.rs` and `src-tauri/src/main.rs`.

**Linting:**
- No `eslint.config.*`, `.eslintrc*`, `biome.json`, `clippy.toml`, or `rustfmt.toml` files are detected.
- TypeScript strictness is enforced through `tsconfig.json`, including `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- `vite.config.ts` uses a documented `@ts-expect-error` for the Node `process` global, so type suppressions are explicit and commented when required.

## Import Organization

**Order:**
1. Import framework and package dependencies first, as in `src/main.tsx`.
2. Import local components, assets, and other relative modules next, as in `src/main.tsx` and `src/App.tsx`.
3. Import side-effect styles with a relative path, as in `src/App.tsx`.

**Path Aliases:**
- No path aliases are configured in `tsconfig.json`.
- Use relative imports such as `./App`, `./App.css`, and `./assets/react.svg`, matching `src/main.tsx` and `src/App.tsx`.

## Component and Style Patterns

**Components:**
- Keep React UI in function components rather than classes, matching `src/App.tsx`.
- Define small file-local handlers inside the component when the logic is only used by that component, matching `greet` in `src/App.tsx`.
- Use inline event handlers for simple form behavior, matching the `onSubmit` and `onChange` callbacks in `src/App.tsx`.

**Styling:**
- Use a plain global stylesheet imported by the component, matching `src/App.css` imported from `src/App.tsx`.
- Style with class selectors, element selectors, and targeted IDs rather than CSS Modules or CSS-in-JS, matching `.container`, `.row`, `.logo.react`, `a:hover`, and `#greet-input` in `src/App.css`.
- Keep responsive or theme-specific overrides in the same stylesheet via media queries, matching `@media (prefers-color-scheme: dark)` in `src/App.css`.

## Error Handling

**Patterns:**
- Frontend async calls currently await Tauri IPC directly without `try/catch`, matching `setGreetMsg(await invoke("greet", { name }))` in `src/App.tsx`.
- Native startup fails fast with `.expect(...)` during Tauri boot, matching `.expect("error while running tauri application")` in `src-tauri/src/lib.rs`.
- Form events prevent default behavior inline before calling async work, matching the `onSubmit` handler in `src/App.tsx`.

## Logging

**Framework:** No logging framework or `console.*` usage is detected in `src/` or `src-tauri/src/`.

**Patterns:**
- Runtime behavior is documented with source comments rather than logs, matching the environment note in `vite.config.ts` and platform note in `src-tauri/src/main.rs`.
- No structured logger, error reporter, or debug helper module is present under `src/` or `src-tauri/src/`.

## Comments

**When to Comment:**
- Add comments for platform-specific or environment-specific behavior, matching the Tauri host and file-watching comments in `vite.config.ts`.
- Add comments for framework-required attributes that would otherwise look arbitrary, matching the Windows subsystem comment in `src-tauri/src/main.rs`.

**JSDoc/TSDoc:**
- JSDoc and TSDoc comments are not detected in `src/`.
- Rust doc comments are not detected in `src-tauri/src/`.

## Function Design

**Size:** Keep functions small and file-local. The current codebase uses one primary React component in `src/App.tsx`, one small helper inside that component, and minimal bootstrap functions in `src-tauri/src/main.rs` and `src-tauri/src/lib.rs`.

**Parameters:**
- Prefer inferred React event types from JSX handlers, matching `e.currentTarget.value` and `e.preventDefault()` in `src/App.tsx`.
- Use borrowed string inputs for simple Rust Tauri commands, matching `fn greet(name: &str) -> String` in `src-tauri/src/lib.rs`.

**Return Values:**
- React components return JSX trees, matching `App` in `src/App.tsx`.
- Frontend async helpers update component state instead of returning a separate result object, matching `greet` in `src/App.tsx`.
- Rust commands return owned values suitable for IPC serialization, matching the `String` return in `src-tauri/src/lib.rs`.

## Module Design

**Exports:**
- Use a single default export for the file's primary React component, matching `export default App` in `src/App.tsx`.
- Use default export for Vite configuration, matching `export default defineConfig(...)` in `vite.config.ts`.
- Keep Rust bootstrap wiring in the library crate and call it from the binary entrypoint, matching `pub fn run()` in `src-tauri/src/lib.rs` and `react_tauri_app_lib::run()` in `src-tauri/src/main.rs`.

**Barrel Files:**
- Barrel files are not detected under `src/` or `src-tauri/src/`.
- Modules are imported directly from their implementation file paths.

---

*Convention analysis: 2026-04-16*
