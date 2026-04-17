# Phase 1: Workspace Boundary & Root Safety - Patterns

**Mapped:** 2026-04-17
**Phase directory:** `.planning/phases/01-workspace-boundary-root-safety`

## File Targets

| Target | Role | Closest Existing Analog | Reuse Guidance |
|--------|------|-------------------------|----------------|
| `src/App.tsx` | Root application orchestrator | `src/App.tsx` | Keep the top-level app shell here; move feature-specific logic into `src/features/workspace/*` instead of growing one giant component again. |
| `src/App.css` | Global tokens and shell styling | `src/App.css` | Reuse the existing global stylesheet entry point, but replace scaffold visuals with the UI-SPEC token set and workspace shell classes. |
| `src/features/workspace/components/*.tsx` | Presentational workspace states | `src/App.tsx` | Follow the same React function-component style, but split welcome/invalid/active-shell views into focused components. |
| `src/features/workspace/workspace-client.ts` | Frontend bridge for dialog/store/invoke calls | `src/App.tsx` | Mirror the current inline async helper pattern, but move Tauri calls behind a typed module boundary. |
| `src/features/workspace/useWorkspaceController.ts` | State orchestration for restore/select/retry flows | `src/App.tsx` | Use local React state and helper functions rather than introducing a global store in Phase 1. |
| `src-tauri/src/workspace.rs` | Native workspace validation and snapshot logic | `src-tauri/src/lib.rs` | Extract non-trivial filesystem logic into a dedicated Rust module and keep `lib.rs` as the registration/composition layer. |
| `src-tauri/src/lib.rs` | Plugin initialization and command registration | `src-tauri/src/lib.rs` | Continue using one authoritative `tauri::generate_handler![...]` list and initialize plugins in the builder chain. |
| `src-tauri/capabilities/default.json` | Window-scoped permissions | `src-tauri/capabilities/default.json` | Extend the existing main-window capability rather than adding broad global permissions. |

## Existing Excerpts To Follow

### React root component pattern
From `src/App.tsx`:

```tsx
function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }
}
```

**Pattern to preserve:** function components with file-local async helpers and state updates driven from explicit user actions.

### Global stylesheet entry point
From `src/App.css`:

```css
:root {
  font-size: 16px;
}

.container {
  display: flex;
}
```

**Pattern to preserve:** global class selectors and root-level tokens live in one shared stylesheet imported by the root component.

### Tauri startup composition
From `src-tauri/src/lib.rs`:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Pattern to preserve:** plugin initialization and command registration stay centralized in `run()`, while detailed command logic can move into sibling modules.

### Capability file shape
From `src-tauri/capabilities/default.json`:

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default", "opener:default"]
}
```

**Pattern to preserve:** keep one explicit capability document for the main window and add only the exact plugin permissions the phase requires.

## Recommended Concrete Patterns

### Frontend split
- Keep `src/App.tsx` responsible for choosing which high-level workspace state to render.
- Put visual states in `src/features/workspace/components/` so Phase 2 can extend the shell without reworking the entire root file.
- Put desktop bridge code in `src/features/workspace/workspace-client.ts` so future phases reuse one invoke/dialog/store seam.

### Rust split
- Add `mod workspace;` in `src-tauri/src/lib.rs`.
- Define serializable structs and helper functions in `src-tauri/src/workspace.rs`.
- Re-export only the Tauri commands from the workspace module into `generate_handler!`.

### Data contract shape
- Return a single typed workspace payload for both first selection and restore flows.
- Include both canonical behavior fields and UI-safe display fields in the payload.
- Represent child entries with an explicit `kind` union such as `directory`, `markdown`, `other`, `external-link`.

## Planned Reuse Map

| New Work | Reuses | Why |
|----------|--------|-----|
| Workspace controller hook | `useState` + async helper pattern from `src/App.tsx` | Matches current repo conventions without adding a store library early. |
| Workspace shell components | existing function-component style | Keeps the repo aligned with React function components and relative imports. |
| Workspace Rust module | current `greet` command seam in `src-tauri/src/lib.rs` | Extends the established IPC pattern instead of inventing a second native access path. |
| Capability extension | existing `default.json` | Preserves window-scoped permission structure already present in the app. |

## Guardrails For Planning

- Do not plan broad `plugin-fs` access for arbitrary user paths in Phase 1.
- Do not keep workspace boundary logic in `src/App.tsx`; it belongs in Rust helpers.
- Do not leave the UI as a scaffold demo while adding workspace logic; the UI-SPEC explicitly requires replacing the starter appearance.
- Do not create false wave parallelism by letting multiple plans edit `src/App.tsx` or `src/App.css` in the same wave.

---

*Pattern map completed: 2026-04-17*
