export type WorkspaceStatus = "welcome" | "ready" | "invalid";

export type WorkspaceEntryKind =
  | "directory"
  | "markdown"
  | "other"
  | "external-link";

export type WorkspaceItemKind = "directory" | "markdown";

export type WorkspaceEntry = {
  name: string;
  path: string;
  kind: WorkspaceEntryKind;
  interactive: boolean;
};

export type WorkspaceTreeNode = {
  name: string;
  path: string;
  kind: WorkspaceEntryKind;
  interactive: boolean;
  children: WorkspaceTreeNode[];
};

export type WorkspaceItemDescriptor = {
  name: string;
  path: string;
  kind: WorkspaceEntryKind;
};

export type WorkspaceLoadResult = {
  requested_path: string;
  display_path: string;
  canonical_path: string;
  status: WorkspaceStatus;
  entries: WorkspaceEntry[];
  message?: string | null;
};

export type WorkspaceTreeResult = {
  root_path: string;
  nodes: WorkspaceTreeNode[];
};

export type OpenDocumentResult = {
  path: string;
  name: string;
  content: string;
};

export type SaveDocumentResult = {
  path: string;
  saved_bytes: number;
};

export type CreateWorkspaceItemResult = {
  item: WorkspaceItemDescriptor;
  opened_document: boolean;
};

export type RenameWorkspaceItemResult = {
  previous_path: string;
  item: WorkspaceItemDescriptor;
};

export type MoveWorkspaceItemResult = {
  previous_path: string;
  item: WorkspaceItemDescriptor;
};

export type DeleteWorkspaceItemResult = {
  path: string;
  kind: WorkspaceEntryKind;
};
