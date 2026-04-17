import { formatDisplayPath } from "../formatDisplayPath";

type WorkspaceInvalidProps = {
  brokenPath: string;
  onChooseWorkspace: () => void;
};

function WorkspaceInvalid({
  brokenPath,
  onChooseWorkspace,
}: WorkspaceInvalidProps) {
  return (
    <section
      className="workspace-panel workspace-panel--blocked"
      aria-labelledby="workspace-invalid-title"
    >
      <div className="workspace-stack">
        <p className="workspace-eyebrow">Workspace unavailable</p>
        <h1 id="workspace-invalid-title" className="workspace-title">
          Workspace needs attention
        </h1>
        <p className="workspace-copy">
          This workspace is no longer available. Choose the folder again to
          continue.
        </p>
        <div className="workspace-path-pill workspace-path-pill--danger">
          <span className="workspace-path-pill__label">Last path</span>
          <span className="workspace-path-pill__value">
            {formatDisplayPath(brokenPath)}
          </span>
        </div>
      </div>

      <div className="workspace-actions">
        <button
          type="button"
          className="workspace-button"
          onClick={onChooseWorkspace}
        >
          Choose workspace folder
        </button>
      </div>
    </section>
  );
}

export default WorkspaceInvalid;
