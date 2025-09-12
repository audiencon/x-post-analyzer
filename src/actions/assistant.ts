'use server';

import OpenAI from 'openai';
import { DEFAULT_MODEL } from '@/config/openai';
import { assistantPrompt, avoidPrompt, type PayloadTweet } from '@/config/prompt';
import { MAX_REQUESTS, WINDOW_MS } from '@/config/constants';

type UsageBucket = { count: number; windowStart: number };
const globalBuckets = global as unknown as { __assistant_usage__?: UsageBucket };

export type ChatHistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function assistantChat(
  userMessage: string,
  editorContent?: string,
  history: ChatHistoryMessage[] = []
): Promise<string> {
  if (!globalBuckets.__assistant_usage__) {
    globalBuckets.__assistant_usage__ = { count: 0, windowStart: Date.now() };
  }
  const usage = globalBuckets.__assistant_usage__!;
  const now = Date.now();
  if (now - usage.windowStart > WINDOW_MS) {
    usage.count = 0;
    usage.windowStart = now;
  }
  if (usage.count >= MAX_REQUESTS) {
    throw new Error(`Usage limit reached (${MAX_REQUESTS} requests per hour)`);
  }
  usage.count += 1;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY on the server.');
  }

  const openai = new OpenAI({ apiKey });

  // Build assistant system prompt using current editor content (if any)
  const tweets: PayloadTweet[] = [];
  if (editorContent && editorContent.trim()) {
    tweets.push({ content: editorContent.trim(), index: 0 });
  }
  const sys = assistantPrompt({ tweets });
  const avoid = avoidPrompt();

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: sys },
    { role: 'system', content: `<guardrails>${avoid}</guardrails>` },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.7,
    messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  });

  return completion.choices[0]?.message?.content ?? '';
}
