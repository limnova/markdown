# Technology Stack

**Analysis Date:** 2026-04-16

## Languages

**Primary:**
- TypeScript `5.8.3` locked in `pnpm-lock.yaml` and configured in `tsconfig.json`; application code lives in `src/main.tsx` and `src/App.tsx`.
- Rust `edition = "2021"` in `src-tauri/Cargo.toml`; the desktop shell and native command bridge live in `src-tauri/src/lib.rs` and `src-tauri/src/main.rs`.

**Secondary:**
- HTML is used for the web entry document in `index.html`.
- CSS is used for UI styling in `src/App.css`.
- JSON is used for desktop configuration and permissions in `src-tauri/tauri.conf.json` and `src-tauri/capabilities/default.json`.
- SVG and PNG assets are bundled from `public/`, `src/assets/`, and `src-tauri/icons/`.

## Runtime

**Environment:**
- Node.js is required for the frontend toolchain. `vite@7.3.2` in `pnpm-lock.yaml` declares `^20.19.0 || >=22.12.0`. The local environment reports `node v22.21.1`.
- Rust/Cargo is required for the desktop shell. The local environment reports `cargo 1.94.0` and `rustc 1.94.0`.
- Tauri desktop runtime is configured through `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`.

**Package Manager:**
- Use `pnpm` at the repo root. `pnpm-lock.yaml` is present and `pnpm-workspace.yaml` exists, although only the root package is currently defined.
- Use Cargo for the native shell in `src-tauri/`. `src-tauri/Cargo.lock` is present.
- The local environment reports `pnpm 10.33.0`.

## Frameworks

**Core:**
- React `^19.1.0` in `package.json`, locked to `19.2.5` in `pnpm-lock.yaml` - UI framework mounted in `src/main.tsx` and implemented in `src/App.tsx`.
- Tauri `2` in `src-tauri/Cargo.toml`, locked to `tauri 2.10.3` in `src-tauri/Cargo.lock` - native desktop container, IPC bridge, and bundling layer.
- Vite `^7.0.4` in `package.json`, locked to `7.3.2` in `pnpm-lock.yaml` - frontend dev server and production bundler configured in `vite.config.ts`.

**Testing:**
- Not detected. `package.json` has no test script, there is no frontend test dependency, and no test config file is present at the repo root.

**Build/Dev:**
- TypeScript compiler `~5.8.3` in `package.json`, locked to `5.8.3` in `pnpm-lock.yaml` - type-checking during `pnpm build`.
- `@vitejs/plugin-react` `^4.6.0` in `package.json`, locked to `4.7.0` in `pnpm-lock.yaml` - React transform plugin loaded in `vite.config.ts`.
- `@tauri-apps/cli` `^2` in `package.json`, locked to `2.10.1` in `pnpm-lock.yaml` - desktop dev/build command surface exposed through the `tauri` script in `package.json`.
- `tauri-build` `2` in `src-tauri/Cargo.toml`, locked to `2.5.6` in `src-tauri/Cargo.lock` - build script executed by `src-tauri/build.rs`.

## Key Dependencies

**Critical:**
- `@tauri-apps/api` `^2` in `package.json`, locked to `2.10.1` in `pnpm-lock.yaml` - frontend IPC client used by `src/App.tsx` via `invoke("greet", ...)`.
- `tauri` `2` in `src-tauri/Cargo.toml`, locked to `2.10.3` in `src-tauri/Cargo.lock` - Rust-side application builder and command registration in `src-tauri/src/lib.rs`.
- `react-dom` `^19.1.0` in `package.json`, locked to `19.2.5` in `pnpm-lock.yaml` - browser renderer used in `src/main.tsx`.

**Infrastructure:**
- `@tauri-apps/plugin-opener` `^2` in `package.json`, locked to `2.5.3` in `pnpm-lock.yaml` - desktop opener bridge available to the app.
- `tauri-plugin-opener` `2` in `src-tauri/Cargo.toml`, locked to `2.5.3` in `src-tauri/Cargo.lock` - plugin initialized in `src-tauri/src/lib.rs`.
- `serde` `1` and `serde_json` `1` in `src-tauri/Cargo.toml`, locked to `1.0.228` and `1.0.149` in `src-tauri/Cargo.lock` - serialization support for Rust-side command payloads.

## Configuration

**Environment:**
- The only detected environment variable read is `TAURI_DEV_HOST` in `vite.config.ts`. It controls the dev server host and HMR host when running under Tauri.
- No `.env`, `.env.local`, `.env.development`, `.env.production`, `src-tauri/.env`, or `src-tauri/.env.local` files are present.
- The repo does not pin Node via `.nvmrc` and does not declare a `packageManager` field in `package.json`.

**Build:**
- `package.json` defines `dev`, `build`, `preview`, and `tauri` scripts.
- `vite.config.ts` fixes the dev server to port `1420`, HMR to `1421` when `TAURI_DEV_HOST` is set, and ignores `src-tauri/**` during file watching.
- `tsconfig.json` enables strict TypeScript checks with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- `tsconfig.node.json` covers Node-side typing for `vite.config.ts`.
- `src-tauri/tauri.conf.json` wires Tauri to `pnpm dev`, `pnpm build`, and the built frontend output in `dist/`.
- `.cargo/config.toml` overrides Cargo's `target-dir` to `D:/env/cargo-targets/react-tauri-app`.
- `src-tauri/build.rs` delegates build metadata generation to `tauri_build::build()`.

## Platform Requirements

**Development:**
- Frontend work requires Node.js plus `pnpm` at the repo root (`package.json`, `pnpm-lock.yaml`).
- Desktop work requires Rust and Cargo under `src-tauri/` (`src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`).
- Tauri development expects the Vite dev server at `http://localhost:1420` (`src-tauri/tauri.conf.json`) and the matching Vite server config in `vite.config.ts`.

**Production:**
- The deliverable is a bundled desktop application, not a deployed web server. `src-tauri/tauri.conf.json` sets `"bundle.active": true` and `"targets": "all"`.
- Desktop window metadata is defined in `src-tauri/tauri.conf.json` and icon assets are sourced from `src-tauri/icons/`.
- The frontend build output consumed by Tauri is the static `dist/` directory referenced by `src-tauri/tauri.conf.json`.

---

*Stack analysis: 2026-04-16*
