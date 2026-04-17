import "./App.css";
import WorkspaceHeader from "./features/workspace/components/WorkspaceHeader";
import WorkspaceInvalid from "./features/workspace/components/WorkspaceInvalid";
import WorkspaceOverview from "./features/workspace/components/WorkspaceOverview";
import WorkspaceWelcome from "./features/workspace/components/WorkspaceWelcome";
import { useWorkspaceController } from "./features/workspace/useWorkspaceController";

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
  entries,
  showBoundaryBanner,
}: {
  currentWorkspacePath: string;
  entries: {
    name: string;
    path: string;
    kind: "directory" | "markdown" | "other" | "external-link";
  }[];
  showBoundaryBanner: boolean;
}) {
  return (
    <section className="workspace-panel" aria-labelledby="workspace-ready-title">
      <WorkspaceHeader currentWorkspacePath={currentWorkspacePath} />

      <div className="workspace-stack">
        <div className="workspace-stack">
          <p className="workspace-eyebrow">Workspace overview</p>
          <h1 id="workspace-ready-title" className="workspace-title">
            Ready to write inside one trusted root
          </h1>
          <p className="workspace-copy">
            The Phase 1 shell shows the top-level folders and files inside the
            current workspace, while keeping out-of-root results informational.
          </p>
        </div>

        <WorkspaceOverview
          entries={entries}
          showBoundaryBanner={showBoundaryBanner}
        />
      </div>
    </section>
  );
}

function App() {
  const {
    mode,
    workspace,
    brokenPath,
    boundaryMessage,
    isLoading,
    onChooseWorkspace,
    onRetryWorkspace,
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
        currentWorkspacePath={workspace.display_path}
        entries={workspace.entries}
        showBoundaryBanner={Boolean(boundaryMessage)}
      />
    );
  }

  return <main className="app-shell">{content}</main>;
}

export default App;
