import { editorViewCtx } from "@milkdown/kit/core";
import { undo, redo } from "@milkdown/kit/prose/history";
import { TextSelection } from "@milkdown/kit/prose/state";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import "@milkdown/kit/prose/tables/style/tables.css";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import "@milkdown/theme-nord/style.css";
import { createMarkdownEditor } from "../editor/createMarkdownEditor";
import {
  applyFindDecorations,
  createFindDecorations,
  documentFindPluginKey,
  findInDocument,
  findNextMatch,
  findPreviousMatch,
  type DocumentFindMatch,
} from "../editor/findInDocument";
import { performanceModeForDocument } from "../editor/performanceMode";

export type RichMarkdownEditorHandle = {
  clearFind: () => void;
  focus: () => void;
  nextFindMatch: () => void;
  previousFindMatch: () => void;
  redo: () => void;
  setFindQuery: (query: string) => void;
  undo: () => void;
};

type RichMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  currentDocumentPath: string;
  disabled?: boolean;
  onEditorReady?: (handle: RichMarkdownEditorHandle | null) => void;
  onFindStateChange?: (state: {
    currentIndex: number;
    resultCount: number;
  }) => void;
};

type RichMarkdownEditorContentProps = RichMarkdownEditorProps & {
  editorKey: string;
  onEditorFocusChange: (isFocused: boolean) => void;
};

function RichMarkdownEditorContent({
  value,
  onChange,
  currentDocumentPath,
  disabled = false,
  editorKey,
  onEditorReady,
  onFindStateChange,
  onEditorFocusChange,
}: RichMarkdownEditorContentProps) {
  const matchesRef = useRef<DocumentFindMatch[]>([]);
  const currentIndexRef = useRef(-1);
  const queryRef = useRef("");

  const emitChange = useEffectEvent((nextValue: string) => {
    onChange(nextValue);
  });
  const reportFindState = useEffectEvent(
    (state: { currentIndex: number; resultCount: number }) => {
      onFindStateChange?.(state);
    },
  );
  const reportReady = useEffectEvent((handle: RichMarkdownEditorHandle | null) => {
    onEditorReady?.(handle);
  });
  const reportFocusChange = useEffectEvent((isFocused: boolean) => {
    onEditorFocusChange(isFocused);
  });

  const { get, loading } = useEditor(
    (root) =>
      createMarkdownEditor({
        root,
        currentDocumentPath,
        initialValue: value,
        editable: !disabled,
        onMarkdownChange: emitChange,
        onDocumentUpdated: () => {
          if (queryRef.current) {
            applyQuery(queryRef.current, currentIndexRef.current, false);
          }
        },
        onFocusChange: reportFocusChange,
      }),
    [editorKey],
  );

  function focusEditor() {
    const editor = get();

    if (!editor) {
      return;
    }

    editor.action((ctx) => {
      ctx.get(editorViewCtx).focus();
    });
  }

  function runHistoryCommand(command: typeof undo) {
    const editor = get();

    if (!editor) {
      return;
    }

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const didRun = command(view.state, view.dispatch);

      if (didRun) {
        view.focus();
      }
    });
  }

  function applyQuery(query: string, targetIndex = 0, shouldFocus = true) {
    const editor = get();

    if (!editor) {
      return;
    }

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const matches = findInDocument(view.state.doc, query);
      const currentIndex =
        matches.length === 0
          ? -1
          : Math.min(Math.max(targetIndex, 0), matches.length - 1);

      matchesRef.current = matches;
      currentIndexRef.current = currentIndex;
      queryRef.current = query;

      let transaction = view.state.tr.setMeta(
        documentFindPluginKey,
        applyFindDecorations(createFindDecorations(matches, currentIndex)),
      );

      if (shouldFocus && currentIndex >= 0) {
        const currentMatch = matches[currentIndex];
        transaction = transaction
          .setSelection(
            TextSelection.create(
              view.state.doc,
              currentMatch.from,
              currentMatch.to,
            ),
          )
          .scrollIntoView();
      }

      view.dispatch(transaction);

      if (shouldFocus) {
        view.focus();
      }
    });

    reportFindState({
      resultCount: matchesRef.current.length,
      currentIndex: currentIndexRef.current,
    });
  }

  function moveMatch(direction: "next" | "previous") {
    const nextIndex =
      direction === "next"
        ? findNextMatch(matchesRef.current, currentIndexRef.current)
        : findPreviousMatch(matchesRef.current, currentIndexRef.current);

    if (nextIndex === -1) {
      reportFindState({
        resultCount: 0,
        currentIndex: -1,
      });
      return;
    }

    applyQuery(queryRef.current, nextIndex);
  }

  useEffect(() => {
    if (loading) {
      return;
    }

    reportReady({
      clearFind: () => applyQuery("", -1, false),
      focus: focusEditor,
      nextFindMatch: () => moveMatch("next"),
      previousFindMatch: () => moveMatch("previous"),
      redo: () => runHistoryCommand(redo),
      setFindQuery: (query) => applyQuery(query, 0, false),
      undo: () => runHistoryCommand(undo),
    });

    return () => {
      reportReady(null);
    };
  }, [editorKey, get, loading, reportReady]);

  return <Milkdown />;
}

function RichMarkdownEditor({
  value,
  onChange,
  currentDocumentPath,
  disabled = false,
  onEditorReady,
  onFindStateChange,
}: RichMarkdownEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const editorKey = `${currentDocumentPath}:${disabled ? "disabled" : "active"}`;
  const mode = performanceModeForDocument(value);
  const editorClassName = [
    "document-pane__textarea",
    "document-pane__editor",
    isFocused ? "document-block--active" : "",
    mode.simplifyFormatting ? "document-block--simplified" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={editorClassName} aria-disabled={disabled || undefined}>
      <MilkdownProvider key={editorKey}>
        <RichMarkdownEditorContent
          value={value}
          onChange={onChange}
          currentDocumentPath={currentDocumentPath}
          disabled={disabled}
          editorKey={editorKey}
          onEditorReady={onEditorReady}
          onFindStateChange={onFindStateChange}
          onEditorFocusChange={setIsFocused}
        />
      </MilkdownProvider>
    </div>
  );
}

export default RichMarkdownEditor;
