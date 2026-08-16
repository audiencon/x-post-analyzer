import { describe, expect, it } from 'vitest';
import { isScratchDraft } from '@/lib/studio-draft';
import { pickStudioPlaceholder, pickStudioStarters, STUDIO_STARTERS } from '@/lib/studio-starters';

describe('isScratchDraft', () => {
  it('treats slash-menu fragments as unsavable', () => {
    expect(isScratchDraft(['<p>/</p>'])).toBe(true);
    expect(isScratchDraft(['<p>/imp</p>'])).toBe(true);
    expect(isScratchDraft([''])).toBe(true);
  });

  it('saves a real line', () => {
    expect(isScratchDraft(['<p>Shipping today.</p>'])).toBe(false);
  });
});

describe('pickStudioStarters', () => {
  it('returns a stable shuffle for a seed and a different set for another', () => {
    const first = pickStudioStarters(5, 11).map(starter => starter.id);
    const again = pickStudioStarters(5, 11).map(starter => starter.id);
    const other = pickStudioStarters(5, 99).map(starter => starter.id);
    expect(first).toEqual(again);
    expect(first).not.toEqual(other);
    expect(first).toHaveLength(5);
    expect(new Set(first).size).toBe(5);
  });

  it('draws from the full catalog', () => {
    expect(STUDIO_STARTERS.length).toBeGreaterThanOrEqual(16);
    expect(pickStudioPlaceholder(0)).toBeTruthy();
  });
});
