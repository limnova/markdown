# External Integrations

**Analysis Date:** 2026-04-16

## APIs & External Services

**Desktop IPC:**
- Tauri command invocation is the primary application-facing integration.
  - Usage: `src/App.tsx` calls `invoke("greet", { name })`.
  - Native handler: `src-tauri/src/lib.rs` exposes `#[tauri::command] fn greet(name: &str) -> String`.
  - SDK/Client: `@tauri-apps/api` from `package.json`.
  - Auth: None.

**Local Dev Server Bridge:**
- Tauri loads the frontend from the local Vite server during development.
  - Config: `src-tauri/tauri.conf.json` uses `"devUrl": "http://localhost:1420"`.
  - Frontend server: `vite.config.ts` binds the Vite server to port `1420` and optional HMR host/port logic around `TAURI_DEV_HOST`.
  - SDK/Client: Vite dev server plus Tauri runtime.
  - Auth: None.

**External Web Links:**
- The current UI only links to documentation sites from `src/App.tsx`: `https://vite.dev`, `https://tauri.app`, and `https://react.dev`.
  - SDK/Client: plain anchor tags in `src/App.tsx`.
  - Auth: None.

## Data Storage

**Databases:**
- None detected.
  - Connection: Not applicable.
  - Client: No ORM or database client is imported in `src/` or `src-tauri/src/`.

**File Storage:**
- Local bundled assets only.
  - Static frontend assets live in `public/` and `src/assets/`.
  - Desktop bundle icons live in `src-tauri/icons/`.
  - No filesystem plugin, file dialog, or persistent user file storage integration is present in `src/` or `src-tauri/src/`.

**Caching:**
- None detected.
  - No `localStorage`, `sessionStorage`, `indexedDB`, service worker, or cache client usage was found in `src/`.

## Authentication & Identity

**Auth Provider:**
- None.
  - Implementation: No login flow, token handling, OAuth library, session library, or identity provider SDK is present in `package.json`, `src/`, or `src-tauri/src/`.

## Monitoring & Observability

**Error Tracking:**
- None.
  - No Sentry, PostHog, Datadog, OpenTelemetry, or analytics SDK is present in `package.json` or `src-tauri/Cargo.toml`.

**Logs:**
- Minimal default runtime failure logging only.
  - `src-tauri/src/lib.rs` ends startup with `.expect("error while running tauri application")`.
  - No structured logging framework or remote log drain is configured.

## CI/CD & Deployment

**Hosting:**
- Desktop bundle via Tauri, not a hosted web app.
  - `src-tauri/tauri.conf.json` sets `"beforeDevCommand": "pnpm dev"`, `"beforeBuildCommand": "pnpm build"`, `"frontendDist": "../dist"`, and `"bundle.active": true`.

**CI Pipeline:**
- None detected.
  - No `.github/` directory is present.
  - No `vercel.json`, `netlify.toml`, `Dockerfile`, `docker-compose.yml`, or `docker-compose.yaml` file is present at the repo root.

## Environment Configuration

**Required env vars:**
- `TAURI_DEV_HOST` is optional and only used in `vite.config.ts` to set the development host/HMR host for Tauri.
- No other environment variable reads were detected in `src/`, `src-tauri/src/`, or root config files.

**Secrets location:**
- None detected.
  - No `.env*` files are present at the repo root or under `src-tauri/`.

## Webhooks & Callbacks

**Incoming:**
- None.
  - No webhook endpoint, HTTP server route, or callback listener exists in `src/` or `src-tauri/src/`.

**Outgoing:**
- None.
  - No outbound webhook client or remote API POST workflow exists in `src/` or `src-tauri/src/`.

## OS & Platform Integrations

**Desktop Shell:**
- Tauri owns the application window and native packaging.
  - Window config: `src-tauri/tauri.conf.json` defines one desktop window titled `react-tauri-app` with size `800x600`.
  - Bundle identity: `src-tauri/tauri.conf.json` sets the application identifier to `com.tauri-app.react-tauri-app`.
  - Native entry: `src-tauri/src/main.rs` calls `react_tauri_app_lib::run()`.

**Opener Capability:**
- The app registers the Tauri opener plugin even though the current frontend does not import its JavaScript API.
  - Runtime registration: `src-tauri/src/lib.rs` calls `.plugin(tauri_plugin_opener::init())`.
  - Permission attachment: `src-tauri/capabilities/default.json` grants `core:default` and `opener:default` to the `main` window.
  - Scope definition: `src-tauri/gen/schemas/desktop-schema.json` and `src-tauri/gen/schemas/acl-manifests.json` expand `opener:default` to default URL opening and reveal-in-directory permissions.

**Security Posture:**
- Tauri content security policy is disabled in the current desktop config.
  - `src-tauri/tauri.conf.json` sets `"app.security.csp": null`.
  - Capability config does not define remote production URLs; only the local dev URL is configured in `src-tauri/tauri.conf.json`.

## Analytics

**Product Analytics:**
- None detected.
  - No analytics library, event sink, or telemetry endpoint is referenced in `package.json`, `src/`, or `src-tauri/src/`.

---

*Integration audit: 2026-04-16*
