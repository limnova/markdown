# Phase 1: Workspace Boundary & Root Safety - Research

**Researched:** 2026-04-17
**Domain:** Tauri 2 workspace selection, persisted local state, and Windows-safe path boundary enforcement
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** First launch uses a dedicated welcome state with a single primary action to choose the workspace directory.
- **D-02:** The first-launch state should stay minimal rather than acting like a multi-step setup flow.
- **D-03:** App relaunch restores the last selected workspace path automatically with no confirmation step.
- **D-04:** If the remembered workspace path is missing, moved, inaccessible, or otherwise invalid, the app enters a blocked "workspace invalid" state and requires the user to reselect a root instead of silently clearing the saved path.
- **D-05:** Any attempt to access content outside the selected workspace root must be rejected clearly and non-destructively.
- **D-06:** Workspace boundary checks must be based on Windows-safe canonicalized paths rather than raw user-facing path strings.
- **D-07:** Filesystem entries inside the workspace that resolve outside the root (such as symlinks, junctions, or shortcuts) may be shown as external-link nodes for awareness.
- **D-08:** External-link nodes are not treated as workspace content: they are not expanded, opened, edited, searched, or used as valid targets for workspace operations.

### the agent's Discretion
- Exact UI treatment for out-of-root rejection states, as long as the rejection is clear and non-destructive.
- Exact wording and visual design of the welcome state and the invalid-workspace state.
- Exact iconography and labeling for external-link nodes that point outside the workspace root.

### Deferred Ideas (OUT OF SCOPE)
- None. This phase stays focused on selecting, restoring, and defending one workspace root.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Open a folder picker for the workspace root | Browser/Client | API/Backend | The dialog is triggered from the UI, but the plugin is hosted by the native runtime. |
| Persist the last selected workspace path | Browser/Client | Database/Storage | The frontend decides when a selection is accepted and writes a small key/value record through the store plugin. |
| Canonicalize and validate workspace boundaries | API/Backend | -- | Boundary enforcement must run in Rust so raw UI strings never become the source of truth. |
| Build a safe root snapshot for the shell | API/Backend | Browser/Client | Rust can inspect metadata and classify out-of-root entries safely before the UI renders them. |
| Render welcome, loading, invalid, and active-root states | Browser/Client | -- | These are pure desktop UI concerns driven by typed payloads from the native layer. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 should use Tauri's dialog and store plugins for the user-facing edges, but the filesystem boundary itself should live in Rust commands. The official Tauri dialog plugin supports directory selection on Windows and can be invoked from JavaScript, while the store plugin gives a backend-persisted key/value store for remembering the last workspace path. Those pieces fit the product requirement to choose and restore a single workspace root without inventing custom persistence or a browser-only picker.

The boundary model should not rely on frontend string comparisons or a broad filesystem plugin scope. Tauri's filesystem plugin is scope-based, using capability globs that are configured up front; that is a poor fit for a user-selected arbitrary workspace root because it either forces overbroad permissions or constant scope churn. The safer split for this phase is: select the directory in the UI, send that path to a Rust command, canonicalize it there, build a safe snapshot there, and only return sanitized display data to the React shell.

For Windows correctness, treat canonical Rust paths as the source of truth and only derive display strings afterward. Rust `std::fs::canonicalize` resolves symlinks and normalizes the path, but on Windows it can return extended-length verbatim paths. That means the backend should keep canonical `PathBuf` values for comparisons, while the UI gets a cleaned display form and relative entry metadata. This preserves root-bound safety without leaking Windows path oddities into the product UI.

