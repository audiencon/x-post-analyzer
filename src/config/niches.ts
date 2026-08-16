export const NICHES = [
  'General',
  'Tech',
  'Marketing',
  'SaaS',
  'Creator',
  'Writing',
  'E-commerce',
  'Finance',
] as const;

export const GOALS = [
  'Payout (Original Content Rewards)',
  'Home reach',
  'Replies (conversation)',
  'Clicks (link in the reply)',
  'Follows',
  'Thought leadership',
] as const;

export type Niche = (typeof NICHES)[number];
export type Goal = (typeof GOALS)[number];

export function isNiche(value: string): value is Niche {
  return (NICHES as readonly string[]).includes(value);
}

export function isGoal(value: string): value is Goal {
  return (GOALS as readonly string[]).includes(value);
}
