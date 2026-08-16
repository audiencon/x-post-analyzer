import { describe, expect, it } from 'vitest';
import { asScores, globalScore } from '@/lib/scores';

describe('asScores', () => {
  it('accepts a complete score set', () => {
    expect(asScores({ engagement: 70, friendliness: 80, virality: 60 })).toEqual({
      engagement: 70,
      friendliness: 80,
      virality: 60,
    });
  });

  it('rejects incomplete or non-numeric scores', () => {
    expect(asScores({ engagement: 70, friendliness: 80 })).toBeNull();
    expect(asScores(null)).toBeNull();
  });
});

describe('globalScore', () => {
  it('averages the three scores', () => {
    expect(globalScore({ engagement: 70, friendliness: 80, virality: 60 })).toBe(70);
  });
});
