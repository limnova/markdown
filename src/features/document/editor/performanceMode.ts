export const performanceMode = {
  largeDocumentCharacters: 16000,
  largeDocumentLines: 350,
} as const;

export type DocumentPerformanceMode = {
  characterCount: number;
  lineCount: number;
  simplifyFormatting: boolean;
};

export function performanceModeForDocument(markdown: string): DocumentPerformanceMode {
  const characterCount = markdown.length;
  const lineCount = markdown.split("\n").length;
  const simplifyFormatting =
    characterCount >= performanceMode.largeDocumentCharacters ||
    lineCount >= performanceMode.largeDocumentLines;

  return {
    characterCount,
    lineCount,
    simplifyFormatting,
  };
}
