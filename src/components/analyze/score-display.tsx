'use client';

import { InkScore } from '@/components/tool/ink-score';
import type { AnalysisResult } from '@/actions/analyze';

interface ScoreDisplayProps {
  scores: AnalysisResult['scores'] | undefined | null;
}

export function ScoreDisplay({ scores }: ScoreDisplayProps) {
  if (!scores) return <p className="text-sm text-white/40">Scores not available.</p>;

  const globalScore = Math.round(
    (scores.engagement + scores.friendliness + scores.virality) / 3
  );

  return (
    <div>
      <p className="font-heading text-5xl tracking-tight text-copy">{globalScore}</p>
      <p className="mt-1 text-[11px] tracking-[0.16em] text-white/30 uppercase">of 100</p>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <InkScore label="Engage" value={scores.engagement} sting={scores.engagement < 55} compact />
        <InkScore
          label="Warmth"
          value={scores.friendliness}
          sting={scores.friendliness < 55}
          compact
        />
        <InkScore label="Viral" value={scores.virality} sting={scores.virality < 55} compact />
      </div>
    </div>
  );
}
