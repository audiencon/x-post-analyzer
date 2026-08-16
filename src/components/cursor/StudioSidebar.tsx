'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Suggestion } from '@/actions/suggestions';
import type { CritiqueHistoryMessage } from '@/lib/critique';
import { streamCritiqueText } from '@/lib/stream-critique';
import { cn } from '@/lib/utils';
import { InspirationDialog } from '@/components/inspiration/InspirationDialog';
import { Textarea } from '@/components/ui/textarea';
import { parseThread, isThread } from '@/lib/thread-parser';
import { extractPostFromNote } from '@/lib/editor-helpers';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AnimatePresence } from 'framer-motion';
import { InkScore } from '@/components/tool/ink-score';
import { FlagList } from '@/components/analyze/desk-flags';
import type { DraftDesk } from '@/lib/x-monetization';

interface StudioSidebarProps {
  onInsert: (text: string) => void;
  onInsertThread?: (tweets: string[]) => void;
  draftText?: string;
  roast?: string;
  scores?: {
    engagement: number;
    friendliness: number;
    virality: number;
  };
  desk?: DraftDesk;
  goal?: string;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type ChatMessage =
  | { id?: string; role: 'user'; content: string; timestamp?: number }
  | {
      id?: string;
      role: 'assistant';
      content: string;
      suggestions?: Suggestion[];
      timestamp?: number;
    };

const markdownComponents: Components = {
  p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  a: ({ ...props }) => (
    <a
      className="text-[oklch(0.72_0.16_28)] underline decoration-white/20 hover:text-[oklch(0.8_0.16_28)]"
      {...props}
    />
  ),
  ul: ({ ...props }) => <ul className="mb-2 ml-4 list-disc space-y-1" {...props} />,
  ol: ({ ...props }) => <ol className="mb-2 ml-4 list-decimal space-y-1" {...props} />,
  li: ({ ...props }) => <li className="" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ ...props }) => <em className="italic" {...props} />,
  code: ({ ...props }) => (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs" {...props} />
  ),
  pre: ({ ...props }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-white/5 p-2 text-xs" {...props} />
  ),
  h1: ({ ...props }) => <h1 className="mb-2 text-lg font-bold" {...props} />,
  h2: ({ ...props }) => <h2 className="mb-2 text-base font-bold" {...props} />,
  h3: ({ ...props }) => <h3 className="mb-1 text-sm font-semibold" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote className="my-2 border-l-2 border-white/20 pl-3 italic" {...props} />
  ),
};

