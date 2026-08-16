export const FREE_ROASTS_PER_DAY = 10;
export const FREE_SAVED_THREADS = 3;
export const FREE_WRITES_PER_DAY = 8;
export const PRO_MONTHLY_PRICE_USD = 19;
export const STUDIO_MONTHLY_PRICE_USD = 32;
export const FOUNDER_PRICE_USD = 199;
export const FOUNDER_SEAT_CAP = 100;
export const PLAN_FREE = 'FREE';
export const PLAN_PRO = 'PRO';
export const PLAN_STUDIO = 'STUDIO';
export const PLAN_STATUS_LIFETIME = 'lifetime';

export type PaidPlan = 'pro' | 'studio';
export type BillingInterval = 'month' | 'year';

const PAID_STATUSES = new Set(['active', 'trialing', PLAN_STATUS_LIFETIME]);

export function isPaidPlan(plan?: string | null, status?: string | null) {
  return (plan === PLAN_PRO || plan === PLAN_STUDIO) && PAID_STATUSES.has(status ?? '');
}

export function isProPlan(plan?: string | null, status?: string | null) {
  return isPaidPlan(plan, status);
}

export function isStudioPlan(plan?: string | null, status?: string | null) {
  return plan === PLAN_STUDIO && PAID_STATUSES.has(status ?? '');
}

export function planLabel(plan?: string | null, status?: string | null) {
  if (status === PLAN_STATUS_LIFETIME) return 'Founder';
  if (plan === PLAN_PRO) return 'Pro';
  if (plan === PLAN_STUDIO) return 'Studio';
  return 'Free';
}

const PRICE_ENV: Record<PaidPlan, Record<BillingInterval, string | undefined>> = {
  pro: {
    month: process.env.STRIPE_PRO_PRICE_ID,
    year: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  studio: {
    month: process.env.STRIPE_STUDIO_PRICE_ID,
    year: process.env.STRIPE_STUDIO_YEARLY_PRICE_ID,
  },
};

export function priceIdFor(plan: PaidPlan, interval: BillingInterval) {
  return PRICE_ENV[plan][interval];
}

export function planFromPriceId(priceId?: string | null) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
    return PLAN_PRO;
  }
  if (
    priceId === process.env.STRIPE_STUDIO_PRICE_ID ||
    priceId === process.env.STRIPE_STUDIO_YEARLY_PRICE_ID
  ) {
    return PLAN_STUDIO;
  }
  if (priceId === process.env.STRIPE_FOUNDER_PRICE_ID) {
    return PLAN_STUDIO;
  }
  return null;
}
