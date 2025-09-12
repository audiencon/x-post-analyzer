'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Suggestion } from '@/actions/suggestions';
import { assistantChat, type ChatHistoryMessage } from '@/actions/assistant';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { MAX_REQUESTS } from '@/config/constants';

interface StudioSidebarProps {
  onInsert: (text: string) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type ChatMessage =
  | { id?: string; role: 'user'; content: string }
  | { id?: string; role: 'assistant'; content: string; suggestions?: Suggestion[] };

export function StudioSidebar({ onInsert }: StudioSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const streamingRef = useRef(false);
  const assistantIdRef = useRef<string | null>(null);

  const examples = [
    'Suggest a tweet about building in public as an indie hacker',
    'Draft 2 tweets on marketing strategies for indie projects',
    'Create a thread about shipping fast and iterating quickly',
    'Tweet about coding tips for indie developers working on side projects',
  ];

  const ask = async (query: string) => {
    if (!query.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);
    // Insert a placeholder assistant message we will stream into
    const id = generateId();
    assistantIdRef.current = id;
    setMessages(prev => [...prev, { id, role: 'assistant', content: '' }]);
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
        streamIntoAssistant(plan.slice(i, Math.min(plan.length, i + step)));
        await new Promise(res => setTimeout(res, 20));
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Usage limit reached (${MAX_REQUESTS} requests per hour)` },
      ]);
    } finally {
      streamingRef.current = false;
      setLoading(false);
    }
  };

  const submit = () => {
    const val = inputRef.current?.value?.trim();
    if (!val) return;
    ask(val);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Auto scroll to bottom on new messages/loading
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="sticky top-4 flex h-[90vh] flex-col justify-between rounded-lg border border-white/10 bg-[#0b0b0b] p-3">
      <div className="flex-1 overflow-hidden">
        <div className="mb-3 border-b border-gray-100/20 py-3 text-base font-medium text-white">
          Assistant
        </div>
        <ScrollArea className="h-[75vh] overflow-y-auto pr-1">
          <div className="mb-3 space-y-2">
            <div className="mb-3 text-xs font-medium text-white">Examples</div>
            {examples.map(example => (
              <button
                key={example}
                onClick={() => ask(example)}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="pr-1">
            {messages.map((m, idx) => (
              <div key={idx} className="mb-3">
                <div className="mb-1 text-xs text-white/40">
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div
                  className={cn(
                    'rounded-md border border-white/10 bg-[#111] p-2 text-sm whitespace-pre-wrap text-white/90',
                    m.role === 'assistant' && 'bg-emerald-500/10'
                  )}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && !loading && (
                  <div className="mt-2">
                    <Button
                      key={idx}
                      size="sm"
                      variant="ghost"
                      onClick={() => onInsert(m.content)}
                      className="h-8 text-xs tracking-tighter"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mb-3 flex items-center gap-2 text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </div>

      <div>
        <label className="mb-2 block text-sm text-white/60">Tweet about…</label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to write about?"
            className="flex-1 rounded-md border border-white/10 bg-[#111] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter') submit();
            }}
          />
          <Button size="icon" variant="secondary" onClick={submit}>
            ↵
          </Button>
        </div>
      </div>
    </div>
  );
}
