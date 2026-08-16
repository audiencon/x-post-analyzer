import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import {
  PLAN_FREE,
  PLAN_PRO,
  PLAN_STUDIO,
  PLAN_STATUS_LIFETIME,
  planFromPriceId,
} from '@/config/billing';

function planFromSubscription(subscription: Stripe.Subscription) {
  const fromMetadata = subscription.metadata?.plan;
  if (fromMetadata === 'studio') return PLAN_STUDIO;
  if (fromMetadata === 'pro') return PLAN_PRO;

  for (const item of subscription.items.data) {
    const priceId = typeof item.price === 'string' ? item.price : item.price.id;
    const matched = planFromPriceId(priceId);
    if (matched) return matched;
  }

  return PLAN_PRO;
}

async function applyFounder(userId: string, customerId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      plan: PLAN_STUDIO,
      planStatus: PLAN_STATUS_LIFETIME,
    },
  });
}

async function applySubscription(userId: string, subscription: Stripe.Subscription) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { planStatus: true },
  });
  if (existing?.planStatus === PLAN_STATUS_LIFETIME) {
    return;
  }

  const status = subscription.status;
  const isActive = status === 'active' || status === 'trialing';

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      plan: isActive ? planFromSubscription(subscription) : PLAN_FREE,
      planStatus: status,
    },
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (userId && session.mode === 'payment' && session.metadata?.offer === 'founder' && customerId) {
        await applyFounder(userId, customerId);
        break;
      }
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscription(userId, subscription);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId =
        subscription.metadata?.userId ||
        (
          await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscription.id },
            select: { id: true },
          })
        )?.id;
      if (userId) {
        await applySubscription(userId, subscription);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
