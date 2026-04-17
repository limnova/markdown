export type DocumentSaveStatus = "unsaved" | "saving" | "saved" | "failed";

export type DocumentSessionState = {
  currentDocumentPath: string | null;
  content: string;
  savedContent: string;
  saveStatus: DocumentSaveStatus;
  statusMessage: string;
  lastSavedAt: string | null;
};
