import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { DEFAULT_API_KEY, DEFAULT_MODEL } from '@/config/openai';
import { studioRewriteSystemPrompt } from '@/config/prompt';
import { assertCanUse, recordUsage, usageErrorStatus } from '@/lib/usage';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    try {
      await assertCanUse('rewrite');
      await recordUsage('rewrite');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Daily rewrite limit reached.';
      return NextResponse.json({ error: message }, { status: usageErrorStatus(error) });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || DEFAULT_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'Rewrite is down. Try again in a minute.' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const stream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: studioRewriteSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
