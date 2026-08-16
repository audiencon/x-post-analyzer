const scores = [
  {
    name: 'Engage',
    line: 'Will anyone stop.',
    body: 'The first line has to earn the rest. A polite opener dies in the first fold.',
  },
  {
    name: 'Warmth',
    line: 'Does it sound like a person.',
    body: 'Generic founder-speak reads as a template. Specific beats agreeable.',
  },
  {
    name: 'Viral',
    line: 'Will anyone pass it on.',
    body: 'People share a line they wish they had written. They do not share a status update.',
  },
  {
    name: 'Payout',
    line: 'Can this shape earn.',
    body: 'X Original Content Rewards pay original Home posts. Replies, bait, and recycled takes do not.',
  },
];

export function Scores() {
  return (
    <section
      id="scores"
      className="scroll-mt-20 bg-[oklch(0.93_0.018_80)] text-[oklch(0.18_0.02_50)]"
      aria-labelledby="scores-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs tracking-[0.2em] text-[oklch(0.45_0.08_40)] uppercase">The reading</p>
        <h2
          id="scores-heading"
          className="font-heading mt-3 max-w-2xl text-3xl tracking-tight sm:text-5xl"
        >
          Four scores. No fifth invented to look complete.
        </h2>
        <p className="speakable mt-4 max-w-xl text-[oklch(0.32_0.02_50)]">
          PostRoast scores an X draft on Engage, Warmth, Viral, and Payout. Payout is the
          post-shape for Original Content Rewards, not a cash forecast.
        </p>
        <ol className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {scores.map((score, index) => (
            <li key={score.name} className="border-t border-[oklch(0.18_0.02_50_/_0.14)] pt-5">
              <p className="font-heading text-5xl tracking-tight text-[oklch(0.55_0.16_28)]">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="font-heading mt-4 text-2xl">{score.name}</h3>
              <p className="mt-1 text-sm font-medium text-[oklch(0.38_0.04_40)]">{score.line}</p>
              <p className="mt-3 text-sm leading-relaxed text-[oklch(0.32_0.02_50_/_0.82)]">
                {score.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
