# Changelog

This file records human-readable release notes for published versions.

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
