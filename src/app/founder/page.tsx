import Link from 'next/link';
import { remainingFounderSeats } from '@/actions/billing';
import { FounderButton } from '@/components/account/founder-button';
import { buttonVariants } from '@/components/ui/button';
import { FOUNDER_PRICE_USD, FOUNDER_SEAT_CAP } from '@/config/billing';
import { isFounderConfigured } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/session';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { crumbsFor, pageGraph } from '@/lib/schema';
import type { Metadata } from 'next';

const description = `One payment. Studio forever. ${FOUNDER_SEAT_CAP} seats, then it closes.`;

export const metadata: Metadata = {
  title: 'Founder lifetime',
  description,
  alternates: { canonical: '/founder' },
  openGraph: {
    title: 'Founder lifetime | PostRoast',
    description,
    url: `${SITE.url}/founder`,
  },
};

const crumbs = crumbsFor('/founder', 'Founder');

export default async function FounderPage() {
  const [seats, user] = await Promise.all([remainingFounderSeats(), getCurrentUser()]);
  const soldOut = seats <= 0;
  const alreadyFounder = user?.planStatus === 'lifetime';

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={pageGraph({
          path: '/founder',
          name: 'Founder lifetime',
          description,
          crumbs,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <p className="mt-6 text-xs tracking-[0.2em] text-[oklch(0.68_0.18_28)] uppercase">Launch offer</p>
      <h1 className="font-heading mt-3 text-4xl tracking-tight sm:text-5xl">
        Founder lifetime. ${FOUNDER_PRICE_USD} once.
      </h1>
      <p className="mt-4 text-white/55">
        Studio forever: unlimited roasts, drafts, and critique. No monthly invoice. Caps at{' '}
        {FOUNDER_SEAT_CAP}. This is not a scheduler. Scheduling comes later.
      </p>
      <p className="mt-6 text-sm text-white/45">
        {soldOut ? 'Sold out.' : `${seats} of ${FOUNDER_SEAT_CAP} seats left.`}
      </p>

      <div className="mt-10">
        {alreadyFounder ? (
          <Link href="/account" className={buttonVariants()}>
            You already have Founder
          </Link>
        ) : (
          <FounderButton configured={isFounderConfigured()} soldOut={soldOut} />
        )}
      </div>

      <ul className="mt-12 space-y-2 text-sm text-white/65">
        <li>Everything in Studio, locked in.</li>
        <li>No subscription to cancel. No price hike later.</li>
        <li>Sign in with X once the X app keys are in env. Identity only — no posting yet.</li>
      </ul>
    </main>
  );
}
