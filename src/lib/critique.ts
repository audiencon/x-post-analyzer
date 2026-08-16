import { assistantPrompt, avoidPrompt, type PayloadTweet } from '@/config/prompt';

export type CritiqueHistoryMessage = { role: 'user' | 'assistant'; content: string };

export function critiqueSystemPrompt(editorContent?: string) {
  const tweets: PayloadTweet[] = [];
  if (editorContent?.trim()) {
    tweets.push({ content: editorContent.trim(), index: 0 });
  }
  return `${assistantPrompt({ tweets })}\n\n<guardrails>${avoidPrompt()}</guardrails>`;
}

export function asCritiqueHistory(value: unknown): CritiqueHistoryMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const role = 'role' in item ? item.role : null;
    const content = 'content' in item ? item.content : null;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return [];
    if (!content.trim()) return [];
    return [{ role, content }];
  });
}
