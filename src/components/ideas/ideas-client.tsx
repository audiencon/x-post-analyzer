'use client';

import { useState } from 'react';
import { generateIdeas, type IdeaDraft } from '@/actions/ideas';
import { NICHES } from '@/config/niches';
import { Button } from '@/components/ui/button';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import { track } from '@/lib/analytics';
import { stashRoastDraft } from '@/lib/roast-draft';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function IdeasClient() {
  const router = useRouter();
  const [niche, setNiche] = useState<(typeof NICHES)[number]>('SaaS');
  const [ideas, setIdeas] = useState<IdeaDraft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleGenerate = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await generateIdeas(niche);
      setIdeas(result);
      track('ideas_generated', { niche, count: result.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate ideas.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-12 space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] tracking-[0.16em] text-white/40 uppercase">Niche</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NICHES.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setNiche(item)}
                className={cn(
                  'border px-3 py-1.5 text-sm transition-colors',
                  niche === item
                    ? 'border-[oklch(0.64_0.19_28)] text-[oklch(0.86_0.08_28)]'
                    : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={pending}
          className="rounded-none bg-[oklch(0.64_0.19_28)] text-[oklch(0.98_0.01_80)] hover:bg-[oklch(0.58_0.19_28)]"
        >
          {pending ? 'Writing…' : 'Give me drafts'}
        </Button>
      </div>

      {error ? <p className="text-sm text-[oklch(0.72_0.16_28)]">{error}</p> : null}

      {!ideas && !pending ? (
        <p className="max-w-md text-sm leading-6 text-white/40">
          Pick the room you write in. You get eight slips: a hook, why it works, and a draft ready
          for the red pen.
        </p>
      ) : null}

      {ideas ? (
        <ol className="divide-y divide-white/8 border-y border-white/8">
          {ideas.map((idea, index) => (
            <li key={`${idea.hook}-${index}`} className="grid gap-6 py-10 md:grid-cols-[4rem_1fr]">
              <span className="font-heading text-3xl text-white/20">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-[11px] tracking-[0.16em] text-white/40 uppercase">
                  {idea.angle}
                </p>
                <h2 className="font-heading mt-2 text-2xl leading-snug tracking-tight sm:text-3xl">
                  {idea.hook}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 whitespace-pre-wrap text-white/70">
                  {idea.draft}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-none"
                    onClick={() => {
                      track('idea_roast_clicked', { niche, angle: idea.angle });
                      stashRoastDraft(idea.draft);
                      router.push('/roast');
                    }}
                  >
                    Roast this
                  </Button>
                  <OpenInStudioButton draft={{ tweets: [idea.draft], title: idea.hook }} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
