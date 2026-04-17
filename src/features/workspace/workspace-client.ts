import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";
import type {
  CreateWorkspaceItemResult,
  DeleteWorkspaceItemResult,
  MoveWorkspaceItemResult,
  OpenDocumentResult,
  RenameWorkspaceItemResult,
  SaveDocumentResult,
  WorkspaceItemKind,
  WorkspaceLoadResult,
  WorkspaceTreeResult,
} from "./types";

const workspaceStore = new LazyStore("workspace.json");
const lastWorkspaceKey = "lastWorkspacePath";

export async function pickWorkspaceDirectory() {
  const selection = await open({
    directory: true,
    multiple: false,
    title: "Choose workspace folder",
  });

  return typeof selection === "string" ? selection : null;
}

export async function loadWorkspace(path: string) {
  return invoke<WorkspaceLoadResult>("load_workspace", { path });
}

export async function listWorkspaceTree(workspacePath: string) {
  return invoke<WorkspaceTreeResult>("list_workspace_tree", { workspacePath });
}

export async function openDocument(
  workspacePath: string,
  documentPath: string,
) {
  return invoke<OpenDocumentResult>("open_document", {
    workspacePath,
    documentPath,
  });
}

export async function saveDocument(
  workspacePath: string,
  documentPath: string,
  content: string,
) {
  return invoke<SaveDocumentResult>("save_document", {
    workspacePath,
    documentPath,
    content,
  });
}

export async function createWorkspaceItem(
  workspacePath: string,
  kind: WorkspaceItemKind,
  options: {
    parentPath?: string | null;
    name?: string | null;
  } = {},
) {
  return invoke<CreateWorkspaceItemResult>("create_workspace_item", {
    workspacePath,
    parentPath: options.parentPath ?? null,
    kind,
    name: options.name ?? null,
  });
}

export async function renameWorkspaceItem(
  workspacePath: string,
  itemPath: string,
  name?: string | null,
) {
  return invoke<RenameWorkspaceItemResult>("rename_workspace_item", {
    workspacePath,
    itemPath,
    name: name ?? null,
  });
}

export async function moveWorkspaceItem(
  workspacePath: string,
  itemPath: string,
  destinationPath: string,
) {
  return invoke<MoveWorkspaceItemResult>("move_workspace_item", {
    workspacePath,
    itemPath,
    destinationPath,
  });
}

export async function deleteWorkspaceItem(
  workspacePath: string,
  itemPath: string,
) {
  return invoke<DeleteWorkspaceItemResult>("delete_workspace_item", {
    workspacePath,
    itemPath,
  });
}

export async function readLastWorkspacePath() {
  return (await workspaceStore.get<string>(lastWorkspaceKey)) ?? null;
}

export async function saveLastWorkspacePath(path: string) {
  await workspaceStore.set(lastWorkspaceKey, path);
  await workspaceStore.save();
}
