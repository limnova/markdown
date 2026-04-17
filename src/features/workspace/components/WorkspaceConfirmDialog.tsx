type WorkspaceConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
};

function WorkspaceConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
  isBusy = false,
}: WorkspaceConfirmDialogProps) {
  return (
    <div className="workspace-dialog" role="presentation">
      <div
        className="workspace-dialog__surface"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="workspace-confirm-title"
      >
        <p className="workspace-eyebrow">Delete item</p>
        <h2 id="workspace-confirm-title" className="workspace-dialog__title">
          {title}
        </h2>
        <p className="workspace-dialog__copy">{body}</p>

        <div className="workspace-dialog__actions">
          <button
            type="button"
            className={`workspace-button${danger ? " workspace-button--danger" : ""}`}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="workspace-button workspace-button--secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceConfirmDialog;
