'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowUp, Loader2, Key, Sparkles, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/config/openai';
import { getViralRewrite } from '@/actions/viralRewrite';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { PostPreviewSpot } from '../spots/post-preview-spot';
import { checkClientRateLimit } from '@/lib/rate-limit';
import { buildViralRewritePrompt } from '@/lib/prompt-builders';
import { showGenericError, showUsageLimitToast } from '@/lib/toast-helpers';
import { MAX_REQUESTS, USAGE_STORAGE_KEY, WINDOW_MS } from '@/config/constants';

// Constants passed as props or defined here if static
// const NICHES = [...];
// const GOALS = [...];

// Constants

// --- Rate Limiting Constants ---
// --- End Constants ---

// --- End Types ---

// --- Custom Markdown Components with Tailwind Styling ---
const markdownComponents: Components = {
  p: ({ ...props }) => <p className="" {...props} />,
  a: ({ ...props }) => <a className="text-blue-400 underline hover:text-blue-300" {...props} />,
  ul: ({ ...props }) => <ul className="list-inside list-disc pl-4" {...props} />,
  ol: ({ ...props }) => <ol className="list-inside list-decimal pl-4" {...props} />,
  li: ({ ...props }) => <li className="" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
  // Add more custom components here for headings, code blocks, etc. if needed
};
// --- End Custom Markdown Components ---

// --- Viral Styles Definition ---
const VIRAL_STYLES = [
  {
    name: 'Threadstorm',
    description:
      'Classic viral mega-thread. Hook, value-packed info, end with a CTA. Use "🧵" or ":" in the first tweet.',
  },
  {
    name: "Provocateur's Path",
    description:
      'Controversial or emotionally charged statement that dares people to respond. Use bold claims + exclusivity.',
  },
  {
    name: 'AI Odyssey',
    description:
      'Show how you used different AI tools to solve the same problem. Great for demos, experiments, and geeky audiences.',
  },
  {
    name: "Trendsetter's Teach",
    description:
      'Educational content about something trending. Teach it simply, give real value, end with insight or tool.',
  },
  {
    name: 'Bulletproof Breakdown',
    description:
      'Listicle-style tweet. Each line 3–5 words, all caps or symbols. Optimize for skimmability.',
  },
  {
    name: 'Contrarian Chronicles',
    description:
      'Take a hot topic and flip it. Use "Stop..." or "You have been lied to..." style openings. Challenge the norm.',
  },
  {
    name: 'Flamebait Flash',
    description:
      'Bold opinion, usually offensive to a large group or common belief. Short, sharp, controversial. (Use responsibly!)',
  },
  {
    name: 'Literal Lens',
    description:
      'Use the word "literally" to exaggerate something relatable or absurd. Humor and drama packed into one-liners.',
  },
  {
    name: 'Inquiry Ignite',
    description:
      'Ask a big question relevant to your niche or community. Bonus if answers drive discussion. Engagement magnet.',
  },
  {
    name: 'Lifestyle Lens',
    description:
      'Show your lifestyle or workflow. Add visual tension or contrast. Great for building personal brand.',
  },
  {
    name: 'Delusion Dive',
    description:
      'Post an exaggerated/unrealistic claim ("I made $20k sleeping"), then later explain. Creates curiosity & debate.',
  },
  {
    name: 'Debunk Dispatch',
    description:
      'Quote-tweet a false claim or idea and dismantle it with receipts or sharp logic. Inflammatory, but factual.',
  },
  {
    name: 'Dystopian Dispatch',
    description:
      'Share a "Black Mirror" style prediction, especially involving AI or tech. Spooky but technically possible.',
  },
];
// --- End Viral Styles ---

interface InputSectionProps {
  content: string;
  setContent: (content: string) => void;
  selectedNiche: string;
  handleNicheChange: (niche: string) => void;
  selectedGoal: string;
  handleGoalChange: (goal: string) => void;
  selectedModel: string;
  handleModelChange: (model: string) => void;
  isAnalyzing: boolean;
  isUsingDefaultKey: boolean;
  handleAnalyze: (text: string) => void;
  setShowApiKeyDialog: (show: boolean) => void;
  getCharacterCountColor: (count: number) => string;
  getProgressBarColor: (count: number) => string;
  MAX_LENGTH: number;
  NICHES: readonly string[];
  GOALS: readonly string[];
  hasVisualContent: boolean;
  setHasVisualContent: (checked: boolean) => void;
  onShowInspiration: () => void;
}

const slideUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
  transition: { duration: 0.5 },
};

const analysis = {
  scores: {
    engagement: 10,
    friendliness: 20,
    virality: 30,
  },
};

export function InputSection({
  content,
  setContent,
  selectedNiche,
  handleNicheChange,
  selectedGoal,
  handleGoalChange,
  selectedModel,
  handleModelChange,
  isAnalyzing,
  isUsingDefaultKey,
  handleAnalyze,
  setShowApiKeyDialog,
  getCharacterCountColor,
  getProgressBarColor,
  MAX_LENGTH,
  NICHES,
  GOALS,
  hasVisualContent,
  setHasVisualContent,
  onShowInspiration,
}: InputSectionProps) {
  const [selectedViralStyle, setSelectedViralStyle] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);
  const [limitRewriteTo280, setLimitRewriteTo280] = useState<boolean>(false);

  // Clear rewrite result if main content changes
  useEffect(() => {
    setRewriteResult(null);
  }, [content]);

  // --- Rate Limiting Helper (for Rewrites) ---
  const checkUsageLimit = (): boolean => {
    const res = checkClientRateLimit(USAGE_STORAGE_KEY, MAX_REQUESTS, WINDOW_MS);
    if (res.allowed) return true;
    showUsageLimitToast({
      message: `Rewrite limit reached (${MAX_REQUESTS} per hour)`,
      description: `Please try again in ${res.timeLeftMinutes} minute(s).`,
    });
    return false;
  };
  // --- End Rate Limiting Helper ---

  const constructViralPrompt = (styleName: string, draft: string): string =>
    buildViralRewritePrompt(styleName, draft, limitRewriteTo280);

  const handleViralRewrite = async () => {
    if (!selectedViralStyle || !content.trim()) return;

    // Apply rate limit only when using the default API key
    if (!checkUsageLimit()) return; // Use the new checkUsageLimit function

    // No need for API key existence check here, handled by checkUsageLimit implicitly for default
    // and assumed valid if user provided one.
    // if (!currentApiKey) { setShowApiKeyDialog(true); return; } // Kept commented for reference

    setIsRewriting(true);
    setRewriteResult(null);
    const fullPrompt = constructViralPrompt(selectedViralStyle, content);

    try {
      const result = await getViralRewrite(fullPrompt, selectedModel);
      setRewriteResult(result);
    } catch (error) {
      console.error('Error getting viral rewrite:', error);
      if (error instanceof Error && error.message.includes('Usage limit reached')) {
        showUsageLimitToast({
          message: 'Usage limit reached',
          description:
            "You've reached the limit of 10 requests per hour. Please try again later or add your own API key for unlimited usage.",
        });
      } else {
        showGenericError(
          'Failed to get viral rewrite',
          'Please try again or check your connection.'
        );
      }
    } finally {
      setIsRewriting(false);
    }
  };

  const handleUseRewrite = () => {
    if (rewriteResult) {
      setContent(rewriteResult);
      setRewriteResult(null); // Clear result after using
    }
  };

  const handleCopyRewrite = () => {
    if (rewriteResult) {
      navigator.clipboard
        .writeText(rewriteResult)
        .then(() => {
          toast.success('Rewrite copied!', {
            className: 'bg-[#1a1a1a] border border-[#333] text-white',
          });
        })
        .catch(err => {
          console.error('Failed to copy rewrite:', err);
          toast.error('Failed to copy rewrite.', {
            className: 'bg-[#1a1a1a] border border-[#333] text-white',
          });
        });
    }
  };

  // Find the description outside the return statement for clarity
  const selectedStyleDescription = VIRAL_STYLES.find(
    s => s.name === selectedViralStyle
  )?.description;

  return (
    <motion.div key="input" className="relative mx-auto w-full max-w-6xl space-y-4" {...slideUp}>
      {/* Combined Goal Select and Visual Switch Row */}
      <div className="mx-auto flex max-w-2xl items-end justify-between gap-4">
        <div className="flex flex-col">
          <Label htmlFor="goal-select" className="mb-2 block text-sm font-medium text-white/60">
            Primary Goal
          </Label>
          <Select
            value={selectedGoal}
            onValueChange={handleGoalChange}
            disabled={isAnalyzing || isRewriting}
          >
            <SelectTrigger
              id="goal-select"
              className="w-full border-0 bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/20"
            >
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent className="border border-[#333] bg-[#1a1a1a] text-white">
              {GOALS.map(goal => (
                <SelectItem key={goal} value={goal} className="cursor-pointer hover:bg-[#2a2a2a]">
                  {goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Visual Content Switch */}
        <div className="flex items-center space-x-2 pb-2">
          <Switch
            id="visual-content-switch"
            checked={hasVisualContent}
            onCheckedChange={setHasVisualContent}
            disabled={isAnalyzing || isRewriting}
            aria-label="Post includes image or video"
          />
          <Label htmlFor="visual-content-switch" className="text-sm font-medium text-white/60">
            Post includes image or video
          </Label>
        </div>
      </div>

      {/* Removed Niche Select from here */}
      {/* Removed full-width Inspiration Button from here */}

      <div className="relative mx-auto max-w-2xl">
        <Textarea
          placeholder="What's on your mind? Paste or type your X post here..."
          value={content}
          onChange={e => {
            const text = e.target.value;
            // Ensure MAX_LENGTH check remains or is passed via props
            if (text.length <= MAX_LENGTH) {
              setContent(text);
            }
          }}
          maxLength={MAX_LENGTH}
          disabled={isAnalyzing || isRewriting}
          className="monospace min-h-[200px] w-full resize-none rounded-xl border-0 bg-[#1a1a1a] pr-24 pb-14 text-white transition-all duration-300 placeholder:text-gray-500 focus:border-transparent focus:ring-1 focus:ring-white/20"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <span
            className={cn(
              'monospace text-sm font-medium transition-colors duration-200',
              getCharacterCountColor(content.length)
            )}
          >
            {content.length}/{MAX_LENGTH}
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-[#333]">
            <div
              className={cn(
                'h-full transition-all duration-200',
                getProgressBarColor(content.length)
              )}
              style={{
                width: `${Math.min((content.length / MAX_LENGTH) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        {/* Updated Textarea Bottom Bar */}
        <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between rounded-2xl bg-[#1a1a1a] px-3 py-2">
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedModel}
              onValueChange={handleModelChange}
              disabled={isAnalyzing || isUsingDefaultKey || isRewriting}
            >
              <SelectTrigger className="h-8 w-auto border-none bg-[#2a2a2a] px-3 text-xs text-white">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="border border-[#333] bg-[#1a1a1a] text-white">
                {AVAILABLE_MODELS.map(model => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="cursor-pointer text-xs hover:bg-[#2a2a2a]"
                    disabled={isUsingDefaultKey && model.id !== DEFAULT_MODEL}
                  >
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyDialog(true)}
              className="h-8 gap-1 px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
              disabled
            >
              <Key className="h-3 w-3" />
              <span>Or use your key</span>
            </Button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedNiche}
              onValueChange={handleNicheChange}
              disabled={isAnalyzing || isRewriting}
            >
              <SelectTrigger
                id="niche-select-bottom"
                className="h-8 w-auto border-none bg-[#2a2a2a] px-3 text-xs text-white placeholder:text-gray-400 focus:ring-0"
                aria-label="Choose a niche"
              >
                <SelectValue placeholder="Choose a niche" />
              </SelectTrigger>
              <SelectContent className="border border-[#333] bg-[#1a1a1a] text-white">
                {NICHES.map(niche => (
                  <SelectItem
                    key={niche}
                    value={niche}
                    className="cursor-pointer text-xs hover:bg-[#2a2a2a]"
                  >
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Inspiration Icon Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onShowInspiration}
              className="relative h-8 w-8 shrink-0 overflow-hidden border-0 bg-[#2a2a2a] p-[1px] text-white/60 hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 focus:outline-none"
              aria-label="Show Inspiration Library"
              disabled={isAnalyzing || isRewriting}
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-sm bg-[#2a2a2a] px-3 py-1 text-sm font-medium backdrop-blur-3xl">
                <Sparkles className="h-4 w-4" />
              </span>
            </Button>
            {/* Analyze Button */}
            <Button
              onClick={() => handleAnalyze(content)}
              disabled={!content.trim() || isAnalyzing || isRewriting}
              variant="secondary"
              size="icon"
              className="group h-8 w-8 cursor-pointer"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Viral Rewrite Section */}
      <div className="mx-auto max-w-2xl space-y-3 border-t border-white/10 pt-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <div className="space-y-1.5">
            <Select
              value={selectedViralStyle}
              onValueChange={setSelectedViralStyle}
              disabled={isRewriting || isAnalyzing}
            >
              <SelectTrigger
                id="viral-style-select"
                className="w-full border-0 bg-[#2a2a2a] text-white placeholder:text-gray-400 focus:ring-1 focus:ring-white/20"
              >
                <SelectValue placeholder="Choose viral style for rewrite..." />
              </SelectTrigger>
              <SelectContent className="border border-[#333] bg-[#1a1a1a] text-white">
                {VIRAL_STYLES.map(style => (
                  <SelectItem
                    key={style.name}
                    value={style.name}
                    className="cursor-pointer hover:bg-[#2a2a2a]"
                  >
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Display description using ReactMarkdown */}
            {selectedViralStyle && selectedStyleDescription && (
              <div className="prose prose-sm prose-invert max-w-none px-1 text-xs text-white/60">
                <ReactMarkdown components={markdownComponents}>
                  {selectedStyleDescription}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <Button
            onClick={handleViralRewrite}
            disabled={!content.trim() || !selectedViralStyle || isRewriting || isAnalyzing}
            variant="outline"
            className="relative shrink-0 self-start overflow-hidden border-0 border-white/20 bg-[#2a2a2a] p-[1px] text-white/80 hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 focus:outline-none"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-sm bg-[#2a2a2a] px-3 py-1 text-sm font-medium backdrop-blur-3xl">
              {isRewriting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Rewrite
            </span>
          </Button>
        </div>

        {/* Character Limit Switch */}
        <div className="flex items-center justify-start space-x-2 pt-1 pl-1">
          <Switch
            id="limit-chars-switch"
            checked={limitRewriteTo280}
            onCheckedChange={setLimitRewriteTo280}
            disabled={isRewriting || isAnalyzing}
            aria-label="Limit rewrite to 280 characters"
          />
          <Label htmlFor="limit-chars-switch" className="text-xs font-medium text-white/60">
            Limit rewrite to 280 characters (for non-X Premium)
          </Label>
        </div>

        {rewriteResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-2 rounded-lg border border-purple-500/30 bg-[#2a2a2a]/30 p-4 shadow-inner"
          >
            <Label className="text-xs font-medium text-purple-300/80">Rewrite Suggestion:</Label>
            <div className="prose prose-sm prose-invert max-w-none text-sm whitespace-pre-wrap text-white/90">
              <ReactMarkdown components={markdownComponents}>{rewriteResult}</ReactMarkdown>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyRewrite}
                className="h-7 gap-1 px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUseRewrite}
                className="h-7 px-3 text-xs"
              >
                Roast it
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      <div className="grid gap-3 pt-10 md:grid-cols-3">
        <PostPreviewSpot id="spot-analysis-bottom-1" content={content} scores={analysis.scores} />
        <PostPreviewSpot id="spot-analysis-bottom-2" content={content} scores={analysis.scores} />
        <PostPreviewSpot id="spot-analysis-bottom-3" content={content} scores={analysis.scores} />
      </div>
    </motion.div>
  );
}
