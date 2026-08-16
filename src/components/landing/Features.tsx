const steps = [
  {
    n: '01',
    title: 'Paste the draft you almost posted',
    body: 'Pick a goal if you want. The roast works on the words, not your follower count.',
  },
  {
    n: '02',
    title: 'Hear what is actually wrong',
    body: 'Engagement, warmth, virality — plus the one line that explains why it will die in the feed.',
  },
  {
    n: '03',
    title: 'Leave with a version you would ship',
    body: 'Rewrite it, open it in Studio, or export a roast card. Ten free roasts a day after you sign in.',
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="font-heading max-w-2xl text-3xl tracking-tight sm:text-5xl">
        Judge the draft you already have.
      </h2>
      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {steps.map(step => (
          <div key={step.n} className="border-t border-white/10 pt-6">
            <p className="text-xs tracking-[0.2em] text-[oklch(0.68_0.18_28)]">{step.n}</p>
            <h3 className="font-heading mt-3 text-2xl leading-tight">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
