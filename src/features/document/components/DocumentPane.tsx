type DocumentPaneProps = {
  value: string;
  currentDocumentPath: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function DocumentPane({
  value,
  currentDocumentPath,
  onChange,
  disabled = false,
}: DocumentPaneProps) {
  return (
    <label className="document-pane">
      <span className="workspace-eyebrow">Plain Markdown editor</span>
      <textarea
        className="document-pane__textarea"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={`Write in ${currentDocumentPath}`}
        disabled={disabled}
      />
    </label>
  );
}

export default DocumentPane;
