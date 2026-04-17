import { useEffect, useState } from "react";
import type {
  WorkspaceEntryKind,
  WorkspaceItemKind,
  WorkspaceTreeNode,
} from "./types";
import {
  createWorkspaceItem,
  deleteWorkspaceItem,
  moveWorkspaceItem,
  renameWorkspaceItem,
} from "./workspace-client";

const unsupportedFileMessage =
  "This file type can't be opened here yet. It stays visible for orientation only.";

type PendingCreateState = {
  parentPath: string | null;
  kind: WorkspaceItemKind;
  name: string;
  depth: number;
};

type PendingRenameState = {
  itemPath: string;
  itemName: string;
  itemKind: WorkspaceEntryKind;
  name: string;
};

type DeleteTarget = {
  path: string;
  name: string;
  kind: WorkspaceEntryKind;
  isCurrentDocument: boolean;
};

type UseWorkspaceTreeControllerOptions = {
  workspacePath: string;
  nodes: WorkspaceTreeNode[];
  currentDocumentPath: string | null;
  reloadTree: () => Promise<void>;
  beforeSelectPath: (path: string) => Promise<boolean>;
  followCurrentDocumentPath: (previousPath: string, nextPath: string) => void;
  clearDeletedDocument: (path: string) => void;
  onBoundaryReject?: () => void;
  onDeleteCurrentDocument?: (path: string) => Promise<"deleted" | "kept">;
};

type FlatNode = WorkspaceTreeNode & {
  depth: number;
  parentPath: string | null;
};

function flattenNodes(
  nodes: WorkspaceTreeNode[],
  depth = 0,
  parentPath: string | null = null,
): FlatNode[] {
  return nodes.flatMap((node) => [
    { ...node, depth, parentPath },
    ...flattenNodes(node.children, depth + 1, node.path),
  ]);
}

function buildNodeLookup(nodes: WorkspaceTreeNode[]) {
  const entries = flattenNodes(nodes);
  const lookup = new Map<string, FlatNode>();

  for (const entry of entries) {
    lookup.set(entry.path, entry);
  }

  return lookup;
}

function isDescendantPath(candidatePath: string, ancestorPath: string) {
  return candidatePath === ancestorPath || candidatePath.startsWith(`${ancestorPath}/`);
}

