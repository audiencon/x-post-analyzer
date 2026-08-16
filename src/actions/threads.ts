'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { FREE_SAVED_THREADS, isStudioPlan } from '@/config/billing';
import { isScratchDraft, titleFromTweets, type StudioScores } from '@/lib/studio-draft';
import type { Prisma } from '@/generated/prisma/client';

function asTweets(value: unknown): string[] {
  if (!Array.isArray(value)) return [''];
  const tweets = value.filter((item): item is string => typeof item === 'string');
  return tweets.length > 0 ? tweets : [''];
}

export async function listThreads() {
  const user = await getCurrentUser();
  if (!user) return [];

  const threads = await prisma.thread.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 40,
    select: {
      id: true,
      title: true,
      tweets: true,
      roast: true,
      scores: true,
      postedAt: true,
      updatedAt: true,
    },
  });

  return threads.map(thread => ({
    ...thread,
    tweets: asTweets(thread.tweets),
  }));
}

export type SaveThreadResult =
  | { ok: true; id: string; title: string; updatedAt: Date }
  | { ok: false; code: 'auth' | 'missing' | 'cap' | 'scratch'; error: string };

export async function saveThread(input: {
  id?: string;
  tweets: string[];
  roast?: string | null;
  scores?: StudioScores | null;
}): Promise<SaveThreadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, code: 'auth', error: 'Sign in to save drafts.' };
  }

  const tweets = input.tweets.map(tweet => tweet.trimEnd());
  if (isScratchDraft(tweets)) {
    return { ok: false, code: 'scratch', error: 'Write a line first.' };
  }

  const title = titleFromTweets(tweets);
  const scores = input.scores
    ? (input.scores as unknown as Prisma.InputJsonValue)
    : undefined;

  if (input.id) {
    const existing = await prisma.thread.findFirst({
      where: { id: input.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, code: 'missing', error: 'Draft not found.' };
    }

    const updated = await prisma.thread.update({
      where: { id: input.id },
      data: {
        title,
        tweets,
        roast: input.roast ?? undefined,
        scores,
      },
      select: { id: true, title: true, updatedAt: true },
    });
    return { ok: true, ...updated };
  }

  if (!isStudioPlan(user.plan, user.planStatus)) {
    const count = await prisma.thread.count({ where: { userId: user.id } });
    if (count >= FREE_SAVED_THREADS) {
      return {
        ok: false,
        code: 'cap',
        error: `Free and Pro accounts can save ${FREE_SAVED_THREADS} drafts. Studio removes the cap.`,
      };
    }
  }

  const created = await prisma.thread.create({
    data: {
      userId: user.id,
      title,
      tweets,
      roast: input.roast ?? undefined,
      scores,
    },
    select: { id: true, title: true, updatedAt: true },
  });
  return { ok: true, ...created };
}

export async function markThreadPosted(id: string, posted = true) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Sign in to mark a draft as posted.');
  }

  const existing = await prisma.thread.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    throw new Error('Draft not found.');
  }

  return prisma.thread.update({
    where: { id },
    data: { postedAt: posted ? new Date() : null },
    select: { id: true, postedAt: true },
  });
}

export async function deleteThread(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Sign in to delete drafts.');
  }

  await prisma.thread.deleteMany({
    where: { id, userId: user.id },
  });
}
