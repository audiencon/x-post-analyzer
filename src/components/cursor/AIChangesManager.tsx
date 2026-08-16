'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { AIChange, revertAIChange } from '@/lib/ai-changes-simple';

interface AIChangesManagerProps {
  editor: Editor | null;
  changes: AIChange[];
  onChangesUpdate: (changes: AIChange[]) => void;
  onHighlightUpdate?: (blockId: string, highlights: { start: number; end: number }[]) => void;
  onRevertChange?: (
    change: AIChange,
    newText: string,
    highlights: { start: number; end: number }[]
  ) => void;
}

export function AIChangesManager({
  editor,
  changes,
  onChangesUpdate,
  onRevertChange,
}: AIChangesManagerProps) {
  const [showChanges, setShowChanges] = useState(true);

  const acceptChange = (changeId: string) => {
    onChangesUpdate(changes.filter(change => change.id !== changeId));
  };

  const rejectChange = (changeId: string) => {
    const change = changes.find(c => c.id === changeId);
    if (!change) return;

    if (onRevertChange && change.originalText) {
      const currentText = editor?.getText() || '';
      const { newText, highlights } = revertAIChange(change, currentText);
      onRevertChange(change, newText, highlights);
    }

    onChangesUpdate(changes.filter(item => item.id !== changeId));
  };

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-white/8 pt-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[11px] tracking-[0.16em] text-white/30 uppercase">
          {changes.length} {changes.length === 1 ? 'edit' : 'edits'}
        </p>
        <div className="flex items-center gap-3 text-xs text-white/35">
          <button type="button" onClick={() => setShowChanges(!showChanges)}>
            {showChanges ? 'Hide' : 'Show'}
          </button>
          <button type="button" onClick={() => onChangesUpdate([])}>
            Clear
          </button>
        </div>
      </div>

      {showChanges ? (
        <div className="space-y-4">
          {changes.map(change => (
            <div key={change.id}>
              <p className="text-[11px] tracking-wide text-white/35 uppercase">
                {change.type}
                {change.isStreaming ? ' · writing' : ''}
              </p>
              {change.originalText ? (
                <p className="mt-1 text-xs text-white/40 line-through">{change.originalText}</p>
              ) : null}
              {change.newText ? (
                <p className="mt-1 text-sm text-[oklch(0.93_0.015_80)]">{change.newText}</p>
              ) : null}
              <div className="mt-2 flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => acceptChange(change.id)}
                  className="text-white/50 hover:text-white"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => rejectChange(change.id)}
                  className="text-[oklch(0.72_0.16_28)] hover:text-[oklch(0.8_0.16_28)]"
                >
                  Revert
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
