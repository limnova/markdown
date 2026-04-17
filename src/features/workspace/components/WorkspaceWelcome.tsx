type WorkspaceWelcomeProps = {
  onChooseWorkspace: () => void;
};

function WorkspaceWelcome({ onChooseWorkspace }: WorkspaceWelcomeProps) {
  return (
    <section className="workspace-panel" aria-labelledby="workspace-welcome-title">
      <div className="workspace-stack">
        <p className="workspace-eyebrow">Workspace</p>
        <h1 id="workspace-welcome-title" className="workspace-title">
          Open one workspace folder
        </h1>
        <p className="workspace-copy">
          Pick a local folder to start. The app will remember it and keep every
          file action inside that boundary.
        </p>
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

export default WorkspaceWelcome;
