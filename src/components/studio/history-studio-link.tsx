'use client';

import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import type { StudioScores } from '@/lib/studio-draft';

function asScores(value: unknown): StudioScores | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const scores = value as Partial<StudioScores>;
  if (
    typeof scores.engagement !== 'number' ||
    typeof scores.friendliness !== 'number' ||
    typeof scores.virality !== 'number'
  ) {
    return undefined;
  }
  return {
    engagement: scores.engagement,
    friendliness: scores.friendliness,
    virality: scores.virality,
  };
}

export function HistoryStudioLink({
  content,
  roast,
  scores,
}: {
  content: string;
  roast: string;
  scores: unknown;
}) {
  return (
    <OpenInStudioButton
      draft={{ tweets: [content], roast, scores: asScores(scores) }}
      label="Open in Studio"
    />
  );
}
