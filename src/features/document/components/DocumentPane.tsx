import RichMarkdownEditor, {
  type RichMarkdownEditorHandle,
} from "./RichMarkdownEditor";

type DocumentPaneProps = {
  value: string;
  currentDocumentPath: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onEditorReady?: (handle: RichMarkdownEditorHandle | null) => void;
  onFindStateChange?: (state: {
    currentIndex: number;
    resultCount: number;
  }) => void;
};

function DocumentPane({
  value,
  currentDocumentPath,
  onChange,
  disabled = false,
  onEditorReady,
  onFindStateChange,
}: DocumentPaneProps) {
  return (
    <section className="document-pane">
      <div className="document-pane__surface">
        <div className="document-pane__canvas">
          <p className="workspace-eyebrow">Single-pane Markdown editor</p>
          <RichMarkdownEditor
            value={value}
            onChange={onChange}
            currentDocumentPath={currentDocumentPath}
            disabled={disabled}
            onEditorReady={onEditorReady}
            onFindStateChange={onFindStateChange}
          />
        </div>
      </div>
    </section>
  );
}

export default DocumentPane;
