'use client';

import { useState } from 'react';
import { rewritePost } from '@/actions/rewrite';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import creatorsData from '@/data/creators.json';
import { toast } from 'sonner';

interface Tweet {
  text: string;
  metrics: {
    likes: number;
    comments: number;
    reposts: number;
  };
}

interface Creator {
  name: string;
  handle: string;
  avatar: string;
  recentTweets: Tweet[];
}

interface Example {
  creator: Creator;
  text: string;
  scores: {
    engagement: number;
    friendliness: number;
    virality: number;
  };
  metrics: {
    likes: number;
    comments: number;
    reposts: number;
    impressions: number;
  };
}

export function StyleExamples({ content }: { content: string }) {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  const handleWrite = async () => {
    setStarted(true);
    setLoading(true);
    setError(null);
    setExamples([]);
    setCurrentIndex(0);

    for (let i = 0; i < creatorsData.creators.length; i++) {
      const creator = creatorsData.creators[i];
      try {
        const result = await rewritePost(content, creator.handle.replace('@', ''));
        setExamples(prev => [
          ...prev,
          {
            creator,
            text: result.text,
            scores: result.scores,
            metrics: result.metrics,
          },
        ]);
        setCurrentIndex(i + 1);
      } catch {
        setError(`Could not write in ${creator.name}'s voice.`);
        setCurrentIndex(i + 1);
      }
    }

    setLoading(false);
  };

  return (
    <section>
      <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">In their voice</p>
      <h2 className="font-heading mt-2 max-w-xl text-[clamp(2rem,4vw,3rem)] tracking-tight">
        Same point. Different mouth.
      </h2>

      {!started ? (
        <button
          type="button"
          onClick={handleWrite}
          className="mt-6 text-sm text-white/40 hover:text-white"
        >
          Write in other voices
        </button>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-white/35">
          Writing {Math.min(currentIndex + 1, creatorsData.creators.length)} of{' '}
          {creatorsData.creators.length}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-[oklch(0.72_0.16_28)]">{error}</p> : null}

      {started ? (
        <div className="mt-10 space-y-0">
          {creatorsData.creators
            .slice(0, Math.max(examples.length, loading ? currentIndex + 1 : 0))
            .map((creator, index) => {
              const example = examples[index];

              return (
                <article key={creator.handle} className="border-t border-white/8 py-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="font-heading text-sm text-white/30">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-2 text-sm text-white/80">{creator.name}</p>
                      <p className="text-xs text-white/35">{creator.handle}</p>
                    </div>
                    {example ? (
                      <div className="flex items-center gap-4 text-xs">
                        <OpenInStudioButton
                          variant="ghost"
                          className="h-auto rounded-none px-0 text-white/35 hover:bg-transparent hover:text-white"
                          draft={{ tweets: [example.text], title: creator.name }}
                          label="Studio"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(example.text, index)}
                          className="text-white/35 hover:text-white"
                        >
                          {copiedIndex === index ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {example ? (
                    <p className="mt-5 max-w-3xl text-[1.02rem] leading-7 whitespace-pre-wrap text-white/75">
                      {example.text}
                    </p>
                  ) : (
                    <p className="mt-5 text-sm text-white/30">Writing…</p>
                  )}
                </article>
              );
            })}
        </div>
      ) : null}
    </section>
  );
}
