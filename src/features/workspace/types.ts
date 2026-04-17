export type WorkspaceStatus = "welcome" | "ready" | "invalid";

export type WorkspaceEntryKind =
  | "directory"
  | "markdown"
  | "other"
  | "external-link";

export type WorkspaceEntry = {
  name: string;
  path: string;
  kind: WorkspaceEntryKind;
  interactive: boolean;
};

export type WorkspaceLoadResult = {
  requested_path: string;
  display_path: string;
  canonical_path: string;
  status: WorkspaceStatus;
  entries: WorkspaceEntry[];
  message?: string | null;
};
