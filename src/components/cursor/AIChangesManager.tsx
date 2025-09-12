'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Check, X, RotateCcw, Eye, EyeOff } from 'lucide-react';
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
  onHighlightUpdate,
  onRevertChange,
}: AIChangesManagerProps) {
  const [showChanges, setShowChanges] = useState(true);

  const acceptChange = (changeId: string) => {
    const change = changes.find(c => c.id === changeId);
    if (!change) return;

    // Remove from changes list
    const updatedChanges = changes.filter(change => change.id !== changeId);
    onChangesUpdate(updatedChanges);

    // Remove highlight if callback provided
    if (onHighlightUpdate && change.blockId) {
      // This would need to be implemented with the current highlights state
      // For now, just remove from changes list
    }
  };

  const rejectChange = (changeId: string) => {
    const change = changes.find(c => c.id === changeId);
    if (!change) return;

    // If we have a revert callback, use it to restore original text
    if (onRevertChange && change.originalText) {
      // Get current text from the editor
      const currentText = editor?.getText() || '';
      const { newText, highlights } = revertAIChange(change, currentText);

      // Call the revert callback
      onRevertChange(change, newText, highlights);
    }

    // Remove from changes list
    const updatedChanges = changes.filter(change => change.id !== changeId);
    onChangesUpdate(updatedChanges);
  };

  const clearAllChanges = () => {
    onChangesUpdate([]);
  };

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-[#333] bg-[#0a0a0a] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">AI Changes</h3>
          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
            {changes.length} change{changes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10"
            title={showChanges ? 'Hide changes' : 'Show changes'}
          >
            {showChanges ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={clearAllChanges}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10"
            title="Clear all changes"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showChanges && (
        <div className="space-y-2">
          {changes.map(change => (
            <div
              key={change.id}
              className={`rounded border p-3 ${
                change.type === 'added'
                  ? 'border-green-500/30 bg-green-500/10'
                  : change.type === 'modified'
                    ? 'border-blue-500/30 bg-blue-500/10'
                    : 'border-red-500/30 bg-red-500/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        change.type === 'added'
                          ? 'bg-green-500/20 text-green-400'
                          : change.type === 'modified'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {change.type}
                    </span>
                    <span className="text-xs text-white/60">{change.action}</span>
                    {change.isStreaming && (
                      <span className="animate-pulse text-xs text-blue-400">Streaming...</span>
                    )}
                    <span className="text-xs text-white/40">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {change.originalText && (
                    <div className="mb-1 text-xs text-white/60">
                      <span className="font-medium">Original:</span> {change.originalText}
                    </div>
                  )}

                  {change.newText && (
                    <div className="text-xs text-white/80">
                      <span className="font-medium">New:</span> {change.newText}
                    </div>
                  )}
                </div>

                <div className="ml-2 flex items-center gap-1">
                  <button
                    onClick={() => acceptChange(change.id)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    title="Accept change"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => rejectChange(change.id)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="Reject change"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
