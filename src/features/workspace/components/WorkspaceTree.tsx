import type { CSSProperties } from "react";
import WorkspaceTreeRow from "./WorkspaceTreeRow";
import type {
  WorkspaceEntryKind,
  WorkspaceTreeNode,
} from "../types";

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

type WorkspaceTreeProps = {
  nodes: WorkspaceTreeNode[];
  currentDocumentPath: string | null;
  expandedPaths: string[];
  pendingCreate: PendingCreateState | null;
  pendingRename: PendingRenameState | null;
  dropTargetPath: string | null;
  isMutating: boolean;
  isTreeLoading: boolean;
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
  onCompleteRootDrop: () => Promise<void>;
  onClearDragState: () => void;
};

function WorkspaceTree({
  nodes,
  currentDocumentPath,
  expandedPaths,
  pendingCreate,
  pendingRename,
  dropTargetPath,
  isMutating,
  isTreeLoading,
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
  onCompleteRootDrop,
  onClearDragState,
}: WorkspaceTreeProps) {
  return (
    <section className="workspace-tree" aria-label="Workspace tree">
      <div
        className={`workspace-tree__root-drop-zone${
          dropTargetPath === "" ? " workspace-tree__root-drop-zone--active" : ""
        }`}
        onDragEnter={() => onActivateDropTarget("")}
        onDragOver={(event) => {
          event.preventDefault();
          onActivateDropTarget("");
        }}
        onDragLeave={() => onActivateDropTarget(null)}
        onDrop={async (event) => {
          event.preventDefault();
          await onCompleteRootDrop();
        }}
      >
        Drop here to move an item to the workspace root
      </div>

      {pendingCreate?.parentPath === null ? (
        <form
          className="workspace-tree__row workspace-tree__row--pending"
          style={{ "--tree-depth": 0 } as CSSProperties}
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

      {isTreeLoading ? (
        <p className="workspace-tree__empty">Refreshing the workspace tree...</p>
      ) : null}

      {!isTreeLoading && nodes.length === 0 ? (
        <p className="workspace-tree__empty">
          This workspace is ready. Add a Markdown file or folder from the sidebar
          to start writing here.
        </p>
      ) : null}

      {nodes.map((node) => (
        <WorkspaceTreeRow
          key={node.path}
          node={node}
          depth={0}
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
    </section>
  );
}

export default WorkspaceTree;
