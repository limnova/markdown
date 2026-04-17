use serde::Serialize;
use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};

const INVALID_WORKSPACE_MESSAGE: &str =
    "This workspace is no longer available. Choose the folder again to continue.";

#[derive(Clone, Copy, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum WorkspaceEntryKind {
    Directory,
    Markdown,
    Other,
    ExternalLink,
}

#[derive(Serialize)]
pub struct WorkspaceEntry {
    name: String,
    path: String,
    kind: WorkspaceEntryKind,
    interactive: bool,
}

#[derive(Serialize)]
pub struct WorkspaceLoadResult {
    requested_path: String,
    display_path: String,
    canonical_path: String,
    status: String,
    entries: Vec<WorkspaceEntry>,
    message: Option<String>,
}

#[tauri::command]
pub fn load_workspace(path: String) -> Result<WorkspaceLoadResult, String> {
    let trimmed_path = path.trim();
    if trimmed_path.is_empty() {
        return Ok(WorkspaceLoadResult {
            requested_path: String::new(),
            display_path: String::new(),
            canonical_path: String::new(),
            status: "welcome".to_string(),
            entries: Vec::new(),
            message: None,
        });
    }

    let requested_path = PathBuf::from(trimmed_path);
    let requested_display_path = sanitize_display_path(&requested_path);

    let canonical_root = match fs::canonicalize(&requested_path) {
        Ok(path) if path.is_dir() => path,
        Ok(_) => {
            return Ok(invalid_workspace_result(
                trimmed_path,
                &requested_display_path,
            ))
        }
        Err(_) => {
            return Ok(invalid_workspace_result(
                trimmed_path,
                &requested_display_path,
            ))
        }
    };

    let entries = match load_top_level_entries(&canonical_root) {
        Ok(entries) => entries,
        Err(_) => {
            return Ok(invalid_workspace_result(
                trimmed_path,
                &requested_display_path,
            ))
        }
    };

    Ok(WorkspaceLoadResult {
        requested_path: trimmed_path.to_string(),
        display_path: sanitize_display_path(&canonical_root),
        canonical_path: sanitize_display_path(&canonical_root),
        status: "ready".to_string(),
        entries,
        message: None,
    })
}

fn invalid_workspace_result(requested_path: &str, display_path: &str) -> WorkspaceLoadResult {
    WorkspaceLoadResult {
        requested_path: requested_path.to_string(),
        display_path: display_path.to_string(),
        canonical_path: String::new(),
        status: "invalid".to_string(),
        entries: Vec::new(),
        message: Some(INVALID_WORKSPACE_MESSAGE.to_string()),
    }
}

fn load_top_level_entries(root: &Path) -> Result<Vec<WorkspaceEntry>, std::io::Error> {
    let mut entries = Vec::new();

    for entry in fs::read_dir(root)? {
        let entry = entry?;
        entries.push(classify_entry(root, entry));
    }

    entries.sort_by(compare_entries);

    Ok(entries)
}

fn classify_entry(root: &Path, entry: fs::DirEntry) -> WorkspaceEntry {
    let entry_name = entry.file_name().to_string_lossy().into_owned();
    let entry_path = entry.path();
    let file_type = entry.file_type().ok();
    let is_symlink = file_type.as_ref().is_some_and(|value| value.is_symlink());
    let resolved_path = fs::canonicalize(&entry_path).ok();

    let (kind, interactive, display_path) = match resolved_path {
        Some(canonical_target) if !canonical_target.starts_with(root) => (
            WorkspaceEntryKind::ExternalLink,
            false,
            sanitize_display_path(&canonical_target),
        ),
        Some(canonical_target) => {
            let metadata = entry.metadata().ok();
            let kind = metadata
                .as_ref()
                .map(|value| classify_within_root(&entry_path, value))
                .unwrap_or(WorkspaceEntryKind::Other);

            (kind, true, sanitize_display_path(&canonical_target))
        }
        None if is_symlink => (
            WorkspaceEntryKind::ExternalLink,
            false,
            sanitize_display_path(&entry_path),
        ),
        None => {
            let metadata = entry.metadata().ok();
            let kind = metadata
                .as_ref()
                .map(|value| classify_within_root(&entry_path, value))
                .unwrap_or(WorkspaceEntryKind::Other);

            (kind, true, sanitize_display_path(&entry_path))
        }
    };

    WorkspaceEntry {
        name: entry_name,
        path: display_path,
        kind,
        interactive,
    }
}

fn classify_within_root(path: &Path, metadata: &fs::Metadata) -> WorkspaceEntryKind {
    if metadata.is_dir() {
        return WorkspaceEntryKind::Directory;
    }

    if is_markdown_file(path) {
        return WorkspaceEntryKind::Markdown;
    }

    WorkspaceEntryKind::Other
}

fn is_markdown_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| extension.to_ascii_lowercase()),
        Some(extension) if matches!(extension.as_str(), "md" | "markdown" | "mdown")
    )
}

fn compare_entries(left: &WorkspaceEntry, right: &WorkspaceEntry) -> Ordering {
    entry_rank(left.kind)
        .cmp(&entry_rank(right.kind))
        .then_with(|| left.name.to_ascii_lowercase().cmp(&right.name.to_ascii_lowercase()))
}

fn entry_rank(kind: WorkspaceEntryKind) -> u8 {
    match kind {
        WorkspaceEntryKind::Directory => 0,
        WorkspaceEntryKind::Markdown => 1,
        WorkspaceEntryKind::Other => 2,
        WorkspaceEntryKind::ExternalLink => 3,
    }
}

fn sanitize_display_path(path: &Path) -> String {
    sanitize_path_string(&path.to_string_lossy())
}

fn sanitize_path_string(path: &str) -> String {
    path.strip_prefix(r"\\?\UNC\")
        .map(|value| format!(r"\\{}", value))
        .or_else(|| path.strip_prefix(r"\\?\").map(str::to_string))
        .unwrap_or_else(|| path.to_string())
}
