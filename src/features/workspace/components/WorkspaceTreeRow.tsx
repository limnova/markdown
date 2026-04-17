import type { CSSProperties } from "react";
import type { WorkspaceEntryKind, WorkspaceTreeNode } from "../types";

type PendingCreateState = {
  parentPath: string | null;
  kind: "directory" | "markdown";
  name: string;
  depth: number;
};

type PendingRenameState = {
  itemPath: string;
  itemName: string;
  itemKind: WorkspaceEntryKind;
  name: string;
};

type WorkspaceTreeRowProps = {
  node: WorkspaceTreeNode;
  depth: number;
  currentDocumentPath: string | null;
  expandedPaths: string[];
  pendingCreate: PendingCreateState | null;
  pendingRename: PendingRenameState | null;
  dropTargetPath: string | null;
  isMutating: boolean;
  onActivateNode: (node: WorkspaceTreeNode) => void;
  onBeginCreateNoteInFolder: (parentPath: string) => void;
  onBeginCreateFolderInFolder: (parentPath: string) => void;
  onUpdatePendingCreate: (value: string) => void;
  onSubmitPendingCreate: (value?: string | null) => Promise<void>;
  onBeginRename: (node: WorkspaceTreeNode) => void;
  onUpdatePendingRename: (value: string) => void;
  onCancelPendingRename: () => void;
  onSubmitPendingRename: () => Promise<void>;
  onRequestDelete: (node: WorkspaceTreeNode) => void;
  onBeginDrag: (path: string) => void;
  onActivateDropTarget: (path: string | null) => void;
  onCompleteDrop: (path: string) => Promise<void>;
  onClearDragState: () => void;
};

function entryLabel(kind: WorkspaceEntryKind) {
  if (kind === "directory") {
    return "Folder";
  }

  if (kind === "markdown") {
    return "Markdown";
  }

  if (kind === "external-link") {
    return "External link";
  }

  return "Unsupported";
}

