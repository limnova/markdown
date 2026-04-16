# Codebase Structure

**Analysis Date:** 2026-04-16

## Directory Layout

```text
react-tauri-app/
├── .cargo/                 # Local Cargo configuration
├── .codex/                 # GSD/Codex automation skills, hooks, and templates
├── .planning/codebase/     # Generated codebase mapping documents
├── docs/                   # Human-authored planning and product docs
├── public/                 # Static assets copied by Vite
├── src/                    # React frontend source
├── src-tauri/              # Rust/Tauri desktop application
├── dist/                   # Generated frontend build output
├── index.html              # HTML shell for the frontend app
├── package.json            # Node scripts and frontend dependencies
├── pnpm-workspace.yaml     # pnpm workspace metadata
├── tsconfig.json           # Frontend TypeScript compiler options
└── vite.config.ts          # Vite dev/build configuration for Tauri
```

## Directory Purposes

**`src/`:**
- Purpose: Hold all browser-side application code.
- Contains: The React bootstrap file, the only application component, one CSS file, and one local SVG asset.
- Key files: `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/assets/react.svg`

**`src-tauri/`:**
- Purpose: Hold the desktop runtime, packaging config, native permissions, and Rust build metadata.
- Contains: Rust entry files, `tauri.conf.json`, `Cargo.toml`, capability manifests, generated schemas, icons, and local build output currently present in the tree.
- Key files: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`

**`src-tauri/src/`:**
- Purpose: Hold executable Rust source for the Tauri app.
- Contains: The binary entry in `main.rs` and the runtime/command setup in `lib.rs`.
- Key files: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`

**`src-tauri/capabilities/`:**
- Purpose: Declare which windows can access which Tauri permissions.
- Contains: One main-window capability manifest.
- Key files: `src-tauri/capabilities/default.json`

**`src-tauri/gen/`:**
- Purpose: Store generated schema artifacts produced by Tauri tooling.
- Contains: `schemas/acl-manifests.json`, `schemas/capabilities.json`, `schemas/desktop-schema.json`, `schemas/windows-schema.json`
- Key files: `src-tauri/gen/schemas/desktop-schema.json`, `src-tauri/gen/schemas/windows-schema.json`

**`public/`:**
- Purpose: Hold static assets referenced by absolute URL paths at runtime.
- Contains: The Vite and Tauri logo SVGs used by `src/App.tsx`.
- Key files: `public/vite.svg`, `public/tauri.svg`

**`docs/`:**
- Purpose: Hold product and implementation notes outside the runtime codepath.
- Contains: A planning document for a future editor implementation.
- Key files: `docs/typora-like-editor-plan.md`

**`dist/`:**
- Purpose: Hold the generated Vite production bundle that Tauri packages via `frontendDist`.
- Contains: Built HTML, JS, CSS, and copied assets.
- Key files: `dist/index.html`, `dist/assets/index-CMuXU7g2.js`, `dist/assets/index-ZCvx-mwu.css`

**`.cargo/`:**
- Purpose: Override Cargo behavior for the local environment.
- Contains: A target-directory redirect away from the repository tree.
- Key files: `.cargo/config.toml`

**`.codex/`:**
- Purpose: Store automation skills, templates, hooks, and workflow helpers for the repository.
- Contains: Skill folders such as `.codex/skills/gsd-map-codebase/` and GSD workflow assets.
- Key files: `.codex/skills/gsd-map-codebase/SKILL.md`

## Key File Locations

**Entry Points:**
- `index.html`: Browser document shell and root mount node.
- `src/main.tsx`: Frontend bootstrap that renders `<App />`.
- `src/App.tsx`: Current application root and only UI module.
- `src-tauri/src/main.rs`: Desktop binary entry point.
- `src-tauri/src/lib.rs`: Tauri runtime bootstrap and command registration entry.

