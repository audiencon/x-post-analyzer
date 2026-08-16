import { describe, expect, it } from 'vitest';
import { asCritiqueHistory } from '@/lib/critique';

describe('asCritiqueHistory', () => {
  it('keeps only user and assistant turns with text', () => {
    expect(
      asCritiqueHistory([
        { role: 'user', content: 'Cut this.' },
        { role: 'assistant', content: 'Here.' },
        { role: 'system', content: 'no' },
        { role: 'user', content: '   ' },
        { role: 'assistant' },
      ])
    ).toEqual([
      { role: 'user', content: 'Cut this.' },
      { role: 'assistant', content: 'Here.' },
    ]);
  });
});
