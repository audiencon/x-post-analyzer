import { describe, expect, it } from 'vitest';
import { inspectDraft, payoutVerdict } from '@/lib/x-monetization';

function flagIds(content: string) {
  return inspectDraft(content).flags.map(flag => flag.id);
}

describe('inspectDraft', () => {
  it('flags a reply as a payout block', () => {
    const inspection = inspectDraft('@someone this take is not it');
    expect(inspection.isReply).toBe(true);
    expect(flagIds('@someone this take is not it')).toContain('reply');
    expect(inspection.flags.find(flag => flag.id === 'reply')?.severity).toBe('block');
  });

  it('flags engagement bait', () => {
    expect(flagIds('RT if you still write your own posts')).toContain('bait');
  });

  it('flags a URL in the first fold', () => {
    expect(flagIds('Read this https://example.com/notes and then argue')).toContain('link-fold');
  });

  it('leaves a clean home post without block flags', () => {
    const inspection = inspectDraft(
      'The first fold is the only part Home pays. Put the claim there, not the recap.'
    );
    expect(inspection.isReply).toBe(false);
    expect(inspection.flags.some(flag => flag.severity === 'block')).toBe(false);
    expect(inspection.payout).toBeGreaterThan(70);
  });
});

describe('payoutVerdict', () => {
  it('calls out replies first', () => {
    const inspection = inspectDraft('@editor I fixed the hook');
    expect(payoutVerdict(inspection.payout, inspection.flags)).toMatch(/reply/i);
  });
});
