# Feature Research

**Domain:** Windows-only local-first Markdown writing editor
**Researched:** 2026-04-16
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single-pane live preview editing | Typora positions "Live Preview" as the core experience, and this project exists specifically to preserve that writing feel. | HIGH | This is the product. If editing falls back to obvious edit/preview mode switching, the app stops being a Typora-like replacement. |
| Folder-scoped workspace with sidebar tree | Typora documents `Open Folder`, `Files Sidebar`, and file tree/list modes; local-first Markdown writers are expected to operate on a real folder, not an internal database. | MEDIUM | v1 only needs one user-selected root folder, Markdown-first filtering, and predictable create/rename/delete/move flows. |
| Reliable open/edit/save flow with dirty-state protection | A writing tool must not lose text. Daily-use credibility depends more on save correctness than on advanced formatting. | MEDIUM | `Ctrl+S`, save indicator, dirty tracking, conflict-safe reload behavior, and atomic-ish writes matter more than autosave tricks in v1. |
| Core Markdown authoring blocks | Headings, lists, quotes, fenced code, links, inline emphasis, and task lists are baseline expectations for general Markdown writing. | MEDIUM | Tables and frontmatter awareness are useful, but not more important than stable core block behavior. |
| Workspace-wide search | Typora documents `Global Search`; once users open a folder, they expect to find documents by filename and text without leaving the app. | MEDIUM | v1 should keep search folder-scoped and fast. Advanced operators can wait. |
| Image paste/drop that stores files locally with relative links | Typora documents clipboard image insertion, copying images to a target folder, and using relative paths. This is standard for practical Markdown writing. | MEDIUM | For this product, the opinionated default should be current-document-adjacent `assets/` storage plus relative Markdown paths. |
| Theme switching with bundled readable themes | Typora exposes themes directly in product UX, and existing project notes already treat theme switching as core, not garnish. | LOW | v1 only needs a few high-quality bundled themes plus syntax highlighting; theme authoring UX can wait. |
| Keyboard-first copy/paste behavior that respects rich text input | Typora explicitly documents `Copy` and `Smart Paste`; daily writers expect paste from browsers/docs to preserve useful structure instead of dumping garbage. | MEDIUM | v1 needs sane HTML-to-Markdown-ish paste handling, plain-text paste, and copy that works well into other apps. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Typora-like writing feel under real load | The replacement succeeds only if cursor movement, block transforms, input latency, and scroll stability stay smooth on long documents. | HIGH | This is the real moat. Many Markdown apps have more features; fewer feel invisible while writing. |
| Opinionated local file ergonomics | Document-adjacent assets, one-root workspace rules, and transparent file paths make the tool easier to trust in company and offline environments. | MEDIUM | Stronger than a generic "attachments folder somewhere" model because it optimizes for portability and manual inspection. |
| CSS-file theme extensibility | Typora's theme model is simple: one CSS file per theme. Matching that keeps customization cheap without inventing a theme platform. | LOW | Good for v1.x: ship bundled themes first, then allow drop-in custom theme files and overrides. |
| Writer-first UI restraint | Deliberately avoiding vault dashboards, graph views, plugin management, and workspace clutter keeps attention on drafting. | LOW | This is partly product discipline, not engineering complexity. It should show up in every prioritization decision. |
| Fast folder-to-writing path | Open folder -> pick file -> start typing should be immediate. Reducing clicks and startup friction matters more than feature breadth. | MEDIUM | This includes remembering recent workspace, last file, sidebar state, and keeping search/file open fast. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cloud sync, accounts, and collaboration | Sounds modern and "complete". | Pulls the product toward auth, conflict resolution, permissions, backend cost, and network failure modes that do not serve the local-first writing goal. | Stay local-first. Make files portable on disk so users can choose their own sync tool outside the app. |
| Knowledge-base features: backlinks, graph, tags database, canvases | Popular in Obsidian-style note apps and often conflated with Markdown editing. | Changes the product from a writer into an information-management system, which expands indexing, metadata, and UI complexity. | Keep folder search and normal Markdown links strong. Defer semantic/graph features indefinitely unless the product direction changes. |
| Plugin marketplace and deep runtime extension API | Users associate extensibility with longevity. | Creates support burden, API stability constraints, security questions, and pressure to ship an app shell before the core writer is good. | Use modular internal architecture plus CSS theme files. Revisit only after the editor is stable and well-used. |
| Multi-pane workspace, tab explosion, or IDE-style layout | Appears useful for power users juggling many files. | Works against focused writing and multiplies state-management complexity, especially with dirty files and search results. | Keep a single editor pane in v1. Add lightweight quick-open and recent files instead of window-management features. |
| Export matrix (PDF, Word, HTML variants) in v1 | Common checkbox item in Markdown tools. | Consumes time on print/layout edge cases while adding little value to the stated daily-writing use case. | Rely on plain Markdown files first. Defer export until the editing loop is solid. |

