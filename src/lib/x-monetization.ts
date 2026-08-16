import {
  DRAFT_MAX_CHARS,
  FIRST_FOLD_CHARS,
  FIRST_FOLD_LINES,
  HOME_POST_CHARS,
} from '@/config/x-rewards';

export type OriginalKind = 'reporting' | 'expertise' | 'story' | 'commentary' | 'media' | 'none';
export type FlagSeverity = 'block' | 'sting' | 'note';

export type DeskFlag = {
  id: string;
  severity: FlagSeverity;
  title: string;
  detail: string;
  penalty: number;
};

export type DraftInspection = {
  payout: number;
  firstFold: string;
  remainder: string;
  flags: DeskFlag[];
  isReply: boolean;
  isThread: boolean;
  firstPostChars: number;
  urls: string[];
};

export type DraftDesk = DraftInspection & {
  originality: number;
  originalKind: OriginalKind;
  verdict: string;
};

const URL_RE = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
const HASHTAG_RE = /(?:^|\s)#\w+/g;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;

const ENGAGEMENT_BAIT =
  /\b(rt if|retweet if|like if|comment (yes|below|if)|drop a|smash (like|rt)|tag a (friend|someone)|quote (this|tweet)|qrt this|follow me|follow for|link in (my )?bio)\b/i;

const MONETIZATION_COACH =
  /\b(how i (make|hit|got) \$?\d|revenue share|payouts?|monetiz\w*|impressions hack|engagement pod|for you page hack)\b/i;

const CROSSPOST =
  /\b(watch (till|until) the end|link in (my )?bio|made (this|it) (on|for) tiktok|tiktok\.com|youtube\.com\/watch)\b/i;

const FOLLOW_CTA = /\b(follow (me|for|back)|dm me|subscribe to|link in (my )?bio)\b/i;

const QUOTE_FARM = /\b(quote tweet this|qt this|qrt this|repost if)\b/i;

const THREAD_MARK = /(?:^|\n)\s*(?:🧵|1\/\d*|1\/)/;

