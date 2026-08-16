'use server';

import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { DEFAULT_MODEL } from '@/config/openai';
import { NICHES, type Niche } from '@/config/niches';
import { assertCanUse } from '@/lib/usage';

export type IdeaDraft = {
  hook: string;
  angle: string;
  draft: string;
};

export async function generateIdeas(niche: string): Promise<IdeaDraft[]> {
  await assertCanUse('analyze');

  const allowed = NICHES.includes(niche as Niche) ? niche : 'General';
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required.');
  }

  const cookieStore = await cookies();
  const model = cookieStore.get('openai-model')?.value || DEFAULT_MODEL;
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You write X post ideas for indie founders. Return JSON: { "ideas": [ { "hook": string, "angle": string, "draft": string } ] } with exactly 8 ideas.
Each draft is a ready-to-roast post, 1-4 short lines. No hashtags. Max one emoji.
hook is the first line. angle is one of: contrarian, number, story, lesson, confession, teardown.
Niche: ${allowed}.`,
      },
      { role: 'user', content: `Give me 8 posts I would actually publish in ${allowed}.` },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content || '{}') as {
    ideas?: IdeaDraft[];
  };

  return (parsed.ideas ?? []).filter(
    idea => idea.hook && idea.angle && idea.draft
  ).slice(0, 8);
}