## Feature Dependencies

```text
[Single-pane live preview editing]
    ├──requires──> [Core Markdown block support]
    ├──requires──> [Reliable open/edit/save flow]
    └──requires──> [Performance guardrails]

[Folder-scoped workspace]
    ├──requires──> [Sidebar tree + file operations]
    ├──enables──> [Workspace-wide search]
    ├──enables──> [Recent workspace / last file restore]
    └──enables──> [Relative image path strategy]

[Image paste/drop]
    ├──requires──> [Current file path known]
    ├──requires──> [File write permissions in workspace]
    └──enhances──> [Live preview editing]

[Theme switching]
    ├──requires──> [Stable semantic design tokens]
    └──conflicts──> [Hardcoded component styling]

[Workspace-wide search]
    ├──requires──> [Accurate workspace indexing or scan strategy]
    └──conflicts──> [Large-folder performance neglect]
```

### Dependency Notes

- **Single-pane live preview editing requires performance guardrails:** if document transforms, selection mapping, or re-rendering are slow, the defining product promise fails before any secondary feature matters.
- **Workspace-wide search requires the workspace model first:** the app needs a clear root directory boundary before it can index or scan anything predictably.
- **Image paste/drop requires current file context:** relative asset placement only works if the current document already has a known path on disk or the app has a clear temporary/save-first rule.
- **Theme switching requires semantic styling:** if UI and editor colors are hardcoded at component level, adding even three bundled themes becomes expensive and brittle.
- **Search conflicts with large-folder performance neglect:** naive recursive scans on every keystroke will make the app feel broken; search design and performance design are linked, not separate concerns.
- **File management quality affects editing feel:** rename, move, delete, reload, and external file changes must not surprise the current editor session or lose dirty state.

## MVP Definition

### Launch With (v1)

Minimum viable product for validating the concept as a practical daily writer.

- [ ] Single-pane live preview editor for core Markdown blocks — the core replacement value
- [ ] One-root folder workspace with sidebar tree — necessary boundary for all file operations
- [ ] Open/create/rename/delete/move Markdown files and folders — minimum local workflow completeness
- [ ] Reliable save flow with dirty-state cues and keyboard shortcuts — trust and safety
- [ ] Folder-scoped search for filenames and content — necessary once the workspace exceeds a handful of notes
- [ ] Image paste/drop to adjacent `assets/` folder with relative links — essential for practical writing, not an edge feature
- [ ] Three bundled themes plus syntax highlighting — enough visual choice without building theme tooling

### Add After Validation (v1.x)

Features to add once the core loop is stable in real use.

- [ ] Better paste normalization from browsers and office docs — add once basic clipboard behavior is trustworthy
- [ ] Recent workspaces, reopen last file, pinned folders — add after the base workspace model feels stable
- [ ] Tables and frontmatter awareness — useful for broader Markdown compatibility, but not launch-critical
- [ ] Custom theme loading from CSS files — worthwhile after bundled themes prove the token model
- [ ] Search polish: result snippets, filters, sort options, keyboard navigation — only after baseline search performance is acceptable
- [ ] External file change detection and refresh prompts — important, but secondary to getting the primary write/save loop correct

### Future Consideration (v2+)

Features to defer until the product is clearly succeeding at its narrow job.

