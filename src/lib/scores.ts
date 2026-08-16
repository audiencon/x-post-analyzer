export type ScoreSet = {
  engagement: number;
  friendliness: number;
  virality: number;
};

export function asScores(value: unknown): ScoreSet | null {
  if (!value || typeof value !== 'object') return null;
  const scores = value as Partial<ScoreSet>;
  if (
    typeof scores.engagement !== 'number' ||
    typeof scores.friendliness !== 'number' ||
    typeof scores.virality !== 'number'
  ) {
    return null;
  }
  return {
    engagement: scores.engagement,
    friendliness: scores.friendliness,
    virality: scores.virality,
  };
}

export function globalScore(scores: ScoreSet) {
  return Math.round((scores.engagement + scores.friendliness + scores.virality) / 3);
}
