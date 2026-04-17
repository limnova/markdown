import { prosePluginsCtx } from "@milkdown/kit/core";
import type { MilkdownPlugin } from "@milkdown/kit/ctx";
import type { Node as ProseNode } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";

export type DocumentFindMatch = {
  from: number;
  to: number;
  text: string;
};

type DocumentFindDecorationMeta = {
  type: "set-decorations";
  decorations: Decoration[];
};

export const documentFindPluginKey = new PluginKey<DecorationSet>("document-find");

const FIND_PLUGIN = new Plugin<DecorationSet>({
  key: documentFindPluginKey,
  state: {
    init: () => DecorationSet.empty,
    apply(transaction, previous, _, nextState) {
      const meta = transaction.getMeta(
        documentFindPluginKey,
      ) as DocumentFindDecorationMeta | null;

      if (meta?.type === "set-decorations") {
        return DecorationSet.create(nextState.doc, meta.decorations);
      }

      if (transaction.docChanged) {
        return previous.map(transaction.mapping, transaction.doc);
      }

      return previous;
    },
  },
  props: {
    decorations(state) {
      return documentFindPluginKey.getState(state);
    },
  },
});

export const documentFindPlugin: MilkdownPlugin = (ctx) => {
  ctx.update(prosePluginsCtx, (plugins) => plugins.concat(FIND_PLUGIN));

  return () => undefined;
};

function normalizedQuery(query: string) {
  return query.trim().toLowerCase();
}

export function findInDocument(doc: ProseNode, query: string) {
  const normalized = normalizedQuery(query);

  if (!normalized) {
    return [];
  }

  const matches: DocumentFindMatch[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return true;
    }

    const source = node.text;
    const lowered = source.toLowerCase();
    let startIndex = 0;

    while (startIndex < lowered.length) {
      const index = lowered.indexOf(normalized, startIndex);

      if (index === -1) {
        break;
      }

      matches.push({
        from: pos + index,
        to: pos + index + normalized.length,
        text: source.slice(index, index + normalized.length),
      });

      startIndex = index + normalized.length;
    }

    return true;
  });

  return matches;
}

export function findNextMatch(matches: DocumentFindMatch[], currentIndex: number) {
  if (matches.length === 0) {
    return -1;
  }

  return currentIndex < 0 ? 0 : (currentIndex + 1) % matches.length;
}

export function findPreviousMatch(
  matches: DocumentFindMatch[],
  currentIndex: number,
) {
  if (matches.length === 0) {
    return -1;
  }

  return currentIndex <= 0 ? matches.length - 1 : currentIndex - 1;
}

export function createFindDecorations(
  matches: DocumentFindMatch[],
  currentIndex: number,
) {
  return matches.map((match, index) =>
    Decoration.inline(match.from, match.to, {
      class:
        index === currentIndex
          ? "document-match document-match--current"
          : "document-match",
    }),
  );
}

export function applyFindDecorations(
  decorations: Decoration[],
) {
  return {
    type: "set-decorations" as const,
    decorations,
  };
}
