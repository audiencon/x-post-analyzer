'use server';

import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { DEFAULT_MODEL } from '@/config/openai';
import { buildAnalyzeSystemPrompt } from '@/config/prompt';
import { assertCanUse, recordUsage } from '@/lib/usage';
import { saveRoast } from '@/actions/roasts';
import { buildDesk, type DraftDesk } from '@/lib/x-monetization';

export interface AdvancedAnalytics {
  readability: {
    score: number;
    level: string;
    description: string;
  };
  sentiment: {
    score: number;
    type: string;
    emotions: string[];
  };
  timing: {
    bestTime: string;
    timezone: string;
    peakDays: string[];
  };
  hashtags: {
    recommended: string[];
    reach: string;
  };
  audience: {
    primary: string;
    interests: string[];
    age: string;
  };
  keywords: {
    optimal: string[];
    trending: string[];
  };
}

export interface AnalysisResult {
  scores: {
    engagement: number;
    friendliness: number;
    virality: number;
  };
  analytics: AdvancedAnalytics;
  analysis: {
    synthesis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  desk?: DraftDesk;
  roastId?: string;
}

export async function analyzePost(
  content: string,
  niche?: string,
  goal?: string,
  hasVisualContent?: boolean
): Promise<AnalysisResult> {
  await assertCanUse('analyze');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Roast is down. Try again in a minute.');
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new Error('Invalid content provided for analysis.');
  }

  const cookieStore = await cookies();
  const model = cookieStore.get('openai-model')?.value || DEFAULT_MODEL;
  const openai = new OpenAI({ apiKey });
  const systemPrompt = buildAnalyzeSystemPrompt({ niche, goal, hasVisualContent });

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

    const response = JSON.parse(completion.choices[0].message.content || '{}') as AnalysisResult & {
      monetization?: {
        originality?: number;
        originalKind?: string;
        verdict?: string;
        payout?: number;
      };
    };
    if (
      !response.scores ||
      typeof response.scores.engagement !== 'number' ||
      typeof response.scores.friendliness !== 'number' ||
      typeof response.scores.virality !== 'number'
    ) {
      throw new Error('Could not score this draft. Try again.');
    }
    const desk = buildDesk(content, response.monetization);
    const result: AnalysisResult = {
      scores: response.scores,
      analytics: response.analytics,
      analysis: response.analysis,
      desk,
    };
    await recordUsage('analyze');
    const saved = await saveRoast(content, result);
    return { ...result, roastId: saved?.id };
  } catch (error) {
    console.error('Error analyzing post:', error);
    throw error;
  }
}
