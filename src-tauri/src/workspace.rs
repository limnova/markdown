use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::HashSet;
use std::fs;
use std::path::{Component, Path, PathBuf};

const INVALID_WORKSPACE_MESSAGE: &str =
    "This workspace is no longer available. Choose the folder again to continue.";
const OUTSIDE_ROOT_MESSAGE: &str =
    "That location is outside the current workspace and can't be opened here.";

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum WorkspaceEntryKind {
    Directory,
    Markdown,
    Other,
    ExternalLink,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum WorkspaceItemKind {
    Directory,
    Markdown,
}

#[derive(Clone, Debug, Serialize)]
pub struct WorkspaceEntry {
    pub name: String,
    pub path: String,
    pub kind: WorkspaceEntryKind,
    pub interactive: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct WorkspaceTreeNode {
    pub name: String,
    pub path: String,
    pub kind: WorkspaceEntryKind,
    pub interactive: bool,
    pub children: Vec<WorkspaceTreeNode>,
}

#[derive(Clone, Debug, Serialize)]
pub struct WorkspaceItemDescriptor {
    pub name: String,
    pub path: String,
    pub kind: WorkspaceEntryKind,
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

#[derive(Serialize)]
pub struct WorkspaceTreeResult {
    root_path: String,
    nodes: Vec<WorkspaceTreeNode>,
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

    let canonical_root = match resolve_workspace_root(trimmed_path) {
        Ok(path) => path,
        Err(_) => {
            return Ok(invalid_workspace_result(
                trimmed_path,
                &requested_display_path,
            ));
        }
    };

    let entries = match list_tree_nodes(&canonical_root) {
        Ok(nodes) => nodes.into_iter().map(into_entry).collect(),
        Err(_) => {
            return Ok(invalid_workspace_result(
                trimmed_path,
                &requested_display_path,
            ));
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

#[tauri::command]
pub fn list_workspace_tree(workspace_path: String) -> Result<WorkspaceTreeResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let nodes = list_tree_nodes(&root).map_err(|error| error.to_string())?;

    Ok(WorkspaceTreeResult {
        root_path: sanitize_display_path(&root),
        nodes,
    })
}

pub fn resolve_workspace_root(workspace_path: &str) -> Result<PathBuf, String> {
    let trimmed = workspace_path.trim();
    if trimmed.is_empty() {
        return Err(INVALID_WORKSPACE_MESSAGE.to_string());
    }

    let canonical_root = fs::canonicalize(trimmed).map_err(|_| INVALID_WORKSPACE_MESSAGE)?;
    if !canonical_root.is_dir() {
        return Err(INVALID_WORKSPACE_MESSAGE.to_string());
    }

    Ok(canonical_root)
}

pub fn resolve_relative_path(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let relative = normalize_relative_path(relative_path, false)?;
    let candidate = root.join(&relative);
    let canonical = fs::canonicalize(&candidate).map_err(|_| {
        format!(
            "Path not found inside the workspace: {}",
            relative_path.trim()
        )
    })?;
    ensure_within_root(root, &canonical)?;
    Ok(canonical)
}

pub fn resolve_relative_directory(
    root: &Path,
    relative_path: Option<&str>,
) -> Result<PathBuf, String> {
    let Some(relative_path) = relative_path else {
        return Ok(root.to_path_buf());
    };

    if relative_path.trim().is_empty() {
        return Ok(root.to_path_buf());
    }

    let directory = resolve_relative_path(root, relative_path)?;
    if !directory.is_dir() {
        return Err("The selected target folder no longer exists.".to_string());
    }

    Ok(directory)
}

pub fn normalize_relative_path(relative_path: &str, allow_empty: bool) -> Result<PathBuf, String> {
    let trimmed = relative_path.trim();
    if trimmed.is_empty() {
        return if allow_empty {
            Ok(PathBuf::new())
        } else {
            Err("A workspace-relative path is required.".to_string())
        };
    }

    let mut normalized = PathBuf::new();

    for component in Path::new(trimmed).components() {
        match component {
            Component::Normal(segment) => normalized.push(segment),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(OUTSIDE_ROOT_MESSAGE.to_string());
            }
        }
    }

    if normalized.as_os_str().is_empty() && !allow_empty {
        return Err("A workspace-relative path is required.".to_string());
    }

    Ok(normalized)
}

pub fn ensure_within_root(root: &Path, candidate: &Path) -> Result<(), String> {
    if candidate.starts_with(root) {
        Ok(())
    } else {
        Err(OUTSIDE_ROOT_MESSAGE.to_string())
    }
}

pub fn classify_existing_path(path: &Path) -> WorkspaceEntryKind {
    let metadata = match fs::metadata(path) {
        Ok(metadata) => metadata,
        Err(_) => return WorkspaceEntryKind::Other,
    };

    classify_within_root(path, &metadata)
}

pub fn describe_existing_item(root: &Path, path: &Path) -> Result<WorkspaceItemDescriptor, String> {
    let canonical = fs::canonicalize(path)
        .map_err(|_| "The selected item no longer exists inside the workspace.".to_string())?;
    ensure_within_root(root, &canonical)?;

    let name = canonical
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "The selected item has an invalid name.".to_string())?
        .to_string();

    Ok(WorkspaceItemDescriptor {
        name,
        path: to_relative_path(root, &canonical)?,
        kind: classify_existing_path(&canonical),
    })
}

pub fn to_relative_path(root: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(root)
        .map_err(|_| OUTSIDE_ROOT_MESSAGE.to_string())?;

    Ok(relative
        .components()
        .map(|component| component.as_os_str().to_string_lossy().into_owned())
        .collect::<Vec<_>>()
        .join("/"))
}

pub fn sanitize_display_path(path: &Path) -> String {
    sanitize_path_string(&path.to_string_lossy())
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

fn list_tree_nodes(root: &Path) -> Result<Vec<WorkspaceTreeNode>, std::io::Error> {
    let mut visited = HashSet::new();
    read_directory_nodes(root, root, &mut visited)
}

fn read_directory_nodes(
    root: &Path,
    directory: &Path,
    visited: &mut HashSet<PathBuf>,
) -> Result<Vec<WorkspaceTreeNode>, std::io::Error> {
    let canonical_directory = fs::canonicalize(directory)?;
    if !visited.insert(canonical_directory.clone()) {
        return Ok(Vec::new());
    }

    let mut nodes = Vec::new();
    for entry in fs::read_dir(&canonical_directory)? {
        let entry = entry?;
        nodes.push(classify_tree_node(root, entry, visited)?);
    }

    visited.remove(&canonical_directory);
    nodes.sort_by(compare_tree_nodes);
    Ok(nodes)
}

fn classify_tree_node(
    root: &Path,
    entry: fs::DirEntry,
    visited: &mut HashSet<PathBuf>,
) -> Result<WorkspaceTreeNode, std::io::Error> {
    let entry_name = entry.file_name().to_string_lossy().into_owned();
    let entry_path = entry.path();
    let file_type = entry.file_type()?;
    let is_symlink = file_type.is_symlink();
    let resolved_path = fs::canonicalize(&entry_path).ok();

    let (kind, interactive, path, children) = match resolved_path {
        Some(canonical_target) if !canonical_target.starts_with(root) => (
            WorkspaceEntryKind::ExternalLink,
            false,
            sanitize_display_path(&canonical_target),
            Vec::new(),
        ),
        Some(canonical_target) => {
            let metadata = fs::metadata(&canonical_target)?;
            let kind = classify_within_root(&canonical_target, &metadata);
            let children = if metadata.is_dir() {
                read_directory_nodes(root, &canonical_target, visited)?
            } else {
                Vec::new()
            };

            (
                kind,
                matches!(
                    kind,
                    WorkspaceEntryKind::Directory | WorkspaceEntryKind::Markdown
                ),
                to_relative_path(root, &canonical_target)
                    .unwrap_or_else(|_| sanitize_display_path(&canonical_target)),
                children,
            )
        }
        None if is_symlink => (
            WorkspaceEntryKind::ExternalLink,
            false,
            sanitize_display_path(&entry_path),
            Vec::new(),
        ),
        None => {
            let metadata = entry.metadata()?;
            let kind = classify_within_root(&entry_path, &metadata);
            let children = if metadata.is_dir() {
                read_directory_nodes(root, &entry_path, visited)?
            } else {
                Vec::new()
            };

            let display_path = entry_path
                .strip_prefix(root)
                .map(|relative| {
                    relative
                        .components()
                        .map(|component| component.as_os_str().to_string_lossy().into_owned())
                        .collect::<Vec<_>>()
                        .join("/")
                })
                .unwrap_or_else(|_| sanitize_display_path(&entry_path));

            (
                kind,
                matches!(
                    kind,
                    WorkspaceEntryKind::Directory | WorkspaceEntryKind::Markdown
                ),
                display_path,
                children,
            )
        }
    };

    Ok(WorkspaceTreeNode {
        name: entry_name,
        path,
        kind,
        interactive,
        children,
    })
}

fn into_entry(node: WorkspaceTreeNode) -> WorkspaceEntry {
    WorkspaceEntry {
        name: node.name,
        path: node.path,
        kind: node.kind,
        interactive: node.interactive,
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

fn compare_tree_nodes(left: &WorkspaceTreeNode, right: &WorkspaceTreeNode) -> Ordering {
    entry_rank(left.kind)
        .cmp(&entry_rank(right.kind))
        .then_with(|| {
            left.name
                .to_ascii_lowercase()
                .cmp(&right.name.to_ascii_lowercase())
        })
}

fn entry_rank(kind: WorkspaceEntryKind) -> u8 {
    match kind {
        WorkspaceEntryKind::Directory => 0,
        WorkspaceEntryKind::Markdown => 1,
        WorkspaceEntryKind::Other => 2,
        WorkspaceEntryKind::ExternalLink => 3,
    }
}

fn sanitize_path_string(path: &str) -> String {
    path.strip_prefix(r"\\?\UNC\")
        .map(|value| format!(r"\\{}", value))
        .or_else(|| path.strip_prefix(r"\\?\").map(str::to_string))
        .unwrap_or_else(|| path.to_string())
}
