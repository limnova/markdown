import { useEffect, useState } from "react";
import DocumentFindBar from "../../document/components/DocumentFindBar";
import DocumentPane from "../../document/components/DocumentPane";
import type { RichMarkdownEditorHandle } from "../../document/components/RichMarkdownEditor";
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
  const [editorHandle, setEditorHandle] = useState<RichMarkdownEditorHandle | null>(
    null,
  );
  const [findQuery, setFindQuery] = useState("");
  const [findResultCount, setFindResultCount] = useState(0);
  const [findCurrentIndex, setFindCurrentIndex] = useState(-1);
  const [isFindOpen, setIsFindOpen] = useState(false);

  useEffect(() => {
    if (!currentDocumentPath) {
      setEditorHandle(null);
    }

    setFindQuery("");
    setFindResultCount(0);
    setFindCurrentIndex(-1);
    setIsFindOpen(false);
  }, [currentDocumentPath]);

  useEffect(() => {
    function handleOpenFind() {
      if (!currentDocumentPath) {
        return;
      }

      setIsFindOpen(true);
    }

    window.addEventListener("document-session:open-find", handleOpenFind);
    return () => {
      window.removeEventListener("document-session:open-find", handleOpenFind);
    };
  }, [currentDocumentPath]);

  function closeFind() {
    setIsFindOpen(false);
    setFindQuery("");
    setFindResultCount(0);
    setFindCurrentIndex(-1);
    editorHandle?.clearFind();
    editorHandle?.focus();
  }

  function updateFindQuery(value: string) {
    setFindQuery(value);
    editorHandle?.setFindQuery(value);
  }

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

      <DocumentFindBar
        query={findQuery}
        resultCount={findResultCount}
        currentIndex={findCurrentIndex}
        isOpen={Boolean(currentDocumentPath) && isFindOpen}
        onQueryChange={updateFindQuery}
        onNext={() => editorHandle?.nextFindMatch()}
        onPrevious={() => editorHandle?.previousFindMatch()}
        onClose={closeFind}
      />

      {workspaceMessage ? <WorkspaceBanner message={workspaceMessage} /> : null}

      {currentDocumentPath ? (
        <DocumentPane
          currentDocumentPath={currentDocumentPath}
          value={content}
          onChange={onContentChange}
          onEditorReady={setEditorHandle}
          onFindStateChange={({ currentIndex, resultCount }) => {
            setFindCurrentIndex(currentIndex);
            setFindResultCount(resultCount);
          }}
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