export function StudioSidebar({
  onInsert,
  onInsertThread,
  draftText,
  roast,
  scores,
  desk,
  goal,
}: StudioSidebarProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const streamingRef = useRef(false);
  const assistantIdRef = useRef<string | null>(null);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const examples = [
    {
      text: 'Roast this draft like a reply guy who actually writes',
    },
    {
      text: 'Give me two openings that would stop the scroll',
    },
    {
      text: 'Turn this into a three-post thread with a closer',
    },
    {
      text: 'Cut the fluff. Keep the line I would actually post',
    },
  ];

  const handleInspirationSelect = (text: string) => {
    onInsert(extractPostFromNote(text));
  };

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard', { duration: 2000 });
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    toast.success('Conversation cleared', { duration: 2000 });
  }, []);

  const writeAssistant = useCallback((content: string) => {
    setMessages(prev => {
      const next = [...prev];
      const i = next.findIndex(m => m.id === assistantIdRef.current);
      if (i >= 0 && next[i]?.role === 'assistant') {
        next[i] = { ...next[i], content } as ChatMessage;
      }
      return next;
    });
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ block: 'end' });
    });
  }, []);

  const runCritique = useCallback(
    async (query: string, history: CritiqueHistoryMessage[]) => {
      if (!query.trim() || streamingRef.current) return;

      const id = generateId();
      assistantIdRef.current = id;
      setMessages(prev => [...prev, { id, role: 'assistant', content: '', timestamp: Date.now() }]);
      setLoading(true);
      streamingRef.current = true;

      try {
        await streamCritiqueText({ message: query, draftText, history }, writeAssistant);
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message.toLowerCase().includes('limit reached')
            ? error.message
            : 'Failed to get response. Please try again.';
        writeAssistant(errorMessage);
      } finally {
        streamingRef.current = false;
        setLoading(false);
        setIsRegenerating(false);
      }
    },
    [draftText, writeAssistant]
  );

  const regenerateLastResponse = useCallback(async () => {
    if (messages.length === 0 || loading || streamingRef.current) return;

    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;

    const query = messages[lastUserMessageIndex].content;
    const history: CritiqueHistoryMessage[] = messages
      .slice(0, lastUserMessageIndex + 1)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => prev.slice(0, lastUserMessageIndex + 1));
    setIsRegenerating(true);
    await runCritique(query, history);
  }, [loading, messages, runCritique]);

  const ask = async (query: string) => {
    if (!query.trim() || loading || streamingRef.current) return;
    const history: CritiqueHistoryMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    setMessages(prev => [...prev, { role: 'user', content: query, timestamp: Date.now() }]);
    await runCritique(query, history);
  };

  const submit = useCallback(() => {
    const val = inputRef.current?.value?.trim() || inputValue.trim();
    if (!val || loading || streamingRef.current) return;

    const history: CritiqueHistoryMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    setMessages(prev => [...prev, { role: 'user', content: val, timestamp: Date.now() }]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';
    }
    void runCritique(val, history);
  }, [inputValue, loading, messages, runCritique]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  };

  // Auto scroll to bottom on new messages/loading
  const prevMessagesLengthRef = useRef(messages.length);
  const prevLoadingRef = useRef(loading);
  useEffect(() => {
    // Scroll when:
    // 1. A new message was added
    // 2. Loading state changes (starts generating)
    // 3. Assistant message content is being updated (streaming)
    const shouldScroll =
      messages.length > prevMessagesLengthRef.current ||
      (!prevLoadingRef.current && loading) ||
      (loading && messages.some(m => m.role === 'assistant' && m.content));

    if (shouldScroll) {
      const timeout = setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        } else if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 50);
      prevMessagesLengthRef.current = messages.length;
      prevLoadingRef.current = loading;
      return () => clearTimeout(timeout);
    }
    prevMessagesLengthRef.current = messages.length;
    prevLoadingRef.current = loading;
  }, [messages, loading]);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasDraft = Boolean(draftText?.trim());

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="flex items-baseline justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">Critique</p>
          <p className="mt-1 text-xs text-white/40">The red pen. Not a chat.</p>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              clearConversation();
            }}
            className="text-xs text-white/35 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>

      {roast || scores || desk ? (
        <div className="border-y border-white/8 px-5 py-6">
          {goal ? (
            <p className="mb-3 text-[11px] tracking-[0.16em] text-white/30 uppercase">{goal}</p>
          ) : null}
          {roast ? (
            <p className="font-heading text-xl leading-snug text-[oklch(0.82_0.1_28)]">“{roast}”</p>
          ) : null}
          {scores ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InkScore
                label="Engage"
                value={scores.engagement}
                sting={scores.engagement < 55}
                compact
              />
              <InkScore
                label="Warmth"
                value={scores.friendliness}
                sting={scores.friendliness < 55}
                compact
              />
              <InkScore
                label="Viral"
                value={scores.virality}
                sting={scores.virality < 55}
                compact
              />
              {desk ? (
                <InkScore label="Payout" value={desk.payout} sting={desk.payout < 55} compact />
              ) : null}
            </div>
          ) : desk ? (
            <div className="mt-6">
              <InkScore label="Payout" value={desk.payout} sting={desk.payout < 55} compact />
            </div>
          ) : null}
          {desk?.verdict ? (
            <p className="mt-5 text-sm leading-6 text-white/50">{desk.verdict}</p>
          ) : null}
          {desk?.flags?.length ? <FlagList flags={desk.flags} /> : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 py-4" data-scroll-container>
          {messages.length === 0 && (
            <div className="mb-2">
              {hasDraft ? (
                <p className="font-heading text-[1.05rem] leading-snug text-white/45">
                  {draftText && draftText.length > 110 ? `${draftText.slice(0, 110)}…` : draftText}
                </p>
              ) : (
                <p className="font-heading text-xl leading-snug text-white/28">
                  Write the line first.
                </p>
              )}
              <p className="mt-5 mb-3 text-[11px] tracking-[0.16em] text-white/30 uppercase">
                Ask for
              </p>
              <div className="space-y-1">
                {examples.map(example => (
                  <button
                    key={example.text}
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      ask(example.text);
                    }}
                    disabled={loading}
                    className="w-full py-2 text-left text-sm text-white/50 hover:text-white disabled:opacity-40"
                  >
                    {example.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence>
            {messages.map((m, idx) => {
              const isLastAssistant = idx === messages.length - 1 && m.role === 'assistant';
              return (
                <div
                  key={m.id || `msg-${idx}`}
                  className={cn(
                    'group mb-6',
                    m.role === 'assistant' && 'border-l border-white/10 pl-3'
                  )}
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="text-[11px] tracking-[0.16em] text-white/30 uppercase">
                      {m.role === 'user' ? 'You' : 'Note'}
                    </p>
                    {m.timestamp ? (
                      <span className="text-[10px] text-white/25">{formatTime(m.timestamp)}</span>
                    ) : null}
                  </div>
                  <div className="relative text-sm leading-relaxed text-[oklch(0.9_0.015_80)]">
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown components={markdownComponents}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-white/70">{m.content}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/35 opacity-0 transition-opacity group-hover:opacity-100">
                      {m.content ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyMessage(m.content);
                          }}
                        >
                          Copy
                        </button>
                      ) : null}
                      {isLastAssistant && !loading ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            regenerateLastResponse();
                          }}
                          disabled={isRegenerating}
                        >
                          {isRegenerating ? 'Again…' : 'Again'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {m.role === 'assistant' && !loading && m.content ? (
                    <div className="mt-3">
                      {isThread(m.content) && onInsertThread ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onInsertThread(parseThread(m.content));
                          }}
                          className="text-sm text-[oklch(0.72_0.16_28)] hover:text-[oklch(0.8_0.16_28)]"
                        >
                          Use {parseThread(m.content).length} posts
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onInsert(extractPostFromNote(m.content));
                          }}
                          className="text-sm text-[oklch(0.72_0.16_28)] hover:text-[oklch(0.8_0.16_28)]"
                        >
                          Use this
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </AnimatePresence>
          {loading ? (
            <p className="mb-4 text-xs tracking-wide text-white/40">Reading the draft…</p>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-white/8 px-5 py-4">
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-[11px] tracking-[0.16em] text-white/35 uppercase">Ask</label>
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowInspiration(true);
            }}
            className="text-xs text-white/35 hover:text-white"
          >
            Library
          </button>
        </div>
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={
              hasDraft ? 'Cut this. Open harder. Make it postable.' : 'What should this draft do?'
            }
            className="max-h-[140px] min-h-[88px] resize-none rounded-none border-white/10 bg-transparent pr-16 text-sm leading-relaxed text-[oklch(0.93_0.015_80)] placeholder:text-white/28 focus-visible:ring-0"
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Critique note"
            rows={3}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {inputValue.length > 0 ? (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInputValue('');
                  if (inputRef.current) {
                    inputRef.current.value = '';
                    inputRef.current.style.height = 'auto';
                    inputRef.current.focus();
                  }
                }}
                className="text-xs text-white/30 hover:text-white"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                submit();
              }}
              disabled={loading || !inputValue.trim()}
              className="text-sm text-[oklch(0.72_0.16_28)] hover:text-[oklch(0.8_0.16_28)] disabled:opacity-30"
            >
              {loading ? '…' : 'Send'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-white/25">Enter to send · Shift+Enter for a line</p>
      </div>

      <InspirationDialog
        open={showInspiration}
        onClose={() => setShowInspiration(false)}
        onExampleSelect={handleInspirationSelect}
        initialNiche="Creator"
      />
    </div>
  );
}
