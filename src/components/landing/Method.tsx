export function Method() {
  return (
    <section className="border-y border-white/8" aria-labelledby="method-heading">
      <div className="mx-auto max-w-2xl px-4 py-24">
        <p className="text-xs tracking-[0.2em] text-white/35 uppercase">The method</p>
        <blockquote
          id="method-heading"
          className="font-heading mt-6 text-3xl leading-[1.15] tracking-tight text-balance italic sm:text-4xl"
        >
          The feed does not owe you a reply.
        </blockquote>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-white/60">
          <p className="speakable">
            Most X drafts die because they are polite, general, and interchangeable. PostRoast
            names that, then hands you a line you would actually ship.
          </p>
          <p>
            We do not schedule. We do not post as you. We do not invent a customer count so the
            landing page looks busy. The proof is the before and after on your own draft.
          </p>
        </div>
      </div>
    </section>
  );
}
