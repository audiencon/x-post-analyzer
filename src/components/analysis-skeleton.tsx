export function AnalysisSkeleton({ streamedRoast }: { streamedRoast?: string }) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-6">
        <p className="text-sm text-white/25">Another draft</p>
        <p className="text-[11px] tracking-[0.18em] text-white/22 uppercase">Reading</p>
      </div>

      <section className="mt-10 border-l-2 border-ink pl-6 sm:pl-8">
        <p className="text-[11px] tracking-[0.2em] text-ink-soft uppercase">The roast</p>
        {streamedRoast ? (
          <p className="font-heading mt-5 max-w-[22ch] text-[clamp(2.15rem,4.6vw,4rem)] leading-[1.06] tracking-tight text-ink-soft sm:max-w-[28ch]">
            {streamedRoast}
          </p>
        ) : (
          <p className="font-heading mt-5 text-[clamp(1.6rem,3vw,2.4rem)] text-white/28">
            Reading the draft…
          </p>
        )}
      </section>

      <section className="mt-14 grid items-end gap-10 border-y border-rule py-10 sm:grid-cols-[auto_1fr] sm:gap-16">
        <div>
          <p className="font-heading text-[5.5rem] leading-none tracking-tight text-white/10 sm:text-[7rem]">
            —
          </p>
          <p className="mt-2 text-[11px] tracking-[0.18em] text-white/22 uppercase">Scoring</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {['Engage', 'Warmth', 'Viral'].map(label => (
            <div key={label}>
              <p className="text-[11px] tracking-[0.16em] text-white/25 uppercase">{label}</p>
              <div className="mt-4 h-px bg-white/8" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
