import DocumentPane from "../../document/components/DocumentPane";
import DocumentStatusChip from "../../document/components/DocumentStatusChip";
import type { DocumentSaveStatus } from "../../document/types";
import { formatDisplayPath } from "../formatDisplayPath";
import WorkspaceBanner from "./WorkspaceBanner";

type WorkspaceDocumentShellProps = {
  currentDocumentPath: string | null;
  content: string;
  saveStatus: DocumentSaveStatus;
  saveDetail: string;
  workspaceMessage?: string | null;
  onCreateNote: () => void;
  onContentChange: (value: string) => void;
};

function WorkspaceDocumentShell({
  currentDocumentPath,
  content,
  saveStatus,
  saveDetail,
  workspaceMessage,
  onCreateNote,
  onContentChange,
}: WorkspaceDocumentShellProps) {
  return (
    <section className="workspace-document-shell">
      <header className="workspace-document-shell__header">
        <div className="workspace-document-shell__path-block">
          <p className="workspace-eyebrow">Current document</p>
          <p className="workspace-document-shell__path">
            {currentDocumentPath
              ? formatDisplayPath(currentDocumentPath, 56)
              : "No note selected yet"}
          </p>
        </div>

        <div className="workspace-document-shell__status">
          <DocumentStatusChip saveStatus={saveStatus} />
          <p className="workspace-document-shell__status-copy">{saveDetail}</p>
        </div>
      </header>

      {workspaceMessage ? <WorkspaceBanner message={workspaceMessage} /> : null}

      {currentDocumentPath ? (
        <DocumentPane
          currentDocumentPath={currentDocumentPath}
          value={content}
          onChange={onContentChange}
        />
      ) : (
        <div className="workspace-document-shell__empty">
          <p className="workspace-eyebrow">Document pane</p>
          <h1 className="workspace-title">Create your first note</h1>
          <p className="workspace-copy">
            This workspace is ready. Add a Markdown file or folder from the sidebar
            to start writing here.
          </p>
          <button type="button" className="workspace-button" onClick={onCreateNote}>
            New note
          </button>
        </div>
      )}
    </section>
  );
}

export default WorkspaceDocumentShell;
