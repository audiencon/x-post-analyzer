import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createTextStreamResponse, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { DEFAULT_MODEL } from '@/config/openai';
import { assertCanUse, usageErrorStatus } from '@/lib/usage';

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
          console.error('stream-roast interrupted', error);
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
    await assertCanUse('analyze');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Not allowed.';
    return NextResponse.json({ error: message }, { status: usageErrorStatus(error) });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key is required.' }, { status: 500 });
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const model = cookieStore.get('openai-model')?.value || DEFAULT_MODEL;
  const openai = createOpenAI({ apiKey });

  const result = streamText({
    model: openai(model),
    temperature: 0.7,
    maxOutputTokens: 180,
    abortSignal: request.signal,
    system:
      'You are PostRoast, a senior X editor with a red pen, 2026. Roast this draft in 1-3 sentences for Home Timeline and Original Content Rewards: original work, first fold visible, no engagement bait, no reply-as-a-post, no link in the opening. Be specific, slightly mean, useful. No scores. No rewrite. No preface.',
    prompt: content,
    onError: ({ error }) => {
      if (!isBenignDisconnect(error)) {
        console.error('stream-roast model error', error);
      }
    },
  });

  return createTextStreamResponse({
    stream: withoutStreamErrors(result.textStream),
  });
}