const GREETING_HOOK = /^(hey|hi|hello|excited to (share|announce)|i('m| am) (thrilled|excited)|just launched)\b/i;

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function firstPost(content: string) {
  const parts = content.split(/\n\s*---\s*\n/);
  return (parts[0] ?? content).trim();
}

export function splitFirstFold(content: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const foldedLines = lines.slice(0, FIRST_FOLD_LINES).join('\n');
  const firstFold =
    foldedLines.length <= FIRST_FOLD_CHARS
      ? foldedLines
      : `${foldedLines.slice(0, FIRST_FOLD_CHARS).trimEnd()}…`;
  const remainder = content.slice(firstFold.replace(/…$/, '').length).trim();
  return { firstFold, remainder };
}

export function inspectDraft(content: string): DraftInspection {
  const text = content.trim();
  const lead = firstPost(text);
  const { firstFold, remainder } = splitFirstFold(lead);
  const urls = [...(text.match(URL_RE) ?? [])];
  const hashtags = text.match(HASHTAG_RE) ?? [];
  const emojis = text.match(EMOJI_RE) ?? [];
  const words = text.split(/\s+/).filter(Boolean);
  const capsWords = words.filter(word => word.length > 2 && word === word.toUpperCase() && /[A-Z]/.test(word));
  const lines = lead.split('\n').filter(line => line.trim());
  const isReply = /^@\w+/.test(lead);
  const isThread =
    THREAD_MARK.test(text) || text.includes('\n---\n') || text.length > HOME_POST_CHARS;

  const flags: DeskFlag[] = [];

  if (isReply) {
    flags.push({
      id: 'reply',
      severity: 'block',
      title: 'This is a reply',
      detail:
        'Replies do not count toward the 500,000 verified Home impressions. Original Content Rewards pays Home Timeline views from Premium users.',
      penalty: 32,
    });
  }

  if (urls.some(url => firstFold.toLowerCase().includes(url.toLowerCase().slice(0, 24)))) {
    flags.push({
      id: 'link-fold',
      severity: 'sting',
      title: 'Link in the first fold',
      detail:
        'A URL in the first 50% pulls people off Home before the post is half-visible. Qualified impressions need 50% on screen. Put the link in a reply.',
      penalty: 16,
    });
  } else if (urls.length > 0) {
    flags.push({
      id: 'link',
      severity: 'note',
      title: 'External link',
      detail: 'Links are allowed. They still cut dwell. If you need the click, make the post self-contained first.',
      penalty: 6,
    });
  }

  if (urls.length >= 2) {
    flags.push({
      id: 'link-dump',
      severity: 'sting',
      title: 'Too many links',
      detail: 'Two or more URLs reads as a dump. Home users bounce. One link, later, or none.',
      penalty: 10,
    });
  }

  if (ENGAGEMENT_BAIT.test(text)) {
    flags.push({
      id: 'bait',
      severity: 'block',
      title: 'Engagement bait',
      detail:
        '“RT if”, “comment YES”, “follow me” is the old revenue-share game. The new program pays original Home posts, not manufactured engagement.',
      penalty: 22,
    });
  }

  if (MONETIZATION_COACH.test(text)) {
    flags.push({
      id: 'coach',
      severity: 'block',
      title: 'Monetization coaching',
      detail: 'X disqualifies posts that explicitly coach people on how to get paid on X.',
      penalty: 28,
    });
  }

  if (CROSSPOST.test(text)) {
    flags.push({
      id: 'crosspost',
      severity: 'sting',
      title: 'Looks transferred',
      detail:
        'Content moved from TikTok/YouTube, or “watch till the end”, does not count as original. Recut it or write the point in your own words.',
      penalty: 18,
    });
  }

  if (FOLLOW_CTA.test(text) && !ENGAGEMENT_BAIT.test(text)) {
    flags.push({
      id: 'follow',
      severity: 'sting',
      title: 'Follow / DM ask',
      detail: 'A follow ask is not a post. It does not earn qualified impressions. Make the post worth a follow instead.',
      penalty: 10,
    });
  }

  if (QUOTE_FARM.test(text)) {
    flags.push({
      id: 'quote-farm',
      severity: 'sting',
      title: 'Quote-farming',
      detail: 'Asking people to quote-tweet you is engagement farming. Say the thing. Let them quote if they must.',
      penalty: 12,
    });
  }

  if (hashtags.length >= 2) {
    flags.push({
      id: 'hashtags',
      severity: 'sting',
      title: 'Hashtag stuffing',
      detail: 'Hashtags do not help distribution on X and look like 2014 growth-hack copy. Zero is better. One is the max.',
      penalty: 10,
    });
  }

  if (emojis.length >= 6) {
    flags.push({
      id: 'emoji',
      severity: 'note',
      title: 'Emoji wall',
      detail: 'Premium Home readers skim text. An emoji pile reads as slop.',
      penalty: 8,
    });
  }

  if (words.length >= 8 && capsWords.length / words.length > 0.35) {
    flags.push({
      id: 'caps',
      severity: 'note',
      title: 'Shouting',
      detail: 'All-caps lines look like ads. Ads do not get Original Content Rewards.',
      penalty: 8,
    });
  }

  if (THREAD_MARK.test(lead) && lead.length < 80) {
    flags.push({
      id: 'thread-empty',
      severity: 'sting',
      title: 'Empty first post',
      detail:
        'The first post is the only one that sits on Home. “1/” with no point does not get 50% visible value. Put the claim in post one.',
      penalty: 14,
    });
  }

  if (lines.length > 8 || lead.length > 320) {
    flags.push({
      id: 'fold',
      severity: 'note',
      title: 'Half of this will be off-screen',
      detail:
        'A qualified impression needs 50% of the post visible on Home. Long posts lose the second half. Cut, or put the rest in the thread.',
      penalty: 8,
    });
  }

  if (GREETING_HOOK.test(lead) && lead.length < 160) {
    flags.push({
      id: 'greeting',
      severity: 'note',
      title: 'Press-release open',
      detail: 'Home does not stop for “excited to share.” Start on the stake, the scene, or the contradiction.',
      penalty: 8,
    });
  }

  if (text.length > DRAFT_MAX_CHARS) {
    flags.push({
      id: 'overlong',
      severity: 'note',
      title: 'Too long to roast as one post',
      detail: 'Paste the first post, or the first three posts of the thread. Home only pays the post it can see.',
      penalty: 4,
    });
  }

  const payout = clamp(100 - flags.reduce((sum, flag) => sum + flag.penalty, 0));

  return {
    payout,
    firstFold,
    remainder,
    flags,
    isReply,
    isThread,
    firstPostChars: lead.length,
    urls,
  };
}

export function payoutVerdict(payout: number, flags: DeskFlag[]) {
  if (flags.some(flag => flag.id === 'reply')) {
    return 'A reply cannot earn Original Content Rewards. Post it on Home, or do not count on a payout.';
  }
  if (flags.some(flag => flag.severity === 'block')) {
    return 'X would not pay this. Fix the disqualifying line before you worry about the hook.';
  }
  if (payout < 45) {
    return 'This will sit on Home. It will not get paid like original work.';
  }
  if (payout < 65) {
    return 'It can take a qualified impression. It is not obviously yours yet.';
  }
  if (payout < 80) {
    return 'Shape is clean. Now it has to be a post only you could have written.';
  }
  return 'This can earn. Do not sand off the specific part.';
}

const ORIGINAL_KINDS: OriginalKind[] = [
  'reporting',
  'expertise',
  'story',
  'commentary',
  'media',
  'none',
];

function asOriginalKind(value: unknown): OriginalKind {
  return typeof value === 'string' && ORIGINAL_KINDS.includes(value as OriginalKind)
    ? (value as OriginalKind)
    : 'none';
}

export function buildDesk(
  content: string,
  llm?: {
    originality?: number;
    originalKind?: string;
    verdict?: string;
    payout?: number;
  } | null
): DraftDesk {
  const inspection = inspectDraft(content);
  const originality = clamp(typeof llm?.originality === 'number' ? llm.originality : 58);
  const payout = clamp(inspection.payout * 0.62 + originality * 0.38);
  const originalKind = asOriginalKind(llm?.originalKind);
  const verdict =
    (typeof llm?.verdict === 'string' && llm.verdict.trim()) ||
    payoutVerdict(payout, inspection.flags);

  return {
    ...inspection,
    payout,
    originality,
    originalKind,
    verdict,
  };
}
