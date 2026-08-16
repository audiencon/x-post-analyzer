import { inspectDraft, type DeskFlag, type DraftDesk } from '@/lib/x-monetization';

export function FlagList({ flags }: { flags: DeskFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <ol className="mt-4 space-y-3">
      {flags.map((flag, index) => (
        <li key={flag.id} className="flex gap-4 text-sm leading-6">
          <span className="font-heading w-6 shrink-0 text-white/28">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span>
            <span
              className={
                flag.severity === 'block' || flag.severity === 'sting'
                  ? 'text-ink-soft'
                  : 'text-white/70'
              }
            >
              {flag.title}.
            </span>{' '}
            <span className="text-white/50">{flag.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LiveDesk({ content }: { content: string }) {
  if (!content.trim()) return null;

  const desk = inspectDraft(content);
  if (desk.flags.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-ink-soft text-[11px] tracking-[0.18em] uppercase">
        {desk.flags.some(flag => flag.severity === 'block') ? 'Would not pay' : 'Before you roast'}
      </p>
      <FlagList flags={desk.flags} />
    </div>
  );
}

export function PayoutDesk({ desk }: { desk: DraftDesk }) {
  return (
    <section className="mt-16">
      <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">X payout</p>
      <h2 className="font-heading mt-2 max-w-2xl text-[clamp(2rem,4vw,3rem)] tracking-tight">
        {desk.verdict}
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
        Original Content Rewards pays unique Premium views on Home, with half the post visible.
        Replies, bait, copied work, and transferred TikToks do not count.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">First fold</p>
          <p className="border-ink mt-3 border-l-2 pl-5 text-[1.02rem] leading-7 whitespace-pre-wrap text-white/75">
            {desk.firstFold}
          </p>
          {desk.isThread ? (
            <p className="mt-3 text-xs text-white/35">Thread. Only this first post sits on Home.</p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">
            {desk.originalKind === 'none' ? 'Originality' : desk.originalKind}
          </p>
          {desk.flags.length ? (
            <FlagList flags={desk.flags} />
          ) : (
            <p className="mt-4 text-sm leading-7 text-white/60">
              No rule flags. If this is first-hand, it can take a qualified impression.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
