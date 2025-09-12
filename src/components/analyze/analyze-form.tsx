'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzePost } from '@/actions/analyze';
import { getSuggestions } from '@/actions/suggestions';
import type { AnalysisResult, AdvancedAnalytics } from '@/actions/analyze';
import type { Suggestion } from '@/actions/suggestions';
import { AnalysisSkeleton } from '@/components/analysis-skeleton';
import { ApiKeyDialog } from '@/components/api-key-dialog';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { DEFAULT_MODEL } from '@/config/openai';
import { cn } from '@/lib/utils';
import { checkClientRateLimit } from '@/lib/rate-limit';
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
import { InspirationDialog } from '@/components/inspiration/InspirationDialog';
import { showGenericError, showUsageLimitToast } from '@/lib/toast-helpers';
import { MAX_LENGTH, MAX_REQUESTS, USAGE_STORAGE_KEY, WINDOW_MS } from '@/config/constants';

// --- Rate Limiting Constants ---
// --- End Constants ---

// --- Constants for Personalization ---
const NICHES = [
  'General',
  'Tech',
  'Marketing',
  'SaaS',
  'Creator',
  'Writing',
  'E-commerce',
  'Finance',
];
const GOALS = [
  'Engagement (Likes, Replies)',
  'Reach & Virality',
  'Clicks & Traffic',
  'Follows & Growth',
  'Thought Leadership',
];
// --- End Constants ---

