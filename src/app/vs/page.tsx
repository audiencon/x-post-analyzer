import Link from 'next/link';
import { COMPARISONS } from '@/config/comparisons';
import { buttonVariants } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { crumbsFor, pageGraph } from '@/lib/schema';
import type { Metadata } from 'next';

const description =
  'Honest comparisons. PostRoast is the last pass before you hit Post — not another X growth suite.';

export const metadata: Metadata = {
  title: 'PostRoast vs Typefully, SupaBird, and GrowthX',
  description,
  alternates: { canonical: '/vs' },
  openGraph: {
    title: 'PostRoast vs Typefully, SupaBird, and GrowthX',
    description,
    url: `${SITE.url}/vs`,
  },
};

const crumbs = crumbsFor('/vs', 'Compare');

export default function VsIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={pageGraph({
          path: '/vs',
          name: 'PostRoast vs Typefully, SupaBird, and GrowthX',
          description,
          crumbs,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <p className="mt-6 text-xs tracking-[0.2em] text-[oklch(0.68_0.18_28)] uppercase">Compare</p>
      <h1 className="font-heading mt-3 text-4xl tracking-tight sm:text-5xl">
        We are not a thinner SupaBird.
      </h1>
      <p className="mt-4 text-white/55">
        Those tools sell a grow loop. PostRoast sells the moment before Post: a roast, a score, and
        a version you would actually ship. Pricing below is from public pages as of August 16, 2026.
      </p>
      <ul className="mt-10 divide-y divide-white/8 border-y border-white/8">
        {COMPARISONS.map(item => (
          <li key={item.slug} className="py-6">
            <h2 className="font-heading text-2xl">PostRoast vs {item.name}</h2>
            <p className="mt-2 text-sm text-white/55">{item.tagline}</p>
            <Link href={`/vs/${item.slug}`} className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-4`}>
              Read the comparison
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
