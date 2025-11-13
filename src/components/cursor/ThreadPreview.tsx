'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Edit2, X, Plus, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TipTapEditor } from './TipTapEditor';
import { CharacterCounter } from './CharacterCounter';
import { AIChangesManager } from './AIChangesManager';
import type { Editor } from '@tiptap/react';
import { applyHighlightRange } from '@/lib/editor-helpers';
import type { AIChange } from '@/lib/ai-changes-simple';
import type { AnalysisResult } from '@/actions/analyze';
import { ScoreDisplay } from '@/components/analyze/score-display';

interface ThreadPreviewProps {
  blocks: Array<{ id: string; text: string }>;
  className?: string;
  onBlockClick?: (blockId: string) => void;
  onBlockUpdate?: (blockId: string, text: string) => void;
  onBlockAnalyze?: (blockId: string) => void;
  onBlockSlashCommand?: (blockId: string, command: string, editor?: Editor) => void;
  onBlockAiAction?: (blockId: string, kind: string, editor?: Editor) => void;
  onBlockSelectionChange?: (blockId: string, start: number, end: number) => void;
  onBlockChangesUpdate?: (blockId: string, changes: AIChange[]) => void;
  onBlockRevertChange?: (
    blockId: string,
    change: AIChange,
    newText: string,
    highlights: { start: number; end: number }[]
  ) => void;
  onAddBlock?: () => void;
  onRemoveBlock?: (blockId: string) => void;
  activeBlockId?: string | null;
  busy?: boolean;
  loadingAction?: string | null;
  highlightsById?: Record<string, { start: number; end: number }[]>;
  aiChanges?: AIChange[];
  analysisById?: Record<string, AnalysisResult | null>;
}

