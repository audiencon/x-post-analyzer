'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Lightbulb,
  Copy,
  Trash2,
  RefreshCw,
  Sparkles,
  User,
  Bot,
  X,
} from 'lucide-react';
import type { Suggestion } from '@/actions/suggestions';
import { assistantChat, type ChatHistoryMessage } from '@/actions/assistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MAX_REQUESTS } from '@/config/constants';
import { InspirationDialog } from '@/components/inspiration/InspirationDialog';
import { Textarea } from '@/components/ui/textarea';
import { parseThread, isThread } from '@/lib/thread-parser';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface StudioSidebarProps {
  onInsert: (text: string) => void;
  onInsertThread?: (tweets: string[]) => void;
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
    <a className="text-[#1d9bf0] underline hover:text-[#1d9bf0]/80" {...props} />
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

export function StudioSidebar({ onInsert, onInsertThread }: StudioSidebarProps) {
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
      icon: '',
      text: 'Suggest a tweet about building in public as an indie hacker',
      category: 'Creator',
    },
    {
      icon: '',
      text: 'Draft 2 tweets on marketing strategies for indie projects',
      category: 'Marketing',
    },
    {
      icon: '',
      text: 'Create a thread about shipping fast and iterating quickly',
      category: 'Tech',
    },
    {
      icon: '',
      text: 'Tweet about coding tips for indie developers working on side projects',
      category: 'Tech',
    },
  ];

  // Available niches for inspiration
  const availableNiches = [
    'Tech',
    'Marketing',
    'SaaS',
    'Creator',
    'Writing',
    'E-commerce',
    'Finance',
    'General',
  ] as const;

  const handleInspirationSelect = (text: string) => {
    const prompt = 'Create a draft tweet inspired by the post below.\n\n' + text;
    setInputValue(prompt);
    if (inputRef.current) {
      inputRef.current.value = prompt;
      inputRef.current.focus();
      // Auto-resize textarea
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard', { duration: 2000 });
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    toast.success('Conversation cleared', { duration: 2000 });
  }, []);

  const regenerateLastResponse = useCallback(async () => {
    if (messages.length === 0 || loading || streamingRef.current) return;

    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];
    const query = lastUserMessage.content;

    // Remove all messages after the last user message
    setMessages(prev => prev.slice(0, lastUserMessageIndex + 1));

    setIsRegenerating(true);
    setLoading(true);
    const id = generateId();
    assistantIdRef.current = id;
    setMessages(prev => [...prev, { id, role: 'assistant', content: '', timestamp: Date.now() }]);
    streamingRef.current = true;

    const streamIntoAssistant = (chunk: string) => {
      setMessages(prev => {
        const next = [...prev];
        const i = next.findIndex(m => m.id === assistantIdRef.current);
        if (i >= 0 && next[i]?.role === 'assistant') {
          const current = next[i] as ChatMessage;
          next[i] = { ...current, content: (current.content || '') + chunk } as ChatMessage;
        }
        return next;
      });
      // Auto-scroll to bottom while streaming
      requestAnimationFrame(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        } else if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    };

    try {
      const history: ChatHistoryMessage[] = messages.slice(0, lastUserMessageIndex + 1).map(m => ({
        role: m.role,
        content: m.content,
      }));
      const plan = await assistantChat(query, undefined, history);

      const step = Math.max(4, Math.floor(plan.length / 80));
      for (let i = 0; i < plan.length; i += step) {
        if (!streamingRef.current) break;
        streamIntoAssistant(plan.slice(i, Math.min(plan.length, i + step)));
        await new Promise(res => setTimeout(res, 20));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.includes('Usage limit reached')
          ? `Usage limit reached (${MAX_REQUESTS} requests per hour)`
          : 'Failed to get response. Please try again.';

      setMessages(prev => {
        const next = [...prev];
        const i = next.findIndex(m => m.id === assistantIdRef.current);
        if (i >= 0 && next[i]?.role === 'assistant') {
          next[i] = { ...next[i], content: errorMessage } as ChatMessage;
        }
        return next;
      });
    } finally {
      streamingRef.current = false;
      setLoading(false);
      setIsRegenerating(false);
    }
  }, [messages, loading]);

  const ask = async (query: string, isRegenerate = false) => {
    if (!query.trim() || loading || streamingRef.current) return;

    if (!isRegenerate) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: query,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMessage]);
    }
    setLoading(true);

    // Insert a placeholder assistant message we will stream into
    const id = generateId();
    assistantIdRef.current = id;
    setMessages(prev => [...prev, { id, role: 'assistant', content: '', timestamp: Date.now() }]);
    streamingRef.current = true;

    const streamIntoAssistant = (chunk: string) => {
      setMessages(prev => {
        const next = [...prev];
        const i = next.findIndex(m => m.id === assistantIdRef.current);
        if (i >= 0 && next[i]?.role === 'assistant') {
          const current = next[i] as ChatMessage;
          next[i] = { ...current, content: (current.content || '') + chunk } as ChatMessage;
        }
        return next;
      });
      // Auto-scroll to bottom while streaming
      requestAnimationFrame(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        } else if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    };

    try {
      // Build compact history (without ids)
      const history: ChatHistoryMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      // Fetch the assistant plan first with history for natural context
      const plan = await assistantChat(query, undefined, history);

      // Stream the plan text chunk-by-chunk for a typing effect
      const step = Math.max(4, Math.floor(plan.length / 80));
      for (let i = 0; i < plan.length; i += step) {
        if (!streamingRef.current) break; // Allow cancellation
        streamIntoAssistant(plan.slice(i, Math.min(plan.length, i + step)));
        await new Promise(res => setTimeout(res, 20));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.includes('Usage limit reached')
          ? `Usage limit reached (${MAX_REQUESTS} requests per hour)`
          : 'Failed to get response. Please try again.';

      setMessages(prev => {
        const next = [...prev];
        const i = next.findIndex(m => m.id === assistantIdRef.current);
        if (i >= 0 && next[i]?.role === 'assistant') {
          next[i] = { ...next[i], content: errorMessage } as ChatMessage;
        }
        return next;
      });
    } finally {
      streamingRef.current = false;
      setLoading(false);
    }
  };

  const submit = useCallback(() => {
    const val = inputRef.current?.value?.trim() || inputValue.trim();
    if (!val || loading || streamingRef.current) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: val,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';
    }

    setLoading(true);
    const id = generateId();
    assistantIdRef.current = id;
    setMessages(prev => [...prev, { id, role: 'assistant', content: '', timestamp: Date.now() }]);
    streamingRef.current = true;

    const streamIntoAssistant = (chunk: string) => {
      setMessages(prev => {
        const next = [...prev];
        const i = next.findIndex(m => m.id === assistantIdRef.current);
        if (i >= 0 && next[i]?.role === 'assistant') {
          const current = next[i] as ChatMessage;
          next[i] = { ...current, content: (current.content || '') + chunk } as ChatMessage;
        }
        return next;
      });
      // Auto-scroll to bottom while streaming
      requestAnimationFrame(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        } else if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    };

    (async () => {
      try {
        const history: ChatHistoryMessage[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        }));
        const plan = await assistantChat(val, undefined, history);

        const step = Math.max(4, Math.floor(plan.length / 80));
        for (let i = 0; i < plan.length; i += step) {
          if (!streamingRef.current) break;
          streamIntoAssistant(plan.slice(i, Math.min(plan.length, i + step)));
          await new Promise(res => setTimeout(res, 20));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message.includes('Usage limit reached')
            ? `Usage limit reached (${MAX_REQUESTS} requests per hour)`
            : 'Failed to get response. Please try again.';

        setMessages(prev => {
          const next = [...prev];
          const i = next.findIndex(m => m.id === assistantIdRef.current);
          if (i >= 0 && next[i]?.role === 'assistant') {
            next[i] = { ...next[i], content: errorMessage } as ChatMessage;
          }
          return next;
        });
      } finally {
        streamingRef.current = false;
        setLoading(false);
      }
    })();
  }, [inputValue, loading, messages]);

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

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current && messages.length === 0) {
      inputRef.current.focus();
    }
  }, [messages.length]);

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

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-white/10 bg-[#0b0b0b] shadow-lg lg:sticky lg:top-4 lg:h-[calc(100vh-80px-57px-32px)] lg:max-h-[800px]">
      {/* Fixed header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
            <p className="text-[10px] text-white/50">Get suggestions and draft content</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              clearConversation();
            }}
            className="h-7 w-7 p-0 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full overflow-y-auto">
          <div className="px-4 py-3" data-scroll-container>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 space-y-2"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-white/60" />
                  <div className="text-xs font-medium text-white/70">Quick Examples</div>
                </div>
                {examples.map((example, idx) => (
                  <motion.button
                    key={example.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      ask(example.text);
                    }}
                    disabled={loading}
                    className="group w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-left text-sm text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base">{example.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">{example.text}</div>
                        <div className="mt-0.5 text-[10px] text-white/40">{example.category}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
            <AnimatePresence>
              {messages.map((m, idx) => {
                const isLastAssistant = idx === messages.length - 1 && m.role === 'assistant';
                return (
                  <motion.div
                    key={m.id || `msg-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="group mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/10">
                        <AvatarFallback
                          className={cn(
                            'text-xs',
                            m.role === 'user'
                              ? 'bg-[#1d9bf0] text-white'
                              : 'bg-linear-to-br from-gray-800 to-black text-white'
                          )}
                        >
                          {m.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <span className="text-sm">𝕏</span>
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {m.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          {m.timestamp && (
                            <span className="text-[10px] text-white/40">
                              {formatTime(m.timestamp)}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            'relative rounded-lg border p-3 text-sm text-white/90',
                            m.role === 'user'
                              ? 'border-white/10 bg-[#111]'
                              : 'border-emerald-500/20 bg-emerald-500/10'
                          )}
                        >
                          {m.role === 'assistant' ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown components={markdownComponents}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap">{m.content}</div>
                          )}
                          {/* Action buttons - show on hover */}
                          <div className="absolute top-2 -right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {m.role === 'assistant' && m.content && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    copyMessage(m.content);
                                  }}
                                  className="h-6 w-6 p-0 text-white/60 hover:bg-white/10 hover:text-white"
                                  aria-label="Copy message"
                                  title="Copy"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                {isLastAssistant && !loading && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      regenerateLastResponse();
                                    }}
                                    disabled={isRegenerating}
                                    className="h-6 w-6 p-0 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
                                    aria-label="Regenerate response"
                                    title="Regenerate"
                                  >
                                    <RefreshCw
                                      className={cn('h-3 w-3', isRegenerating && 'animate-spin')}
                                    />
                                  </Button>
                                )}
                              </>
                            )}
                            {m.role === 'user' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  copyMessage(m.content);
                                }}
                                className="h-6 w-6 p-0 text-white/60 hover:bg-white/10 hover:text-white"
                                aria-label="Copy message"
                                title="Copy"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {m.role === 'assistant' && !loading && m.content && (
                          <div className="mt-2 flex items-center gap-2">
                            {isThread(m.content) && onInsertThread ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const tweets = parseThread(m.content);
                                  onInsertThread(tweets);
                                }}
                                className="h-8 gap-1.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-xs font-medium text-white shadow-sm hover:from-emerald-500 hover:to-emerald-400"
                                aria-label="Apply thread to composer"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Apply Thread ({parseThread(m.content).length} tweets)
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onInsert(m.content);
                                }}
                                className="h-8 gap-1.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-xs font-medium text-white shadow-sm hover:from-emerald-500 hover:to-emerald-400"
                                aria-label="Apply this suggestion to the editor"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Apply to Editor
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 flex items-center gap-3"
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/10">
                  <AvatarFallback className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span className="text-xs text-white/80">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Fixed bottom input area */}
      <div className="border-t border-white/10 bg-[#0b0b0b] px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-white/70">Ask AI Assistant</label>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowInspiration(true);
              }}
              className="h-7 px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
            >
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              Inspiration
            </Button>
          </div>
        </div>
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="What do you want to write about? (Press Enter to send, Shift+Enter for new line)"
            className="max-h-[120px] min-h-[44px] resize-none border-white/20 bg-[#111] pr-12 text-sm text-white placeholder:text-white/40 focus:border-[#1d9bf0]/50 focus:ring-[#1d9bf0]/20"
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Chat input"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {inputValue.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
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
                className="h-6 w-6 p-0 text-white/40 hover:bg-white/10 hover:text-white"
                aria-label="Clear input"
                title="Clear (Esc)"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                submit();
              }}
              disabled={loading || !inputValue.trim()}
              className="h-7 w-7 bg-linear-to-r from-[#1d9bf0] to-[#1d9bf0]/80 p-0 text-white shadow-sm hover:from-[#1d9bf0]/90 hover:to-[#1d9bf0]/70 disabled:opacity-50"
              aria-label="Send message"
              title="Send (Enter)"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowLeft className="h-3.5 w-3.5 -rotate-45" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {inputValue.length > 0 && (
            <span className={cn(inputValue.length > 500 && 'text-orange-400')}>
              {inputValue.length} characters
            </span>
          )}
        </div>
      </div>

      <InspirationDialog
        open={showInspiration}
        onClose={() => setShowInspiration(false)}
        onExampleSelect={handleInspirationSelect}
        initialNiche="Creator"
        initialGoal=""
        niches={availableNiches}
      />
    </div>
  );
}
