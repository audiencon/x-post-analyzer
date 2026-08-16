'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getStripe, isFounderConfigured, isStripeConfigured, randomIntegrationSuffix } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import {
  FOUNDER_SEAT_CAP,
  PLAN_STATUS_LIFETIME,
  priceIdFor,
  type BillingInterval,
  type PaidPlan,
} from '@/config/billing';

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export async function startProCheckout() {
  return startCheckout('pro', 'month');
}

export async function startCheckout(plan: PaidPlan, interval: BillingInterval = 'month') {
  if (plan !== 'pro' && plan !== 'studio') {
    throw new Error('Unknown plan.');
  }
  if (interval !== 'month' && interval !== 'year') {
    throw new Error('Unknown billing interval.');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?next=/account');
  }
  if (user.isPro) {
    redirect('/account');
  }
  if (!isStripeConfigured()) {
    throw new Error(
      'Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID to start charging.'
    );
  }

  const price = priceIdFor(plan, interval);
  if (!price) {
    throw new Error(`Missing Stripe price for ${plan} ${interval}.`);
  }

  const stripe = getStripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl()}/account?checkout=success`,
    cancel_url: `${appUrl()}/account?checkout=cancel`,
    metadata: { userId: user.id, plan },
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
    integration_identifier: `postroast-${plan}-${randomIntegrationSuffix()}`,
  });

  if (!session.url) {
    throw new Error('Could not start checkout.');
  }

  redirect(session.url);
}

export async function remainingFounderSeats() {
  const taken = await prisma.user.count({
    where: { planStatus: PLAN_STATUS_LIFETIME },
  });
  return Math.max(0, FOUNDER_SEAT_CAP - taken);
}

export async function startFounderCheckout() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?next=/founder');
  }
  if (user.planStatus === PLAN_STATUS_LIFETIME) {
    redirect('/account');
  }
  if (!isFounderConfigured()) {
    throw new Error('Founder checkout is not configured yet.');
  }
  const seats = await remainingFounderSeats();
  if (seats <= 0) {
    throw new Error('The Founder offer is sold out.');
  }

  const price = process.env.STRIPE_FOUNDER_PRICE_ID;
  if (!price) {
    throw new Error('Missing STRIPE_FOUNDER_PRICE_ID.');
  }

  const stripe = getStripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl()}/account?checkout=founder`,
    cancel_url: `${appUrl()}/founder?checkout=cancel`,
    metadata: { userId: user.id, offer: 'founder' },
    integration_identifier: `postroast-founder-${randomIntegrationSuffix()}`,
  });

  if (!session.url) {
    throw new Error('Could not start checkout.');
  }

  redirect(session.url);
}

export async function openBillingPortal() {
  const user = await getCurrentUser();
  if (!user?.stripeCustomerId) {
    redirect('/account');
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl()}/account`,
  });

  redirect(portal.url);
}
