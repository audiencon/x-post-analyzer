'use server';

import OpenAI from 'openai';
import { cookies } from 'next/headers';
import type { AdvancedAnalytics } from './analyze';
import { DEFAULT_MODEL } from '@/config/openai';
import { buildSuggestionsSystemPrompt } from '@/config/prompt';
import { assertCanUse, recordUsage } from '@/lib/usage';

export interface Suggestion {
  text: string;
  scores: {
    engagement: number;
    friendliness: number;
    virality: number;
  };
  analytics: AdvancedAnalytics;
}

export async function getSuggestions(
  content: string,
  niche?: string,
  goal?: string,
  hasVisualContent?: boolean
): Promise<Suggestion[]> {
  await assertCanUse('suggestions');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OpenAI API key is required. Please provide your API key or set OPENAI_API_KEY environment variable.'
    );
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return [];
  }

  const cookieStore = await cookies();
  const model = cookieStore.get('openai-model')?.value || DEFAULT_MODEL;
  const openai = new OpenAI({ apiKey });
  const systemPrompt = buildSuggestionsSystemPrompt({ niche, goal, hasVisualContent });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    await recordUsage('suggestions');
    return response.suggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
}
