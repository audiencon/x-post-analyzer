import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
}

export function isStudioConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_STUDIO_PRICE_ID);
}

export function isFounderConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_FOUNDER_PRICE_ID);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function randomIntegrationSuffix() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    ''
  );
}
