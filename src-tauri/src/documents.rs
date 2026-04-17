use crate::workspace::{
    classify_existing_path, describe_existing_item, ensure_within_root, normalize_relative_path,
    resolve_relative_directory, resolve_relative_path, resolve_workspace_root, to_relative_path,
    WorkspaceEntryKind, WorkspaceItemDescriptor, WorkspaceItemKind,
};
use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const DOCUMENT_NOT_SUPPORTED_MESSAGE: &str =
    "Only Markdown files can be opened in the editor right now.";
const RECYCLE_BIN_UNAVAILABLE_MESSAGE: &str =
    "This item couldn't be moved to the Recycle Bin, so it was left in place.";

#[derive(Serialize)]
pub struct OpenDocumentResult {
    path: String,
    name: String,
    content: String,
}

#[derive(Serialize)]
pub struct SaveDocumentResult {
    path: String,
    saved_bytes: usize,
}

#[derive(Serialize)]
pub struct CreateWorkspaceItemResult {
    item: WorkspaceItemDescriptor,
    opened_document: bool,
}

#[derive(Serialize)]
pub struct RenameWorkspaceItemResult {
    previous_path: String,
    item: WorkspaceItemDescriptor,
}

#[derive(Serialize)]
pub struct MoveWorkspaceItemResult {
    previous_path: String,
    item: WorkspaceItemDescriptor,
}

#[derive(Serialize)]
pub struct DeleteWorkspaceItemResult {
    path: String,
    kind: WorkspaceEntryKind,
}

#[tauri::command]
pub fn open_document(
    workspace_path: String,
    document_path: String,
) -> Result<OpenDocumentResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let document = resolve_relative_path(&root, &document_path)?;
    ensure_markdown_document(&document)?;

    let content = fs::read_to_string(&document)
        .map_err(|error| format!("Couldn't open the document: {error}"))?;

    Ok(OpenDocumentResult {
        path: to_relative_path(&root, &document)?,
        name: file_name_string(&document)?,
        content,
    })
}

#[tauri::command]
pub fn save_document(
    workspace_path: String,
    document_path: String,
    content: String,
) -> Result<SaveDocumentResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let document = resolve_document_write_target(&root, &document_path)?;
    ensure_markdown_path(&document)?;

    safe_write_document(&document, &content)?;

    Ok(SaveDocumentResult {
        path: to_relative_path(&root, &document)?,
        saved_bytes: content.len(),
    })
}

#[tauri::command]
pub fn create_workspace_item(
    workspace_path: String,
    parent_path: Option<String>,
    kind: WorkspaceItemKind,
    name: Option<String>,
) -> Result<CreateWorkspaceItemResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let parent = resolve_relative_directory(&root, parent_path.as_deref())?;
    let target = resolve_create_target(&parent, kind, name.as_deref())?;

    match kind {
        WorkspaceItemKind::Directory => {
            fs::create_dir(&target)
                .map_err(|error| format!("Couldn't create the folder: {error}"))?;
        }
        WorkspaceItemKind::Markdown => {
            fs::File::create(&target)
                .map_err(|error| format!("Couldn't create the note: {error}"))?;
        }
    }

    Ok(CreateWorkspaceItemResult {
        item: describe_existing_item(&root, &target)?,
        opened_document: matches!(kind, WorkspaceItemKind::Markdown),
    })
}

#[tauri::command]
pub fn rename_workspace_item(
    workspace_path: String,
    item_path: String,
    name: Option<String>,
) -> Result<RenameWorkspaceItemResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let source = resolve_relative_path(&root, &item_path)?;
    let previous_path = to_relative_path(&root, &source)?;
    let kind = classify_existing_path(&source);
    let target = resolve_rename_target(&source, kind, name.as_deref())?;

    if target != source {
        fs::rename(&source, &target)
            .map_err(|error| format!("Couldn't rename the item: {error}"))?;
    }

    Ok(RenameWorkspaceItemResult {
        previous_path,
        item: describe_existing_item(&root, &target)?,
    })
}

#[tauri::command]
pub fn move_workspace_item(
    workspace_path: String,
    item_path: String,
    destination_path: String,
) -> Result<MoveWorkspaceItemResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let source = resolve_relative_path(&root, &item_path)?;
    let previous_path = to_relative_path(&root, &source)?;
    let destination = resolve_relative_directory(&root, Some(&destination_path))?;

    if source == destination {
        return Err("A file can't be moved onto itself.".to_string());
    }

    if source.is_dir() && destination.starts_with(&source) {
        return Err("Folders can't be moved into themselves.".to_string());
    }

    let target = destination.join(file_name_string(&source)?);
    if target.exists() && target != source {
        return Err("That destination already contains an item with the same name.".to_string());
    }

    if target != source {
        fs::rename(&source, &target).map_err(|error| format!("Couldn't move the item: {error}"))?;
    }

    Ok(MoveWorkspaceItemResult {
        previous_path,
        item: describe_existing_item(&root, &target)?,
    })
}