export function useWorkspaceTreeController({
  workspacePath,
  nodes,
  currentDocumentPath,
  reloadTree,
  beforeSelectPath,
  followCurrentDocumentPath,
  clearDeletedDocument,
  onBoundaryReject,
  onDeleteCurrentDocument,
}: UseWorkspaceTreeControllerOptions) {
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
  const [unsupportedMessage, setUnsupportedMessage] = useState<string | null>(
    null,
  );
  const [pendingCreate, setPendingCreate] = useState<PendingCreateState | null>(
    null,
  );
  const [pendingRename, setPendingRename] = useState<PendingRenameState | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const nodeLookup = buildNodeLookup(nodes);

  useEffect(() => {
    if (!currentDocumentPath) {
      return;
    }

    const currentNode = nodeLookup.get(currentDocumentPath);
    if (!currentNode) {
      return;
    }

    let nextPath = currentNode.parentPath;
    const pathsToExpand: string[] = [];

    while (nextPath) {
      pathsToExpand.push(nextPath);
      nextPath = nodeLookup.get(nextPath)?.parentPath ?? null;
    }

    if (pathsToExpand.length > 0) {
      setExpandedPaths((previousPaths) => {
        const mergedPaths = new Set(previousPaths);
        pathsToExpand.forEach((path) => mergedPaths.add(path));
        return Array.from(mergedPaths);
      });
    }
  }, [currentDocumentPath, nodeLookup]);

  function toggleFolder(path: string) {
    setExpandedPaths((previousPaths) =>
      previousPaths.includes(path)
        ? previousPaths.filter((value) => value !== path)
        : [...previousPaths, path],
    );
  }

  function clearUnsupportedMessage() {
    setUnsupportedMessage(null);
  }

  async function activateNode(node: WorkspaceTreeNode) {
    if (node.kind === "directory") {
      clearUnsupportedMessage();
      toggleFolder(node.path);
      return;
    }

    if (node.kind === "markdown") {
      clearUnsupportedMessage();
      await beforeSelectPath(node.path);
      return;
    }

    onBoundaryReject?.();
    setUnsupportedMessage(unsupportedFileMessage);
  }

  function beginCreate(kind: WorkspaceItemKind) {
    const currentNode = currentDocumentPath
      ? nodeLookup.get(currentDocumentPath) ?? null
      : null;
    const parentPath = currentNode?.parentPath ?? null;
    const depth = currentNode?.depth ?? 0;

    setPendingRename(null);
    setDeleteTarget(null);
    clearUnsupportedMessage();
    setPendingCreate({
      parentPath,
      kind,
      name: "",
      depth,
    });
  }

  function beginCreateForFolder(kind: WorkspaceItemKind, parentPath: string) {
    const parentNode = nodeLookup.get(parentPath);
    const depth = (parentNode?.depth ?? 0) + 1;

    setPendingRename(null);
    setDeleteTarget(null);
    clearUnsupportedMessage();
    setExpandedPaths((previousPaths) =>
      previousPaths.includes(parentPath)
        ? previousPaths
        : [...previousPaths, parentPath],
    );
    setPendingCreate({
      parentPath,
      kind,
      name: "",
      depth,
    });
  }

  function updatePendingCreate(name: string) {
    setPendingCreate((currentState) =>
      currentState
        ? {
            ...currentState,
            name,
          }
        : currentState,
    );
  }

  async function submitPendingCreate(nameOverride?: string | null) {
    if (!pendingCreate) {
      return;
    }

    setIsMutating(true);

    try {
      const result = await createWorkspaceItem(workspacePath, pendingCreate.kind, {
        parentPath: pendingCreate.parentPath,
        name: (nameOverride ?? pendingCreate.name) || null,
      });
      await reloadTree();
      setPendingCreate(null);
      clearUnsupportedMessage();

      if (result.opened_document) {
        await beforeSelectPath(result.item.path);
      }

      if (pendingCreate.parentPath) {
        setExpandedPaths((previousPaths) =>
          previousPaths.includes(pendingCreate.parentPath!)
            ? previousPaths
            : [...previousPaths, pendingCreate.parentPath!],
        );
      }
    } finally {
      setIsMutating(false);
    }
  }

  function beginRename(node: WorkspaceTreeNode) {
    setPendingCreate(null);
    setDeleteTarget(null);
    clearUnsupportedMessage();
    setPendingRename({
      itemPath: node.path,
      itemName: node.name,
      itemKind: node.kind,
      name: node.name,
    });
  }

  function updatePendingRename(name: string) {
    setPendingRename((currentState) =>
      currentState
        ? {
            ...currentState,
            name,
          }
        : currentState,
    );
  }

  function cancelPendingRename() {
    setPendingRename(null);
  }

  async function submitPendingRename() {
    if (!pendingRename) {
      return;
    }

    setIsMutating(true);

    try {
      const renameResult = await renameWorkspaceItem(
        workspacePath,
        pendingRename.itemPath,
        pendingRename.name,
      );
      await reloadTree();
      followCurrentDocumentPath(renameResult.previous_path, renameResult.item.path);
      setPendingRename(null);
    } finally {
      setIsMutating(false);
    }
  }

  function requestDelete(node: WorkspaceTreeNode) {
    setPendingCreate(null);
    setPendingRename(null);
    setDeleteTarget({
      path: node.path,
      name: node.name,
      kind: node.kind,
      isCurrentDocument: currentDocumentPath === node.path,
    });
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsMutating(true);

    try {
      if (deleteTarget.isCurrentDocument && onDeleteCurrentDocument) {
        const result = await onDeleteCurrentDocument(deleteTarget.path);
        if (result === "kept") {
          setDeleteTarget(null);
          return;
        }
      } else {
        await deleteWorkspaceItem(workspacePath, deleteTarget.path);
        clearDeletedDocument(deleteTarget.path);
      }

      await reloadTree();
      setDeleteTarget(null);
    } finally {
      setIsMutating(false);
    }
  }

  function beginDrag(path: string) {
    setDraggedPath(path);
    setDropTargetPath(null);
  }

  function clearDragState() {
    setDraggedPath(null);
    setDropTargetPath(null);
  }

  function canDropOn(targetPath: string | null) {
    if (!draggedPath) {
      return false;
    }

    const draggedNode = nodeLookup.get(draggedPath);
    if (!draggedNode) {
      return false;
    }

    if (targetPath === null) {
      return false;
    }

    if (targetPath === "") {
      return draggedNode.parentPath !== null;
    }

    const targetNode = nodeLookup.get(targetPath);
    if (!targetNode || targetNode.kind !== "directory") {
      return false;
    }

    if (draggedPath === targetPath) {
      return false;
    }

    if (
      draggedNode.kind === "directory" &&
      isDescendantPath(targetPath, draggedPath)
    ) {
      return false;
    }

    return draggedNode.parentPath !== targetPath;
  }

  function activateDropTarget(targetPath: string | null) {
    setDropTargetPath(canDropOn(targetPath) ? targetPath : null);
  }

  async function completeDrop(targetPath: string) {
    if (!draggedPath || !canDropOn(targetPath)) {
      clearDragState();
      return;
    }

    setIsMutating(true);

    try {
      const moveResult = await moveWorkspaceItem(workspacePath, draggedPath, targetPath);
      await reloadTree();
      followCurrentDocumentPath(moveResult.previous_path, moveResult.item.path);
    } finally {
      setIsMutating(false);
      clearDragState();
    }
  }

  async function completeRootDrop() {
    if (!draggedPath || !canDropOn("")) {
      clearDragState();
      return;
    }

    setIsMutating(true);

    try {
      const moveResult = await moveWorkspaceItem(workspacePath, draggedPath, "");
      await reloadTree();
      followCurrentDocumentPath(moveResult.previous_path, moveResult.item.path);
    } finally {
      setIsMutating(false);
      clearDragState();
    }
  }

  return {
    unsupportedMessage,
    expandedPaths,
    pendingCreate,
    pendingRename,
    deleteTarget,
    dropTargetPath,
    draggedPath,
    isMutating,
    activateNode,
    clearUnsupportedMessage,
    beginCreateNote: () => beginCreate("markdown"),
    beginCreateFolder: () => beginCreate("directory"),
    beginCreateNoteInFolder: (parentPath: string) =>
      beginCreateForFolder("markdown", parentPath),
    beginCreateFolderInFolder: (parentPath: string) =>
      beginCreateForFolder("directory", parentPath),
    updatePendingCreate,
    submitPendingCreate,
    beginRename,
    updatePendingRename,
    cancelPendingRename,
    submitPendingRename,
    requestDelete,
    closeDeleteDialog,
    confirmDelete,
    beginDrag,
    activateDropTarget,
    completeDrop,
    completeRootDrop,
    clearDragState,
  };
}
