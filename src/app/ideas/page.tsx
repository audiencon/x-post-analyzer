import { IdeasClient } from '@/components/ideas/ideas-client';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { crumbsFor, pageGraph } from '@/lib/schema';
import type { Metadata } from 'next';

const description =
  'Pick a niche. Get eight drafts worth roasting before you post. Free X ideas for founders and operators.';
const crumbs = crumbsFor('/ideas', 'Ideas');

export const metadata: Metadata = {
  title: 'Post ideas for X',
  description,
  alternates: { canonical: '/ideas' },
  openGraph: {
    title: 'Post ideas for X | PostRoast',
    description,
    url: `${SITE.url}/ideas`,
  },
};

export default function IdeasPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <JsonLd
        data={pageGraph({
          path: '/ideas',
          name: 'Post ideas for X',
          description,
          crumbs,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <p className="mt-6 text-[11px] tracking-[0.22em] text-[oklch(0.68_0.18_28)] uppercase">
        Assignment desk
      </p>
      <h1 className="font-heading mt-3 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-tight">
        Eight drafts.
        <br />
        Then the roast.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/55">
        A hook, an angle, and a draft you can roast or finish in Studio. Not a content calendar.
      </p>
      <IdeasClient />
    </main>
  );
}
