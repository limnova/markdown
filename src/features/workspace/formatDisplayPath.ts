function truncateSegment(segment: string, maxLength: number) {
  if (segment.length <= maxLength) {
    return segment;
  }

  if (maxLength <= 3) {
    return segment.slice(0, maxLength);
  }

  return `${segment.slice(0, maxLength - 3)}...`;
}

export function formatDisplayPath(path: string, maxLength = 42) {
  if (path.length <= maxLength) {
    return path;
  }

  const normalizedPath = path.replace(/\//g, "\\");
  const driveMatch = normalizedPath.match(/^[A-Za-z]:/);
  const uncMatch = normalizedPath.match(/^\\\\[^\\]+\\[^\\]+/);
  const pathParts = normalizedPath.split("\\").filter(Boolean);
  const tail = pathParts[pathParts.length - 1] ?? normalizedPath;

  let root = "";
  if (driveMatch) {
    root = driveMatch[0];
  } else if (uncMatch) {
    root = uncMatch[0];
  } else if (normalizedPath.startsWith("\\\\")) {
    root = "\\\\";
  } else if (normalizedPath.startsWith("\\")) {
    root = "\\";
  }

  const compactPath = root ? `${root}\\...\\${tail}` : `...\\${tail}`;
  if (compactPath.length <= maxLength) {
    return compactPath;
  }

  const reservedLength = Math.max(maxLength - (root ? root.length + 5 : 4), 10);
  const truncatedTail = truncateSegment(tail, reservedLength);
  return root ? `${root}\\...\\${truncatedTail}` : `...\\${truncatedTail}`;
}
