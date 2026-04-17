import WorkspaceBanner from "./WorkspaceBanner";
import { formatDisplayPath } from "../formatDisplayPath";

type WorkspaceEntryKind = "directory" | "markdown" | "other" | "external-link";

type WorkspaceEntry = {
  kind: WorkspaceEntryKind;
  name: string;
  path: string;
};

type WorkspaceOverviewProps = {
  entries: WorkspaceEntry[];
  showBoundaryBanner?: boolean;
};

function entryBadge(kind: WorkspaceEntryKind) {
  if (kind === "directory") {
    return "Folder";
  }

  if (kind === "markdown") {
    return "Markdown";
  }

  if (kind === "external-link") {
    return "External link";
  }

  return "Other";
}

function WorkspaceOverview({
  entries,
  showBoundaryBanner = false,
}: WorkspaceOverviewProps) {
  return (
    <section className="workspace-overview" aria-label="Workspace overview">
      {showBoundaryBanner ? <WorkspaceBanner /> : null}

      <div className="workspace-overview__list">
        {entries.map((entry) => {
          const isExternal = entry.kind === "external-link";
          const entryClassName = isExternal
            ? "workspace-entry workspace-entry--external"
            : "workspace-entry";

          return (
            <div
              key={`${entry.kind}:${entry.path}`}
              className={entryClassName}
              data-kind={entry.kind}
              aria-disabled={isExternal || undefined}
            >
              <div className="workspace-entry__meta">
                <span className="workspace-entry__title">{entry.name}</span>
                <span className="workspace-entry__path">
                  {formatDisplayPath(entry.path)}
                </span>
              </div>
              <span className="workspace-entry__badge">{entryBadge(entry.kind)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default WorkspaceOverview;
