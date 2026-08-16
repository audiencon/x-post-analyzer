import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { FREE_ROASTS_PER_DAY, FREE_WRITES_PER_DAY } from '@/config/billing';

export type UsageKind = 'analyze' | 'rewrite' | 'critique' | 'suggestions';

function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function meterKind(kind: UsageKind) {
  if (kind === 'suggestions') return 'rewrite';
  return kind;
}

async function guestKey() {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headerList.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function getUsageState(kind: UsageKind = 'analyze') {
  const user = await getCurrentUser();
  const metered = meterKind(kind);
  const userId = user?.id ?? null;
  const key = userId ? null : await guestKey();

  if (metered === 'analyze' && user?.isPro) {
    return {
      allowed: true as const,
      remaining: null,
      isPro: true,
      isStudio: Boolean(user.isStudio),
      userId: user.id,
    };
  }

  if ((metered === 'rewrite' || metered === 'critique') && user?.isStudio) {
    return {
      allowed: true as const,
      remaining: null,
      isPro: true,
      isStudio: true,
      userId: user.id,
    };
  }

  const since = startOfUtcDay();
  const kinds =
    metered === 'rewrite' ? (['rewrite', 'suggestions'] as const) : ([metered] as const);
  const cap = metered === 'analyze' ? FREE_ROASTS_PER_DAY : FREE_WRITES_PER_DAY;

  const used = await prisma.usageEvent.count({
    where: {
      createdAt: { gte: since },
      kind: { in: [...kinds] },
      ...(userId ? { userId } : { guestKey: key }),
    },
  });

  const remaining = Math.max(0, cap - used);
  return {
    allowed: remaining > 0,
    remaining,
    isPro: Boolean(user?.isPro),
    isStudio: Boolean(user?.isStudio),
    userId,
    guestKey: key,
  };
}

function limitMessage(kind: UsageKind) {
  const metered = meterKind(kind);
  switch (metered) {
    case 'analyze':
      return `Daily free limit reached (${FREE_ROASTS_PER_DAY} roasts). Upgrade to Pro for unlimited roasts.`;
    case 'rewrite':
      return `Daily rewrite limit reached (${FREE_WRITES_PER_DAY}). Studio removes the cap.`;
    case 'critique':
      return `Daily critique limit reached (${FREE_WRITES_PER_DAY}). Studio removes the cap.`;
    default: {
      const _exhaustive: never = metered;
      return _exhaustive;
    }
  }
}

export function usageErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return /sign in/i.test(message) ? 401 : 429;
}

export async function assertCanUse(kind: UsageKind) {
  const state = await getUsageState(kind);
  if (!state.userId) {
    throw new Error('Sign in to use PostRoast.');
  }
  if (!state.allowed) {
    throw new Error(limitMessage(kind));
  }
  return state;
}

export async function recordUsage(kind: UsageKind) {
  const state = await getUsageState(kind);
  await prisma.usageEvent.create({
    data: {
      kind: meterKind(kind),
      userId: state.userId,
      guestKey: state.userId ? null : state.guestKey,
    },
  });
  return state;
}