**Primary recommendation:** Use `@tauri-apps/plugin-dialog` plus `@tauri-apps/plugin-store` at the UI edge, and implement workspace validation, root snapshotting, and out-of-root classification in Rust commands backed by canonical path checks.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tauri-apps/plugin-dialog` | 2.x | Open a native folder picker from the React shell | Official Tauri plugin for file and directory selection; matches the desired welcome-state CTA. |
| `@tauri-apps/plugin-store` | 2.x | Persist the last accepted workspace root | Official backend-persisted key/value storage without inventing a custom config file format. |
| Rust `std::fs` | stable | Canonicalize paths, read metadata, enumerate directory entries | Native filesystem APIs are the correct authority for Windows-safe boundary checks. |
| Rust `std::path` | stable | Compare canonical root prefixes and derive relative display paths | `Path` operations avoid raw string slicing and operate on path components. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tauri-apps/api/path` | 2.x | Normalize or format paths on the frontend when needed | Use for display helpers, not as the final security authority. |
| `serde` / `serde_json` | 1.x | Serialize command payloads between Rust and TypeScript | Already in the repo and needed for typed workspace load results. |
| Tauri capabilities / plugin permissions | built-in | Restrict dialog/store/native access by window | Required whenever new plugins or commands are added to the desktop app. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Rust boundary commands | `@tauri-apps/plugin-fs` for everything | The filesystem plugin is official, but its static scope model is awkward for an arbitrary user-selected root and risks broader permissions than needed. |
| Store plugin | `localStorage` | Browser storage is easy, but a backend-persisted store is more aligned with a desktop app and avoids web-only assumptions. |
| Canonical Rust comparison | Frontend string prefix checks | Simpler to code, but unsafe around separators, symlinks, junctions, and Windows path normalization. |

**Installation:**
```bash
pnpm add @tauri-apps/plugin-dialog @tauri-apps/plugin-store
cargo add tauri-plugin-dialog tauri-plugin-store --manifest-path src-tauri/Cargo.toml
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
App launch
  |
  v
Load stored workspace key from backend-persisted store
  |
  +--> no stored path -------------------------------> render welcome state
  |
  +--> stored path present
         |
         v
     invoke Rust workspace loader
         |
         +--> canonicalize + metadata checks fail ---> render invalid-workspace state with broken path
         |
         +--> canonical root valid
                |
                v
            build sanitized root snapshot
                |
                v
            render active workspace shell

User clicks "Choose workspace folder"
  |
  v
Dialog plugin returns selected directory path
  |
  v
invoke same Rust workspace loader
  |
  +--> invalid / out-of-root result ---------------> keep current shell and show boundary banner
  |
  +--> valid workspace ----------------------------> persist path to store, render active shell
```

### Recommended Project Structure
```text
src/
  features/
    workspace/
      components/
        WorkspaceWelcome.tsx
        WorkspaceInvalid.tsx
        WorkspaceHeader.tsx
        WorkspaceOverview.tsx
      workspace-client.ts
      useWorkspaceController.ts
      types.ts
      formatDisplayPath.ts
  App.tsx
  App.css
src-tauri/
  src/
    lib.rs
    workspace.rs
  capabilities/
    default.json
```

### Pattern 1: Thin frontend edge, authoritative Rust workspace loader
**What:** The UI owns dialog and shell state, but every real filesystem decision funnels through one Rust workspace-loading path.
**When to use:** Anytime the app accepts a user path or restored persisted path and needs a safe workspace snapshot.
**Example:**
```ts
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

const selected = await open({ directory: true, multiple: false });
if (typeof selected === "string") {
  const payload = await invoke("load_workspace", { path: selected });
  // Persist only after the backend accepted the path.
}
```

### Pattern 2: Canonical boundary checks in Rust, display cleanup afterward
**What:** Convert the candidate root and any inspected target paths into canonical `PathBuf` values first, then compare path components and classify anything outside root as external or rejected.
**When to use:** Loading the root, classifying child entries, or validating future file operations under the same boundary helper.
**Example:**
```rust
use std::fs;
use std::path::{Path, PathBuf};

fn canonical_root(path: &str) -> std::io::Result<PathBuf> {
    fs::canonicalize(path)
}

fn is_within_root(root: &Path, candidate: &Path) -> bool {
    candidate.starts_with(root)
}
```

