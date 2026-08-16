import { describe, expect, it } from 'vitest';
import { isThread, parseThread } from '@/lib/thread-parser';

describe('parseThread', () => {
  it('splits posts on a dash separator', () => {
    expect(parseThread('First post\n\n---\n\nSecond post')).toEqual(['First post', 'Second post']);
  });

  it('treats a single block as one post', () => {
    expect(parseThread('Just one post, no separator.')).toEqual(['Just one post, no separator.']);
  });

  it('returns an empty list for blank input', () => {
    expect(parseThread('   ')).toEqual([]);
  });
});

describe('isThread', () => {
  it('is true only when there are multiple posts', () => {
    expect(isThread('First post that is long enough to count\n\n---\n\nSecond post here')).toBe(
      true
    );
    expect(isThread('A single post, even if it is fairly long on its own.')).toBe(false);
  });
});
