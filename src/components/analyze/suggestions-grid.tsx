'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { InkScore } from '@/components/tool/ink-score';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import type { Suggestion } from '@/actions/suggestions';
import type { StudioDraft } from '@/lib/studio-draft';

interface SuggestionsGridProps {
  suggestions: Suggestion[];
  onReanalyze: (text: string) => void;
  onSimulateABTest: (suggestion: Suggestion) => void;
  isAnalyzing: boolean;
  currentAnalyzing: string | null;
  studioContext?: Omit<StudioDraft, 'tweets'>;
}

export function SuggestionsGrid({
  suggestions,
  onReanalyze,
  onSimulateABTest,
  isAnalyzing,
  currentAnalyzing,
  studioContext,
}: SuggestionsGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Copied.');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Could not copy.');
    }
  };

  return (
    <div className="grid gap-10 md:grid-cols-3">
      {suggestions.map((suggestion, index) => {
        const isCurrentlyAnalyzing = currentAnalyzing === suggestion.text;

        return (
          <article key={suggestion.text} className="border-t border-white/8 pt-5">
            <p className="font-heading text-sm text-white/30">
              {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-5 text-[0.98rem] leading-7 whitespace-pre-wrap text-white/80">
              {suggestion.text}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <InkScore
                label="Engage"
                value={suggestion.scores.engagement}
                sting={suggestion.scores.engagement < 55}
                compact
              />
              <InkScore
                label="Warmth"
                value={suggestion.scores.friendliness}
                sting={suggestion.scores.friendliness < 55}
                compact
              />
              <InkScore
                label="Viral"
                value={suggestion.scores.virality}
                sting={suggestion.scores.virality < 55}
                compact
              />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/40">
              <OpenInStudioButton
                variant="ghost"
                className="h-auto rounded-none px-0 text-xs text-white/40 hover:bg-transparent hover:text-white"
                draft={{ tweets: [suggestion.text], ...studioContext }}
                label="Studio"
              />
              <button
                type="button"
                onClick={() => handleCopy(suggestion.text, index)}
                className="hover:text-white"
              >
                {copiedIndex === index ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => onReanalyze(suggestion.text)}
                disabled={isAnalyzing}
                className="hover:text-white disabled:opacity-40"
              >
                {isCurrentlyAnalyzing ? 'Reading…' : 'Roast this'}
              </button>
              <button
                type="button"
                onClick={() => onSimulateABTest(suggestion)}
                disabled={isAnalyzing}
                className="hover:text-white disabled:opacity-40"
              >
                Compare
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
