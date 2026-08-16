'use client';

import { useState } from 'react';
import { getRewriteAngles } from '@/actions/rewrite-angles';
import type { RewriteAngle } from '@/config/rewrite-angles';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import type { StudioDraft, StudioScores } from '@/lib/studio-draft';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';

export function RewriteAngles({
  content,
  roast,
  scores,
  desk,
  goal,
}: {
  content: string;
  roast?: string;
  scores?: StudioScores;
  desk?: StudioDraft['desk'];
  goal?: string;
}) {
  const [angles, setAngles] = useState<RewriteAngle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copied.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Could not copy.');
    }
  };

  const handleWrite = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRewriteAngles(content);
      setAngles(result);
      track('rewrite_angles_viewed', { count: result.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write the angles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">Ship one of these</p>
      <h2 className="font-heading mt-2 text-[clamp(2rem,4vw,3rem)] tracking-tight">Three angles</h2>

      {!angles && !loading ? (
        <button
          type="button"
          onClick={handleWrite}
          className="mt-6 text-sm text-white/40 hover:text-white"
        >
          Write three versions
        </button>
      ) : null}

      {error ? <p className="text-ink-soft mt-4 text-sm">{error}</p> : null}

      {loading || angles ? (
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {(angles ?? [null, null, null]).map((angle, index) => (
            <article key={angle?.id ?? index} className="border-t border-white/8 pt-5">
              <p className="font-heading text-sm text-white/30">
                {String(index + 1).padStart(2, '0')}
              </p>
              {angle ? (
                <>
                  <p className="text-ink-soft mt-3 text-[11px] tracking-[0.16em] uppercase">
                    {angle.label}
                  </p>
                  <p className="mt-1 text-xs text-white/35">{angle.note}</p>
                  <p className="mt-5 text-[0.98rem] leading-7 whitespace-pre-wrap text-white/80">
                    {angle.text}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <OpenInStudioButton
                      variant="ghost"
                      className="h-auto rounded-none px-0 text-white/40 hover:bg-transparent hover:text-white"
                      draft={{
                        tweets: [angle.text],
                        roast,
                        scores,
                        desk,
                        goal,
                        title: angle.label,
                      }}
                      label="Open in Studio"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(angle.text, angle.id)}
                      className="text-white/40 hover:text-white"
                    >
                      {copiedId === angle.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-sm text-white/30">Writing…</p>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
