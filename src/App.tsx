import "./App.css";
import WorkspaceBanner from "./features/workspace/components/WorkspaceBanner";
import WorkspaceConfirmDialog from "./features/workspace/components/WorkspaceConfirmDialog";
import WorkspaceDocumentShell from "./features/workspace/components/WorkspaceDocumentShell";
import WorkspaceHeader from "./features/workspace/components/WorkspaceHeader";
import WorkspaceInvalid from "./features/workspace/components/WorkspaceInvalid";
import WorkspaceTree from "./features/workspace/components/WorkspaceTree";
import WorkspaceWelcome from "./features/workspace/components/WorkspaceWelcome";
import { useDocumentSession } from "./features/document/useDocumentSession";
import { useWorkspaceController } from "./features/workspace/useWorkspaceController";
import { useWorkspaceTreeController } from "./features/workspace/useWorkspaceTreeController";

function LoadingPanel() {
  return (
    <section className="workspace-panel" aria-live="polite">
      <div className="workspace-stack">
        <p className="workspace-eyebrow">Workspace</p>
        <h1 className="workspace-title">Restoring your workspace</h1>
        <p className="workspace-copy">
          Checking the last trusted folder before the writing shell opens.
        </p>
      </div>
    </section>
  );
}

function ReadyPanel({
  currentWorkspacePath,
  treeNodes,
  boundaryMessage,
  workspaceMessage,
  isTreeLoading,
  refreshTree,
}: {
  currentWorkspacePath: string;
  treeNodes: Parameters<typeof useWorkspaceTreeController>[0]["nodes"];
  boundaryMessage: string | null;
  workspaceMessage: string | null;
  isTreeLoading: boolean;
  refreshTree: () => Promise<void>;
}) {
  const documentSession = useDocumentSession({
    workspacePath: currentWorkspacePath,
  });

  const treeController = useWorkspaceTreeController({
    workspacePath: currentWorkspacePath,
    nodes: treeNodes,
    currentDocumentPath: documentSession.currentDocumentPath,
    reloadTree: refreshTree,
    beforeSelectPath: documentSession.beforeSelectPath,
    followCurrentDocumentPath: documentSession.followCurrentDocumentPath,
    clearDeletedDocument: documentSession.clearDeletedDocument,
    onDeleteCurrentDocument: documentSession.deleteCurrentDocument,
  });

  const bannerMessage = treeController.unsupportedMessage || boundaryMessage;
  const confirmLabel = treeController.deleteTarget?.isCurrentDocument
    ? "Save and move to Recycle Bin"
    : "Move to Recycle Bin";
  const cancelLabel = treeController.deleteTarget?.isCurrentDocument
    ? "Keep note"
    : "Keep item";

  return (
    <>
      <section className="workspace-shell" aria-labelledby="workspace-ready-title">
        <aside className="workspace-sidebar">
          <WorkspaceHeader
            currentWorkspacePath={currentWorkspacePath}
            onCreateNote={treeController.beginCreateNote}
            onCreateFolder={treeController.beginCreateFolder}
          />

          {bannerMessage ? <WorkspaceBanner message={bannerMessage} /> : null}

          <WorkspaceTree
            nodes={treeNodes}
            currentDocumentPath={documentSession.currentDocumentPath}
            expandedPaths={treeController.expandedPaths}
            pendingCreate={treeController.pendingCreate}
            pendingRename={treeController.pendingRename}
            dropTargetPath={treeController.dropTargetPath}
            isMutating={treeController.isMutating}
            isTreeLoading={isTreeLoading}
            onActivateNode={treeController.activateNode}
            onBeginCreateNoteInFolder={treeController.beginCreateNoteInFolder}
            onBeginCreateFolderInFolder={treeController.beginCreateFolderInFolder}
            onUpdatePendingCreate={treeController.updatePendingCreate}
            onSubmitPendingCreate={treeController.submitPendingCreate}
            onBeginRename={treeController.beginRename}
            onUpdatePendingRename={treeController.updatePendingRename}
            onCancelPendingRename={treeController.cancelPendingRename}
            onSubmitPendingRename={treeController.submitPendingRename}
            onRequestDelete={treeController.requestDelete}
            onBeginDrag={treeController.beginDrag}
            onActivateDropTarget={treeController.activateDropTarget}
            onCompleteDrop={treeController.completeDrop}
            onCompleteRootDrop={treeController.completeRootDrop}
            onClearDragState={treeController.clearDragState}
          />
        </aside>

        <WorkspaceDocumentShell
          currentDocumentPath={documentSession.currentDocumentPath}
          content={documentSession.content}
          saveStatus={documentSession.saveStatus}
          saveDetail={documentSession.statusMessage}
          workspaceMessage={workspaceMessage}
          onCreateNote={treeController.beginCreateNote}
          onContentChange={documentSession.updateContent}
        />
      </section>

      {treeController.deleteTarget ? (
        <WorkspaceConfirmDialog
          title={`Move "${treeController.deleteTarget.name}" to the Recycle Bin?`}
          body={
            treeController.deleteTarget.isCurrentDocument
              ? "If this is the current note, save the latest changes before deleting."
              : "Delete always stays explicit in this shell. The item will only move after you confirm."
          }
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          danger
          onConfirm={() => void treeController.confirmDelete()}
          onCancel={treeController.closeDeleteDialog}
          isBusy={treeController.isMutating}
        />
      ) : null}
    </>
  );
}

function App() {
  const {
    mode,
    workspace,
    treeNodes,
    brokenPath,
    boundaryMessage,
    workspaceMessage,
    isLoading,
    isTreeLoading,
    onChooseWorkspace,
    onRetryWorkspace,
    refreshTree,
  } = useWorkspaceController();

  let content = <LoadingPanel />;

  if (!isLoading && mode === "welcome") {
    content = <WorkspaceWelcome onChooseWorkspace={onChooseWorkspace} />;
  } else if (!isLoading && mode === "invalid") {
    content = (
      <WorkspaceInvalid
        brokenPath={brokenPath}
        onChooseWorkspace={onRetryWorkspace}
      />
    );
  } else if (!isLoading && mode === "ready" && workspace) {
    content = (
      <ReadyPanel
        currentWorkspacePath={workspace.requested_path}
        treeNodes={treeNodes}
        boundaryMessage={boundaryMessage}
        workspaceMessage={workspaceMessage}
        isTreeLoading={isTreeLoading}
        refreshTree={refreshTree}
      />
    );
  }

  return <main className="app-shell">{content}</main>;
}

export default App;
