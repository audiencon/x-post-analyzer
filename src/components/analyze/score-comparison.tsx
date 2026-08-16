'use client';

import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/actions/analyze';

interface ScoreComparisonProps {
  originalScores: AnalysisResult['scores'] | undefined | null;
  suggestionScores: AnalysisResult['scores'] | undefined | null;
}

const METRICS = [
  { key: 'engagement', label: 'Engage' },
  { key: 'friendliness', label: 'Warmth' },
  { key: 'virality', label: 'Viral' },
] as const;

export function ScoreComparison({ originalScores, suggestionScores }: ScoreComparisonProps) {
  if (!originalScores || !suggestionScores) return null;

  return (
    <dl className="grid grid-cols-3 gap-6 border-t border-rule pt-6">
      {METRICS.map(metric => {
        const diff = suggestionScores[metric.key] - originalScores[metric.key];
        return (
          <div key={metric.key}>
            <dt className="text-[11px] tracking-[0.16em] text-white/35 uppercase">{metric.label}</dt>
            <dd
              className={cn(
                'font-heading mt-1 text-2xl tracking-tight',
                diff > 0 ? 'text-copy' : diff < 0 ? 'text-ink-soft' : 'text-white/50'
              )}
            >
              {diff > 0 ? `+${diff}` : diff}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
