'use server';

import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { DEFAULT_MODEL } from '@/config/openai';
import {
  REWRITE_ANGLE_COPY,
  REWRITE_ANGLE_IDS,
  type RewriteAngle,
} from '@/config/rewrite-angles';

export async function getRewriteAngles(content: string): Promise<RewriteAngle[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required.');
  }
  if (!content.trim()) {
    throw new Error('Nothing to rewrite.');
  }

  const cookieStore = await cookies();
  const model = cookieStore.get('openai-model')?.value || DEFAULT_MODEL;
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You rewrite X drafts for Original Content Rewards (Home Timeline, 50% visible, original work).
Return JSON with exactly three keys: sharper, warmer, shorter.
Each value is the full rewritten post, ready to ship on Home — not a reply.
- sharper: more specific, more tension. Keep the claim. First fold must contain it.
- warmer: same idea, more human, still not soft.
- shorter: cut until one Home screen. Lead with the line that earns a qualified impression.
No hashtags. Max one emoji. No engagement bait. No URL in the first 140 characters. No preface.`,
      },
      { role: 'user', content },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content || '{}') as Record<
    string,
    unknown
  >;

  return REWRITE_ANGLE_IDS.map(id => {
    const text = typeof parsed[id] === 'string' ? parsed[id].trim() : '';
    return {
      id,
      ...REWRITE_ANGLE_COPY[id],
      text: text || content,
    };
  });
}
