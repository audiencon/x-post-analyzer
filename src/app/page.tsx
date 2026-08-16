import { Audience, CTA, Faq, Features, Hero, Method, Pricing, Scores, SocialProof } from '@/components/landing';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE, SITE_OG_IMAGE } from '@/config/site';
import { homeGraph } from '@/lib/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostRoast — The last stop before you hit Post',
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    title: 'PostRoast — Your tweet is fine. Fine does not get you followers.',
    description: SITE.shortDescription,
    siteName: SITE.name,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: 'PostRoast roast before and after' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostRoast — The last stop before you hit Post',
    description: SITE.shortDescription,
    images: [SITE_OG_IMAGE],
    creator: SITE.founder.handle,
  },
};

export default function Home() {
  return (
    <main>
      <JsonLd data={homeGraph()} />
      <Hero />
      <Features />
      <Scores />
      <Method />
      <Audience />
      <SocialProof />
      <Faq />
      <Pricing />
      <CTA />
    </main>
  );
}
