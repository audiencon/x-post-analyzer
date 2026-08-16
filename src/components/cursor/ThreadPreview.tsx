'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TipTapEditor } from './TipTapEditor';
import { CharacterCounter } from './CharacterCounter';
import { AIChangesManager } from './AIChangesManager';
import type { Editor } from '@tiptap/react';
import { applyHighlightRange, visiblePostText } from '@/lib/editor-helpers';
import type { AIChange } from '@/lib/ai-changes-simple';
import type { AnalysisResult } from '@/actions/analyze';
import { InkScore } from '@/components/tool/ink-score';
import type { StudioStarter } from '@/lib/studio-starters';

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
  onCopy?: () => void;
  onDownload?: () => void;
  onComposeOnX?: () => void;
  onMarkPosted?: () => void;
  posted?: boolean;
  onRemoveBlock?: (blockId: string) => void;
  activeBlockId?: string | null;
  busy?: boolean;
  loadingAction?: string | null;
  highlightsById?: Record<string, { start: number; end: number }[]>;
  aiChanges?: AIChange[];
  analysisById?: Record<string, AnalysisResult | null>;
  starters?: StudioStarter[];
  onUseStarter?: (insert: string) => void;
  emptyPlaceholder?: string;
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
  onCopy,
  onDownload,
  onComposeOnX,
  onMarkPosted,
  posted = false,
  onRemoveBlock,
  activeBlockId,
  busy = false,
  loadingAction = null,
  highlightsById = {},
  aiChanges = [],
  analysisById = {},
  starters = [],
  onUseStarter,
  emptyPlaceholder,
}: ThreadPreviewProps) {
  const nonEmptyBlocks = useMemo(
    () => blocks.filter(b => visiblePostText(b.text).trim().length > 0),
    [blocks]
  );
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
            const { from, to } = editor.state.selection;
            if (from !== to) return;
            highlights.forEach(range => {
              try {
                applyHighlightRange(editor, range.start, range.end, 'oklch(0.64 0.19 28 / 0.28)');
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
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">
          {nonEmptyBlocks.length > 0
            ? `${nonEmptyBlocks.length} ${nonEmptyBlocks.length === 1 ? 'post' : 'posts'}`
            : 'Draft'}
        </p>
        <div className="flex items-center gap-4 text-xs text-white/40">
          {onCopy ? (
            <button
              type="button"
              onClick={onCopy}
              className="hover:text-white disabled:opacity-40"
              disabled={!nonEmptyBlocks.length}
            >
              Copy
            </button>
          ) : null}
          {onDownload ? (
            <button
              type="button"
              onClick={onDownload}
              className="hover:text-white disabled:opacity-40"
              disabled={!nonEmptyBlocks.length}
            >
              Download
            </button>
          ) : null}
          {onComposeOnX ? (
            <button
              type="button"
              onClick={onComposeOnX}
              className="hover:text-white disabled:opacity-40"
              disabled={!nonEmptyBlocks.length}
              title={
                nonEmptyBlocks.length > 1
                  ? 'X only takes the first post. The rest is copied.'
                  : 'Open X with this post'
              }
            >
              {nonEmptyBlocks.length > 1 ? 'Compose first' : 'Compose on X'}
            </button>
          ) : null}
          {onMarkPosted ? (
            <button
              type="button"
              onClick={onMarkPosted}
              className="hover:text-white disabled:opacity-40"
              disabled={!nonEmptyBlocks.length && !posted}
            >
              {posted ? 'Posted' : 'Mark posted'}
            </button>
          ) : null}
          {onAddBlock ? (
            <button type="button" onClick={onAddBlock} className="hover:text-white" disabled={busy}>
              Add post
            </button>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">
        {displayBlocks.map((block, idx) => {
          const isActive = activeBlockId === block.id;
          const isEditing = editingBlockId === block.id;
          const isEmpty = !visiblePostText(block.text).trim();
          const shouldShowEditor = true;
          const analysis = analysisById[block.id];
          const roastLine =
            analysis?.analysis?.weaknesses?.[0] || analysis?.analysis?.synthesis || null;

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
                'group relative border-t border-white/8 pt-5 pb-6',
                isActive && 'border-t-[oklch(0.64_0.19_28)]'
              )}
              onClick={() => onBlockClick?.(block.id)}
              onKeyDown={e => {
                if (isEditing && e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-heading text-sm text-white/30">
                  {String(idx + 1).padStart(2, '0')}
                </p>
                <div className="flex items-center gap-3 text-xs text-white/35">
                  <CharacterCounter text={block.text} />
                  {onBlockAnalyze && !isEmpty ? (
                    <button
                      type="button"
                      disabled={busy || !block.text.trim()}
                      onClick={e => {
                        e.stopPropagation();
                        onBlockAnalyze(block.id);
                      }}
                      className="hover:text-white disabled:opacity-40"
                      title="Uses one roast from today's limit"
                    >
                      {loadingAction === 'analyze' ? 'Reading…' : 'Roast'}
                    </button>
                  ) : null}
                  {onRemoveBlock && blocks.length > 1 ? (
                    <button
                      type="button"
                      className="hover:text-[oklch(0.72_0.16_28)]"
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveBlock(block.id);
                      }}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                {shouldShowEditor ? (
                  <div onClick={e => e.stopPropagation()}>
                    <div className="studio-paper">
                      <TipTapEditor
                        value={block.text}
                        onChange={handleEditorChange}
                        onAddPost={onAddBlock}
                        className="min-h-[8.5rem] text-[1.2rem] leading-[1.55] text-[oklch(0.93_0.015_80)] focus-visible:ring-0"
                        placeholder={
                          isEmpty && blocks.length > 1
                            ? 'Type / to write the next post from the last one.'
                            : isEmpty
                              ? (emptyPlaceholder ??
                                'Write the line you would actually post. Type / for commands.')
                              : 'Keep going.'
                        }
                        slashContext={{ empty: isEmpty, thread: blocks.length > 1 }}
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
                                          'oklch(0.64 0.19 28 / 0.28)'
                                        );
                                      } catch {
                                        // Ignore highlight errors
                                      }
                                    });
                                  }
                                }, 50);
                              }

                              if (isActive && isEmpty) {
                                setTimeout(() => {
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
                              }
                            } else {
                              // Retry after a short delay
                              setTimeout(() => waitForView(attempts + 1), 100);
                            }
                          };

                          waitForView();
                        }}
                      />
                    </div>
                    {isActive ? (
                      <p className="mt-3 text-[11px] tracking-wide text-white/25">
                        / commands · ⌘↵ next post
                      </p>
                    ) : null}
                    {analysis ? (
                      <div className="border-ink mt-5 border-l-2 pl-4">
                        {roastLine ? (
                          <p className="font-heading text-ink-soft text-lg leading-snug">
                            {roastLine}
                          </p>
                        ) : null}
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <InkScore
                            label="Engage"
                            value={analysis.scores.engagement}
                            sting={analysis.scores.engagement < 55}
                            compact
                          />
                          <InkScore
                            label="Warmth"
                            value={analysis.scores.friendliness}
                            sting={analysis.scores.friendliness < 55}
                            compact
                          />
                          <InkScore
                            label="Viral"
                            value={analysis.scores.virality}
                            sting={analysis.scores.virality < 55}
                            compact
                          />
                          {analysis.desk ? (
                            <InkScore
                              label="Payout"
                              value={analysis.desk.payout}
                              sting={analysis.desk.payout < 55}
                              compact
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

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
              </div>
            </div>
          );
        })}
      </div>
      {onUseStarter &&
      starters.length > 0 &&
      displayBlocks.length === 1 &&
      !visiblePostText(displayBlocks[0]?.text ?? '').trim() ? (
        <div className="pt-2">
          <p className="text-[11px] tracking-[0.16em] text-white/28 uppercase">Start from</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {starters.map(starter => (
              <button
                key={starter.id}
                type="button"
                onClick={() => onUseStarter(starter.insert)}
                className="border-t border-white/8 pt-3 text-left hover:border-white/20"
              >
                <span className="block text-sm text-white/75">{starter.title}</span>
                <span className="mt-1 block text-xs leading-5 text-white/35">{starter.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