#[tauri::command]
pub fn delete_workspace_item(
    workspace_path: String,
    item_path: String,
) -> Result<DeleteWorkspaceItemResult, String> {
    let root = resolve_workspace_root(&workspace_path)?;
    let target = resolve_relative_path(&root, &item_path)?;
    let path = to_relative_path(&root, &target)?;
    let kind = classify_existing_path(&target);

    trash::delete(&target).map_err(|_| RECYCLE_BIN_UNAVAILABLE_MESSAGE.to_string())?;

    Ok(DeleteWorkspaceItemResult { path, kind })
}

fn resolve_document_write_target(root: &Path, document_path: &str) -> Result<PathBuf, String> {
    let relative = normalize_relative_path(document_path, false)?;
    let candidate = root.join(&relative);
    let parent = candidate
        .parent()
        .ok_or_else(|| "The selected document is missing its parent folder.".to_string())?;
    let canonical_parent = fs::canonicalize(parent)
        .map_err(|_| "The selected document folder no longer exists.".to_string())?;
    ensure_within_root(root, &canonical_parent)?;

    Ok(canonical_parent.join(
        candidate
            .file_name()
            .ok_or_else(|| "The selected document has an invalid name.".to_string())?,
    ))
}

fn resolve_create_target(
    parent: &Path,
    kind: WorkspaceItemKind,
    name: Option<&str>,
) -> Result<PathBuf, String> {
    let Some(explicit_name) = normalize_item_name(name, kind) else {
        return find_available_default_path(parent, kind);
    };

    let target = parent.join(&explicit_name);
    if target.exists() {
        return Err("An item with that name already exists in this folder.".to_string());
    }

    Ok(target)
}

fn resolve_rename_target(
    source: &Path,
    kind: WorkspaceEntryKind,
    name: Option<&str>,
) -> Result<PathBuf, String> {
    let parent = source
        .parent()
        .ok_or_else(|| "The selected item is missing its parent folder.".to_string())?;

    let next_name = match normalize_rename_name(name, kind) {
        Some(name) => name,
        None => {
            let fallback_kind = match kind {
                WorkspaceEntryKind::Directory => WorkspaceItemKind::Directory,
                _ => WorkspaceItemKind::Markdown,
            };
            return find_available_default_path_excluding(parent, fallback_kind, source);
        }
    };

    let target = parent.join(next_name);
    if target.exists() && target != source {
        return Err("An item with that name already exists in this folder.".to_string());
    }

    Ok(target)
}

fn normalize_item_name(name: Option<&str>, kind: WorkspaceItemKind) -> Option<String> {
    let trimmed = name?.trim();
    if trimmed.is_empty() {
        return None;
    }

    validate_name_segments(trimmed).ok()?;

    Some(match kind {
        WorkspaceItemKind::Directory => trimmed.to_string(),
        WorkspaceItemKind::Markdown => ensure_markdown_name(trimmed),
    })
}

fn normalize_rename_name(name: Option<&str>, kind: WorkspaceEntryKind) -> Option<String> {
    let trimmed = name?.trim();
    if trimmed.is_empty() {
        return None;
    }

    validate_name_segments(trimmed).ok()?;

    Some(match kind {
        WorkspaceEntryKind::Directory => trimmed.to_string(),
        _ => ensure_markdown_name(trimmed),
    })
}

fn validate_name_segments(name: &str) -> Result<(), String> {
    if name.contains(['\\', '/', ':']) {
        return Err("Item names can't contain path separators.".to_string());
    }

    if matches!(name, "." | "..") {
        return Err("Item names must stay inside the workspace.".to_string());
    }

    Ok(())
}

fn ensure_markdown_document(path: &Path) -> Result<(), String> {
    ensure_markdown_path(path)?;

    if !path.is_file() {
        return Err("That Markdown note is no longer available.".to_string());
    }

    Ok(())
}

fn ensure_markdown_path(path: &Path) -> Result<(), String> {
    let is_markdown = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .is_some_and(|value| matches!(value.as_str(), "md" | "markdown" | "mdown"));

    if is_markdown {
        Ok(())
    } else {
        Err(DOCUMENT_NOT_SUPPORTED_MESSAGE.to_string())
    }
}

fn ensure_markdown_name(name: &str) -> String {
    let lowercase = Path::new(name)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());

    match lowercase.as_deref() {
        Some("md") | Some("markdown") | Some("mdown") => name.to_string(),
        _ => format!("{name}.md"),
    }
}

fn find_available_default_path(parent: &Path, kind: WorkspaceItemKind) -> Result<PathBuf, String> {
    find_available_default_path_excluding(parent, kind, Path::new(""))
}