### Anti-Patterns to Avoid
- **Raw string prefix comparisons:** `"C:\\notes-2".startsWith("C:\\notes")` is not a safe boundary rule.
- **Wide filesystem capabilities for the whole machine:** granting generic read/write access undermines the product's single-root promise.
- **Silently dropping an invalid remembered path:** the UI contract explicitly requires a blocked state that preserves the broken path for recovery.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Folder picking | A custom browser file picker workaround | `@tauri-apps/plugin-dialog` | The official plugin already supports native directory selection on Windows. |
| Persisted settings file format | Ad-hoc JSON read/write plumbing in the frontend | `@tauri-apps/plugin-store` | The store plugin already provides backend-persisted key/value storage. |
| Generic path normalization logic in TypeScript | Manual slash replacement and prefix trimming | Rust `std::fs::canonicalize` and `Path` comparisons | Windows path edge cases and reparse points are easy to get wrong in browser code. |
| Permission model | One-off undocumented capability choices | Tauri capabilities and plugin permission identifiers | Official capability files are the supported way to bound frontend access. |

**Key insight:** Use official Tauri plugins for user-facing desktop primitives, but do not confuse "official filesystem access" with "safe arbitrary-root enforcement." Phase 1 needs a stricter boundary authority than a broad plugin scope.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Canonical Windows paths leak verbatim prefixes into the UI
**What goes wrong:** The shell shows `\\?\C:\...` or mixes slash styles after restore.
**Why it happens:** Rust canonicalization on Windows can return extended-length paths intended for internal filesystem work.
**How to avoid:** Keep canonical `PathBuf` values internal; derive a cleaned display string separately before serializing to the frontend.
**Warning signs:** Displayed workspace paths look unfamiliar or break truncation logic even though validation succeeds.

### Pitfall 2: Symlinks or junctions are treated like normal children
**What goes wrong:** The app traverses entries that appear inside the root but resolve outside it.
**Why it happens:** Code checks only the child path string and never compares the resolved target against the canonical root.
**How to avoid:** Use metadata and canonical target checks before marking a child as interactive workspace content.
**Warning signs:** Clicking a seemingly local node opens content outside the chosen workspace.

### Pitfall 3: Overbroad filesystem capabilities weaken the root boundary
**What goes wrong:** The app can technically access locations beyond the workspace even if the UI intends not to.
**Why it happens:** The filesystem plugin is configured with wide scopes such as full-home or full-documents recursive access.
**How to avoid:** Keep Phase 1 filesystem authority inside narrow Rust commands and add only the plugin permissions actually needed for dialog and store.
**Warning signs:** Capability files accumulate generic read/write scopes unrelated to the chosen root.
</common_pitfalls>

<code_examples>
## Code Examples

### Native directory picker from JavaScript
```ts
// Source: https://v2.tauri.app/plugin/dialog/
import { open } from "@tauri-apps/plugin-dialog";

const selected = await open({
  directory: true,
  multiple: false,
});
```

### Backend-persisted store object
```ts
// Source: https://v2.tauri.app/reference/javascript/store/
import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("workspace.json");
await store.set("lastWorkspacePath", "C:\\notes");
await store.save();
```

### Canonical path rule in Rust
```rust
// Source: https://doc.rust-lang.org/stable/std/fs/fn.canonicalize.html
use std::fs;

let canonical = fs::canonicalize(path)?;
```
</code_examples>

<validation_architecture>
## Validation Architecture

Phase 1 does not currently have a dedicated test runner in the repo, so the validation strategy should combine compiler/build checks with a small set of explicit manual desktop verifications. The minimum automated baseline is `pnpm build` for the React/TypeScript bundle and `cargo check --manifest-path src-tauri/Cargo.toml` for the native layer. Those commands are fast enough to run throughout execution and catch most contract mismatches between the new workspace module, Tauri command signatures, and the React shell.

Manual verification is still required for the native folder picker and persisted restore behavior. The plan should explicitly cover: choosing a workspace folder, restarting with the last root restored, and handling a missing remembered folder with a blocked invalid-workspace state rather than silent reset. Because these checks rely on desktop runtime behavior rather than pure file reads, they belong in `VALIDATION.md` as manual-only verifications with exact steps.

