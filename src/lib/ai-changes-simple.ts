export interface AIChange {
  id: string;
  type: 'added' | 'modified' | 'removed';
  originalText?: string;
  newText?: string;
  timestamp: number;
  action: string;
  blockId: string;
  start?: number;
  end?: number;
  isStreaming?: boolean;
  isReverted?: boolean;
}

export const createAIChange = (
  type: 'added' | 'modified' | 'removed',
  originalText?: string,
  newText?: string,
  action: string = 'unknown',
  blockId: string = '',
  start?: number,
  end?: number,
  isStreaming: boolean = false
): AIChange => ({
  id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  originalText,
  newText,
  timestamp: Date.now(),
  action,
  blockId,
  start,
  end,
  isStreaming,
  isReverted: false,
});

export const applyAIChangeHighlight = (
  highlights: { start: number; end: number }[],
  change: AIChange
): { start: number; end: number }[] => {
  if (change.start !== undefined && change.end !== undefined) {
    return [...highlights, { start: change.start, end: change.end }];
  }
  return highlights;
};

export const removeAIChangeHighlight = (
  highlights: { start: number; end: number }[],
  changeId: string,
  changes: AIChange[]
): { start: number; end: number }[] => {
  const change = changes.find(c => c.id === changeId);
  if (!change || change.start === undefined || change.end === undefined) {
    return highlights;
  }

  return highlights.filter(h => !(h.start === change.start && h.end === change.end));
};

export const revertAIChange = (
  change: AIChange,
  currentText: string
): { newText: string; highlights: { start: number; end: number }[] } => {
  if (change.type === 'modified' && change.originalText) {
    // If this is a full content change (start=0, end=0), restore the entire original text
    if (change.start === 0 && change.end === 0) {
      return { newText: change.originalText, highlights: [] };
    }

    // Otherwise, handle partial text replacement
    if (change.start !== undefined && change.end !== undefined) {
      const before = currentText.slice(0, change.start);
      const after = currentText.slice(change.end);
      const newText = before + change.originalText + after;

      // Calculate new highlight positions for the reverted text
      const newEnd = change.start + change.originalText.length;
      const highlights = [{ start: change.start, end: newEnd }];

      return { newText, highlights };
    }
  }

  return { newText: currentText, highlights: [] };
};

export const updateAIChange = (
  changes: AIChange[],
  changeId: string,
  updates: Partial<AIChange>
): AIChange[] => {
  return changes.map(change => (change.id === changeId ? { ...change, ...updates } : change));
};
