import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { getDeskSnapshot } from '@/actions/desk';
import { FREE_ROASTS_PER_DAY } from '@/config/billing';
import { buttonVariants } from '@/components/ui/button';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import { RoastAgainButton } from '@/components/studio/roast-again-button';
import { asScores } from '@/lib/scores';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Desk',
  description: 'Your critiques, scores, and drafts — the last stop before Post.',
  robots: { index: false, follow: false },
};

function greeting(weekCount: number, leak: string | null) {
  if (weekCount === 0) return 'Nothing on the desk this week. Paste a draft.';
  if (leak)
    return `${weekCount} critique${weekCount === 1 ? '' : 's'} this week. ${leak} is the leak.`;
  return `${weekCount} critique${weekCount === 1 ? '' : 's'} this week. The scores are holding.`;
}

export default async function DeskPage() {
  await requireUser('/desk');
  const desk = await getDeskSnapshot();
  if (!desk) redirect('/auth/login?next=/desk');

  const maxDay = Math.max(1, ...desk.days.map(day => day.count));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-ink-soft text-[11px] tracking-[0.2em] uppercase">Desk</p>
          <h1 className="font-heading mt-3 text-[clamp(2.4rem,5vw,4rem)] leading-[1.04] tracking-tight">
            {desk.firstName}.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/55">
            {greeting(desk.weekCount, desk.leak)}
          </p>
        </div>
        <Link href="/roast" className={cn(buttonVariants(), 'rounded-none')}>
          Roast a draft
        </Link>
      </div>

      <section className="border-rule mt-14 grid gap-10 border-y py-10 sm:grid-cols-4">
        <Stat label="This week" value={String(desk.weekCount)} />
        <Stat label="Avg score" value={desk.avgScore === null ? '—' : String(desk.avgScore)} />
        <Stat
          label="Payout shape"
          value={desk.avgPayout === null ? '—' : String(desk.avgPayout)}
          sting={desk.avgPayout !== null && desk.avgPayout < 55}
        />
        <Stat
          label={desk.isPro ? 'Plan' : 'Left today'}
          value={desk.isPro ? desk.plan : String(desk.remaining ?? 0)}
          hint={desk.isPro ? undefined : `of ${FREE_ROASTS_PER_DAY}`}
        />
      </section>

      <section className="mt-14">
        <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">This week</p>
        <div className="mt-6 grid grid-cols-7 gap-3">
          {desk.days.map(day => (
            <div key={day.key} className="flex flex-col justify-end gap-2">
              <div className="border-rule flex h-24 items-end border-b">
                <div
                  className={cn('w-full', day.count ? 'bg-ink' : 'bg-white/6')}
                  style={{ height: `${Math.max(day.count ? 12 : 2, (day.count / maxDay) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] tracking-[0.12em] text-white/35 uppercase">{day.label}</p>
              <p className="font-heading text-sm text-white/50">{day.count || '—'}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">
              Recent critiques
            </p>
            <Link href="/history" className="text-xs text-white/35 hover:text-white">
              All history
            </Link>
          </div>
          {desk.roasts.length === 0 ? (
            <p className="mt-6 text-sm text-white/45">
              Roast a draft and it lands here. Scores, payout shape, the line we wrote in ink.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-white/8 border-y border-white/8">
              {desk.roasts.map((item, index) => (
                <li key={item.id} className="py-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-heading text-sm text-white/28">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <p className="text-[11px] tracking-[0.14em] text-white/30 uppercase">
                      {item.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {item.isPublic ? ' · Public' : ''}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <p className="font-heading text-copy text-3xl tracking-tight">{item.score}</p>
                    <p
                      className={cn(
                        'font-heading text-xl tracking-tight',
                        item.payout < 55 ? 'text-ink-soft' : 'text-white/50'
                      )}
                    >
                      {item.payout}
                      <span className="ml-2 text-[11px] tracking-[0.14em] text-white/30 uppercase">
                        payout
                      </span>
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
                    {item.content}
                  </p>
                  <p className="font-heading text-ink-soft mt-3 text-lg leading-snug">
                    {item.roast}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 text-xs text-white/40">
                    <RoastAgainButton content={item.content} className="hover:text-white" />
                    <OpenInStudioButton
                      variant="ghost"
                      className="h-auto rounded-none px-0 text-xs text-white/40 hover:bg-transparent hover:text-white"
                      draft={{
                        tweets: [item.content],
                        roast: item.roast,
                        scores: item.scores ?? undefined,
                      }}
                      label="Open Studio"
                    />
                    {item.isPublic ? (
                      <Link href={`/r/${item.id}`} className="hover:text-white">
                        Public card
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-12">
          <section>
            <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">Open drafts</p>
            {desk.threads.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-white/45">
                Studio drafts show up here. Finish a roast, then write the version you would post.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-white/8 border-y border-white/8">
                {desk.threads.map(thread => (
                  <li key={thread.id} className="py-4">
                    <OpenInStudioButton
                      variant="ghost"
                      className="h-auto w-full justify-start rounded-none px-0 text-left text-sm text-white/75 hover:bg-transparent hover:text-white"
                      draft={{
                        tweets: thread.tweets,
                        title: thread.title,
                        roast: thread.roast ?? undefined,
                        scores: asScores(thread.scores) ?? undefined,
                        threadId: thread.id,
                        postedAt: thread.postedAt,
                      }}
                      label={thread.title}
                    />
                    <p className="mt-1 text-xs text-white/35">
                      {thread.updatedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {desk.posted.length > 0 ? (
              <div className="mt-10">
                <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">Posted</p>
                <ul className="mt-5 divide-y divide-white/8 border-y border-white/8">
                  {desk.posted.map(thread => (
                    <li key={thread.id} className="py-4">
                      <OpenInStudioButton
                        variant="ghost"
                        className="h-auto w-full justify-start rounded-none px-0 text-left text-sm text-white/55 hover:bg-transparent hover:text-white"
                        draft={{
                          tweets: thread.tweets,
                          title: thread.title,
                          roast: thread.roast ?? undefined,
                          scores: asScores(thread.scores) ?? undefined,
                          threadId: thread.id,
                          postedAt: thread.postedAt,
                        }}
                        label={thread.title}
                      />
                      <p className="mt-1 text-xs text-white/35">
                        {thread.postedAt
                          ? thread.postedAt.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Link
              href="/studio"
              className="mt-4 inline-block text-sm text-white/40 hover:text-white"
            >
              Open Studio
            </Link>
          </section>

          <section className="border-rule border-t pt-8">
            <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">Plan</p>
            <p className="font-heading mt-3 text-3xl tracking-tight">{desk.plan}</p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              {desk.isStudio
                ? 'Unlimited roasts, drafts, and critique.'
                : desk.isPro
                  ? 'Unlimited roasts. Three drafts. Eight critiques a day.'
                  : `${desk.remaining ?? 0} free roasts left today. Pro removes the roast cap.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 text-sm">
              <Link href="/account" className="text-ink-soft hover:text-ink-soft/80">
                {desk.isPro ? 'Manage billing' : 'Upgrade'}
              </Link>
              <Link href="/ideas" className="text-white/40 hover:text-white">
                Ideas
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
  sting = false,
}: {
  label: string;
  value: string;
  hint?: string;
  sting?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] text-white/35 uppercase">{label}</p>
      <p
        className={cn(
          'font-heading mt-2 text-5xl tracking-tight',
          sting ? 'text-ink-soft' : 'text-copy'
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/30">{hint}</p> : null}
    </div>
  );
}
