import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="rounded-3xl border border-white/8 bg-[oklch(0.18_0.016_45)] px-6 py-14 text-center sm:px-12">
        <h2 className="font-heading text-3xl tracking-tight sm:text-5xl">
          Paste the draft. Take the hit. Post the better one.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/55">
          If it survives the roast, it can survive the feed.
        </p>
        <Link href="/roast" className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
          Roast a post free
        </Link>
      </div>
    </section>
  );
}
