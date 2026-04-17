import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { LazyStore } from "@tauri-apps/plugin-store";
import type { WorkspaceLoadResult } from "./types";

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

export async function readLastWorkspacePath() {
  return (await workspaceStore.get<string>(lastWorkspaceKey)) ?? null;
}

export async function saveLastWorkspacePath(path: string) {
  await workspaceStore.set(lastWorkspaceKey, path);
  await workspaceStore.save();
}
