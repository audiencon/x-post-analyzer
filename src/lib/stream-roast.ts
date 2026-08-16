export async function streamRoastText(
  content: string,
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch('/api/stream-roast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || 'Could not stream the roast.');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No roast stream.');
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
