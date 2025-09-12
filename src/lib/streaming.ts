export interface StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export class AIStream {
  private controller: AbortController;
  private fullText: string = '';
  private isStreaming: boolean = false;

  constructor(private options: StreamOptions = {}) {
    this.controller = new AbortController();
  }

  async streamResponse(prompt: string, apiKey?: string): Promise<string> {
    this.isStreaming = true;
    this.fullText = '';

    try {
      const response = await fetch('/api/stream-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          apiKey,
        }),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              this.isStreaming = false;
              this.options.onComplete?.(this.fullText);
              return this.fullText;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                this.fullText += parsed.content;
                this.options.onChunk?.(parsed.content);
              }
            } catch {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }

      this.isStreaming = false;
      this.options.onComplete?.(this.fullText);
      return this.fullText;
    } catch (error) {
      this.isStreaming = false;
      const err = error instanceof Error ? error : new Error('Streaming failed');
      this.options.onError?.(err);
      throw err;
    }
  }

  abort() {
    this.controller.abort();
    this.isStreaming = false;
  }

  get isActive() {
    return this.isStreaming;
  }

  get currentText() {
    return this.fullText;
  }
}

export const createStream = (options: StreamOptions = {}) => {
  return new AIStream(options);
};
