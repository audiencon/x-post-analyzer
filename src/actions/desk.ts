'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { getUsageState } from '@/lib/usage';
import { asScores, globalScore, type ScoreSet } from '@/lib/scores';
import { inspectDraft } from '@/lib/x-monetization';
import { listThreads } from '@/actions/threads';
import { planLabel } from '@/config/billing';

export type DeskRoast = {
  id: string;
  content: string;
  roast: string;
  score: number;
  scores: ScoreSet | null;
  payout: number;
  createdAt: Date;
  isPublic: boolean;
};

export type DeskDay = {
  key: string;
  label: string;
  count: number;
};

export type DeskSnapshot = {
  firstName: string;
  plan: string;
  isPro: boolean;
  isStudio: boolean;
  remaining: number | null;
  weekCount: number;
  avgScore: number | null;
  avgPayout: number | null;
  leak: string | null;
  days: DeskDay[];
  roasts: DeskRoast[];
  threads: Awaited<ReturnType<typeof listThreads>>;
  posted: Awaited<ReturnType<typeof listThreads>>;
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function deskFromAnalysis(analysis: unknown, content: string) {
  if (analysis && typeof analysis === 'object' && 'desk' in analysis) {
    const desk = (analysis as { desk?: { payout?: number } }).desk;
    if (typeof desk?.payout === 'number') return desk.payout;
  }
  return inspectDraft(content).payout;
}

export async function getDeskSnapshot(): Promise<DeskSnapshot | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [usage, threads, rows] = await Promise.all([
    getUsageState(),
    listThreads(),
    prisma.roast.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        content: true,
        roast: true,
        scores: true,
        analysis: true,
        isPublic: true,
        createdAt: true,
      },
    }),
  ]);

  const today = startOfUtcDay(new Date());
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const days: DeskDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      count: 0,
    };
  });

  const weekRows = rows.filter(row => row.createdAt >= weekStart);
  for (const row of weekRows) {
    const key = startOfUtcDay(row.createdAt).toISOString().slice(0, 10);
    const day = days.find(item => item.key === key);
    if (day) day.count += 1;
  }

  const scored = rows
    .map(row => {
      const scores = asScores(row.scores);
      if (!scores) return null;
      return {
        scores,
        payout: deskFromAnalysis(row.analysis, row.content),
      };
    })
    .filter((row): row is { scores: NonNullable<ReturnType<typeof asScores>>; payout: number } =>
      Boolean(row)
    );

  const pool = scored.length ? scored : [];
  const avgScore = pool.length
    ? Math.round(pool.reduce((sum, row) => sum + globalScore(row.scores), 0) / pool.length)
    : null;
  const avgPayout = pool.length
    ? Math.round(pool.reduce((sum, row) => sum + row.payout, 0) / pool.length)
    : null;

  let leak: string | null = null;
  if (pool.length) {
    const means = [
      {
        label: 'Engage',
        value: pool.reduce((sum, row) => sum + row.scores.engagement, 0) / pool.length,
      },
      {
        label: 'Warmth',
        value: pool.reduce((sum, row) => sum + row.scores.friendliness, 0) / pool.length,
      },
      {
        label: 'Viral',
        value: pool.reduce((sum, row) => sum + row.scores.virality, 0) / pool.length,
      },
      { label: 'Payout', value: pool.reduce((sum, row) => sum + row.payout, 0) / pool.length },
    ];
    const worst = means.reduce((a, b) => (b.value < a.value ? b : a));
    leak = worst.value < 70 ? worst.label : null;
  }

  const roasts: DeskRoast[] = rows.slice(0, 8).map(row => {
    const scores = asScores(row.scores);
    return {
      id: row.id,
      content: row.content,
      roast: row.roast,
      score: scores ? globalScore(scores) : 0,
      scores,
      payout: deskFromAnalysis(row.analysis, row.content),
      createdAt: row.createdAt,
      isPublic: row.isPublic,
    };
  });

  return {
    firstName: user.name.trim().split(/\s+/)[0] || user.name,
    plan: planLabel(user.plan, user.planStatus),
    isPro: user.isPro,
    isStudio: user.isStudio,
    remaining: usage.remaining,
    weekCount: weekRows.length,
    avgScore,
    avgPayout,
    leak,
    days,
    roasts,
    threads: threads.filter(thread => !thread.postedAt).slice(0, 5),
    posted: threads.filter(thread => thread.postedAt).slice(0, 5),
  };
}
