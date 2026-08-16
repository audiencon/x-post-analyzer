import Link from 'next/link';
import { FAQ_ITEMS } from '@/config/faq';

export function Faq({
  heading = 'Questions people actually ask',
  limit,
}: {
  heading?: string;
  limit?: number;
}) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-heading text-3xl tracking-tight sm:text-5xl">
        {heading}
      </h2>
      <p className="mt-4 text-white/55">
        Short answers. If you need the legal version, read{' '}
        <Link href="/terms" className="underline decoration-white/20 underline-offset-4 hover:text-white">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline decoration-white/20 underline-offset-4 hover:text-white">
          Privacy
        </Link>
        .
      </p>
      <dl className="mt-12 divide-y divide-white/8 border-y border-white/8">
        {items.map(item => (
          <div key={item.question} className="py-7">
            <dt>
              <h3 className="font-heading text-xl leading-snug sm:text-2xl">{item.question}</h3>
            </dt>
            <dd className="speakable mt-3 text-sm leading-relaxed text-white/60">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
