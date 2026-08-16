import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicRoast } from '@/actions/roasts';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import { buttonVariants } from '@/components/ui/button';
import { SITE } from '@/config/site';
import { crumbsFor, roastCardGraph } from '@/lib/schema';
import { globalScore } from '@/lib/scores';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const roast = await getPublicRoast(id);
  if (!roast) return { title: 'Roast card' };

  return {
    title: `Roast card · ${globalScore(roast.scores)}`,
    description: roast.roast,
    alternates: { canonical: `/r/${id}` },
    openGraph: {
      title: `PostRoast · ${globalScore(roast.scores)}`,
      description: roast.roast,
      url: `${SITE.url}/r/${id}`,
      images: [{ url: `${SITE.url}/r/${id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `PostRoast · ${globalScore(roast.scores)}`,
      description: roast.roast,
      images: [`${SITE.url}/r/${id}/opengraph-image`],
    },
  };
}

export default async function PublicRoastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roast = await getPublicRoast(id);
  if (!roast) notFound();

  const score = globalScore(roast.scores);
  const crumbs = crumbsFor(`/r/${id}`, `Card ${score}`, [{ name: 'Roast', path: '/roast' }]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={roastCardGraph({
          id,
          roast: roast.roast,
          content: roast.content,
          score,
          datePublished: roast.createdAt.toISOString(),
        })}
      />
      <Breadcrumbs items={crumbs} />
      <p className="mt-6 text-[11px] tracking-[0.2em] text-ink-soft uppercase">Public roast</p>
      <p className="font-heading mt-4 text-7xl tracking-tight text-copy">{score}</p>
      <p className="mt-2 text-[11px] tracking-[0.16em] text-white/35 uppercase">
        Engage {roast.scores.engagement} · Warmth {roast.scores.friendliness} · Viral{' '}
        {roast.scores.virality}
      </p>
      <p className="font-heading mt-10 border-l-2 border-ink pl-6 text-[clamp(1.8rem,4vw,2.75rem)] leading-[1.12] text-ink-soft">
        {roast.roast}
      </p>
      <p className="mt-8 whitespace-pre-wrap border-l border-ink/40 bg-paper-2/80 px-5 py-5 leading-8 text-white/70">
        {roast.content}
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <OpenInStudioButton
          variant="default"
          draft={{ tweets: [roast.content], roast: roast.roast, scores: roast.scores }}
          label="Open in Studio"
        />
        <Link href="/roast" className={buttonVariants({ variant: 'outline' })}>
          Roast your draft
        </Link>
      </div>
    </main>
  );
}
