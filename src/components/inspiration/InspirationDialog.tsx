'use client';

import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getInspirationExamples, type InspirationExample } from '@/actions/inspiration';
import { NICHES } from '@/config/niches';
import { cn } from '@/lib/utils';
import { InspirationCard } from './InspirationCard';

const NICHE_TOPICS: Record<string, string[]> = {
  Tech: ['Startup', 'SaaS', 'AI', 'Programming', 'Developer'],
  Marketing: ['Marketing', 'SEO', 'Audience building', 'Digital Marketing'],
  SaaS: ['SaaS', 'Startup', 'MRR', 'Productivity'],
  Creator: ['build in public', 'indiehackers', 'productivity', 'vibe coding', 'coding', 'developer'],
  Writing: ['Copywriting', 'Content Marketing', 'Blogging', 'Freelancing'],
  'E-commerce': ['E-commerce', 'Retail'],
  Finance: ['Finance', 'Investment', 'Personal Finance', 'Stocks', 'Cryptocurrency'],
  General: ['Startup', 'Marketing', 'Productivity', 'Personal Branding'],
};

interface InspirationDialogProps {
  open: boolean;
  onClose: () => void;
  onExampleSelect: (text: string) => void;
  initialNiche?: string;
  niches?: readonly string[];
}

export function InspirationDialog({
  open,
  onClose,
  onExampleSelect,
  initialNiche = 'General',
  niches = NICHES,
}: InspirationDialogProps) {
  const [selectedNiche, setSelectedNiche] = useState(initialNiche);
  const [handleQuery, setHandleQuery] = useState('');
  const [examples, setExamples] = useState<InspirationExample[]>([]);
  const [isPending, startTransition] = useTransition();
  const debouncedHandle = useDebounce(handleQuery, 400);

  useEffect(() => {
    if (!open) return;
    setSelectedNiche(initialNiche);
    setHandleQuery('');
  }, [open, initialNiche]);

  useEffect(() => {
    if (!open) return;

    const handle = debouncedHandle.trim().replace(/^@/, '');
    const searchQuery = handle
      ? `@${handle}`
      : (NICHE_TOPICS[selectedNiche] ?? NICHE_TOPICS.General ?? ['Startup']).join(',');
    const context = handle ? `@${handle}` : selectedNiche;

    startTransition(async () => {
      const next = await getInspirationExamples(searchQuery, context);
      setExamples(next);
    });
  }, [open, selectedNiche, debouncedHandle]);

  const handle = handleQuery.trim().replace(/^@/, '');
  const shelf = handle ? `@${handle}` : selectedNiche;

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[min(88vh,52rem)] w-full max-w-3xl flex-col gap-0 rounded-none bg-[oklch(0.15_0.014_50)] p-0 text-[oklch(0.93_0.015_80)] ring-1 ring-white/8 sm:max-w-3xl"
        showCloseButton
      >
        <DialogHeader className="border-b border-white/8 px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-[0.2em] text-[oklch(0.68_0.18_28)] uppercase">
            Library
          </p>
          <DialogTitle className="font-heading mt-2 text-3xl tracking-tight">
            Posts that already worked
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-md text-sm leading-6 text-white/45">
            Steal the shape, not the sentence. Use this line puts it in the draft.
          </DialogDescription>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
            {niches.map(niche => (
              <button
                key={niche}
                type="button"
                onClick={() => {
                  setSelectedNiche(niche);
                  setHandleQuery('');
                }}
                disabled={isPending && !handle}
                className={cn(
                  'text-[11px] tracking-[0.14em] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40',
                  !handle && selectedNiche === niche
                    ? 'text-[oklch(0.78_0.1_28)]'
                    : 'text-white/32 hover:text-white'
                )}
              >
                {niche}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="sr-only">Search a handle</span>
            <input
              type="text"
              value={handleQuery}
              onChange={event => setHandleQuery(event.target.value)}
              placeholder="A handle — without the @"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full border-0 border-b border-white/10 bg-transparent text-sm text-white outline-none placeholder:text-white/28 focus-visible:border-white/35"
            />
          </label>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="flex items-baseline justify-between pt-5">
            <p className="text-[11px] tracking-[0.16em] text-white/30 uppercase">{shelf}</p>
            <p className="text-[11px] text-white/28">
              {isPending ? 'Reading…' : `${examples.length} ${examples.length === 1 ? 'post' : 'posts'}`}
            </p>
          </div>

          {isPending ? (
            <div className="divide-y divide-white/8">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="py-6">
                  <div className="h-3 w-10 bg-white/8" />
                  <div className="mt-4 h-5 w-full bg-white/7" />
                  <div className="mt-2 h-5 w-4/5 bg-white/6" />
                  <div className="mt-2 h-5 w-2/5 bg-white/5" />
                </div>
              ))}
            </div>
          ) : examples.length > 0 ? (
            <div>
              {examples.map((example, index) => (
                <InspirationCard
                  key={example.id}
                  example={example}
                  index={index}
                  onSelect={text => {
                    onExampleSelect(text);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="py-16 text-sm leading-6 text-white/40">
              Nothing on this shelf. Try another desk, or a handle that actually posts.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
