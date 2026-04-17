import { formatDisplayPath } from "../formatDisplayPath";

type WorkspaceHeaderProps = {
  currentWorkspacePath: string;
  statusLabel?: string;
  statusNote?: string;
};

function WorkspaceHeader({
  currentWorkspacePath,
  statusLabel = "Boundary safe",
  statusNote = "Only items inside this workspace can be opened here.",
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-stack">
      <div className="workspace-status-row">
        <span className="workspace-status-label">{statusLabel}</span>
        <span className="workspace-status-note">{statusNote}</span>
      </div>
      <div className="workspace-path-pill">
        <span className="workspace-path-pill__label">Current workspace</span>
        <span className="workspace-path-pill__value">
          {formatDisplayPath(currentWorkspacePath)}
        </span>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
