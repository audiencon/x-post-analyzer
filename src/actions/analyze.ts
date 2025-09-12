/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import OpenAI from 'openai';
import Cookies from 'js-cookie';
import { DEFAULT_MODEL } from '@/config/openai';
import { buildAnalyzeSystemPrompt } from '@/config/prompt';
import { MAX_REQUESTS, WINDOW_MS } from '@/config/constants';

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
}

export async function analyzePost(
  content: string,
  niche?: string,
  goal?: string,
  hasVisualContent?: boolean
): Promise<AnalysisResult> {
  // Server-side rate limiting for default API key usage
  // Module-level usage tracker
  const globalAny = global as any;
  if (!globalAny.__analyze_usage__) {
    globalAny.__analyze_usage__ = { count: 0, windowStart: Date.now() } as {
      count: number;
      windowStart: number;
    };
  }
  const usage = globalAny.__analyze_usage__ as { count: number; windowStart: number };
  const now = Date.now();
  if (now - usage.windowStart > WINDOW_MS) {
    usage.count = 0;
    usage.windowStart = now;
  }
  if (usage.count >= MAX_REQUESTS) {
    throw new Error(`Usage limit reached (${MAX_REQUESTS} requests per hour)`);
  }
  usage.count += 1;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OpenAI API key is required. Please provide your API key or set OPENAI_API_KEY environment variable.'
    );
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new Error('Invalid content provided for analysis.');
  }

  const openai = new OpenAI({ apiKey });
  const model = Cookies.get('openai-model') || DEFAULT_MODEL;

  const systemPrompt = buildAnalyzeSystemPrompt({ niche, goal, hasVisualContent });

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: messages as any,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}') as AnalysisResult;
    return response;
  } catch (error) {
    console.error('Error analyzing post:', error);
    throw error;
  }
}
