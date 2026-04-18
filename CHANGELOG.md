# Changelog

This file records human-readable release notes for published versions.

## v0.1.6 - 2026-04-19

### Changed
- Changed the GitHub `Release` workflow to publish a normal release immediately after a successful tag build instead of creating a draft first.
- Updated the release documentation to match the new auto-publish behavior.

## v0.1.5 - 2026-04-17

### Fixed
- Fixed PowerShell summary rendering in the GitHub `Release` workflow so markdown-style backticks no longer break the job after installers are already built and located.
- Replaced fragile inline escaped strings in the summary step with explicit string concatenation.

## v0.1.4 - 2026-04-17

### Fixed
- Fixed the GitHub `Release` workflow to resolve exact installer file paths before artifact upload and release asset upload, removing fragile fallback globs.
- Fixed false-negative artifact upload failures caused by unmatched optional bundle patterns in GitHub Actions.

## v0.1.3 - 2026-04-17

### Fixed
- Fixed the GitHub `Release` workflow path normalization so artifact globs no longer generate invalid patterns such as `src-tauri/./.cargo-target-gha/...`.
- Normalized the temporary Cargo target directory used on GitHub Actions so both build steps and artifact upload steps resolve the same bundle location.

## v0.1.2 - 2026-04-17

### Fixed
- Fixed the GitHub `Release` workflow to locate Windows installer bundles whether Tauri writes them under the repo root target directory or under `src-tauri/target`.
- Fixed artifact and release asset upload steps that previously failed after a successful build because they searched only one bundle path.

## v0.1.1 - 2026-04-17

### Fixed
- Fixed the GitHub `Release` workflow so Windows tag builds no longer fail when the default integration token cannot create GitHub releases.
- Removed the unsupported `uploadWorkflowArtifacts` input from the Tauri release action path.

### Changed
- Release automation now always preserves Windows installers as GitHub Actions artifacts, even when draft release creation is skipped.
- Added support for an optional `RELEASE_TOKEN` secret to restore automatic draft release publishing on restricted repositories.

## v0.1.0 - 2026-04-17

### Added
- Added GitHub Actions based CI workflow for pull requests and branch pushes on GitHub.
- Added tag-triggered Windows packaging workflow using GitHub-hosted `windows-latest` runners.
- Added automatic GitHub draft release creation for version tags matching `v*.*.*`.
- Added project documentation for GitHub CI/CD setup and release flow.

### Changed
- Updated package scripts to separate frontend type checking, web build, and Rust compile checks for CI use.
- Documented the GitHub release process so packaging now runs from GitHub instead of requiring a local Windows release server.

### Notes
- This release flow currently depends only on GitHub-provided `GITHUB_TOKEN`.
- Windows installers are built by GitHub Actions but are not code-signed yet.