export function ThreadPreview({
  blocks,
  className,
  onBlockClick,
  onBlockUpdate,
  onBlockAnalyze,
  onBlockSlashCommand,
  onBlockAiAction,
  onBlockSelectionChange,
  onBlockChangesUpdate,
  onBlockRevertChange,
  onAddBlock,
  onRemoveBlock,
  activeBlockId,
  busy = false,
  loadingAction = null,
  highlightsById = {},
  aiChanges = [],
  analysisById = {},
}: ThreadPreviewProps) {
  const nonEmptyBlocks = useMemo(() => blocks.filter(b => b.text.trim().length > 0), [blocks]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const previewEditorRefs = useRef<Record<string, Editor>>({});

  // Auto-start editing for empty blocks
  useEffect(() => {
    const emptyBlock = blocks.find(b => !b.text.trim());
    if (emptyBlock && !editingBlockId) {
      setEditingBlockId(emptyBlock.id);
    }
  }, [blocks, editingBlockId]);

  // Apply highlights when they change
  useEffect(() => {
    Object.keys(highlightsById).forEach(blockId => {
      const editor = previewEditorRefs.current[blockId];
      if (!editor || !editor.view || !editor.view.dom) return;

      const highlights = highlightsById[blockId] || [];
      if (highlights.length > 0) {
        // Clear existing highlights first
        try {
          if (editor && editor.view && editor.view.dom) {
            editor.commands.unsetHighlight();
          }
        } catch {
          // Editor might not be ready
        }

        // Apply new highlights
        setTimeout(() => {
          if (editor && editor.view && editor.view.dom) {
            highlights.forEach(range => {
              try {
                applyHighlightRange(editor, range.start, range.end, 'rgba(34, 197, 94, 0.3)');
              } catch {
                // Ignore highlight errors
              }
            });
          }
        }, 50);
      } else {
        // Clear highlights if none exist
        try {
          if (editor && editor.view && editor.view.dom) {
            editor.commands.unsetHighlight();
          }
        } catch {
          // Editor might not be ready
        }
      }
    });
  }, [highlightsById]);

  // Handle Escape key to close editor
  useEffect(() => {
    if (!editingBlockId) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let cleanupFn: (() => void) | null = null;
    let attempts = 0;
    const maxAttempts = 20; // Max 1 second of retries

    // Wait for editor to be ready
    const setupEscapeHandler = (): (() => void) | null => {
      attempts++;
      if (attempts > maxAttempts) {
        return null; // Give up after max attempts
      }

      const editor = previewEditorRefs.current[editingBlockId];
      if (!editor) {
        // Retry after a short delay
        timeoutId = setTimeout(() => {
          cleanupFn = setupEscapeHandler();
        }, 50);
        return null;
      }

      // Check if view is available safely
      let editorView: typeof editor.view | undefined;
      try {
        editorView = editor.view;
      } catch {
        // Editor view not available yet
        timeoutId = setTimeout(() => {
          cleanupFn = setupEscapeHandler();
        }, 50);
        return null;
      }

      if (!editorView) {
        timeoutId = setTimeout(() => {
          cleanupFn = setupEscapeHandler();
        }, 50);
        return null;
      }

      let editorDom: HTMLElement | null = null;
      try {
        editorDom = editorView.dom;
      } catch {
        // DOM not available yet
        timeoutId = setTimeout(() => {
          cleanupFn = setupEscapeHandler();
        }, 50);
        return null;
      }

      if (!editorDom) {
        timeoutId = setTimeout(() => {
          cleanupFn = setupEscapeHandler();
        }, 50);
        return null;
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingBlockId(null);
        }
      };

      editorDom.addEventListener('keydown', handleEscape);

      return () => {
        if (editorDom) {
          editorDom.removeEventListener('keydown', handleEscape);
        }
      };
    };

    cleanupFn = setupEscapeHandler();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [editingBlockId]);

  // Always show at least one editor (placeholder if no blocks)
  const displayBlocks = blocks.length > 0 ? blocks : [{ id: 'placeholder', text: '' }];

  return (
    <div className={cn('rounded-lg border border-white/10 bg-[#0e0e0e] p-4', className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">𝕏</span>
        <span className="text-xs font-medium text-white/70">Preview</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/40">
            {nonEmptyBlocks.length > 0
              ? `${nonEmptyBlocks.length} ${nonEmptyBlocks.length === 1 ? 'tweet' : 'tweets'}`
              : 'Start writing...'}
          </span>
          {onAddBlock && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onAddBlock}
              className="h-7 gap-1.5 px-2 text-xs"
              disabled={busy}
              aria-label="Add new tweet to thread"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tweet</span>
            </Button>
          )}
        </span>
      </div>
      <div className="space-y-3">
        {displayBlocks.map((block, idx) => {
          const isActive = activeBlockId === block.id;
          const isEditing = editingBlockId === block.id;
          const isEmpty = !block.text.trim();
          const shouldShowEditor = isEditing || isEmpty; // Always show editor if empty or editing

          const handleStartEdit = (e: React.MouseEvent) => {
            e.stopPropagation();
            setEditingBlockId(block.id);
          };

          const handleCancelEdit = () => {
            setEditingBlockId(null);
            // Don't clear the editor ref - it might be reused
            // The editor will be cleaned up by React when the component unmounts
          };

          const handleEditorChange = (text: string) => {
            if (onBlockUpdate) {
              onBlockUpdate(block.id, text);
            }
          };

          return (
            <div
              key={block.id}
              data-block-id={block.id}
              className={cn(
                'group relative rounded-lg border bg-[#111] p-3 transition-all duration-200',
                isActive
                  ? 'border-[#1d9bf0]/50 bg-[#1d9bf0]/5 shadow-lg shadow-[#1d9bf0]/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-[#151515]',
                onBlockClick && !shouldShowEditor && 'cursor-pointer'
              )}
              onClick={() => !shouldShowEditor && onBlockClick?.(block.id)}
              onKeyDown={e => {
                if (isEditing && e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l-lg bg-[#1d9bf0]" />
              )}

              <div className="mb-2 flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10 transition-all group-hover:ring-[#1d9bf0]/30">
                  <AvatarFallback className="bg-[#1d9bf0] text-white">You</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-white">You</span>
                    <span className="text-xs text-white/40">@you</span>
                    {idx > 0 && <span className="text-xs text-white/30">· Thread {idx + 1}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      {!shouldShowEditor && onBlockClick && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={handleStartEdit}
                          aria-label="Edit this tweet"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {shouldShowEditor && (
                      <div className="ml-auto flex items-center gap-1">
                        {onBlockAnalyze && !isEmpty && (
                          <Button
                            size="sm"
                            disabled={busy || !block.text.trim()}
                            onClick={e => {
                              e.stopPropagation();
                              onBlockAnalyze(block.id);
                            }}
                            className="relative h-7 bg-linear-to-r from-purple-600 to-fuchsia-600 text-white shadow hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50"
                            aria-label="Analyze this post"
                          >
                            {loadingAction === 'analyze' && (
                              <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
                            )}
                            <span className="relative text-xs">Analyze</span>
                          </Button>
                        )}
                        {onRemoveBlock && blocks.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                            onClick={e => {
                              e.stopPropagation();
                              onRemoveBlock(block.id);
                            }}
                            aria-label="Delete this tweet"
                            disabled={busy}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        {!isEmpty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            onClick={e => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            aria-label="Close editor"
                            title="Close (Esc)"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {shouldShowEditor ? (
                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="relative rounded-lg border border-white/20 bg-[#0a0a0a] p-2">
                        <TipTapEditor
                          value={block.text}
                          onChange={handleEditorChange}
                          className="min-h-[100px] text-sm text-white focus-visible:ring-0"
                          placeholder={
                            isEmpty
                              ? "What's on your mind?\nTip: type / to see actions"
                              : 'Edit your tweet... (Press Esc to close)'
                          }
                          loadingAction={loadingAction}
                          onSelectionChange={(start, end) => {
                            if (onBlockSelectionChange) {
                              onBlockSelectionChange(block.id, start, end);
                            }
                          }}
                          onSlashCommand={command => {
                            if (onBlockSlashCommand) {
                              const editor = previewEditorRefs.current[block.id];
                              // Only pass editor if it's mounted and ready
                              if (editor && editor.view && editor.view.dom) {
                                onBlockSlashCommand(block.id, command, editor);
                              } else {
                                onBlockSlashCommand(block.id, command, undefined);
                              }
                            }
                          }}
                          onAiAction={kind => {
                            if (onBlockAiAction) {
                              const editor = previewEditorRefs.current[block.id];
                              // Only pass editor if it's mounted and ready
                              if (editor && editor.view && editor.view.dom) {
                                onBlockAiAction(block.id, kind, editor);
                              } else {
                                onBlockAiAction(block.id, kind, undefined);
                              }
                            }
                          }}
                          onEditorReady={(editor: Editor) => {
                            // Store editor ref - always store it for the block
                            previewEditorRefs.current[block.id] = editor;

                            // Wait for editor view to be fully available
                            const waitForView = (attempts = 0) => {
                              if (attempts > 10) return; // Max 10 attempts (1 second)

                              // Double-check that this is still the active editor
                              if (previewEditorRefs.current[block.id] !== editor) {
                                return; // Editor was replaced
                              }

                              if (editor && editor.view && editor.view.dom) {
                                // Apply highlights if they exist
                                const highlights = highlightsById[block.id] || [];
                                if (highlights.length > 0) {
                                  // Apply highlights after editor is ready
                                  setTimeout(() => {
                                    // Check again that editor is still valid
                                    if (
                                      previewEditorRefs.current[block.id] === editor &&
                                      editor.view &&
                                      editor.view.dom
                                    ) {
                                      highlights.forEach(range => {
                                        try {
                                          applyHighlightRange(
                                            editor,
                                            range.start,
                                            range.end,
                                            'rgba(34, 197, 94, 0.3)'
                                          );
                                        } catch {
                                          // Ignore highlight errors
                                        }
                                      });
                                    }
                                  }, 50);
                                }

                                // Focus the editor when it's ready
                                setTimeout(() => {
                                  // Check again that editor is still valid
                                  if (
                                    previewEditorRefs.current[block.id] === editor &&
                                    editor.view &&
                                    editor.view.dom &&
                                    editor.commands
                                  ) {
                                    try {
                                      editor.commands.focus();
                                    } catch {
                                      // Editor might not be fully mounted yet
                                    }
                                  }
                                }, 50);
                              } else {
                                // Retry after a short delay
                                setTimeout(() => waitForView(attempts + 1), 100);
                              }
                            };

                            waitForView();
                          }}
                        />
                        <div className="absolute right-3 bottom-3">
                          <CharacterCounter text={block.text} />
                        </div>
                      </div>
                      {!isEmpty && (
                        <div className="text-xs text-white/40">Press Esc to close editor</div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-white/90">
                        {block.text}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
                        <span className="transition-colors group-hover:text-white/60">
                          💬 Reply
                        </span>
                        <span className="transition-colors group-hover:text-white/60">
                          🔄 Retweet
                        </span>
                        <span className="transition-colors group-hover:text-white/60">❤️ Like</span>
                        <span className="transition-colors group-hover:text-white/60">
                          📤 Share
                        </span>
                      </div>
                    </>
                  )}

                  {/* AI Changes Manager for this block */}
                  {onBlockChangesUpdate && onBlockRevertChange && (
                    <div className="mt-3">
                      <AIChangesManager
                        editor={previewEditorRefs.current[block.id] || null}
                        changes={aiChanges.filter(c => c.blockId === block.id)}
                        onChangesUpdate={changes => {
                          // Update only changes for this block, keep others
                          if (onBlockChangesUpdate) {
                            const otherChanges = aiChanges.filter(c => c.blockId !== block.id);
                            onBlockChangesUpdate(block.id, [...otherChanges, ...changes]);
                          }
                        }}
                        onRevertChange={(change, newText, highlights) => {
                          onBlockRevertChange(block.id, change, newText, highlights);
                        }}
                      />
                    </div>
                  )}

                  {/* Analysis Display for this block */}
                  {analysisById[block.id] && (
                    <div className="mt-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-purple-300">Analysis Results</h4>
                      </div>
                      <ScoreDisplay scores={analysisById[block.id]?.scores} />
                      {analysisById[block.id]?.analysis &&
                        (() => {
                          const analysis = analysisById[block.id]?.analysis;
                          if (!analysis) return null;
                          return (
                            <div className="mt-3 space-y-2 text-xs">
                              {analysis.synthesis && (
                                <div>
                                  <span className="font-medium text-white/70">Summary: </span>
                                  <span className="text-white/90">{analysis.synthesis}</span>
                                </div>
                              )}
                              {analysis.strengths && analysis.strengths.length > 0 && (
                                <div>
                                  <span className="font-medium text-green-400/80">Strengths: </span>
                                  <ul className="mt-1 ml-4 list-disc space-y-0.5 text-white/80">
                                    {analysis.strengths.map((strength, i) => (
                                      <li key={i}>{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                                <div>
                                  <span className="font-medium text-orange-400/80">
                                    Areas to Improve:{' '}
                                  </span>
                                  <ul className="mt-1 ml-4 list-disc space-y-0.5 text-white/80">
                                    {analysis.weaknesses.map((weakness, i) => (
                                      <li key={i}>{weakness}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.recommendations && analysis.recommendations.length > 0 && (
                                <div>
                                  <span className="font-medium text-blue-400/80">
                                    Recommendations:{' '}
                                  </span>
                                  <ul className="mt-1 ml-4 list-disc space-y-0.5 text-white/80">
                                    {analysis.recommendations.map((rec, i) => (
                                      <li key={i}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* Add Block Button at the end */}
        {onAddBlock && (
          <div className="flex justify-center pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onAddBlock}
              className="h-9 gap-2 border-dashed border-white/20 bg-transparent text-white/60 hover:border-white/40 hover:bg-white/5 hover:text-white"
              disabled={busy}
              aria-label="Add new tweet to thread"
            >
              <Plus className="h-4 w-4" />
              <span>Add Tweet to Thread</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
