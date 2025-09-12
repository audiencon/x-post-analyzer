/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TipTapEditor } from './TipTapEditor';
import { AIChangesManager } from './AIChangesManager';
import type { Editor } from '@tiptap/react';
import { analyzePost } from '@/actions/analyze';
import { getSuggestions } from '@/actions/suggestions';
import { createAIChange, updateAIChange, type AIChange } from '@/lib/ai-changes-simple';
import { createStream } from '@/lib/streaming';
import type { AnalysisResult } from '@/actions/analyze';
import type { Suggestion } from '@/actions/suggestions';
import { toast } from 'sonner';
import {
  sanitizeModelOutput,
  textToHtmlWithParagraphs,
  applyHighlightRange,
  insertStreamLineBreak,
  setContentSafely,
  highlightEntireDoc,
} from '@/lib/editor-helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import spotsConfig from '@/config/spots.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDuration, formatPrice } from '@/types/spots';

interface Block {
  id: string;
  text: string;
}

interface ThreadComposerProps {
  externalInsert?: string;
  onInserted?: () => void;
}

export function ThreadComposer({ externalInsert, onInserted }: ThreadComposerProps) {
  const [blocks, setBlocks] = useState<Block[]>([{ id: crypto.randomUUID(), text: '' }]);
  const [busy, setBusy] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [analysisById, setAnalysisById] = useState<Record<string, AnalysisResult | null>>({});
  const [suggestionsById, setSuggestionsById] = useState<Record<string, Suggestion[] | null>>({});
  // TipTap manages its own refs
  const [selectionById, setSelectionById] = useState<
    Record<string, { start: number; end: number } | null>
  >({});
  const [highlightsById, setHighlightsById] = useState<
    Record<string, { start: number; end: number }[]>
  >({});
  const [aiChanges, setAiChanges] = useState<AIChange[]>([]);
  const [editorRef, setEditorRef] = useState<Editor | null>(null);
  const active = blocks[0]?.id ?? null;

  const spot = spotsConfig.spots.find(s => s.id === 'spot-cursor');
  const url = spot?.available ? spot?.stripeUrl : spot?.data.url;

  const update = (id: string, text: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, text } : b)));
  };

  const applySuggestion = (blockId: string, suggestion: string) => {
    update(blockId, suggestion);

    // Apply highlight to the applied suggestion
    if (editorRef && blockId === active) {
      editorRef.commands.setContent(suggestion);
      editorRef.commands.selectAll();
      editorRef.commands.setHighlight({ color: '#3b82f6' }); // Blue highlight for suggestions
    }

    toast.success('Suggestion applied', {
      description: 'The suggestion has been added to your content.',
      duration: 2000,
    });
  };

  const applyTransform = async (
    id: string,
    kind: 'improve' | 'extend' | 'short' | 'hook' | 'punchy' | 'clarify' | 'formal' | 'casual'
  ) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const base = block.text
      .replace(/\/(improve|extend|short|hook|punchy|clarify|formal|casual)\b\s*$/i, '')
      .trim();
    if (!base) return;
    setBusy(true);
    setLoadingAction(kind);
    try {
      let instruction = '';
      if (kind === 'improve') {
        instruction =
          'Improve clarity, flow, and engagement. Keep original meaning and tone. Make it punchy and compelling for X. Keep within 240-280 characters if possible.';
      } else if (kind === 'extend') {
        instruction =
          'Extend and enrich the post with one or two crisp details or examples. Keep it engaging and skimmable. Aim for 240-280 characters.';
      } else if (kind === 'short') {
        instruction =
          'Make it concise and impactful under 180 characters. Preserve the key message and make it scroll-stopping.';
      } else if (kind === 'hook') {
        instruction =
          'Rewrite to maximize the opening hook. Lead with tension, curiosity, or a bold claim. One strong opening line.';
      } else if (kind === 'punchy') {
        instruction =
          'Increase energy, remove filler, choose vivid words. Keep it crisp and punchy for X feed.';
      } else if (kind === 'clarify') {
        instruction =
          'Rewrite to be simpler and clearer for a broad audience. Remove jargon and reduce clauses.';
      } else if (kind === 'formal') {
        instruction =
          'Rewrite in a more formal, professional tone while staying concise and engaging for X.';
      } else if (kind === 'casual') {
        instruction =
          'Rewrite in a more casual, friendly tone with light personality. Avoid slang overload.';
      }
      const prompt = `You are editing a tweet for X performance.

<general_rules>
- Output ONLY the final tweet text. Do not explain anything.
- No hashtags or links unless explicitly present in the original. Max 1 emoji.
- Use short lines and deliberate line breaks for skimmability (use \n).
- Keep the user's tone and meaning intact; raise hook strength and clarity.
- 6th-grade reading level language.
</general_rules>

<instruction>
${instruction}
</instruction>

<original>
${base}
</original>

Return ONLY the rewritten tweet text and append a trailing *.`;

      // Create AI change record for streaming - store the full original text
      const aiChange = createAIChange('modified', block.text, '', kind, id, 0, 0, true);
      setAiChanges(prev => [...prev, aiChange]);

      // Clear the editor content and start streaming
      if (editorRef) {
        editorRef.commands.clearContent();
        editorRef.commands.focus();
      }

      let streamedText = '';
      const stream = createStream({
        onChunk: (chunk: string) => {
          // Check for line breaks BEFORE updating streamedText
          const shouldInsertLineBreak =
            chunk === ' ' &&
            (streamedText.endsWith('!') ||
              streamedText.endsWith('.') ||
              streamedText.endsWith('?'));

          streamedText += chunk;

          // Update the change with streaming text
          setAiChanges(prev =>
            updateAIChange(prev, aiChange.id, {
              newText: streamedText,
            })
          );

          // Insert chunk into editor at current cursor position
          if (editorRef) {
            // (debugging removed)

            // Detect line breaks in different formats
            if (chunk.includes('\\n')) {
              // Handle explicit \n markers
              const parts = chunk.split('\\n');
              parts.forEach((part, index) => {
                if (part) {
                  editorRef.commands.insertContent(part);
                  // highlight each part
                  try {
                    if (part.trim().length > 0) {
                      const { state } = editorRef;
                      const to = state.selection.to;
                      const from = Math.max(1, to - part.length);
                      editorRef
                        .chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .setHighlight({ color: 'rgba(34, 197, 94, 0.3)' })
                        .setTextSelection(to)
                        .run();
                    }
                  } catch {}
                }
                if (index < parts.length - 1) {
                  editorRef.commands.enter();
                }
              });
            } else if (shouldInsertLineBreak) {
              // Handle space after punctuation marks (likely line break)
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(editorRef);
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else if (chunk.trim() === '' && chunk.length > 0) {
              // Handle empty chunks that represent line breaks
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(editorRef);
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else {
              editorRef.commands.insertContent(chunk);
            }
            // (debugging removed)
          }
        },
        onComplete: (fullText: string) => {
          // Remove wrapping quotes and trailing asterisks from model output
          const sanitized = sanitizeModelOutput(fullText);

          // Process line breaks in the final text for storage
          const processedFinalText = sanitized.replace(/\\n/g, '\n');

          // Update the change with final text
          setAiChanges(prev =>
            updateAIChange(prev, aiChange.id, {
              newText: processedFinalText,
              isStreaming: false,
              end: processedFinalText.length,
            })
          );

          // Replace editor content with sanitized text (preserving paragraphs), then highlight
          if (editorRef) {
            // (debugging removed)
            try {
              const html = textToHtmlWithParagraphs(processedFinalText);
              setContentSafely(editorRef, html);
              highlightEntireDoc(editorRef);
            } catch {}
          }

          // Update the block with final text
          update(id, processedFinalText);
        },
        onError: (error: Error) => {
          // Remove the failed change
          setAiChanges(prev => prev.filter(c => c.id !== aiChange.id));

          // Restore original content on error
          if (editorRef) {
            editorRef.commands.setContent(base);
          }

          if (error.message.includes('Usage limit reached')) {
            toast.error('Usage limit reached', {
              description:
                "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
              duration: 5000,
            });
          } else {
            toast.error('Streaming failed', {
              description: 'Please try again or check your connection.',
              duration: 3000,
            });
          }
        },
      });

      await stream.streamResponse(prompt);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        toast.error('Usage limit reached', {
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
          duration: 5000,
        });
      } else {
        toast.error('Something went wrong', {
          description: 'Please try again or check your connection.',
          duration: 3000,
        });
      }
    } finally {
      setBusy(false);
      setLoadingAction(null);
    }
  };

  // Handle external insertions (e.g., from IdeasSidebar) without setting state during render
  useEffect(() => {
    if (!externalInsert || busy) return;
    const targetId = active ?? blocks[0]?.id;
    if (!targetId) return;
    const current = blocks.find(b => b.id === targetId)?.text ?? '';
    const next = current ? current + '\n\n' + externalInsert : externalInsert;
    update(targetId, next);
    onInserted?.();
  }, [externalInsert]);

  const runAnalyzeBlock = async (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block || !block.text.trim()) return;
    setBusy(true);
    setLoadingAction('analyze');
    try {
      const res = await analyzePost(block.text);
      setAnalysisById(prev => ({ ...prev, [id]: res }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        toast.error('Usage limit reached', {
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
          duration: 5000,
        });
      } else {
        toast.error('Analysis failed', {
          description: 'Please try again or check your connection.',
          duration: 3000,
        });
      }
    } finally {
      setBusy(false);
      setLoadingAction(null);
    }
  };

  const runSuggestBlock = async (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block || !block.text.trim()) return;
    setBusy(true);
    setLoadingAction('suggest');
    try {
      const res = await getSuggestions(block.text);
      setSuggestionsById(prev => ({ ...prev, [id]: res }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        toast.error('Usage limit reached', {
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
          duration: 5000,
        });
      } else {
        toast.error('Suggestions failed', {
          description: 'Please try again or check your connection.',
          duration: 3000,
        });
      }
    } finally {
      setBusy(false);
      setLoadingAction(null);
    }
  };

  const scoreSummary = (a?: AnalysisResult | null) => {
    if (!a) return '—';
    const s = a.scores;
    return `E ${s.engagement} · F ${s.friendliness} · V ${s.virality}`;
  };

  const renderWithHighlights = (id: string, text: string) => {
    const ranges = (highlightsById[id] ?? []).slice().sort((a, b) => a.start - b.start);
    if (!ranges.length) return text;
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    ranges.forEach((r, idx) => {
      const start = Math.max(0, Math.min(r.start, text.length));
      const end = Math.max(0, Math.min(r.end, text.length));
      if (start > cursor) {
        parts.push(<span key={`t-${idx}-${cursor}`}>{text.slice(cursor, start)}</span>);
      }
      if (end > start) {
        parts.push(
          <span key={`h-${idx}-${start}`} className="bg-green-500/20">
            {text.slice(start, end)}
          </span>
        );
        cursor = end;
      }
    });
    if (cursor < text.length) parts.push(<span key={`t-end-${cursor}`}>{text.slice(cursor)}</span>);
    return parts;
  };

  const applyTransformToSelection = async (
    id: string,
    kind: 'improve' | 'extend' | 'short' | 'hook' | 'punchy' | 'clarify' | 'formal' | 'casual'
  ) => {
    const block = blocks.find(b => b.id === id);
    const sel = selectionById[id];
    if (!block || !sel || sel.end <= sel.start) {
      toast.error('No text selected', {
        description: 'Please select some text first, then click an action button.',
        duration: 3000,
      });
      return;
    }

    // TipTap uses 1-based coordinates, but slice() uses 0-based, so we need to adjust
    const start = Math.max(0, sel.start - 1);
    const end = Math.max(0, sel.end - 1);

    const before = block.text.slice(0, start);
    const target = block.text.slice(start, end);
    const after = block.text.slice(end);
    setBusy(true);
    setLoadingAction(kind);
    try {
      let instruction = '';
      switch (kind) {
        case 'improve':
          instruction = 'Improve clarity, flow, and engagement while preserving meaning and tone.';
          break;
        case 'extend':
          instruction = 'Extend with 1-2 crisp details or examples, keep it skimmable.';
          break;
        case 'short':
          instruction = 'Make concise and impactful; preserve key message.';
          break;
        case 'hook':
          instruction = 'Maximize opening hook; lead with tension or a bold claim.';
          break;
        case 'punchy':
          instruction = 'Increase energy, remove filler, choose vivid words.';
          break;
        case 'clarify':
          instruction = 'Simplify for broad audience; remove jargon and reduce clauses.';
          break;
        case 'formal':
          instruction = 'More formal, professional tone; concise and engaging for X.';
          break;
        case 'casual':
          instruction = 'More casual, friendly tone; light personality; avoid slang overload.';
          break;
      }
      const prompt = `You are editing a tweet for X performance.

<general_rules>
- Output ONLY the final tweet text. Do not explain anything.
- No hashtags or links unless explicitly present in the original. Max 1 emoji.
- Use short lines and deliberate line breaks for skimmability (use \n).
- Keep the user's tone and meaning intact; raise hook strength and clarity.
- 6th-grade reading level language.
</general_rules>

<instruction>
${instruction}
</instruction>

<original>
${target}
</original>

Return ONLY the rewritten tweet text and append a trailing *.`;

      const newStart = before.length;

      // Create AI change record for streaming
      const aiChange = createAIChange('modified', target, '', kind, id, newStart, newStart, true);
      setAiChanges(prev => [...prev, aiChange]);

      // Delete the selected text and prepare for streaming
      if (editorRef) {
        editorRef.commands.deleteRange({ from: sel.start, to: sel.end });
        editorRef.commands.focus();
      }

      let streamedText = '';
      const stream = createStream({
        onChunk: (chunk: string) => {
          // Check for line breaks BEFORE updating streamedText
          const shouldInsertLineBreak =
            chunk === ' ' &&
            (streamedText.endsWith('!') ||
              streamedText.endsWith('.') ||
              streamedText.endsWith('?'));

          streamedText += chunk;

          // Update the change with streaming text
          setAiChanges(prev =>
            updateAIChange(prev, aiChange.id, {
              newText: streamedText,
            })
          );

          // Insert chunk into editor at current cursor position
          if (editorRef) {
            // Detect line breaks in different formats
            if (chunk.includes('\\n')) {
              // Handle explicit \n markers
              const parts = chunk.split('\\n');
              parts.forEach((part, index) => {
                if (part) {
                  editorRef.commands.insertContent(part);
                }
                if (index < parts.length - 1) {
                  editorRef.commands.enter();
                }
              });
            } else if (shouldInsertLineBreak) {
              // Handle space after punctuation marks (likely line break)
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(editorRef);
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else if (chunk.trim() === '' && chunk.length > 0) {
              // Handle empty chunks that represent line breaks
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(editorRef);
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else {
              // Regular content
              editorRef.commands.insertContent(chunk);
              // Highlight the newly inserted range
              try {
                if (chunk.length > 0 && chunk.trim().length > 0) {
                  const { state } = editorRef;
                  const to = state.selection.to;
                  const from = Math.max(1, to - chunk.length);
                  editorRef
                    .chain()
                    .focus()
                    .setTextSelection({ from, to })
                    .setHighlight({ color: 'rgba(34, 197, 94, 0.3)' })
                    .setTextSelection(to)
                    .run();
                }
              } catch {}
            }
          }
        },
        onComplete: (fullText: string) => {
          // Remove wrapping quotes and trailing asterisks from model output
          const sanitized = sanitizeModelOutput(fullText);

          // Process line breaks in the final text for storage
          const processedFinalText = sanitized.replace(/\\n/g, '\n');
          const newText = before + processedFinalText + after;
          const newEnd = newStart + processedFinalText.length;

          // Update the change with final text
          setAiChanges(prev =>
            updateAIChange(prev, aiChange.id, {
              newText: processedFinalText,
              isStreaming: false,
              end: newEnd,
            })
          );

          // Replace the streamed selection with sanitized text in the editor, then highlight that span
          if (editorRef) {
            // (debugging removed)
            try {
              // Determine the streamed span by using caret and streamed length
              const streamedLength = streamedText.length;
              const caretEnd = editorRef.state.selection.to;
              const caretStart = Math.max(1, caretEnd - Math.max(0, streamedLength));

              // Build sanitized HTML from processed text
              const parts = processedFinalText.split(/\n{2,}/);
              const html = parts
                .map((par, idx) => {
                  const inside = par.replace(/\n/g, '<br>');
                  const trailing = idx < parts.length - 1 ? '<br>' : '';
                  return `<p>${inside}${trailing}</p>`;
                })
                .join('');

              // Replace the streamed raw content with sanitized HTML
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              editorRef.commands.setTextSelection({ from: caretStart, to: caretEnd });
              editorRef.commands.insertContent(html);
              (
                editorRef as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);

              // Highlight the newly inserted sanitized span
              const newEndSel = editorRef.state.selection.to;
              const newStartSel = Math.max(1, newEndSel - processedFinalText.length);
              applyHighlightRange(editorRef, newStartSel, newEndSel);
            } catch {}
          }

          // Update the block with final text
          update(id, newText);
        },
        onError: (error: Error) => {
          // Remove the failed change
          setAiChanges(prev => prev.filter(c => c.id !== aiChange.id));

          // Restore original content on error
          if (editorRef) {
            editorRef.commands.setContent(block.text);
          }

          if (error.message.includes('Usage limit reached')) {
            toast.error('Usage limit reached', {
              description:
                "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
              duration: 5000,
            });
          } else {
            toast.error('Streaming failed', {
              description: 'Please try again or check your connection.',
              duration: 3000,
            });
          }
        },
      });

      await stream.streamResponse(prompt);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        toast.error('Usage limit reached', {
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
          duration: 5000,
        });
      } else {
        toast.error('Something went wrong', {
          description: 'Please try again or check your connection.',
          duration: 3000,
        });
      }
    } finally {
      setBusy(false);
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex h-[70vh] w-full max-w-5xl flex-col">
      <ScrollArea className="h-[70vh] overflow-y-auto">
        <div className="flex-1 space-y-3 p-3">
          {/* AI Changes Manager */}
          <AIChangesManager
            editor={editorRef}
            changes={aiChanges}
            onChangesUpdate={setAiChanges}
            onRevertChange={(change, newText, highlights) => {
              // Update the block text
              update(change.blockId, newText);

              // Update the editor content if it's the active block
              if (editorRef && change.blockId === active) {
                editorRef.commands.setContent(newText);
                // Remove all highlights when reverting
                editorRef.commands.unsetHighlight();
              }

              // Update highlights for this block
              setHighlightsById(prev => ({
                ...prev,
                [change.blockId]: highlights,
              }));
            }}
          />
          {blocks.map(b => (
            <div key={b.id} className="rounded-lg border border-[#2a2a2a] bg-[#111] p-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-full gap-3">
                  {spot?.available ? (
                    <Link
                      href={url ?? ''}
                      target="_blank"
                      className="group relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#2f3336] transition-colors hover:bg-[#2f3336]/80"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-[#71767b]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={url ?? ''}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#2f3336] transition-transform hover:scale-105"
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={spot?.data?.avatar} alt={`@${spot?.data?.username}`} />
                        <AvatarFallback>
                          {(spot?.data?.name as string)?.substring(0, 2).toUpperCase() +
                            spot?.data?.name?.substring(2)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  )}
                  <div className="flex h-full min-w-0 flex-col justify-between">
                    {/* Username and Handle */}
                    <div className="flex items-center justify-between gap-2">
                      {spot?.available ? (
                        <Link
                          href={url ?? ''}
                          target="_blank"
                          className="flex items-center gap-1 text-[15px]"
                        >
                          <span className="cursor-pointer font-bold text-[#1d9bf0] hover:underline">
                            Want to be our sponsor? <br />
                            {formatPrice(spot?.price ?? 0, 'USD')} for{' '}
                            {formatDuration(spot?.duration ?? '30d')}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex flex-col text-[15px]">
                          <div className="flex items-center gap-1">
                            <Link
                              href={url ?? ''}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-white hover:underline"
                            >
                              {spot?.data?.name}
                            </Link>
                            {spot?.data?.verified && (
                              <svg
                                className="h-4 w-4 text-[#1d9bf0]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                              </svg>
                            )}

                            <div className="ml-12 flex items-center gap-1 text-[13px] text-[#71767b]">
                              <span>Ads</span>
                              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                            </div>
                          </div>
                          <Link
                            href={url ?? ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#71767b] hover:underline"
                          >
                            @{spot?.data?.username}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => runAnalyzeBlock(b.id)}
                    className="relative bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow hover:from-purple-500 hover:to-fuchsia-500"
                  >
                    {loadingAction === 'analyze' && (
                      <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
                    )}
                    <span className="relative">Analyze</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => runSuggestBlock(b.id)}
                  >
                    {loadingAction === 'suggest' && (
                      <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
                    )}
                    <span className="relative">Suggest</span>
                  </Button>
                </div>
              </div>
              <TipTapEditor
                value={b.text}
                suppressExternalSync={busy && b.id === active}
                onChange={v => {
                  update(b.id, v);
                }}
                onSelectionChange={(start, end) => {
                  setSelectionById(prev => ({ ...prev, [b.id]: { start, end } }));
                }}
                onAiAction={kind => applyTransformToSelection(b.id, kind)}
                onSlashCommand={command => {
                  const cmd = command as
                    | 'improve'
                    | 'extend'
                    | 'short'
                    | 'hook'
                    | 'punchy'
                    | 'clarify'
                    | 'formal'
                    | 'casual';
                  applyTransform(b.id, cmd);
                }}
                onEditorReady={editor => {
                  if (b.id === active) {
                    setEditorRef(editor);
                  }
                }}
                loadingAction={loadingAction}
                className="min-h-[120px] border-0 bg-[#0c0c0c] text-[16px] leading-7 text-white focus-visible:ring-0"
                placeholder={`What's on your mind?
Tip: type / to see actions`}
              />
              {(highlightsById[b.id]?.length ?? 0) > 0 && (
                <div className="mt-2 rounded-md border border-[#2a2a2a] bg-[#0e0e0e] p-2 text-sm text-white/80">
                  <div className="mb-1 text-xs text-white/50">Preview with highlights</div>
                  <div className="max-h-[100px] overflow-scroll whitespace-pre-wrap">
                    {renderWithHighlights(b.id, b.text)}
                  </div>
                </div>
              )}
              <div className="mt-2 grid gap-3 text-xs text-white/70">
                {analysisById[b.id]?.analysis && (
                  <div className="rounded-md border border-[#2a2a2a] bg-[#0e0e0e] p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-white/60">Scores</div>
                      <div className="font-medium">{scoreSummary(analysisById[b.id])}</div>
                    </div>
                    {analysisById[b.id]?.analysis?.synthesis ? (
                      <div className="rounded bg-white/5 p-2 text-white/80">
                        {analysisById[b.id]!.analysis.synthesis}
                      </div>
                    ) : null}

                    <div className="mt-2 grid gap-2 md:grid-cols-3">
                      <div>
                        <div className="mb-1 text-white/50">Strengths</div>
                        <ul className="space-y-1">
                          {analysisById[b.id]!.analysis.strengths?.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="text-white/80">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-1 text-white/50">Weaknesses</div>
                        <ul className="space-y-1">
                          {analysisById[b.id]!.analysis.weaknesses?.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
                              <span className="text-white/80">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-1 text-white/50">Recommendations</div>
                        <ul className="space-y-1">
                          {analysisById[b.id]!.analysis.recommendations?.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
                              <span className="text-white/80">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {suggestionsById[b.id]?.length ? (
                  <div className="rounded-md border border-[#2a2a2a] bg-[#0e0e0e] p-2">
                    <div className="mb-1 text-white/60">Suggestions</div>
                    <ul className="space-y-1">
                      {suggestionsById[b.id]!.slice(0, 3).map((s, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => applySuggestion(b.id, s.text)}
                            className="w-full rounded p-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            title="Click to apply this suggestion"
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 text-xs text-white/50">{idx + 1}.</span>
                              <span className="flex-1">{s.text}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