function WorkspaceTreeRow({
  node,
  depth,
  currentDocumentPath,
  expandedPaths,
  pendingCreate,
  pendingRename,
  dropTargetPath,
  isMutating,
  onActivateNode,
  onBeginCreateNoteInFolder,
  onBeginCreateFolderInFolder,
  onUpdatePendingCreate,
  onSubmitPendingCreate,
  onBeginRename,
  onUpdatePendingRename,
  onCancelPendingRename,
  onSubmitPendingRename,
  onRequestDelete,
  onBeginDrag,
  onActivateDropTarget,
  onCompleteDrop,
  onClearDragState,
}: WorkspaceTreeRowProps) {
  const isFolder = node.kind === "directory";
  const isActiveDocument = currentDocumentPath === node.path;
  const isExpanded = expandedPaths.includes(node.path);
  const isRenameRow = pendingRename?.itemPath === node.path;
  const hasInlineCreate = pendingCreate?.parentPath === node.path;
  const acceptsDrop = dropTargetPath === node.path;
  const isInteractive = node.kind === "directory" || node.kind === "markdown";
  const isDraggable = node.kind === "directory" || node.kind === "markdown";

  return (
    <>
      <div
        className={`workspace-tree__row${
          isActiveDocument ? " workspace-tree__row--active" : ""
        }${acceptsDrop ? " workspace-tree__row--drop-target" : ""}${
          node.kind === "other" || node.kind === "external-link"
            ? " workspace-tree__row--unsupported"
            : ""
        }`}
        style={{ "--tree-depth": depth } as CSSProperties}
        draggable={isDraggable}
        onDragStart={() => onBeginDrag(node.path)}
        onDragEnd={onClearDragState}
        onDragEnter={
          isFolder ? () => onActivateDropTarget(node.path) : undefined
        }
        onDragOver={
          isFolder
            ? (event) => {
                event.preventDefault();
                onActivateDropTarget(node.path);
              }
            : undefined
        }
        onDragLeave={
          isFolder ? () => onActivateDropTarget(null) : undefined
        }
        onDrop={
          isFolder
            ? async (event) => {
                event.preventDefault();
                await onCompleteDrop(node.path);
              }
            : undefined
        }
      >
        {isRenameRow ? (
          <form
            className="workspace-tree__inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmitPendingRename();
            }}
          >
            <input
              className="workspace-tree__input"
              value={pendingRename.name}
              onChange={(event) => onUpdatePendingRename(event.currentTarget.value)}
              aria-label={`Rename ${node.name}`}
              autoFocus
            />
            <button
              type="submit"
              className="workspace-tree__text-action"
              disabled={isMutating}
            >
              Rename
            </button>
            <button
              type="button"
              className="workspace-tree__text-action workspace-tree__text-action--muted"
              onClick={onCancelPendingRename}
              disabled={isMutating}
            >
              Keep item
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              className={`workspace-tree__item${
                isInteractive ? "" : " workspace-tree__item--disabled"
              }`}
              onClick={() => onActivateNode(node)}
            >
              <span className="workspace-tree__item-icon" aria-hidden="true">
                {isFolder ? (isExpanded ? "▾" : "▸") : node.kind === "markdown" ? "•" : "×"}
              </span>
              <span className="workspace-tree__item-meta">
                <span className="workspace-tree__item-title">{node.name}</span>
                <span className="workspace-tree__item-badge">
                  {entryLabel(node.kind)}
                </span>
              </span>
            </button>

            <div className="workspace-tree__row-actions">
              {isFolder ? (
                <>
                  <button
                    type="button"
                    className="workspace-tree__icon-action"
                    onClick={() => onBeginCreateNoteInFolder(node.path)}
                    aria-label={`Create note inside ${node.name}`}
                  >
                    +N
                  </button>
                  <button
                    type="button"
                    className="workspace-tree__icon-action"
                    onClick={() => onBeginCreateFolderInFolder(node.path)}
                    aria-label={`Create folder inside ${node.name}`}
                  >
                    +F
                  </button>
                </>
              ) : null}

              {node.kind !== "external-link" ? (
                <>
                  <button
                    type="button"
                    className="workspace-tree__icon-action"
                    onClick={() => onBeginRename(node)}
                    aria-label={`Rename ${node.name}`}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="workspace-tree__icon-action workspace-tree__icon-action--danger"
                    onClick={() => onRequestDelete(node)}
                    aria-label={`Delete ${node.name}`}
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}
      </div>

      {hasInlineCreate ? (
        <form
          className="workspace-tree__row workspace-tree__row--pending"
          style={{ "--tree-depth": pendingCreate.depth } as CSSProperties}
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmitPendingCreate();
          }}
        >
          <input
            className="workspace-tree__input"
            value={pendingCreate.name}
            onChange={(event) => onUpdatePendingCreate(event.currentTarget.value)}
            placeholder={
              pendingCreate.kind === "markdown" ? "Untitled.md" : "New Folder"
            }
            aria-label={
              pendingCreate.kind === "markdown" ? "New note name" : "New folder name"
            }
            autoFocus
          />
          <button
            type="submit"
            className="workspace-tree__text-action"
            disabled={isMutating}
          >
            Create
          </button>
          <button
            type="button"
            className="workspace-tree__text-action workspace-tree__text-action--muted"
            onClick={() => void onSubmitPendingCreate(null)}
            disabled={isMutating}
          >
            Use default
          </button>
        </form>
      ) : null}

      {isFolder && isExpanded ? (
        <div className="workspace-tree__children">
          {node.children.map((child) => (
            <WorkspaceTreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              currentDocumentPath={currentDocumentPath}
              expandedPaths={expandedPaths}
              pendingCreate={pendingCreate}
              pendingRename={pendingRename}
              dropTargetPath={dropTargetPath}
              isMutating={isMutating}
              onActivateNode={onActivateNode}
              onBeginCreateNoteInFolder={onBeginCreateNoteInFolder}
              onBeginCreateFolderInFolder={onBeginCreateFolderInFolder}
              onUpdatePendingCreate={onUpdatePendingCreate}
              onSubmitPendingCreate={onSubmitPendingCreate}
              onBeginRename={onBeginRename}
              onUpdatePendingRename={onUpdatePendingRename}
              onCancelPendingRename={onCancelPendingRename}
              onSubmitPendingRename={onSubmitPendingRename}
              onRequestDelete={onRequestDelete}
              onBeginDrag={onBeginDrag}
              onActivateDropTarget={onActivateDropTarget}
              onCompleteDrop={onCompleteDrop}
              onClearDragState={onClearDragState}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

export default WorkspaceTreeRow;