export function AnalyzeForm() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>(NICHES[0]);
  const [selectedGoal, setSelectedGoal] = useState<string>(GOALS[0]);
  const [hasVisualContent, setHasVisualContent] = useState<boolean>(false);
  const [abTestData, setAbTestData] = useState<{
    originalAnalysis: AnalysisResult | null;
    suggestionAnalysis: AnalysisResult | null;
    suggestionContent: string;
  } | null>(null);
  const [showInspirationDialog, setShowInspirationDialog] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedModel = Cookies.get('openai-model');
    if (storedModel) {
      setSelectedModel(storedModel);
    }
    const storedNiche = Cookies.get('user-niche');
    if (storedNiche && NICHES.includes(storedNiche)) {
      setSelectedNiche(storedNiche);
    }
    const storedGoal = Cookies.get('user-goal');
    if (storedGoal && GOALS.includes(storedGoal)) {
      setSelectedGoal(storedGoal);
    }
    const savedApiKey = Cookies.get('openai-api-key');
    setIsUsingDefaultKey(!savedApiKey);
  }, []);

  // --- Rate Limiting Helper ---
  const checkUsageLimit = (): boolean => {
    const res = checkClientRateLimit(USAGE_STORAGE_KEY, MAX_REQUESTS, WINDOW_MS);
    if (res.allowed) return true;
    showUsageLimitToast({
      message: `Usage limit reached (${MAX_REQUESTS} requests per hour)`,
      description: `Please try again in ${res.timeLeftMinutes} minute(s).`,
    });
    return false;
  };
  // --- End Rate Limiting Helper ---

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    Cookies.set('openai-model', model, { expires: 30 });
  };

  const handleNicheChange = (niche: string) => {
    setSelectedNiche(niche);
    Cookies.set('user-niche', niche, { expires: 30 });
  };

  const handleGoalChange = (goal: string) => {
    setSelectedGoal(goal);
    Cookies.set('user-goal', goal, { expires: 30 });
  };

  const getCharacterCountColor = (count: number) => {
    if (count >= MAX_LENGTH) return 'text-red-500';
    if (count >= MAX_LENGTH * 0.9) return 'text-yellow-500';
    if (count >= MAX_LENGTH * 0.7) return 'text-orange-500';
    return 'text-green-500';
  };

  const getProgressBarColor = (count: number) => {
    if (count >= MAX_LENGTH) return 'bg-red-500';
    if (count >= MAX_LENGTH * 0.9) return 'bg-yellow-500';
    if (count >= MAX_LENGTH * 0.7) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const handleAnalyze = async (text: string = content) => {
    // Apply rate limit only when using the default API key
    if (!checkUsageLimit()) return;

    setIsAnalyzing(true);
    setCurrentAnalyzing(text);
    setShowSuggestions(false);
    setSuggestions(null);
    try {
      const result = await analyzePost(text, selectedNiche, selectedGoal, hasVisualContent);
      if (result) {
        setAnalysis(result);
        setContent(text);
      }
    } catch (error) {
      console.error('Error analyzing post:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        setShowApiKeyDialog(true);
      } else if (error instanceof Error && error.message.includes('Usage limit reached')) {
        showUsageLimitToast({
          message: 'Usage limit reached',
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
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
    // Apply rate limit only when using the default API key
    if (!checkUsageLimit()) return;

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
      const result = await getSuggestions(content, selectedNiche, selectedGoal, hasVisualContent);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        showUsageLimitToast({
          message: 'Usage limit reached',
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
        });
      } else {
        showGenericError('Failed to get suggestions', 'Please try again or check your connection.');
      }
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  const handleReanalyze = async (text: string) => {
    // Apply rate limit only when using the default API key
    if (!checkUsageLimit()) return;

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
      // Run analysis and get suggestions in parallel
      const [analysisResult, suggestionsResult] = await Promise.all([
        analyzePost(text, selectedNiche, selectedGoal, hasVisualContent),
        getSuggestions(text, selectedNiche, selectedGoal, hasVisualContent),
      ]);

      if (analysisResult) {
        setAnalysis(analysisResult);
        setContent(text);
      }
      if (suggestionsResult) {
        setSuggestions(suggestionsResult);
      }
    } catch (error) {
      console.error('Error during reanalysis:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        setShowApiKeyDialog(true);
      } else if (error instanceof Error && error.message.includes('Usage limit reached')) {
        showUsageLimitToast({
          message: 'Usage limit reached',
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
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

  const handleApiKeySave = () => {
    setIsUsingDefaultKey(false);
    setShowApiKeyDialog(false);
  };

  const handleReturn = () => {
    setAnalysis(null);
    setSuggestions(null);
  };

  // Handler for when an example is selected in the dialog
  const handleInspirationSelect = (selectedText: string) => {
    setContent(selectedText); // Update the main text area content
    // Dialog closure is handled within InspirationDialog via onClose
  };

  return (
    <>
      <AnimatePresence mode="wait">{!analysis && !isAnalyzing && <FormHeader />}</AnimatePresence>

      <div className="w-full space-y-6">
        <div
          id="analysis-section"
          className={cn('relative mx-auto flex w-full max-w-6xl flex-col items-center')}
        >
          <AnimatePresence mode="wait">
            {!analysis && !isAnalyzing && (
              <InputSection
                content={content}
                setContent={setContent}
                selectedNiche={selectedNiche}
                handleNicheChange={handleNicheChange}
                selectedGoal={selectedGoal}
                handleGoalChange={handleGoalChange}
                selectedModel={selectedModel}
                handleModelChange={handleModelChange}
                isAnalyzing={isAnalyzing}
                isUsingDefaultKey={isUsingDefaultKey}
                handleAnalyze={handleAnalyze}
                setShowApiKeyDialog={setShowApiKeyDialog}
                getCharacterCountColor={getCharacterCountColor}
                getProgressBarColor={getProgressBarColor}
                MAX_LENGTH={MAX_LENGTH}
                NICHES={NICHES}
                GOALS={GOALS}
                hasVisualContent={hasVisualContent}
                setHasVisualContent={setHasVisualContent}
                onShowInspiration={() => setShowInspirationDialog(true)}
              />
            )}

            {isAnalyzing && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <AnalysisSkeleton />
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
                apiKey={Cookies.get('openai-api-key') || ''}
              />
            )}
          </AnimatePresence>
        </div>

        <SuggestionsSection
          isGettingSuggestions={isGettingSuggestions}
          showSuggestions={showSuggestions}
          suggestions={suggestions}
          suggestionsRef={suggestionsRef}
          handleReanalyze={handleReanalyze}
          handleSimulateABTest={handleSimulateABTest}
          isAnalyzing={isAnalyzing}
          currentAnalyzing={currentAnalyzing}
        />
      </div>

      <ApiKeyDialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        onSave={handleApiKeySave}
      />

      <AlertDialog open={!!abTestData} onOpenChange={open => !open && setAbTestData(null)}>
        <AlertDialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <AlertDialogContent className="w-full border-[#333] bg-[#1a1a1a] text-white sm:max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">A/B Simulation</AlertDialogTitle>
          </AlertDialogHeader>

          {abTestData && (
            <div className="max-h-[70vh] overflow-y-auto p-1 pr-3">
              <>
                <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
                  <div className="flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white/80">Original</h3>
                      <div className="min-h-[120px] rounded-md border border-[#2a2a2a] bg-[#222] p-3 text-sm text-white/90">
                        {content}
                      </div>
                    </div>
                    <ScoreDisplay scores={abTestData.originalAnalysis?.scores} />
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white/80">Suggestion</h3>
                      <div className="min-h-[120px] rounded-md border border-[#2a2a2a] bg-[#222] p-3 text-sm text-white/90">
                        {abTestData.suggestionContent}
                      </div>
                    </div>
                    <ScoreDisplay scores={abTestData.suggestionAnalysis?.scores} />
                  </div>
                </div>

                <div className="mt-4">
                  <ScoreComparison
                    originalScores={abTestData.originalAnalysis?.scores}
                    suggestionScores={abTestData.suggestionAnalysis?.scores}
                  />
                </div>
              </>
            </div>
          )}

          <AlertDialogFooter className="mt-4 gap-5">
            <p className="text-xs text-white/50">
              * This simulation compares scores based on AI analysis metrics. It does not guarantee
              real-world engagement differences.
            </p>
            <AlertDialogCancel
              onClick={() => setAbTestData(null)}
              className="border-[#333] bg-[#2a2a2a] text-white hover:bg-[#333]"
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InspirationDialog
        open={showInspirationDialog}
        onClose={() => setShowInspirationDialog(false)}
        onExampleSelect={handleInspirationSelect}
        initialNiche={selectedNiche}
        initialGoal={selectedGoal}
        niches={NICHES}
      />
    </>
  );
}
