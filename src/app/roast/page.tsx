import ClientHome from '@/app/ui/ClientHome';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE, SITE_OG_IMAGE } from '@/config/site';
import { crumbsFor, pageGraph } from '@/lib/schema';
import type { Metadata } from 'next';

const description =
  'Paste your X draft. Get Engage, Warmth, Viral, and Payout scores plus a rewrite you would actually post. Sign in for ten free roasts a day.';
const crumbs = crumbsFor('/roast', 'Roast');

export const metadata: Metadata = {
  title: 'Roast a post',
  description,
  alternates: { canonical: '/roast' },
  openGraph: {
    url: `${SITE.url}/roast`,
    title: 'Roast a post | PostRoast',
    description,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: 'PostRoast roast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roast a post | PostRoast',
    description,
    images: [SITE_OG_IMAGE],
  },
};

export default function RoastPage() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col px-4 py-14 sm:px-6">
      <JsonLd
        data={pageGraph({
          path: '/roast',
          name: 'Roast a post',
          description,
          crumbs,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <div className="mt-8">
        <ClientHome />
      </div>
    </main>
  );
}
