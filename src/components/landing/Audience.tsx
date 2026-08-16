const forYou = [
  'You already write on X and still watch a post stall.',
  'You want the last five minutes to sting a little.',
  'You care whether the post can earn Original Content Rewards.',
  'You will sign in for ten free roasts a day.',
];

const notForYou = [
  'You want a calendar, a queue, and a posting robot.',
  'You want likes predicted from last month.',
  'You want an idea factory and a coach on retainer.',
  'You want us to take X posting permission.',
];

export function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="audience-heading">
      <h2 id="audience-heading" className="font-heading text-3xl tracking-tight sm:text-5xl">
        Built for the last five minutes.
      </h2>
      <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-xs tracking-[0.2em] text-[oklch(0.68_0.18_28)] uppercase">For you</p>
          <ul className="mt-5 space-y-4">
            {forYou.map(item => (
              <li
                key={item}
                className="border-l-2 border-[oklch(0.68_0.18_28)] pl-4 text-sm leading-relaxed text-white/75"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-white/35 uppercase">Not for you</p>
          <ul className="mt-5 space-y-4">
            {notForYou.map(item => (
              <li key={item} className="border-l-2 border-white/12 pl-4 text-sm leading-relaxed text-white/45">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