The phase does not need full filesystem CRUD tests yet. The validation focus is narrower: accepted root selection, safe snapshot rendering, clear invalid-root handling, and rejection of out-of-root resolution paths. That keeps Nyquist coverage aligned with the actual phase goal instead of overfitting future phases.
</validation_architecture>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri 1 allowlists | Tauri 2 capabilities + plugin permissions | Tauri 2 era | Desktop access is now modeled through capability files and plugin permission identifiers. |
| Browser-only persistence assumptions | Backend-persisted store plugins | Current Tauri 2 ecosystem | Desktop apps can keep small persisted state without relying on `localStorage`. |
| Generic filesystem plugins for all local access | Narrow command surfaces plus scoped plugins | Current security guidance | Dynamic user-selected roots are safer behind explicit native validation than broad static scopes. |

**New tools/patterns to consider:**
- Tauri 2 plugin permissions make it practical to add only dialog and store access in Phase 1 without committing to broad filesystem scopes.
- Rust `std::path::absolute` exists, but for this phase `canonicalize` is still the right choice because root safety depends on resolving symlinks and junction-like escapes.

**Deprecated/outdated:**
- Raw string path comparisons for security decisions are outdated for Windows-safe boundary enforcement.
- Treating Tauri command registration as implicitly safe is outdated; Phase 1 should document the desktop trust boundary explicitly in plan threat models.
</sota_updates>

<open_questions>
## Open Questions

1. **How much `.lnk` shortcut resolution belongs in Phase 1?**
   - What we know: the phase must not treat shortcuts to out-of-root locations as normal workspace content.
   - What's unclear: resolving Windows `.lnk` targets requires extra OS-specific work beyond basic `std::fs` metadata.
   - Recommendation: treat `.lnk` files as inert informational rows in Phase 1; do not attempt target resolution unless a later phase truly needs it.

2. **Should the active shell show a shallow root snapshot or only the current root header?**
   - What we know: D-07 and D-08 already define how out-of-root entries must behave if shown.
   - What's unclear: whether a minimal top-level list is necessary in Phase 1 or whether a header plus status surface is sufficient.
   - Recommendation: plan for a shallow snapshot list because it exercises boundary classification without expanding into Phase 2 CRUD.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- Tauri Dialog plugin docs: https://v2.tauri.app/plugin/dialog/
- Tauri Store JavaScript reference: https://v2.tauri.app/reference/javascript/store/
- Tauri Path JavaScript reference (`normalize`): https://v2.tauri.app/reference/javascript/api/namespacepath/
- Tauri Capabilities guide: https://v2.tauri.app/security/capabilities/
- Tauri File System plugin docs: https://v2.tauri.app/plugin/file-system/
- Rust `std::fs::canonicalize`: https://doc.rust-lang.org/stable/std/fs/fn.canonicalize.html
- Rust `Path::starts_with`: https://doc.rust-lang.org/stable/std/path/struct.Path.html

### Secondary (MEDIUM confidence)
- `docs/typora-like-editor-plan.md` - project-local architectural recommendation to prefer Tauri plugins at the user-facing edge.

### Tertiary (LOW confidence - needs validation)
- None. The key library and path-behavior claims above are grounded in official Tauri and Rust documentation.
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Tauri 2 dialog/store/capability model
- Ecosystem: official Tauri plugins plus Rust filesystem/path APIs
- Patterns: safe root loading, canonical boundary checks, blocked invalid restore flow
- Pitfalls: Windows canonical path display, symlink/junction escapes, overbroad permissions

**Confidence breakdown:**
- Standard stack: HIGH - all primary dependencies are official Tauri or Rust components
- Architecture: HIGH - derived from the repo's current Tauri boundary and official plugin/capability model
- Pitfalls: HIGH - directly tied to official canonicalization and scope semantics
- Code examples: HIGH - sourced from official Tauri and Rust documentation

**Research date:** 2026-04-17
**Valid until:** 2026-05-17
</metadata>

---

*Phase: 01-workspace-boundary-root-safety*
*Research completed: 2026-04-17*
*Ready for planning: yes*
