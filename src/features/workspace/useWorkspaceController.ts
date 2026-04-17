import { useEffect, useState } from "react";
import type { WorkspaceLoadResult } from "./types";
import {
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
  const [brokenPath, setBrokenPath] = useState("");
  const [boundaryMessage, setBoundaryMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function applyWorkspacePath(path: string, source: "restore" | "manual") {
    setIsLoading(true);

    try {
      const result = await loadWorkspace(path);

      if (result.status === "ready") {
        await saveLastWorkspacePath(result.requested_path);
        setWorkspace(result);
        setBrokenPath("");
        setBoundaryMessage(null);
        setMode("ready");
        return;
      }

      setBrokenPath(fallbackBrokenPath(result, path));

      if (source === "restore") {
        setMode("invalid");
        setWorkspace(null);
      } else {
        setMode("invalid");
      }
    } catch {
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
            setBrokenPath("");
            setBoundaryMessage(null);
            setIsLoading(false);
          }
          return;
        }

        const result = await loadWorkspace(lastWorkspacePath);
        if (cancelled) {
          return;
        }

        if (result.status === "ready") {
          setWorkspace(result);
          setBrokenPath("");
          setBoundaryMessage(null);
          setMode("ready");
          return;
        }

        setWorkspace(null);
        setBrokenPath(fallbackBrokenPath(result, lastWorkspacePath));
        setBoundaryMessage(null);
        setMode("invalid");
      } catch {
        if (!cancelled) {
          setWorkspace(null);
          setBoundaryMessage(null);

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
    brokenPath,
    boundaryMessage,
    isLoading,
    onChooseWorkspace: chooseWorkspace,
    onRetryWorkspace: retryWorkspace,
    rejectBoundaryAction,
  };
}
