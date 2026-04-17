import { useEffect, useState } from "react";
import type { DocumentSessionState } from "./types";
import {
  deleteWorkspaceItem,
  openDocument,
  saveDocument,
} from "../workspace/workspace-client";

type UseDocumentSessionOptions = {
  workspacePath: string;
};

const initialState: DocumentSessionState = {
  currentDocumentPath: null,
  content: "",
  savedContent: "",
  saveStatus: "saved",
  statusMessage: "Open a Markdown note to start writing here.",
  lastSavedAt: null,
};

function replacePathPrefix(
  currentPath: string | null,
  previousPath: string,
  nextPath: string,
) {
  if (!currentPath) {
    return currentPath;
  }

  if (currentPath === previousPath) {
    return nextPath;
  }

  if (currentPath.startsWith(`${previousPath}/`)) {
    return `${nextPath}${currentPath.slice(previousPath.length)}`;
  }

  return currentPath;
}

function savedTimestampMessage(timestamp: string | null) {
  if (!timestamp) {
    return "Saved";
  }

  return `Saved at ${new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function useDocumentSession({ workspacePath }: UseDocumentSessionOptions) {
  const [state, setState] = useState<DocumentSessionState>(initialState);

  const isDirty =
    state.currentDocumentPath !== null && state.content !== state.savedContent;

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      const key = event.key.toLowerCase();

      // Ctrl+F stays note-scoped by opening the embedded document find bar.
      if (key === "f" && state.currentDocumentPath) {
        event.preventDefault();
        window.dispatchEvent(new Event("document-session:open-find"));
        return;
      }

      if (key !== "s") {
        return;
      }

      event.preventDefault();
      void saveCurrentDocument();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [state.content, state.currentDocumentPath, workspacePath]);

  async function loadDocument(path: string) {
    const result = await openDocument(workspacePath, path);
    setState({
      currentDocumentPath: result.path,
      content: result.content,
      savedContent: result.content,
      saveStatus: "saved",
      statusMessage: "Saved",
      lastSavedAt: new Date().toISOString(),
    });
  }

  async function saveCurrentDocument() {
    if (!state.currentDocumentPath) {
      return false;
    }

    setState((currentState) => ({
      ...currentState,
      saveStatus: "saving",
      statusMessage: `Saving ${currentState.currentDocumentPath}...`,
    }));

    try {
      const saveResult = await saveDocument(
        workspacePath,
        state.currentDocumentPath,
        state.content,
      );
      const savedAt = new Date().toISOString();

      setState((currentState) => ({
        ...currentState,
        currentDocumentPath: saveResult.path,
        savedContent: currentState.content,
        saveStatus: "saved",
        statusMessage: savedTimestampMessage(savedAt),
        lastSavedAt: savedAt,
      }));

      return true;
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        saveStatus: "failed",
        statusMessage:
          error instanceof Error
            ? error.message
            : "Save failed. Keep the window open and try again.",
      }));

      return false;
    }
  }

  async function attemptSaveBefore(nextPath: string) {
    if (!isDirty || !state.currentDocumentPath || state.currentDocumentPath === nextPath) {
      return true;
    }

    return saveCurrentDocument();
  }

  async function beforeSelectPath(nextPath: string) {
    if (state.currentDocumentPath === nextPath) {
      return true;
    }

    if (!(await attemptSaveBefore(nextPath))) {
      return false;
    }

    try {
      await loadDocument(nextPath);
      return true;
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        saveStatus: "failed",
        statusMessage:
          error instanceof Error
            ? error.message
            : "This note couldn't be opened right now.",
      }));
      return false;
    }
  }

  async function deleteCurrentDocument(path: string) {
    if (state.currentDocumentPath !== path) {
      await deleteWorkspaceItem(workspacePath, path);
      return "deleted" as const;
    }

    if (!(await attemptSaveBefore(path))) {
      return "kept" as const;
    }

    try {
      await deleteWorkspaceItem(workspacePath, path);
      setState(initialState);
      return "deleted" as const;
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        saveStatus: "failed",
        statusMessage:
          error instanceof Error
            ? error.message
            : "The current note couldn't be moved to the Recycle Bin.",
      }));
      return "kept" as const;
    }
  }

  function updateContent(content: string) {
    setState((currentState) => ({
      ...currentState,
      content,
      saveStatus: currentState.currentDocumentPath
        ? content !== currentState.savedContent
          ? "unsaved"
          : "saved"
        : currentState.saveStatus,
      statusMessage: currentState.currentDocumentPath
        ? content !== currentState.savedContent
          ? "Unsaved changes"
          : savedTimestampMessage(currentState.lastSavedAt)
        : currentState.statusMessage,
    }));
  }

  function followCurrentDocumentPath(previousPath: string, nextPath: string) {
    setState((currentState) => {
      const currentDocumentPath = replacePathPrefix(
        currentState.currentDocumentPath,
        previousPath,
        nextPath,
      );

      return {
        ...currentState,
        currentDocumentPath,
        statusMessage:
          currentDocumentPath && currentState.saveStatus === "saved"
            ? savedTimestampMessage(currentState.lastSavedAt)
            : currentState.statusMessage,
      };
    });
  }

  function clearDeletedDocument(path: string) {
    setState((currentState) =>
      currentState.currentDocumentPath &&
      (currentState.currentDocumentPath === path ||
        currentState.currentDocumentPath.startsWith(`${path}/`))
        ? initialState
        : currentState,
    );
  }

  return {
    currentDocumentPath: state.currentDocumentPath,
    content: state.content,
    saveStatus: state.saveStatus,
    statusMessage: state.statusMessage,
    isDirty,
    beforeSelectPath,
    updateContent,
    saveCurrentDocument,
    deleteCurrentDocument,
    followCurrentDocumentPath,
    clearDeletedDocument,
  };
}
