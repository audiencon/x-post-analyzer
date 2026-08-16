import type { CritiqueHistoryMessage } from '@/lib/critique';

export async function streamCritiqueText(
  input: {
    message: string;
    draftText?: string;
    history?: CritiqueHistoryMessage[];
  },
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch('/api/stream-critique', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || 'Could not stream the critique.');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No critique stream.');
  }

  const decoder = new TextDecoder();
  let full = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      if (full) onChunk(full);
    }
    full += decoder.decode();
    if (full) onChunk(full);
  } catch (error) {
    if (full) return full;
    throw error;
  }

  return full;
}
