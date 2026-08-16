'use client';

import { motion } from 'framer-motion';

export function FormHeader() {
  return (
    <motion.div
      key="header"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mb-10 w-full max-w-3xl"
    >
      <p className="text-[11px] tracking-[0.22em] text-ink-soft uppercase">
        Roast · Original Content Rewards
      </p>
      <h1 className="font-heading mt-3 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-tight">
        Paste the draft.
        <br />
        Take the hit.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/55">
        We read it the way X pays now: Home Timeline, half the post visible, original work. Sign in
        to run the roast. Ten free a day.
      </p>
    </motion.div>
  );
}
