import type { Metadata } from 'next';
import { Faq } from '@/components/landing/Faq';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { crumbsFor, faqGraph } from '@/lib/schema';

const description =
  'Does PostRoast post to X? Do you need an account? What do Engage, Warmth, Viral, and Payout mean? Pro vs Studio, Founder, and what happens to drafts.';

export const metadata: Metadata = {
  title: 'FAQ',
  description,
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ | PostRoast',
    description,
    url: `${SITE.url}/faq`,
  },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqGraph()} />
      <main>
        <div className="mx-auto max-w-3xl px-4 pt-16">
          <Breadcrumbs items={crumbsFor('/faq', 'FAQ')} />
          <p className="mt-6 text-xs tracking-[0.2em] text-[oklch(0.68_0.18_28)] uppercase">Answers</p>
          <h1 className="font-heading mt-3 text-4xl tracking-tight sm:text-5xl">PostRoast FAQ</h1>
          <p className="speakable mt-4 text-white/55">
            PostRoast is an AI roast for X drafts. Sign in for ten free roasts a day. We do not
            post or schedule on your account.
          </p>
        </div>
        <Faq heading="The short versions" />
      </main>
    </>
  );
}
