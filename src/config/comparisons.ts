export type CompareSlug = 'typefully' | 'supabird' | 'growthx';

export type CompareRow = {
  feature: string;
  postroast: string;
  other: string;
};

export type Comparison = {
  slug: CompareSlug;
  name: string;
  url: string;
  tagline: string;
  title: string;
  description: string;
  verdict: string;
  price: string;
  postroastPrice: string;
  updated: string;
  rows: CompareRow[];
  theyWin: string[];
  weWin: string[];
  bestForThem: string;
  bestForUs: string;
};

export const COMPARISONS: Comparison[] = [
  {
    slug: 'typefully',
    name: 'Typefully',
    url: 'https://typefully.com',
    tagline: 'The calm writing studio vs the last honest pass before Post.',
    title: 'PostRoast vs Typefully (2026): roast first, then write',
    description:
      'Typefully is a polished X editor and scheduler. PostRoast is the critique you run before you open an editor. Compare roast, rewrite, studio, and pricing.',
    verdict:
      'Use Typefully if you already know the draft is good and need a calendar. Use PostRoast if the draft still might be polite garbage.',
    price: 'Free, then about $12–$19/mo',
    postroastPrice: 'Free roast, Pro $19/mo, Studio $32/mo',
    updated: 'August 16, 2026',
    rows: [
      { feature: 'Free roast after sign-in', postroast: '10/day', other: 'No' },
      { feature: 'Honest critique of the draft', postroast: 'The product', other: 'Light suggestions' },
      { feature: 'Thread editor', postroast: 'Studio', other: 'Excellent' },
      { feature: 'Saved drafts', postroast: 'Yes, with an account', other: 'Yes' },
      { feature: 'Schedule / post to X', postroast: 'Not yet', other: 'Yes' },
      { feature: 'Shareable roast card', postroast: 'Yes', other: 'No' },
      { feature: 'Ads in the tool', postroast: 'Only sold slots; hidden for Pro', other: 'No' },
    ],
    theyWin: [
      'Scheduling and a calmer daily writing habit.',
      'A more mature editor for people who already write every day.',
    ],
    weWin: [
      'A roast that tells you the draft will die, before you format it.',
      'Three rewrite angles and a card you can post.',
    ],
    bestForThem: 'Writers who need a queue and a clean composer.',
    bestForUs: 'Founders who want the truth about a draft in the last five minutes.',
  },
  {
    slug: 'supabird',
    name: 'SupaBird',
    url: 'https://supabird.io',
    tagline: 'A full X growth OS vs a red-pen workshop.',
    title: 'PostRoast vs SupaBird (2026): critique, not another growth suite',
    description:
      'SupaBird sells ideas, calendar, engage, and coaching. PostRoast sells the last honest pass before you hit Post. See what each tool is actually for.',
    verdict:
      'SupaBird is the operating system. PostRoast is the editor who will not lie to you. Most people do not need another OS. They need to know if the tweet is weak.',
    price: '$39/mo or $99/yr',
    postroastPrice: 'Free roast, Pro $19/mo, Studio $32/mo',
    updated: 'August 16, 2026',
    rows: [
      { feature: 'Free plan', postroast: '10 roasts/day after sign-in', other: 'Trial, no lasting free plan' },
      { feature: 'Roast / critique', postroast: 'Lead feature', other: 'Partial' },
      { feature: 'Niche ideas', postroast: 'Ideas v1', other: 'Ideas Lab' },
      { feature: 'Human coach', postroast: 'No', other: 'Yes' },
      { feature: 'Reply targeting', postroast: 'No', other: 'Yes' },
      { feature: 'Calendar / schedule', postroast: 'Not yet', other: 'Yes' },
      { feature: 'Starting price', postroast: '$0, then $19', other: '$39/mo or $99/yr' },
    ],
    theyWin: [
      'A complete grow loop: idea, write, calendar, engage.',
      'Coaching and a large idea library if you want a team around you.',
    ],
    weWin: [
      'Ten free roasts a day. No trial countdown.',
      'A sharper roast, and a cheaper habit if you only need the last pass.',
    ],
    bestForThem: 'Operators who want a full X department in one login.',
    bestForUs: 'Builders who already write and need the draft judged.',
  },
  {
    slug: 'growthx',
    name: 'GrowthX',
    url: 'https://growthx.so',
    tagline: 'Predicted likes vs a roast you can feel.',
    title: 'PostRoast vs GrowthX (2026): scores with teeth, not a 3D globe',
    description:
      'GrowthX predicts engagement from your last 60 days and schedules to the second. PostRoast roasts the line and gives you a version you would actually post.',
    verdict:
      'GrowthX wins if you already post and want forecasts plus a queue. PostRoast wins if the problem is the sentence, not the clock.',
    price: 'Starter $15, Pro $29, Max $49',
    postroastPrice: 'Free roast, Pro $19/mo, Studio $32/mo',
    updated: 'August 16, 2026',
    rows: [
      { feature: 'Sign-in to roast', postroast: 'Account required', other: 'X OAuth first' },
      { feature: 'Draft critique', postroast: 'Roast + scores', other: 'Prediction ranges' },
      { feature: 'Multiple rewrites', postroast: 'Three named angles', other: 'Three drafts' },
      { feature: 'Shareable artifact', postroast: 'Roast card', other: '3D growth visual' },
      { feature: 'Schedule to the second', postroast: 'Not yet', other: 'Yes' },
      { feature: 'Unfollow tracking', postroast: 'No', other: 'Yes' },
      { feature: 'Personalization from your X history', postroast: 'Not yet', other: 'Last 60 days' },
    ],
    theyWin: [
      'Engagement prediction tied to your real account.',
      'Scheduling, unfollows, and a visual people screenshot.',
    ],
    weWin: [
      'Sign-in is identity only. We do not ask for X posting permission.',
      'A critique that names what is wrong, not only what might perform.',
    ],
    bestForThem: 'Accounts that already publish and want a forecast plus a queue.',
    bestForUs: 'People who still need to hear that the hook is polite and dead.',
  },
];

export function comparisonBySlug(slug: string) {
  return COMPARISONS.find(item => item.slug === slug) ?? null;
}
