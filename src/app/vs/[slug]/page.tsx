import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPARISONS, comparisonBySlug } from '@/config/comparisons';
import { buttonVariants } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { comparisonGraph, crumbsFor } from '@/lib/schema';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return COMPARISONS.map(item => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = comparisonBySlug(slug);
  if (!page) return { title: 'Comparison' };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/vs/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE.url}/vs/${page.slug}`,
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = comparisonBySlug(slug);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={comparisonGraph({
          slug: page.slug,
          name: page.name,
          title: page.title,
          description: page.description,
          verdict: page.verdict,
          price: page.price,
          postroastPrice: page.postroastPrice,
          updated: page.updated,
        })}
      />
      <Breadcrumbs
        items={crumbsFor(`/vs/${page.slug}`, `vs ${page.name}`, [{ name: 'Compare', path: '/vs' }])}
      />

      <p className="mt-6 text-xs tracking-[0.2em] text-white/40 uppercase">
        Comparison · Updated {page.updated}
      </p>
      <h1 className="font-heading mt-3 text-4xl tracking-tight sm:text-5xl">
        PostRoast vs {page.name}
      </h1>
      <p className="mt-4 text-white/55">{page.tagline}</p>
      <p className="mt-3 text-sm text-white/40">
        PostRoast makes this page. Sources: public marketing on{' '}
        <a href={page.url} className="underline decoration-white/20 underline-offset-4" rel="noopener noreferrer">
          {page.name}
        </a>{' '}
        and www.postroast.app. No star ratings.
      </p>

      <section className="mt-10 rounded-2xl border border-[oklch(0.68_0.18_28_/_0.35)] bg-[oklch(0.19_0.02_40)] p-6">
        <h2 className="font-heading text-2xl">Verdict</h2>
        <p className="mt-3 text-white/75">{page.verdict}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/roast" className={buttonVariants()}>
            Roast a post free
          </Link>
          <a href="/#pricing" className={buttonVariants({ variant: 'outline' })}>
            See pricing
          </a>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl">Side by side</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40">
              <th className="py-3 pr-4 font-medium">Feature</th>
              <th className="py-3 pr-4 font-medium">PostRoast</th>
              <th className="py-3 font-medium">{page.name}</th>
            </tr>
          </thead>
          <tbody>
            {page.rows.map(row => (
              <tr key={row.feature} className="border-b border-white/8">
                <td className="py-3 pr-4 text-white/70">{row.feature}</td>
                <td className="py-3 pr-4">{row.postroast}</td>
                <td className="py-3 text-white/70">{row.other}</td>
              </tr>
            ))}
            <tr className="border-b border-white/8">
              <td className="py-3 pr-4 text-white/70">Price (as of {page.updated})</td>
              <td className="py-3 pr-4">{page.postroastPrice}</td>
              <td className="py-3 text-white/70">{page.price}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl">Where {page.name} wins</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            {page.theyWin.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/45">Best for: {page.bestForThem}</p>
        </div>
        <div>
          <h2 className="font-heading text-2xl">Where PostRoast wins</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            {page.weWin.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/45">Best for: {page.bestForUs}</p>
        </div>
      </section>

      <section className="mt-12 border-t border-white/8 pt-8">
        <h2 className="font-heading text-2xl">Other comparisons</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {COMPARISONS.filter(item => item.slug !== page.slug).map(item => (
            <Link
              key={item.slug}
              href={`/vs/${item.slug}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              vs {item.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
