import { NextResponse } from 'next/server';
import { createTextStreamResponse, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { DEFAULT_MODEL } from '@/config/openai';
import { asCritiqueHistory, critiqueSystemPrompt } from '@/lib/critique';
import { assertCanUse, recordUsage, usageErrorStatus } from '@/lib/usage';

export const runtime = 'nodejs';
export const maxDuration = 30;

function isBenignDisconnect(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const err = error as {
    name?: string;
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  const code = err.code || err.cause?.code;
  const message = `${err.name ?? ''} ${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return (
    err.name === 'AbortError' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    /abort|aborted|terminated|econnreset/i.test(message)
  );
}

function withoutStreamErrors(stream: ReadableStream<string>) {
  return new ReadableStream<string>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (error) {
        if (!isBenignDisconnect(error)) {
          console.error('stream-critique interrupted', error);
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  try {
    await assertCanUse('critique');
    await recordUsage('critique');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Not allowed.';
    return NextResponse.json({ error: message }, { status: usageErrorStatus(error) });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Critique is down. Try again in a minute.' }, { status: 500 });
  }

  const body = (await request.json()) as {
    message?: string;
    draftText?: string;
    history?: unknown;
  };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'A note is required.' }, { status: 400 });
  }

  const openai = createOpenAI({ apiKey });
  const result = streamText({
    model: openai(DEFAULT_MODEL),
    temperature: 0.7,
    maxOutputTokens: 900,
    abortSignal: request.signal,
    system: critiqueSystemPrompt(body.draftText),
    messages: [
      ...asCritiqueHistory(body.history),
      { role: 'user', content: message },
    ],
    onError: ({ error }) => {
      if (!isBenignDisconnect(error)) {
        console.error('stream-critique model error', error);
      }
    },
  });

  return createTextStreamResponse({
    stream: withoutStreamErrors(result.textStream),
  });
}
