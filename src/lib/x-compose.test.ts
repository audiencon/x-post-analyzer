import { describe, expect, it } from 'vitest';
import { composeOnXUrl, firstPostText, restPostsText } from '@/lib/x-compose';

describe('composeOnXUrl', () => {
  it('builds an X intent URL from the first post', () => {
    expect(composeOnXUrl('Ship the draft.')).toBe(
      'https://x.com/intent/post?text=Ship%20the%20draft.'
    );
  });

  it('strips editor HTML before encoding', () => {
    expect(composeOnXUrl('<p>Hello</p>')).toBe('https://x.com/intent/post?text=Hello');
  });
});

describe('firstPostText', () => {
  it('skips empty boxes and returns the first written post', () => {
    expect(firstPostText(['', '<p></p>', '<p>The turn.</p>'])).toBe('The turn.');
  });
});

describe('restPostsText', () => {
  it('returns every written post after the first', () => {
    expect(restPostsText(['<p>Open</p>', '', '<p>The turn.</p>', '<p>Land it.</p>'])).toEqual([
      'The turn.',
      'Land it.',
    ]);
  });
});