fn find_available_default_path_excluding(
    parent: &Path,
    kind: WorkspaceItemKind,
    exclude: &Path,
) -> Result<PathBuf, String> {
    let (base_name, extension) = match kind {
        WorkspaceItemKind::Directory => ("New Folder", None),
        WorkspaceItemKind::Markdown => ("Untitled", Some("md")),
    };

    for index in 1..=10_000 {
        let stem = if index == 1 {
            base_name.to_string()
        } else {
            format!("{base_name} {index}")
        };

        let file_name = match extension {
            Some(extension) => format!("{stem}.{extension}"),
            None => stem,
        };

        let candidate = parent.join(file_name);
        if !candidate.exists() || candidate == exclude {
            return Ok(candidate);
        }
    }

    Err("Couldn't find an available fallback name in this folder.".to_string())
}

fn safe_write_document(path: &Path, content: &str) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "The selected document is missing its parent folder.".to_string())?;
    let temp_path = build_sibling_temp_path(path, "saving");

    let mut temp_file = fs::File::create(&temp_path)
        .map_err(|error| format!("Couldn't create the save swap file: {error}"))?;
    temp_file
        .write_all(content.as_bytes())
        .map_err(|error| format!("Couldn't write the save swap file: {error}"))?;
    temp_file
        .sync_all()
        .map_err(|error| format!("Couldn't flush the save swap file: {error}"))?;
    drop(temp_file);

    if path.exists() {
        let backup_path = build_sibling_temp_path(path, "backup");
        fs::rename(path, &backup_path).map_err(|error| {
            format!("Couldn't prepare the existing document for a safe save: {error}")
        })?;

        if let Err(error) = fs::rename(&temp_path, path) {
            let _ = fs::rename(&backup_path, path);
            let _ = fs::remove_file(&temp_path);
            return Err(format!("Couldn't finalize the safe save: {error}"));
        }

        let _ = fs::remove_file(&backup_path);
    } else {
        fs::rename(&temp_path, path)
            .map_err(|error| format!("Couldn't finalize the safe save: {error}"))?;
    }

    sync_directory(parent);
    Ok(())
}

fn build_sibling_temp_path(path: &Path, label: &str) -> PathBuf {
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("document.md");
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();

    parent.join(format!(".{file_name}.{label}.{timestamp}.tmp"))
}

fn sync_directory(path: &Path) {
    if let Ok(directory) = fs::File::open(path) {
        let _ = directory.sync_all();
    }
}

fn file_name_string(path: &Path) -> Result<String, String> {
    path.file_name()
        .and_then(|value| value.to_str())
        .map(str::to_string)
        .ok_or_else(|| "The selected item has an invalid name.".to_string())
}

#[cfg(test)]
mod tests {
    use super::{
        create_workspace_item, move_workspace_item, open_document, rename_workspace_item,
        save_document,
    };
    use crate::workspace::WorkspaceItemKind;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_test_root() -> PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or_default();
        let root = std::env::temp_dir().join(format!("react-tauri-app-phase-02-{stamp}"));
        fs::create_dir_all(&root).unwrap();
        root
    }

    #[test]
    fn workspace_rejects_out_of_root_document_open() {
        let root = unique_test_root();
        let root_path = root.to_string_lossy().to_string();

        let result = open_document(root_path, "../escape.md".to_string());
        assert!(result.is_err());

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn workspace_saves_and_reopens_document_without_losing_content() {
        let root = unique_test_root();
        let root_path = root.to_string_lossy().to_string();
        let document = root.join("notes.md");
        fs::write(&document, "before").unwrap();

        let save_result = save_document(
            root_path.clone(),
            "notes.md".to_string(),
            "# Updated\n\nBody".to_string(),
        )
        .unwrap();
        assert_eq!(save_result.path, "notes.md");

        let open_result = open_document(root_path, "notes.md".to_string()).unwrap();
        assert_eq!(open_result.content, "# Updated\n\nBody");

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn workspace_returns_authoritative_paths_for_rename_and_move() {
        let root = unique_test_root();
        let root_path = root.to_string_lossy().to_string();

        let created = create_workspace_item(
            root_path.clone(),
            None,
            WorkspaceItemKind::Markdown,
            Some("draft".to_string()),
        )
        .unwrap();
        assert_eq!(created.item.path, "draft.md");

        let renamed = rename_workspace_item(
            root_path.clone(),
            created.item.path.clone(),
            Some("chapter-one".to_string()),
        )
        .unwrap();
        assert_eq!(renamed.previous_path, "draft.md");
        assert_eq!(renamed.item.path, "chapter-one.md");

        fs::create_dir(root.join("archive")).unwrap();
        let moved =
            move_workspace_item(root_path, renamed.item.path.clone(), "archive".to_string())
                .unwrap();
        assert_eq!(moved.previous_path, "chapter-one.md");
        assert_eq!(moved.item.path, "archive/chapter-one.md");

        let _ = fs::remove_dir_all(root);
    }
}
