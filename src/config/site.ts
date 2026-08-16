export const SITE = {
  name: 'PostRoast',
  url: 'https://www.postroast.app',
  tagline: 'The last stop before you hit Post',
  description:
    'PostRoast is an AI roast for X drafts. Sign in, paste a post, and get Engage, Warmth, Viral, and Payout scores plus a rewrite you would actually ship. Ten free roasts a day.',
  shortDescription:
    'Paste a draft. Get a roast, a score, and a version you would actually post.',
  locale: 'en_US',
  legalUpdated: '2026-08-16',
  legalUpdatedLabel: 'August 16, 2026',
  founder: {
    name: 'Audiencon',
    url: 'https://x.com/audiencon',
    handle: '@audiencon',
    sameAs: ['https://x.com/audiencon', 'https://github.com/audiencon'] as const,
  },
  sameAs: [
    'https://x.com/audiencon',
    'https://github.com/audiencon',
    'https://github.com/audiencon/postroast',
  ] as const,
  ogImagePath: '/opengraph-image',
} as const;

export const SITE_OG_IMAGE = `${SITE.url}${SITE.ogImagePath}`;
