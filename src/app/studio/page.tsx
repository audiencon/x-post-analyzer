import { CursorClient } from '@/app/cursor/CursorClient';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { crumbsFor, pageGraph } from '@/lib/schema';
import { requireUser } from '@/lib/session';
import type { Metadata } from 'next';

const description =
  'Finish the draft after the roast. Threads, rewrite, and a red pen in one workspace.';

export const metadata: Metadata = {
  title: 'Studio',
  description,
  alternates: { canonical: '/studio' },
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE.url}/studio`,
    title: 'Studio | PostRoast',
    description,
    images: [{ url: `${SITE.url}/studio/opengraph-image`, width: 1200, height: 630 }],
  },
};

export default async function StudioPage() {
  await requireUser('/studio');
  return (
    <>
      <JsonLd
        data={pageGraph({
          path: '/studio',
          name: 'Studio',
          description,
          crumbs: crumbsFor('/studio', 'Studio'),
        })}
      />
      <CursorClient />
    </>
  );
}
