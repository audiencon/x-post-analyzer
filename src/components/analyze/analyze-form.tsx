'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzePost } from '@/actions/analyze';
import { getSuggestions } from '@/actions/suggestions';
import type { AnalysisResult, AdvancedAnalytics } from '@/actions/analyze';
import type { Suggestion } from '@/actions/suggestions';
import { AnalysisSkeleton } from '@/components/analysis-skeleton';
import { updateRoastLine } from '@/actions/roasts';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';
import { ScoreDisplay } from './score-display';
import { ScoreComparison } from './score-comparison';
import { FormHeader } from './form-header';
import { InputSection } from './input-section';
import { AnalysisDisplay } from './analysis-display';
import { SuggestionsSection } from './suggestions-section';
import { showGenericError, showUsageLimitToast } from '@/lib/toast-helpers';
import { HOME_POST_MAX, MAX_LENGTH } from '@/config/constants';
import { GOALS, isGoal } from '@/config/niches';
import { streamRoastText } from '@/lib/stream-roast';
import { stashRoastDraft, takeRoastDraft } from '@/lib/roast-draft';
import { track } from '@/lib/analytics';
import { authClient } from '@/lib/auth-client';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';

function redirectToSignIn(draft: string) {
  stashRoastDraft(draft);
  window.location.assign(`/auth/login?next=${encodeURIComponent('/roast')}`);
}