- [ ] Typewriter/focus mode — useful polish, not proof of value
- [ ] Document outline panel and richer navigation aids — good once long-document workflows are common
- [ ] Session restore across many files or tabs — only if real use shows the single-file loop is too limiting
- [ ] Export features — postpone until there is evidence they matter more than editing improvements
- [ ] Optional non-Markdown file visibility or read-only attachments browser — only if workspace browsing needs expand

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single-pane live preview editing | HIGH | HIGH | P1 |
| Reliable local save flow | HIGH | MEDIUM | P1 |
| Folder workspace + sidebar tree | HIGH | MEDIUM | P1 |
| Search across current workspace | HIGH | MEDIUM | P1 |
| Image paste to local relative assets | HIGH | MEDIUM | P1 |
| Bundled theme switching | MEDIUM | LOW | P1 |
| Smart paste refinement | MEDIUM | MEDIUM | P2 |
| Recent workspaces / restore last file | MEDIUM | LOW | P2 |
| Custom CSS theme loading | MEDIUM | LOW | P2 |
| Tables / frontmatter awareness | MEDIUM | MEDIUM | P2 |
| Export formats | LOW | MEDIUM | P3 |
| Plugin marketplace | LOW | HIGH | P3 |
| Collaboration / cloud sync | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Inference note: the comparison below mixes official documented behavior with product-direction inference. Inference is called out explicitly in the "Our Approach" column when it goes beyond direct source text.

| Feature | Typora | Obsidian | Our Approach |
|---------|--------|----------|--------------|
| Core workspace model | Official docs emphasize opening a folder and browsing it through files sidebar and quick open. | Official docs center work around a local folder "vault" and opening an existing folder as a vault. | Match the folder-first model, but keep it simpler: one selected root folder, no vault management concepts. |
| Search | Official docs expose global search inside the current loaded folder. | Official docs provide powerful vault-wide search with operators. | Ship straightforward folder-scoped full-text search in v1; infer that complex operator search is unnecessary for the first daily-writing release. |
| Images / attachments | Official docs support pasting images, copying them to a target folder, and using relative paths. | Official docs support pasted attachments with configurable default location, including same-folder/subfolder placement. | Prefer a stricter default: current document plus adjacent `assets/`. Inference: explicit locality is better for writer trust than many attachment-location options in v1. |
| Themes | Official docs use one CSS file per theme and support custom themes by dropping files into the theme folder. | Official docs support browsing and installing community themes in-app. | Follow Typora's simpler CSS-file philosophy for v1.x rather than an in-app theme marketplace or manager. |
| Product surface | Typora presents a writing-centric surface with file/sidebar/theme features documented prominently. | Obsidian help reveals a much broader platform surface around plugins, vault management, and advanced search. | Stay intentionally closer to Typora than Obsidian. Inference: breadth is not a competitive advantage for this project's stated scope. |

## Sources

- `.planning/PROJECT.md` for product scope, constraints, and out-of-scope boundaries
- `docs/typora-like-editor-plan.md` for existing internal direction on workspace, sidebar tree, editor pane, theme switching, and save flow
- Typora Quick Start, updated April 4, 2026: https://support.typora.io/Quick-Start/
- Typora File Management, updated April 4, 2026: https://support.typora.io/File-Management/
- Typora About Themes, updated April 4, 2026: https://support.typora.io/About-Themes/
- Typora Images in Typora, updated April 4, 2026: https://support.typora.io/Images/
- Obsidian Help, Create a vault: https://obsidian.md/help/Getting%2Bstarted/Create%2Ba%2Bvault
- Obsidian Help, Search: https://obsidian.md/help/plugins/search
- Obsidian Help, Attachments: https://obsidian.md/help/attachments
- Obsidian Help, Themes: https://obsidian.md/help/themes
- Inference from competitor behavior: users of local Markdown tools broadly expect folder-scoped workspace, search, theme control, and sane attachment handling; the recommendation to keep v1 narrower than Obsidian is an opinionated product conclusion, not a direct quote from competitor docs.

---
*Feature research for: Windows-only local-first Markdown writing editor*
*Researched: 2026-04-16*
