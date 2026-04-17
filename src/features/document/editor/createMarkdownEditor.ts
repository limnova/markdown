import {
  defaultValueCtx,
  Editor,
  editorViewOptionsCtx,
  rootAttrsCtx,
  rootCtx,
} from "@milkdown/kit/core";
import { codeBlockComponent } from "@milkdown/kit/component/code-block";
import { listItemBlockComponent } from "@milkdown/kit/component/list-item-block";
import { tableBlock } from "@milkdown/kit/component/table-block";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { gfm } from "@milkdown/kit/preset/gfm";
import { nord } from "@milkdown/theme-nord";
import { documentFindPlugin } from "./findInDocument";
import {
  markdownFromEditor,
  normalizeMarkdownForEditor,
  supportedMarkdownBlocks,
} from "./markdownSerializer";

type CreateMarkdownEditorOptions = {
  root: HTMLElement;
  currentDocumentPath: string;
  initialValue: string;
  editable: boolean;
  onMarkdownChange: (markdown: string) => void;
  onDocumentUpdated?: () => void;
  onFocusChange?: (isFocused: boolean) => void;
};

export const markdownEditorFeatures = {
  headings: supportedMarkdownBlocks.headings,
  blockquotes: supportedMarkdownBlocks.blockquotes,
  lists: supportedMarkdownBlocks.lists,
  taskItems: supportedMarkdownBlocks.lists.includes("task"),
  tables: supportedMarkdownBlocks.tables,
  inlineCode: supportedMarkdownBlocks.inlineCode,
  codeBlocks: supportedMarkdownBlocks.fencedCodeBlocks,
} as const;

export function createMarkdownEditor({
  root,
  currentDocumentPath,
  initialValue,
  editable,
  onMarkdownChange,
  onDocumentUpdated,
  onFocusChange,
}: CreateMarkdownEditorOptions) {
  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(rootAttrsCtx, {
        class: "document-rich-editor__content",
        "data-document-path": currentDocumentPath,
      });
      ctx.set(defaultValueCtx, normalizeMarkdownForEditor(initialValue));
      ctx.update(editorViewOptionsCtx, (previous) => ({
        ...previous,
        editable: () => editable,
      }));
      ctx
        .get(listenerCtx)
        .markdownUpdated((_, markdown, previousMarkdown) => {
          const nextValue = markdownFromEditor(markdown);
          const previousValue = markdownFromEditor(previousMarkdown);

          if (nextValue !== previousValue) {
            onMarkdownChange(nextValue);
          }

          onDocumentUpdated?.();
        })
        .focus(() => onFocusChange?.(true))
        .blur(() => onFocusChange?.(false));
    })
    .config(nord)
    .use(gfm)
    .use(listener)
    .use(documentFindPlugin)
    .use(codeBlockComponent)
    .use(listItemBlockComponent)
    .use(tableBlock);
}
