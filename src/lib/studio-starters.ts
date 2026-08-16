export type StudioStarter = {
  id: string;
  title: string;
  hint: string;
  insert: string;
};

export const STUDIO_STARTERS: StudioStarter[] = [
  { id: 'thread', title: 'Number it', hint: 'Start a thread.', insert: '1/ ' },
  { id: 'question', title: 'Question', hint: 'A real question, not bait.', insert: 'What if I told you…\n\n' },
  { id: 'news', title: 'Ship note', hint: 'You shipped. Say what.', insert: 'Shipping today:\n\n' },
  { id: 'tip', title: 'Tip', hint: 'One thing you learned late.', insert: 'One thing I wish I knew earlier:\n\n' },
  { id: 'story', title: 'Scene', hint: 'Open on a moment.', insert: 'A year ago, I…\n\n' },
  { id: 'number', title: 'Receipt', hint: 'Lead with the number.', insert: 'Here is the number:\n\n' },
  { id: 'versus', title: 'Before / after', hint: 'Everyone says / I did.', insert: 'Everyone says this.\n\nI did the other thing.\n\n' },
  { id: 'wrong', title: 'I was wrong', hint: 'A recant with a reason.', insert: 'I was wrong about…\n\n' },
  { id: 'rule', title: 'The rule', hint: 'The one you actually follow.', insert: 'The rule I actually follow:\n\n' },
  { id: 'mistake', title: 'Expensive mistake', hint: 'What it cost. What changed.', insert: 'The expensive mistake:\n\n' },
  { id: 'nobody', title: 'Nobody says', hint: 'Name the ignored part.', insert: 'Nobody talks about…\n\n' },
  { id: 'stopped', title: 'I stopped', hint: 'A decision, not a vibe.', insert: 'I stopped doing this:\n\n' },
  { id: 'after', title: 'After 100', hint: 'Pattern from repetition.', insert: 'After doing this a hundred times:\n\n' },
  { id: 'stuck', title: 'If you are stuck', hint: 'Help without a funnel.', insert: 'If you are stuck on this:\n\n' },
  { id: 'unpopular', title: 'Unpopular', hint: 'A stance you can defend.', insert: 'Unpopular, but:\n\n' },
  { id: 'last-month', title: 'Last month', hint: 'Before / after, no flex.', insert: 'Last month this was broken.\n\n' },
  { id: 'desk', title: 'From the desk', hint: 'A field note.', insert: 'From the desk today:\n\n' },
  { id: 'hours', title: 'Constraint', hint: 'Time was the point.', insert: 'We had 48 hours.\n\n' },
  { id: 'problem', title: 'Name it', hint: 'The real problem, first.', insert: 'The real problem is…\n\n' },
  { id: 'thread-hook', title: 'Thread hook', hint: 'Promise the thread.', insert: 'A short thread on the thing nobody prices correctly:\n\n' },
];

export const STUDIO_PLACEHOLDERS = [
  'Write the line you would actually post. Type / for commands.',
  'The first fold has to carry the claim. Type / to shape it.',
  'One concrete line. Then the next. Type / for a hook or a cut.',
  'If you would not post it, do not type it. / opens the menu.',
  'Start ugly. /improve after. The roast comes later.',
];

function mulberry32(seed: number) {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number) {
  const rand = mulberry32(seed);
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const current = pool[i];
    const swap = pool[j];
    if (current === undefined || swap === undefined) continue;
    pool[i] = swap;
    pool[j] = current;
  }
  return pool;
}

export function pickStudioStarters(count = 5, seed = Date.now()) {
  return shuffle(STUDIO_STARTERS, seed).slice(0, Math.min(count, STUDIO_STARTERS.length));
}

export function pickStudioPlaceholder(seed = Date.now()) {
  return STUDIO_PLACEHOLDERS[seed % STUDIO_PLACEHOLDERS.length] ?? STUDIO_PLACEHOLDERS[0];
}
