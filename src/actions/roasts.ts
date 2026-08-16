'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import type { AnalysisResult } from '@/actions/analyze';
import type { Prisma } from '@/generated/prisma/client';
import { asScores } from '@/lib/scores';

export async function saveRoast(content: string, result: AnalysisResult) {
  const user = await getCurrentUser();
  if (!user) return null;

  const roastLine =
    result.analysis?.synthesis ||
    result.analysis?.weaknesses?.[0] ||
    'This draft is trying not to be disliked.';

  return prisma.roast.create({
    data: {
      userId: user.id,
      content,
      roast: roastLine,
      scores: result.scores as unknown as Prisma.InputJsonValue,
      analysis: result as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
}

export async function updateRoastLine(id: string, roast: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const line = roast.trim();
  if (!line) return null;

  await prisma.roast.updateMany({
    where: { id, userId: user.id },
    data: { roast: line },
  });
  return id;
}

export async function listRoasts() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.roast.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      content: true,
      roast: true,
      scores: true,
      isPublic: true,
      createdAt: true,
    },
  });
}

export async function publishRoast(input: {
  id?: string;
  content: string;
  roast: string;
  scores: AnalysisResult['scores'];
  analysis?: AnalysisResult;
}) {
  const user = await getCurrentUser();

  if (input.id) {
    const existing = await prisma.roast.findUnique({
      where: { id: input.id },
      select: { id: true, userId: true },
    });
    if (existing && existing.userId === user?.id) {
      await prisma.roast.update({
        where: { id: existing.id },
        data: { isPublic: true },
      });
      return existing.id;
    }
  }

  const created = await prisma.roast.create({
    data: {
      userId: user?.id,
      content: input.content,
      roast: input.roast,
      scores: input.scores as unknown as Prisma.InputJsonValue,
      analysis: (input.analysis ?? {}) as unknown as Prisma.InputJsonValue,
      isPublic: true,
    },
    select: { id: true },
  });

  return created.id;
}

export async function getPublicRoast(id: string) {
  const roast = await prisma.roast.findFirst({
    where: { id, isPublic: true },
    select: {
      id: true,
      content: true,
      roast: true,
      scores: true,
      createdAt: true,
    },
  });
  if (!roast) return null;
  const scores = asScores(roast.scores);
  if (!scores) return null;
  return { ...roast, scores };
}

export async function listPublicRoastIds() {
  return prisma.roast.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: { id: true, updatedAt: true },
  });
}