**Configuration:**
- `package.json`: Node scripts and frontend package metadata.
- `pnpm-workspace.yaml`: pnpm workspace settings.
- `tsconfig.json`: Frontend TypeScript options.
- `vite.config.ts`: Vite server/build behavior for Tauri.
- `.cargo/config.toml`: Cargo target-dir override to `D:/env/cargo-targets/react-tauri-app`.
- `src-tauri/Cargo.toml`: Rust crate metadata and native dependencies.
- `src-tauri/build.rs`: Tauri build-script handoff.
- `src-tauri/tauri.conf.json`: Window, bundle, and frontend handoff configuration.
- `src-tauri/capabilities/default.json`: Window-scoped Tauri permission manifest.

**Core Logic:**
- `src/App.tsx`: Form interaction, local state, and IPC invocation.
- `src-tauri/src/lib.rs`: `greet` command definition and Tauri builder assembly.

**Testing:**
- Not detected. There are no test directories, `*.test.*` / `*.spec.*` files, or test runner config files at the repository root.

## Naming Conventions

**Files:**
- React component/source files use simple TypeScript names with the root component capitalized: `src/App.tsx`, `src/App.css`, `src/main.tsx`.
- Tool-owned config files follow each tool's required lowercase naming: `vite.config.ts`, `tsconfig.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.
- Planning docs use lowercase or kebab-case prose names outside runtime code: `docs/typora-like-editor-plan.md`.

**Directories:**
- Runtime source directories are lowercase and purpose-led: `src/`, `public/`, `docs/`.
- The Tauri subtree uses the tool-prescribed hyphenated directory name `src-tauri/`.
- Generated subtrees are nested under their owner directory rather than mixed into source folders: `src-tauri/gen/`, `dist/`.

## Where to Add New Code

**New Feature:**
- Primary code: `src/`
- Current placement rule: There is no existing `src/components/`, `src/features/`, `src/hooks/`, `src/services/`, or `src/state/` directory. New frontend code should be introduced under `src/` and wired into `src/App.tsx` unless you first create a deliberate substructure.
- Native counterpart: If the feature needs desktop/native access, add the Rust command and registration path under `src-tauri/src/`, keeping `src-tauri/src/lib.rs` as the place that exposes commands to Tauri.
- Tests: Not applicable yet; no test location pattern exists in the current repo.

**New Component/Module:**
- Implementation: `src/`
- Current module boundary: `src/App.tsx` is the only application module. Extract sibling modules from `src/` first, then import them back into `src/App.tsx` or `src/main.tsx`.

**Utilities:**
- Shared helpers: No dedicated shared-utility directory exists.
- Current placement rule: Put any new helper module under `src/` alongside the code that consumes it until a stable shared folder is intentionally added.

## Special Directories

**`src-tauri/gen/`:**
- Purpose: Generated Tauri schemas.
- Generated: Yes
- Committed: Yes

**`src-tauri/icons/`:**
- Purpose: Desktop bundle icons referenced by `src-tauri/tauri.conf.json`.
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: Generated frontend bundle referenced by `src-tauri/tauri.conf.json` as `frontendDist`.
- Generated: Yes
- Committed: Yes

**`src-tauri/target/`:**
- Purpose: Rust build artifacts from prior local builds.
- Generated: Yes
- Committed: Yes
- Note: `.cargo/config.toml` redirects the active Cargo target directory to `D:/env/cargo-targets/react-tauri-app`, so `src-tauri/target/` should not be treated as the authoritative current output location.

**`.planning/codebase/`:**
- Purpose: Generated architecture and codebase reference docs for GSD workflows.
- Generated: Yes
- Committed: Intended for repo tracking

**Absent Structure to Note:**
- `src/` does not currently contain feature folders, routing folders, data-access layers, hooks directories, or shared state directories.
- `src-tauri/src/` does not currently contain additional Rust modules beyond `main.rs` and `lib.rs`.
- No separate backend service, API server directory, database migration directory, or test directory is present in the repository tree.

---

*Structure analysis: 2026-04-16*
