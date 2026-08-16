import { describe, expect, it } from 'vitest';
import { extractPostFromNote, textToHtmlWithParagraphs, visiblePostText } from '@/lib/editor-helpers';

describe('extractPostFromNote', () => {
  it('returns fenced copy when the note wraps a draft', () => {
    expect(extractPostFromNote('Try this:\n\n```\nThe claim belongs in post one.\n```')).toBe(
      'The claim belongs in post one.'
    );
  });

  it('strips a leading editor preface', () => {
    expect(
      extractPostFromNote('Here is a tighter version.\n\nHome only pays what it can see.')
    ).toBe('Home only pays what it can see.');
  });

  it('drops leftover writeTweet markup', () => {
    expect(extractPostFromNote('<writeTweet>ignore</writeTweet>\nPut the stake first.')).toBe(
      'Put the stake first.'
    );
  });
});

describe('textToHtmlWithParagraphs', () => {
  it('keeps blank lines as paragraphs, not extra breaks', () => {
    expect(
      textToHtmlWithParagraphs(
        'The rise of vibe coding.\n\nBut does it end engineering?\n\nI am not so sure.'
      )
    ).toBe(
      '<p>The rise of vibe coding.</p><p>But does it end engineering?</p><p>I am not so sure.</p>'
    );
  });

  it('keeps a single line break inside one paragraph', () => {
    expect(textToHtmlWithParagraphs('First line\nSecond line')).toBe(
      '<p>First line<br>Second line</p>'
    );
  });
});

describe('visiblePostText', () => {
  it('turns editor HTML into the text a reader would see', () => {
    expect(visiblePostText('<p>First line</p><p>Second line</p>')).toBe('First line\nSecond line');
  });

  it('leaves plain text alone', () => {
    expect(visiblePostText('Already a draft')).toBe('Already a draft');
  });
});
