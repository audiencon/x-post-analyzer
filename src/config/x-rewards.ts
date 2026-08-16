/** X Original Content Rewards — account rules as of Aug 2026. */
export const X_REWARDS = {
  program: 'Original Content Rewards',
  starts: '2026-09-08',
  replaces: 'Ads Revenue Sharing (sunset 2026-09-07)',
  minAge: 18,
  subscription: ['Premium', 'Premium+', 'Premium Business'] as const,
  minVerifiedFollowers: 500,
  minVerifiedHomeImpressions90d: 500_000,
  repliesCountTowardThreshold: false,
  qualifiedImpression: {
    audience: 'unique Premium subscribers',
    surface: 'Home Timeline',
    minVisible: 0.5,
    exclude: ['replies-as-threshold', 'paid', 'promoted', 'duplicate', 'fraudulent'] as const,
  },
  originalCounts: [
    'original reporting or analysis',
    'first-hand expertise',
    'a story only you can tell',
    'original photos, video, graphics, or memes you made',
    'commentary that adds something meaningful',
  ] as const,
  originalDisqualifies: [
    'copied from another X account',
    'transferred from TikTok, YouTube, or another platform with no new work',
    'a caption on someone else’s media',
    'explicit monetization coaching',
    'misleading or false claims',
    'sexually explicit or harmful content',
    'Community Notes corrections',
  ] as const,
} as const;

export const FIRST_FOLD_CHARS = 140;
export const FIRST_FOLD_LINES = 4;
export const HOME_POST_CHARS = 280;
export const DRAFT_MAX_CHARS = 4000;
