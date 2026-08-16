'use client';

import Link from 'next/link';
import { ShareRoastButton } from '@/components/roast-card/share-roast-button';
import { buttonVariants } from '@/components/ui/button';
import { asScores } from '@/lib/scores';
import type { AnalysisResult } from '@/actions/analyze';

export function HistoryShareLink({
  id,
  content,
  roast,
  scores,
  isPublic,
}: {
  id: string;
  content: string;
  roast: string;
  scores: unknown;
  isPublic: boolean;
}) {
  const parsed = asScores(scores);
  if (isPublic) {
    return (
      <Link href={`/r/${id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        View public card
      </Link>
    );
  }
  if (!parsed) return null;
  return (
    <ShareRoastButton
      roastId={id}
      content={content}
      roast={roast}
      scores={parsed as AnalysisResult['scores']}
    />
  );
}
