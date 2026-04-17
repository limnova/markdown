import type { DocumentSaveStatus } from "../types";

type DocumentStatusChipProps = {
  saveStatus: DocumentSaveStatus;
};

const saveStatusLabels: Record<DocumentSaveStatus, string> = {
  unsaved: "Unsaved",
  saving: "Saving",
  saved: "Saved",
  failed: "Save failed",
};

function DocumentStatusChip({ saveStatus }: DocumentStatusChipProps) {
  return (
    <span className={`workspace-status-chip workspace-status-chip--${saveStatus}`}>
      {saveStatusLabels[saveStatus]}
    </span>
  );
}

export default DocumentStatusChip;
