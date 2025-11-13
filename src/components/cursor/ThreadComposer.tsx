'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Editor } from '@tiptap/react';
import { analyzePost } from '@/actions/analyze';
import { createAIChange, updateAIChange, type AIChange } from '@/lib/ai-changes-simple';
import { createStream } from '@/lib/streaming';
import type { AnalysisResult } from '@/actions/analyze';
import { toast } from 'sonner';
import {
  sanitizeModelOutput,
  textToHtmlWithParagraphs,
  applyHighlightRange,
  insertStreamLineBreak,
  setContentSafely,
  highlightEntireDoc,
} from '@/lib/editor-helpers';
import { ThreadPreview } from './ThreadPreview';
import { ContentTemplates } from './ContentTemplates';
import { Download, Copy } from 'lucide-react';

interface Block {
  id: string;
  text: string;
}

interface ThreadComposerProps {
  externalInsert?: string;
  externalThread?: string[]; // Array of tweet texts for thread insertion
  onInserted?: () => void;
}

export function ThreadComposer({
  externalInsert,
  externalThread,
  onInserted,
}: ThreadComposerProps) {
  const [blocks, setBlocks] = useState<Block[]>([{ id: crypto.randomUUID(), text: '' }]);
  const [busy, setBusy] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [analysisById, setAnalysisById] = useState<Record<string, AnalysisResult | null>>({});
  // TipTap manages its own refs
  const [selectionById, setSelectionById] = useState<
    Record<string, { start: number; end: number } | null>
  >({});
  const [highlightsById, setHighlightsById] = useState<
    Record<string, { start: number; end: number }[]>
  >({});
  const [aiChanges, setAiChanges] = useState<AIChange[]>([]);
  const [editorRef, setEditorRef] = useState<Editor | null>(null);
  const [editorRefsById, setEditorRefsById] = useState<Record<string, Editor>>({});
  const previewEditorRefs = useRef<Record<string, Editor>>({});
  const [activeBlockId, setActiveBlockId] = useState<string | null>(blocks[0]?.id ?? null);
  const active = activeBlockId ?? blocks[0]?.id ?? null;
  const processedThreadRef = useRef<string>('');
  const processedInsertRef = useRef<string>('');
  const isProcessingThreadRef = useRef<boolean>(false);
  const isProcessingInsertRef = useRef<boolean>(false);
  const prevExternalThreadRef = useRef<string | undefined>(undefined);
  const prevExternalInsertRef = useRef<string | undefined>(undefined);

  const update = useCallback((id: string, text: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, text } : b)));
  }, []);

  const addBlock = useCallback(() => {
    const newBlock: Block = { id: crypto.randomUUID(), text: '' };
    setBlocks(prev => [...prev, newBlock]);
    // Set the new block as active
    setActiveBlockId(newBlock.id);
    // Scroll to the new block after a short delay to allow it to render
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`);
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  const removeBlock = useCallback(
    (id: string) => {
      // Don't allow removing the last block if it's the only one
      if (blocks.length <= 1) {
        toast.error('Cannot remove the last tweet', {
          description: 'You need at least one tweet in your thread.',
          duration: 2000,
        });
        return;
      }

      setBlocks(prev => prev.filter(b => b.id !== id));
      // Remove associated analysis
      setAnalysisById(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Remove associated editor refs
      setEditorRefsById(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Remove highlights
      setHighlightsById(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Remove selection
      setSelectionById(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Remove AI changes
      setAiChanges(prev => prev.filter(c => c.blockId !== id));

      // If the removed block was active, set the first remaining block as active
      if (activeBlockId === id) {
        const remainingBlocks = blocks.filter(b => b.id !== id);
        if (remainingBlocks.length > 0) {
          setActiveBlockId(remainingBlocks[0].id);
        }
      }
    },
    [blocks, activeBlockId]
  );

  const copyThread = () => {
    const threadText = blocks
      .filter(b => b.text.trim())
      .map((b, idx) => `${idx + 1}/${blocks.filter(bl => bl.text.trim()).length} ${b.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(threadText);
    toast.success('Thread copied to clipboard', { duration: 2000 });
  };

  const downloadThread = () => {
    const threadText = blocks
      .filter(b => b.text.trim())
      .map((b, idx) => `${idx + 1}/${blocks.filter(bl => bl.text.trim()).length} ${b.text}`)
      .join('\n\n');
    const blob = new Blob([threadText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-thread-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Thread downloaded', { duration: 2000 });
  };

  const applyTemplate = (template: string) => {
    const targetId = active ?? blocks[0]?.id;
    if (!targetId) return;
    const current = blocks.find(b => b.id === targetId)?.text ?? '';
    const next = current ? current + template : template;
    update(targetId, next);
    // Focus editor
    setTimeout(() => {
      editorRef?.commands.focus();
    }, 100);
  };

  const applyTransform = async (
    id: string,
    kind: 'improve' | 'extend' | 'short' | 'hook' | 'punchy' | 'clarify' | 'formal' | 'casual',
    editorOverride?: Editor
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

      // Get the correct editor for this block (prefer override, then preview, then main editor)
      const blockEditor =
        editorOverride ||
        previewEditorRefs.current[id] ||
        editorRefsById[id] ||
        (id === active ? editorRef : null);

      // Clear the editor content and start streaming
      if (blockEditor) {
        blockEditor.commands.clearContent();
        blockEditor.commands.focus();
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
          if (blockEditor) {
            // Detect line breaks in different formats
            if (chunk.includes('\\n')) {
              // Handle explicit \n markers
              const parts = chunk.split('\\n');
              parts.forEach((part, index) => {
                if (part) {
                  blockEditor.commands.insertContent(part);
                  // highlight each part
                  try {
                    if (part.trim().length > 0) {
                      const { state } = blockEditor;
                      const to = state.selection.to;
                      const from = Math.max(1, to - part.length);
                      blockEditor
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
                  blockEditor.commands.enter();
                }
              });
            } else if (shouldInsertLineBreak) {
              // Handle space after punctuation marks (likely line break)
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(blockEditor);
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else if (chunk.trim() === '' && chunk.length > 0) {
              // Handle empty chunks that represent line breaks
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(blockEditor);
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else {
              blockEditor.commands.insertContent(chunk);
            }
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
          if (blockEditor) {
            // (debugging removed)
            try {
              const html = textToHtmlWithParagraphs(processedFinalText);
              setContentSafely(blockEditor, html);
              highlightEntireDoc(blockEditor);

              // Update highlights state for preview editor
              const docSize = blockEditor.state.doc.content.size;
              setHighlightsById(prev => ({
                ...prev,
                [id]: [{ start: 1, end: Math.max(1, docSize) }],
              }));
            } catch {}
          }

          // Update the block with final text
          update(id, processedFinalText);
        },
        onError: (error: Error) => {
          // Remove the failed change
          setAiChanges(prev => prev.filter(c => c.id !== aiChange.id));

          // Restore original content on error
          if (blockEditor) {
            blockEditor.commands.setContent(base);
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

  // Handle external thread insertion (multiple tweets)
  useEffect(() => {
    // Create a stable key for comparison
    const currentThreadKey = externalThread ? JSON.stringify(externalThread) : '';

    // Only process if the content actually changed
    if (prevExternalThreadRef.current === currentThreadKey) return;
    prevExternalThreadRef.current = currentThreadKey;

    // Reset ref when thread is cleared
    if (!externalThread) {
      if (processedThreadRef.current !== '') {
        processedThreadRef.current = '';
      }
      isProcessingThreadRef.current = false;
      return;
    }

    if (busy || externalThread.length === 0 || isProcessingThreadRef.current) return;

    // Check if we've already processed this exact thread
    if (processedThreadRef.current === currentThreadKey) return;

    // Mark as processing to prevent concurrent executions
    isProcessingThreadRef.current = true;
    processedThreadRef.current = currentThreadKey;

    // Clear existing blocks and create new ones for the thread
    const newBlocks = externalThread.map(tweet => ({
      id: crypto.randomUUID(),
      text: tweet.trim(),
    }));

    setBlocks(newBlocks);

    // Set first block as active
    if (newBlocks.length > 0) {
      setActiveBlockId(newBlocks[0].id);
    }

    // Clear old editor refs since we're replacing all blocks
    setEditorRefsById({});
    setEditorRef(null);

    // Show success message
    toast.success('Thread applied', {
      description: `Applied ${externalThread.length} tweet${externalThread.length !== 1 ? 's' : ''} to composer.`,
      duration: 3000,
    });

    // Call onInserted after a small delay to ensure state updates are complete
    setTimeout(() => {
      isProcessingThreadRef.current = false;
      onInserted?.();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalThread, busy]);

  // Handle external insertions (e.g., from IdeasSidebar) without setting state during render
  useEffect(() => {
    // Only process if the content actually changed
    if (prevExternalInsertRef.current === externalInsert) return;
    prevExternalInsertRef.current = externalInsert;

    // Reset ref when insert is cleared
    if (!externalInsert) {
      if (processedInsertRef.current !== '') {
        processedInsertRef.current = '';
      }
      isProcessingInsertRef.current = false;
      return;
    }

    if (busy || externalThread || isProcessingInsertRef.current) return; // Don't handle if thread is being inserted

    // Check if we've already processed this exact insert
    if (processedInsertRef.current === externalInsert) return;

    // Mark as processing to prevent concurrent executions
    isProcessingInsertRef.current = true;
    processedInsertRef.current = externalInsert;

    // Use a function to get current blocks state to avoid dependency issues
    setBlocks(currentBlocks => {
      const currentActive = currentBlocks[0]?.id ?? null;
      const targetId = currentActive;
      if (!targetId) {
        isProcessingInsertRef.current = false;
        return currentBlocks;
      }

      const currentBlock = currentBlocks.find(b => b.id === targetId);
      if (!currentBlock) {
        isProcessingInsertRef.current = false;
        return currentBlocks;
      }

      // Replace the content instead of appending
      const next = externalInsert;

      // Replace all blocks with a single block containing the new content
      const updatedBlocks = [{ id: targetId, text: next }];

      // Clear all other state associated with removed blocks
      setAnalysisById({});
      setEditorRefsById(prev => {
        const next = { ...prev };
        // Keep only the target block's editor ref
        Object.keys(next).forEach(key => {
          if (key !== targetId) {
            delete next[key];
          }
        });
        return next;
      });
      setHighlightsById({});
      setSelectionById({});
      setAiChanges([]);
      setActiveBlockId(targetId);

      // Focus the editor after state update
      setTimeout(() => {
        const blockEditor = editorRefsById[targetId] || editorRef;
        if (blockEditor) {
          blockEditor.commands.focus();
          blockEditor.commands.setTextSelection(blockEditor.state.doc.content.size);
        }
        isProcessingInsertRef.current = false;
        onInserted?.();
      }, 50);

      return updatedBlocks;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalInsert, busy, externalThread]);

  const runAnalyzeBlock = async (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block || !block.text.trim() || busy) return;
    setBusy(true);
    setLoadingAction('analyze');
    try {
      const res = await analyzePost(block.text);
      setAnalysisById(prev => ({ ...prev, [id]: res }));
      toast.success('Analysis complete', {
        description: 'Your post has been analyzed successfully.',
        duration: 2000,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        toast.error('Usage limit reached', {
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
          duration: 5000,
        });
      } else {
        toast.error('Analysis failed', {
          description:
            error instanceof Error ? error.message : 'Please try again or check your connection.',
          duration: 3000,
        });
      }
      // Clear any partial analysis on error
      setAnalysisById(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setBusy(false);
      setLoadingAction(null);
    }
  };

  const applyTransformToSelection = async (
    id: string,
    kind: 'improve' | 'extend' | 'short' | 'hook' | 'punchy' | 'clarify' | 'formal' | 'casual',
    editorOverride?: Editor
  ) => {
    const block = blocks.find(b => b.id === id);

    // Get selection from editor if available, otherwise from state
    let sel = selectionById[id];
    if (editorOverride) {
      const { from, to } = editorOverride.state.selection;
      if (from !== to) {
        sel = { start: from, end: to };
      }
    } else {
      const previewEditor = previewEditorRefs.current[id];
      if (previewEditor) {
        const { from, to } = previewEditor.state.selection;
        if (from !== to) {
          sel = { start: from, end: to };
        }
      }
    }

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

      // Get the correct editor for this block (prefer override, then preview, then main editor)
      const blockEditor =
        editorOverride ||
        previewEditorRefs.current[id] ||
        editorRefsById[id] ||
        (id === active ? editorRef : null);

      // Delete the selected text and prepare for streaming
      if (blockEditor) {
        blockEditor.commands.deleteRange({ from: sel.start, to: sel.end });
        blockEditor.commands.focus();
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
          if (blockEditor) {
            // Detect line breaks in different formats
            if (chunk.includes('\\n')) {
              // Handle explicit \n markers
              const parts = chunk.split('\\n');
              parts.forEach((part, index) => {
                if (part) {
                  blockEditor.commands.insertContent(part);
                }
                if (index < parts.length - 1) {
                  blockEditor.commands.enter();
                }
              });
            } else if (shouldInsertLineBreak) {
              // Handle space after punctuation marks (likely line break)
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(blockEditor);
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else if (chunk.trim() === '' && chunk.length > 0) {
              // Handle empty chunks that represent line breaks
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              insertStreamLineBreak(blockEditor);
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);
            } else {
              // Regular content
              blockEditor.commands.insertContent(chunk);
              // Highlight the newly inserted range
              try {
                if (chunk.length > 0 && chunk.trim().length > 0) {
                  const { state } = blockEditor;
                  const to = state.selection.to;
                  const from = Math.max(1, to - chunk.length);
                  blockEditor
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
          if (blockEditor) {
            // (debugging removed)
            try {
              // Determine the streamed span by using caret and streamed length
              const streamedLength = streamedText.length;
              const caretEnd = blockEditor.state.selection.to;
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
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(true);
              blockEditor.commands.setTextSelection({ from: caretStart, to: caretEnd });
              blockEditor.commands.insertContent(html);
              (
                blockEditor as unknown as { setContentSettingFlag?: (s: boolean) => void }
              ).setContentSettingFlag?.(false);

              // Highlight the newly inserted sanitized span
              const newEndSel = blockEditor.state.selection.to;
              const newStartSel = Math.max(1, newEndSel - processedFinalText.length);
              applyHighlightRange(blockEditor, newStartSel, newEndSel);

              // Update highlights state for preview editor
              setHighlightsById(prev => ({
                ...prev,
                [id]: [{ start: newStartSel, end: newEndSel }],
              }));
            } catch {}
          }

          // Update the block with final text
          update(id, newText);
        },
        onError: (error: Error) => {
          // Remove the failed change
          setAiChanges(prev => prev.filter(c => c.id !== aiChange.id));

          // Restore original content on error
          if (blockEditor) {
            blockEditor.commands.setContent(block.text);
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
    <div className="flex w-full flex-col">
      {/* Top Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-[#0e0e0e] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ContentTemplates onSelect={applyTemplate} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={copyThread}
            className="h-8 text-xs text-white/60 hover:text-white"
            disabled={!blocks.some(b => b.text.trim())}
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="ml-1.5">Copy</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadThread}
            className="h-8 text-xs text-white/60 hover:text-white"
            disabled={!blocks.some(b => b.text.trim())}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1.5">Download</span>
          </Button>
        </div>
      </div>

      {/* Preview Row - Always visible */}
      <div className="mb-4">
        <ThreadPreview
          blocks={blocks}
          activeBlockId={active}
          busy={busy}
          loadingAction={loadingAction}
          highlightsById={highlightsById}
          aiChanges={aiChanges}
          analysisById={analysisById}
          onAddBlock={addBlock}
          onRemoveBlock={removeBlock}
          onBlockChangesUpdate={(blockId, changes) => {
            setAiChanges(changes);
          }}
          onBlockRevertChange={(blockId, change, newText, highlights) => {
            // Update the block text
            update(blockId, newText);

            // Get the correct editor for this block (prefer preview editor)
            const blockEditor =
              previewEditorRefs.current[blockId] ||
              editorRefsById[blockId] ||
              (blockId === active ? editorRef : null);

            // Update the editor content
            if (blockEditor) {
              blockEditor.commands.setContent(newText);
              // Remove all highlights when reverting
              blockEditor.commands.unsetHighlight();
            }

            // Update highlights for this block
            setHighlightsById(prev => ({
              ...prev,
              [blockId]: highlights,
            }));
          }}
          onBlockClick={blockId => {
            // Set as active block
            setActiveBlockId(blockId);

            // Find the block index
            const blockIndex = blocks.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return;

            // Get the editor for this block
            const blockEditor = editorRefsById[blockId] || (blockId === active ? editorRef : null);

            // Focus the editor
            if (blockEditor) {
              blockEditor.commands.focus();
              // Scroll the editor into view
              const editorElement = blockEditor.view.dom as HTMLElement;
              if (editorElement) {
                editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } else {
              // If editor not ready, scroll to the block container
              setTimeout(() => {
                const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
                if (blockElement) {
                  blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Try to focus the editor after scroll
                  setTimeout(() => {
                    const editor = editorRefsById[blockId];
                    if (editor) {
                      editor.commands.focus();
                    }
                  }, 200);
                }
              }, 100);
            }
          }}
          onBlockUpdate={(blockId, text) => {
            // Update the block text
            update(blockId, text);

            // Update the editor content if it exists (in the main editor area)
            const blockEditor = editorRefsById[blockId] || (blockId === active ? editorRef : null);
            if (blockEditor) {
              blockEditor.commands.setContent(text);
            }
          }}
          onBlockAnalyze={blockId => {
            runAnalyzeBlock(blockId);
          }}
          onBlockSelectionChange={(blockId, start, end) => {
            setSelectionById(prev => ({ ...prev, [blockId]: { start, end } }));
          }}
          onBlockSlashCommand={(blockId, command, editor) => {
            const cmd = command as
              | 'improve'
              | 'extend'
              | 'short'
              | 'hook'
              | 'punchy'
              | 'clarify'
              | 'formal'
              | 'casual';
            // Store preview editor ref if provided
            if (editor) {
              previewEditorRefs.current[blockId] = editor;
            }
            applyTransform(blockId, cmd, editor);
          }}
          onBlockAiAction={(blockId, kind, editor) => {
            const actionKind = kind as
              | 'improve'
              | 'extend'
              | 'short'
              | 'hook'
              | 'punchy'
              | 'clarify'
              | 'formal'
              | 'casual';
            // Store preview editor ref if provided
            if (editor) {
              previewEditorRefs.current[blockId] = editor;
            }
            applyTransformToSelection(blockId, actionKind, editor);
          }}
        />
      </div>

      {/* Analysis and Suggestions - shown below preview */}
    </div>
  );
}
