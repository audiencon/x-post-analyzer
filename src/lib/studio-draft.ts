import { visiblePostText } from '@/lib/editor-helpers';
import type { DraftDesk } from '@/lib/x-monetization';

export const STUDIO_DRAFT_KEY = 'postroast.studioDraft';
export const STUDIO_PATH = '/studio';

export type StudioScores = {
  engagement: number;
  friendliness: number;
  virality: number;
};

export type StudioDraft = {
  tweets: string[];
  title?: string;
  roast?: string;
  scores?: StudioScores;
  desk?: DraftDesk;
  goal?: string;
  threadId?: string;
  postedAt?: string | Date | null;
};

export function stashStudioDraft(draft: StudioDraft) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(draft));
}

export function takeStudioDraft(): StudioDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STUDIO_DRAFT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STUDIO_DRAFT_KEY);
  try {
    const parsed = JSON.parse(raw) as StudioDraft;
    if (!Array.isArray(parsed.tweets) || parsed.tweets.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isScratchDraft(tweets: string[]) {
  const text = tweets.map(tweet => visiblePostText(tweet).trim()).join('');
  if (!text) return true;
  return /^\/\w*$/.test(text);
}

export function titleFromTweets(tweets: string[]) {
  const first = tweets.find(tweet => tweet.trim()) ?? 'Untitled draft';
  return first
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 72);
}
