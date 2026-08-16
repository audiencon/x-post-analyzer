'use client';

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
import { cn } from '@/lib/utils';
import { HOME_POST_MAX } from '@/config/constants';
import { LiveDesk } from './desk-flags';

interface InputSectionProps {
  content: string;
  setContent: (content: string) => void;
  selectedGoal: string;
  handleGoalChange: (goal: string) => void;
  isAnalyzing: boolean;
  handleAnalyze: (text: string) => void;
  getCharacterCountColor: (count: number) => string;
  getProgressBarColor: (count: number) => string;
  MAX_LENGTH: number;
  GOALS: readonly string[];
}

export function InputSection({
  content,
  setContent,
  selectedGoal,
  handleGoalChange,
  isAnalyzing,
  handleAnalyze,
  getCharacterCountColor,
  getProgressBarColor,
  MAX_LENGTH,
  GOALS,
}: InputSectionProps) {
  return (
    <motion.div
      key="input"
      className="relative mx-auto w-full max-w-3xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-6 max-w-xs">
        <Select
          value={selectedGoal}
          onValueChange={value => {
            if (value) handleGoalChange(value);
          }}
          disabled={isAnalyzing}
        >
          <SelectTrigger
            aria-label="Goal"
            className="w-full rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm text-white/70 shadow-none"
          >
            <SelectValue placeholder="Goal" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[oklch(0.16_0.016_50)] text-white">
            {GOALS.map(goal => (
              <SelectItem key={goal} value={goal}>
                {goal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="tool-paper relative">
        <Textarea
          placeholder="Paste the Home post."
          value={content}
          onChange={e => {
            const text = e.target.value;
            if (text.length <= MAX_LENGTH) setContent(text);
          }}
          maxLength={MAX_LENGTH}
          disabled={isAnalyzing}
          className="min-h-[280px] w-full resize-none rounded-none border-0 bg-transparent px-6 pt-6 pb-16 text-base leading-7 text-copy shadow-none placeholder:text-white/30 focus-visible:ring-0"
        />
        <div className="absolute top-5 right-6 text-right">
          <span className={cn('text-xs tabular-nums', getCharacterCountColor(content.length))}>
            {content.length}/{HOME_POST_MAX}
          </span>
          <div className="mt-2 h-px w-16 bg-white/10">
            <div
              className={cn('h-px', getProgressBarColor(content.length))}
              style={{ width: `${Math.min((content.length / HOME_POST_MAX) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-white/8 px-4 py-3">
          <Button
            onClick={() => handleAnalyze(content)}
            disabled={!content.trim() || isAnalyzing}
            className="rounded-none bg-ink text-[oklch(0.98_0.01_80)] hover:bg-[oklch(0.58_0.19_28)]"
          >
            {isAnalyzing ? 'Reading…' : 'Roast it'}
          </Button>
        </div>
      </div>

      <LiveDesk content={content} />
    </motion.div>
  );
}
