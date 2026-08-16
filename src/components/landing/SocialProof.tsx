export function SocialProof() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-8 border-y border-white/8 py-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
            Built for people who already write, and still watch the post stall.
          </h2>
          <p className="mt-4 max-w-lg text-white/55">
            No fake star ratings. No invented customer counts. The proof is the before and after on
            your own draft.
          </p>
        </div>
        <ul className="space-y-4 text-sm text-white/70">
          <li className="border-l-2 border-[oklch(0.68_0.18_28)] pl-4">
            Sign in. Ten free roasts a day. The roast is the product.
          </li>
          <li className="border-l-2 border-white/15 pl-4">
            Studio for threads when the roast is not enough.
          </li>
          <li className="border-l-2 border-white/15 pl-4">
            A card you can post when the score finally moves.
          </li>
        </ul>
      </div>
    </section>
  );
}
