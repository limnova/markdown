const WINDOWS_NEWLINE = /\r\n?/g;

export const supportedMarkdownBlocks = {
  headings: true,
  blockquotes: true,
  lists: ["ordered", "unordered", "task"],
  tables: true,
  inlineCode: true,
  fencedCodeBlocks: true,
} as const;

function normalizeNewlines(markdown: string) {
  return markdown.replace(WINDOWS_NEWLINE, "\n");
}

export function normalizeMarkdownForEditor(markdown: string) {
  return normalizeNewlines(markdown);
}

export function markdownFromEditor(markdown: string) {
  const normalized = normalizeNewlines(markdown);

  if (!normalized) {
    return "";
  }

  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}
