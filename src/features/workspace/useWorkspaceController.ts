import { useEffect, useRef, useState } from "react";
import type { WorkspaceLoadResult, WorkspaceTreeNode } from "./types";
import {
  listWorkspaceTree,
  loadWorkspace,
  pickWorkspaceDirectory,
  readLastWorkspacePath,
  saveLastWorkspacePath,
} from "./workspace-client";

type WorkspaceMode = "loading" | "welcome" | "invalid" | "ready";

const boundaryRejectionMessage =
  "That location is outside the current workspace and can't be opened here.";

function fallbackBrokenPath(
  result: WorkspaceLoadResult,
  preferredPath: string | null,
) {
  return result.display_path || result.requested_path || preferredPath || "";
}

export function useWorkspaceController() {
  const [mode, setMode] = useState<WorkspaceMode>("loading");
  const [workspace, setWorkspace] = useState<WorkspaceLoadResult | null>(null);
  const [treeNodes, setTreeNodes] = useState<WorkspaceTreeNode[]>([]);
  const [brokenPath, setBrokenPath] = useState("");
  const [boundaryMessage, setBoundaryMessage] = useState<string | null>(null);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const activeWorkspacePathRef = useRef<string | null>(null);

  async function hydrateTree(workspacePath: string) {
    setIsTreeLoading(true);

    try {
      const tree = await listWorkspaceTree(workspacePath);
      setTreeNodes(tree.nodes);
      setWorkspaceMessage(null);
    } catch (error) {
      setTreeNodes([]);
      setWorkspaceMessage(
        error instanceof Error
          ? error.message
          : "The workspace tree couldn't be loaded right now.",
      );
    } finally {
      setIsTreeLoading(false);
    }
  }

  async function applyWorkspacePath(path: string, source: "restore" | "manual") {
    setIsLoading(true);
    setWorkspaceMessage(null);

    try {
      const result = await loadWorkspace(path);

      if (result.status === "ready") {
        activeWorkspacePathRef.current = result.requested_path;
        await saveLastWorkspacePath(result.requested_path);
        setWorkspace(result);
        setBrokenPath("");
        setBoundaryMessage(null);
        setMode("ready");
        await hydrateTree(result.requested_path);
        return;
      }

      activeWorkspacePathRef.current = null;
      setTreeNodes([]);
      setBrokenPath(fallbackBrokenPath(result, path));

      if (source === "restore") {
        setMode("invalid");
        setWorkspace(null);
      } else {
        setMode("invalid");
      }
    } catch {
      activeWorkspacePathRef.current = null;
      setTreeNodes([]);

      if (source === "restore") {
        setWorkspace(null);
        setMode("invalid");
        setBrokenPath(path);
      } else {
        setMode("invalid");
        setBrokenPath(path);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function chooseWorkspace() {
    const selectedPath = await pickWorkspaceDirectory();
    if (!selectedPath) {
      return;
    }

    await applyWorkspacePath(selectedPath, "manual");
  }

  async function retryWorkspace() {
    await chooseWorkspace();
  }

  function rejectBoundaryAction() {
    setBoundaryMessage(boundaryRejectionMessage);
  }

  function clearBoundaryMessage() {
    setBoundaryMessage(null);
  }

  function clearWorkspaceMessage() {
    setWorkspaceMessage(null);
  }

  async function refreshTree() {
    const workspacePath = activeWorkspacePathRef.current;
    if (!workspacePath) {
      return;
    }

    await hydrateTree(workspacePath);
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreWorkspace() {
      setIsLoading(true);
      let lastWorkspacePath: string | null = null;

      try {
        lastWorkspacePath = await readLastWorkspacePath();

        if (!lastWorkspacePath) {
          if (!cancelled) {
            setMode("welcome");
            setWorkspace(null);
            setTreeNodes([]);
            setBrokenPath("");
            setBoundaryMessage(null);
            setWorkspaceMessage(null);
            setIsLoading(false);
          }
          return;
        }

        const result = await loadWorkspace(lastWorkspacePath);
        if (cancelled) {
          return;
        }

        if (result.status === "ready") {
          activeWorkspacePathRef.current = result.requested_path;
          setWorkspace(result);
          setBrokenPath("");
          setBoundaryMessage(null);
          setMode("ready");

          setIsTreeLoading(true);
          try {
            const tree = await listWorkspaceTree(result.requested_path);
            if (!cancelled) {
              setTreeNodes(tree.nodes);
              setWorkspaceMessage(null);
            }
          } catch (error) {
            if (!cancelled) {
              setTreeNodes([]);
              setWorkspaceMessage(
                error instanceof Error
                  ? error.message
                  : "The workspace tree couldn't be loaded right now.",
              );
            }
          } finally {
            if (!cancelled) {
              setIsTreeLoading(false);
            }
          }

          return;
        }

        activeWorkspacePathRef.current = null;
        setWorkspace(null);
        setTreeNodes([]);
        setBrokenPath(fallbackBrokenPath(result, lastWorkspacePath));
        setBoundaryMessage(null);
        setWorkspaceMessage(null);
        setMode("invalid");
      } catch {
        activeWorkspacePathRef.current = null;

        if (!cancelled) {
          setWorkspace(null);
          setTreeNodes([]);
          setBoundaryMessage(null);
          setWorkspaceMessage(null);

          if (lastWorkspacePath) {
            setBrokenPath(lastWorkspacePath);
            setMode("invalid");
          } else {
            setBrokenPath("");
            setMode("welcome");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    mode,
    workspace,
    treeNodes,
    brokenPath,
    boundaryMessage,
    workspaceMessage,
    isLoading,
    isTreeLoading,
    onChooseWorkspace: chooseWorkspace,
    onRetryWorkspace: retryWorkspace,
    rejectBoundaryAction,
    clearBoundaryMessage,
    clearWorkspaceMessage,
    refreshTree,
  };
}
