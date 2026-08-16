'use client';

import { SuggestionsGrid } from './suggestions-grid';
import type { Suggestion } from '@/actions/suggestions';
import type { AdvancedAnalytics } from '@/actions/analyze';
import type { StudioDraft } from '@/lib/studio-draft';

interface SuggestionsSectionProps {
  isGettingSuggestions: boolean;
  showSuggestions: boolean;
  suggestions: Suggestion[] | null;
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
  handleReanalyze: (text: string) => void;
  handleSimulateABTest: (suggestion: {
    text: string;
    analytics: AdvancedAnalytics;
    scores: {
      engagement: number;
      friendliness: number;
      virality: number;
    };
  }) => void;
  isAnalyzing: boolean;
  currentAnalyzing: string | null;
  studioContext?: Omit<StudioDraft, 'tweets'>;
}

export function SuggestionsSection({
  isGettingSuggestions,
  showSuggestions,
  suggestions,
  suggestionsRef,
  handleReanalyze,
  handleSimulateABTest,
  isAnalyzing,
  currentAnalyzing,
  studioContext,
}: SuggestionsSectionProps) {
  if (!isGettingSuggestions && !(showSuggestions && suggestions)) {
    return <div ref={suggestionsRef} />;
  }

  return (
    <section ref={suggestionsRef} className="mt-16">
      <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">More versions</p>
      <h2 className="font-heading mt-2 text-[clamp(2rem,4vw,3rem)] tracking-tight">
        {isGettingSuggestions ? 'Writing alternatives…' : 'Pick a line. Roast it again.'}
      </h2>
      {showSuggestions && suggestions ? (
        <div className="mt-10">
          <SuggestionsGrid
            suggestions={suggestions}
            onReanalyze={handleReanalyze}
            onSimulateABTest={handleSimulateABTest}
            isAnalyzing={isAnalyzing}
            currentAnalyzing={currentAnalyzing}
            studioContext={studioContext}
          />
        </div>
      ) : null}
    </section>
  );
}
