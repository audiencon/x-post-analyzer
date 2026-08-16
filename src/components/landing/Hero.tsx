import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { DEMO_ROAST } from '@/config/demo-roast';
import { cn } from '@/lib/utils';

function ScorePills({
  scores,
  tone,
}: {
  scores: { engagement: number; friendliness: number; virality: number };
  tone: 'before' | 'after';
}) {
  const items = [
    ['Engage', scores.engagement],
    ['Warmth', scores.friendliness],
    ['Viral', scores.virality],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, value]) => (
        <span
          key={label}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] tracking-wide',
            tone === 'before'
              ? 'bg-white/6 text-white/50'
              : 'bg-[oklch(0.68_0.18_28_/_0.16)] text-[oklch(0.82_0.12_28)]'
          )}
        >
          {label} {value}
        </span>
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
      <p className="mb-5 text-xs tracking-[0.22em] text-[oklch(0.68_0.18_28)] uppercase">
        The last stop before you hit Post
      </p>
      <h1 className="font-heading max-w-4xl text-[clamp(2.4rem,6vw,5.2rem)] leading-[0.95] tracking-tight text-balance">
        Your tweet is fine.
        <span className="mt-2 block text-[oklch(0.72_0.16_28)]">
          Fine does not get you followers.
        </span>
      </h1>
      <p className="speakable mt-6 max-w-xl text-lg leading-relaxed text-white/65">
        Paste a draft. Get a roast, a score, and a version you would actually post. Ten free roasts
        a day — sign in first.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/roast" className={buttonVariants({ size: 'lg' })}>
          Roast this post
        </Link>
        <Link href="/studio" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Open Studio
        </Link>
      </div>

      <div className="mt-16 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-[oklch(0.18_0.014_50)] p-5 sm:p-6">
          <p className="mb-3 text-[11px] tracking-[0.18em] text-white/40 uppercase">Before</p>
          <p className="text-[15px] leading-relaxed text-white/70">{DEMO_ROAST.original}</p>
          <div className="mt-5">
            <ScorePills scores={DEMO_ROAST.scores.before} tone="before" />
          </div>
        </article>
        <article className="rounded-2xl border border-[oklch(0.68_0.18_28_/_0.35)] bg-[oklch(0.19_0.02_40)] p-5 sm:p-6">
          <p className="mb-3 text-[11px] tracking-[0.18em] text-[oklch(0.72_0.16_28)] uppercase">
            After the roast
          </p>
          <p className="font-heading text-xl leading-snug text-[oklch(0.86_0.08_28)]">
            “{DEMO_ROAST.roast}”
          </p>
          <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap text-white/85">
            {DEMO_ROAST.rewrite}
          </p>
          <div className="mt-5">
            <ScorePills scores={DEMO_ROAST.scores.after} tone="after" />
          </div>
        </article>
      </div>
    </section>
  );
}
