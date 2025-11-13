/**
 * Parses a thread string into an array of individual tweet texts
 * Only handles threads separated by "---" (3+ dashes on their own line)
 */
export function parseThread(content: string): string[] {
  if (!content || !content.trim()) return [];

  const text = content.trim();

  // Split by "---" separator (AI-generated thread format)
  // Pattern: content followed by newlines, then "---" (3+ dashes), then newlines, then more content
  const dashLineSplit = text.split(/\n\s*-{3,}\s*\n/).filter(part => part.trim().length > 0);
  if (dashLineSplit.length > 1) {
    // If we have multiple parts separated by "---", it's a thread
    return dashLineSplit.map(part => part.trim());
  }

  // If no "---" separator found, return as single tweet
  return [text];
}

/**
 * Detects if content appears to be a thread (multiple tweets)
 */
export function isThread(content: string): boolean {
  if (!content || content.trim().length < 50) return false;

  const parsed = parseThread(content);
  return parsed.length > 1;
}
