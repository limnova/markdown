type DocumentFindBarProps = {
  query: string;
  resultCount: number;
  currentIndex: number;
  isOpen: boolean;
  onQueryChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
};

function findCounterLabel(
  query: string,
  resultCount: number,
  currentIndex: number,
) {
  if (!query.trim()) {
    return "Search this note";
  }

  if (resultCount === 0) {
    return "No matches in this note";
  }

  return `${Math.min(currentIndex + 1, resultCount)} of ${resultCount}`;
}

function DocumentFindBar({
  query,
  resultCount,
  currentIndex,
  isOpen,
  onQueryChange,
  onNext,
  onPrevious,
  onClose,
}: DocumentFindBarProps) {
  if (!isOpen) {
    return null;
  }

  const isDisabled = resultCount === 0;
  const counterLabel = findCounterLabel(query, resultCount, currentIndex);

  return (
    <div className="document-find-bar" role="search" aria-label="Find in current note">
      <label className="document-find-bar__field">
        <span className="workspace-eyebrow">Find in note</span>
        <input
          autoFocus
          className="document-find-bar__input"
          type="search"
          value={query}
          placeholder="Search visible text"
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();

              if (event.shiftKey) {
                onPrevious();
              } else {
                onNext();
              }
            }
          }}
        />
      </label>

      <p className="document-find-bar__results">{counterLabel}</p>

      <div className="document-find-bar__actions">
        <button
          type="button"
          className="workspace-button workspace-button--secondary document-find-bar__button"
          onClick={onPrevious}
          disabled={isDisabled}
        >
          Previous
        </button>
        <button
          type="button"
          className="workspace-button workspace-button--secondary document-find-bar__button"
          onClick={onNext}
          disabled={isDisabled}
        >
          Next
        </button>
        <button
          type="button"
          className="workspace-button workspace-button--secondary document-find-bar__button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default DocumentFindBar;