export function AnalyzeForm() {
  const { data: session, isPending } = authClient.useSession();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>(GOALS[0]);
  const [abTestData, setAbTestData] = useState<{
    originalAnalysis: AnalysisResult | null;
    suggestionAnalysis: AnalysisResult | null;
    suggestionContent: string;
  } | null>(null);
  const [streamedRoast, setStreamedRoast] = useState('');
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedGoal = Cookies.get('user-goal');
    if (storedGoal && isGoal(storedGoal)) {
      setSelectedGoal(storedGoal);
    }
    const incomingDraft = takeRoastDraft();
    if (incomingDraft) {
      setContent(incomingDraft);
    }
    try {
      localStorage.removeItem('apiUsageData');
    } catch {
      // ignore
    }
  }, []);

  const handleGoalChange = (goal: string) => {
    setSelectedGoal(goal);
    Cookies.set('user-goal', goal, { expires: 30 });
  };

  const getCharacterCountColor = (count: number) => {
    if (count > HOME_POST_MAX) return 'text-ink-soft';
    if (count >= HOME_POST_MAX) return 'text-white/70';
    return 'text-white/35';
  };

  const getProgressBarColor = (count: number) => {
    if (count > HOME_POST_MAX) return 'bg-ink';
    return 'bg-white/40';
  };

  const handleAnalyze = async (text: string = content) => {
    if (isPending) return;
    if (!session?.user) {
      redirectToSignIn(text);
      return;
    }
    setIsAnalyzing(true);
    setCurrentAnalyzing(text);
    setShowSuggestions(false);
    setSuggestions(null);
    setStreamedRoast('');
    track('roast_started', { goal: selectedGoal });
    try {
      const roastPromise = streamRoastText(text, setStreamedRoast).catch(() => '');
      const result = await analyzePost(text, undefined, selectedGoal);
      const roastLine = await roastPromise;
      if (roastLine) setStreamedRoast(roastLine);
      if (result) {
        if (result.roastId && roastLine) {
          await updateRoastLine(result.roastId, roastLine).catch(() => null);
        }
        track('roast_completed', {
          engagement: result.scores.engagement,
          friendliness: result.scores.friendliness,
          virality: result.scores.virality,
          payout: result.desk?.payout,
        });
        setAnalysis(result);
        setContent(text);
      }
    } catch (error) {
      console.error('Error analyzing post:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('sign in')) {
        redirectToSignIn(text);
      } else if (error instanceof Error && error.message.toLowerCase().includes('limit reached')) {
        showUsageLimitToast({
          message: 'Daily free limit reached',
          description: error.message,
        });
      } else {
        showGenericError('Failed to analyze post', 'Please try again or check your connection.');
      }
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalyzing(null);
    }
  };

  const handleGetSuggestions = async () => {
    setIsGettingSuggestions(true);
    try {
      // Scroll suggestions into view if they are not already visible
      setTimeout(() => {
        if (suggestionsRef.current) {
          const element = suggestionsRef.current;
          const rect = element.getBoundingClientRect();
          // Only scroll if the top of the element is below 80% of the viewport height
          if (rect.top > window.innerHeight * 0.8) {
            const headerOffset = 100; // Adjust as needed
            const offsetPosition = rect.top + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }
      }, 100); // Short delay after setting state
      const result = await getSuggestions(content, undefined, selectedGoal);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('limit reached')) {
        showUsageLimitToast({
          message: 'Daily free limit reached',
          description: error.message,
        });
      } else {
        showGenericError('Failed to get suggestions', 'Please try again or check your connection.');
      }
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  const handleReanalyze = async (text: string) => {
    // Add check for valid text before proceeding
    if (!text || typeof text !== 'string' || text.trim() === '') {
      toast.error('Cannot re-analyze empty content.', {
        className: 'bg-[#1a1a1a] border border-[#333] text-white',
      });
      return;
    }

    // Clear states first
    setAnalysis(null);
    setIsAnalyzing(true);
    setIsGettingSuggestions(true);
    setCurrentAnalyzing(text);
    setSuggestions(null);
    setStreamedRoast('');

    // Scroll to top with a slight delay to ensure state updates have processed
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      // Fallback for Safari
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);

    try {
      const roastPromise = streamRoastText(text, setStreamedRoast).catch(() => '');
      const [analysisResult, suggestionsResult] = await Promise.all([
        analyzePost(text, undefined, selectedGoal),
        getSuggestions(text, undefined, selectedGoal),
      ]);
      const roastLine = await roastPromise;
      if (roastLine) setStreamedRoast(roastLine);

      if (analysisResult) {
        if (analysisResult.roastId && roastLine) {
          await updateRoastLine(analysisResult.roastId, roastLine).catch(() => null);
        }
        setAnalysis(analysisResult);
        setContent(text);
      }
      if (suggestionsResult) {
        setSuggestions(suggestionsResult);
      }
    } catch (error) {
      console.error('Error during reanalysis:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('limit reached')) {
        showUsageLimitToast({
          message: 'Daily free limit reached',
          description: error.message,
        });
      } else {
        showGenericError('Failed to reanalyze post', 'Please try again or check your connection.');
      }
    } finally {
      setIsAnalyzing(false);
      setIsGettingSuggestions(false);
      setCurrentAnalyzing(null);
    }
  };

  const handleSimulateABTest = (suggestion: {
    text: string;
    analytics: AdvancedAnalytics;
    scores: {
      engagement: number;
      friendliness: number;
      virality: number;
    };
  }) => {
    if (!analysis) {
      toast.error('Cannot simulate without initial analysis.', {
        className: 'bg-[#1a1a1a] border border-[#333] text-white',
      });
      return;
    }

    // Directly set the state with available data, no loading needed
    // Construct a structure similar to AnalysisResult for the suggestion part
    const constructedSuggestionAnalysis: Partial<AnalysisResult> = {
      scores: suggestion.scores,
      analytics: suggestion.analytics,
      analysis: undefined,
    };

    setAbTestData({
      originalAnalysis: analysis,
      suggestionAnalysis: constructedSuggestionAnalysis as AnalysisResult, // Assert type for now
      suggestionContent: suggestion.text,
    });
  };

  const handleReturn = () => {
    setAnalysis(null);
    setSuggestions(null);
    setStreamedRoast('');
  };

  return (
    <>
      <AnimatePresence mode="wait">{!analysis && !isAnalyzing && <FormHeader />}</AnimatePresence>

      <div className="w-full space-y-6">
        <div
          id="analysis-section"
          className={cn('relative mx-auto flex w-full max-w-6xl flex-col')}
        >
          <AnimatePresence mode="wait">
            {!analysis && !isAnalyzing && (
              <InputSection
                content={content}
                setContent={setContent}
                selectedGoal={selectedGoal}
                handleGoalChange={handleGoalChange}
                isAnalyzing={isAnalyzing}
                handleAnalyze={handleAnalyze}
                getCharacterCountColor={getCharacterCountColor}
                getProgressBarColor={getProgressBarColor}
                MAX_LENGTH={MAX_LENGTH}
                GOALS={GOALS}
              />
            )}

            {isAnalyzing && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <AnalysisSkeleton streamedRoast={streamedRoast} />
              </motion.div>
            )}

            {analysis && (
              <AnalysisDisplay
                analysis={analysis}
                content={content}
                handleReturn={handleReturn}
                showSuggestions={showSuggestions}
                handleGetSuggestions={handleGetSuggestions}
                isGettingSuggestions={isGettingSuggestions}
                streamedRoast={streamedRoast}
                goal={selectedGoal}
              >
                <SuggestionsSection
                  isGettingSuggestions={isGettingSuggestions}
                  showSuggestions={showSuggestions}
                  suggestions={suggestions}
                  suggestionsRef={suggestionsRef}
                  handleReanalyze={handleReanalyze}
                  handleSimulateABTest={handleSimulateABTest}
                  isAnalyzing={isAnalyzing}
                  currentAnalyzing={currentAnalyzing}
                  studioContext={{
                    roast: streamedRoast,
                    scores: analysis.scores,
                    desk: analysis.desk,
                    goal: selectedGoal,
                  }}
                />
              </AnalysisDisplay>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={!!abTestData} onOpenChange={open => !open && setAbTestData(null)}>
        <AlertDialogOverlay className="bg-desk/80" />
        <AlertDialogContent className="border-rule bg-paper text-copy w-full sm:max-w-4xl">
          <AlertDialogHeader>
            <p className="text-ink-soft text-[11px] tracking-[0.18em] uppercase">Compare</p>
            <AlertDialogTitle className="font-heading text-3xl tracking-tight">
              Which line travels farther?
            </AlertDialogTitle>
          </AlertDialogHeader>

          {abTestData && (
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="grid gap-10 py-6 md:grid-cols-2">
                <div>
                  <p className="text-[11px] tracking-[0.16em] text-white/35 uppercase">The draft</p>
                  <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-white/70">
                    {content}
                  </p>
                  <div className="mt-6">
                    <ScoreDisplay scores={abTestData.originalAnalysis?.scores} />
                  </div>
                </div>
                <div>
                  <p className="text-ink-soft text-[11px] tracking-[0.16em] uppercase">
                    The version
                  </p>
                  <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-white/70">
                    {abTestData.suggestionContent}
                  </p>
                  <div className="mt-6">
                    <ScoreDisplay scores={abTestData.suggestionAnalysis?.scores} />
                  </div>
                </div>
              </div>
              <ScoreComparison
                originalScores={abTestData.originalAnalysis?.scores}
                suggestionScores={abTestData.suggestionAnalysis?.scores}
              />
            </div>
          )}

          <AlertDialogFooter className="mt-6 items-center justify-between gap-4 sm:justify-between">
            <p className="text-xs text-white/35">
              Scores, not a promise. The feed still gets a vote.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {abTestData ? (
                <OpenInStudioButton
                  variant="ghost"
                  className="text-ink-soft hover:text-ink-soft/80 h-auto rounded-none px-0 hover:bg-transparent"
                  draft={{
                    tweets: [abTestData.suggestionContent],
                    roast: streamedRoast,
                    scores: abTestData.suggestionAnalysis?.scores,
                    desk: analysis?.desk,
                    goal: selectedGoal,
                    title: 'Compared version',
                  }}
                  label="Finish this in Studio"
                />
              ) : null}
              <AlertDialogCancel
                onClick={() => setAbTestData(null)}
                className="border-rule bg-transparent text-white hover:bg-white/5"
              >
                Close
              </AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
