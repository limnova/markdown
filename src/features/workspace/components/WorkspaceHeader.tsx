import { formatDisplayPath } from "../formatDisplayPath";

type WorkspaceHeaderProps = {
  currentWorkspacePath: string;
  onCreateNote: () => void;
  onCreateFolder: () => void;
};

function WorkspaceHeader({
  currentWorkspacePath,
  onCreateNote,
  onCreateFolder,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-sidebar__header">
      <div className="workspace-status-row">
        <span className="workspace-status-label">Boundary safe</span>
        <span className="workspace-status-note">
          Only items inside this workspace can be opened here.
        </span>
      </div>

      <div className="workspace-path-pill">
        <span className="workspace-path-pill__label">Current workspace</span>
        <span className="workspace-path-pill__value">
          {formatDisplayPath(currentWorkspacePath)}
        </span>
      </div>

      <div className="workspace-sidebar__actions">
        <button type="button" className="workspace-button" onClick={onCreateNote}>
          New note
        </button>
        <button
          type="button"
          className="workspace-button workspace-button--secondary"
          onClick={onCreateFolder}
        >
          New folder
        </button>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
