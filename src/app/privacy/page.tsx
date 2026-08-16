import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalArticle } from '@/components/legal/legal-article';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { crumbsFor, legalGraph } from '@/lib/schema';

const description =
  'PostRoast privacy: what we store from a roast, who processes it (Better Auth, Stripe, PostHog, OpenAI, Neon, Vercel), and how to ask for deletion.';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy policy | PostRoast',
    description,
    url: `${SITE.url}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={legalGraph('/privacy', 'Privacy policy', description)} />
      <LegalArticle kicker="Legal" title="Privacy policy" crumbs={crumbsFor('/privacy', 'Privacy')}>
        <section>
          <h2>What this covers</h2>
          <p>
            This page explains what PostRoast collects when you use www.postroast.app, why we keep it,
            and who else sees it. We do not sell drafts. Public roast cards are published only when
            you click share.
          </p>
          <p>
            Operator: Audiencon. Contact:{' '}
            <a
              href={SITE.founder.url}
              className="underline decoration-white/20 underline-offset-4 hover:text-white"
              rel="noopener noreferrer"
            >
              {SITE.founder.handle}
            </a>{' '}
            on X.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>
          <ul>
            <li>
              Account: email, name if you give one, hashed password or OAuth identity, plan, and
              Stripe customer id if you pay.
            </li>
            <li>
              Drafts and output: the text you paste, the roast, scores, rewrites, Studio threads,
              and Ideas you generate.
            </li>
            <li>
              Usage: roast, critique, and rewrite counts so daily caps work. We store a posted
              timestamp if you mark a thread as posted. That mark stays in PostRoast. It is not a
              post to X.
            </li>
            <li>
              Product analytics: page views and feature use through PostHog, with a device or
              person id.
            </li>
            <li>Technical: IP address, user agent, and cookies needed to keep you signed in.</li>
          </ul>
        </section>

        <section>
          <h2>Why we keep it</h2>
          <p>
            We use this data to run the roast, enforce plan caps, save history, take payment, debug
            failures, and see which parts of the product people actually use. We do not use your
            drafts to train a public model of our own. The model provider that generates a roast
            receives the draft for that request under their terms.
          </p>
        </section>

        <section>
          <h2>Who processes it</h2>
          <ul>
            <li>Better Auth — sign-in and sessions.</li>
            <li>Stripe — checkout, subscriptions, and Founder payments.</li>
            <li>PostHog — product analytics.</li>
            <li>OpenAI — roast, rewrite, critique, and Ideas generation.</li>
            <li>Neon (Postgres) — application database.</li>
            <li>Vercel — hosting and request logs.</li>
          </ul>
          <p>
            X sign-in, when enabled, is for identity only. We do not request posting permission, we
            do not read your timeline, and we do not schedule on your behalf.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            We use a session cookie so you stay signed in, and PostHog cookies or local storage for
            analytics. There is no advertising pixel from us. If we ever add one, this page will
            say so.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            Account data and drafts stay while the account is open. Usage events stay as long as we
            need them to enforce caps and understand the product. Public roast cards stay until you
            unpublish them or we take them down. Server logs rotate on the host&apos;s schedule.
            Stripe keeps payment records as the law requires.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p>
            You can stop pasting drafts. You can close the account. You can ask us to delete the
            account and stored drafts by writing {SITE.founder.handle} on X from the handle or
            email we have on file. We will keep what the law or a payment dispute requires.
          </p>
          <p>
            If you are in a place with access, correction, or deletion rights (including the EEA,
            UK, or California), use the same contact. We will not charge you to ask.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>
            PostRoast is not for children under 16. If we learn an account belongs to someone
            younger, we will delete it.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            If the way we handle data changes in a material way, we will update this page and the
            date at the top. The{' '}
            <Link href="/terms" className="underline decoration-white/20 underline-offset-4 hover:text-white">
              Terms of use
            </Link>{' '}
            cover the product rules. The{' '}
            <Link href="/faq" className="underline decoration-white/20 underline-offset-4 hover:text-white">
              FAQ
            </Link>{' '}
            covers how the tool works.
          </p>
        </section>
      </LegalArticle>
    </>
  );
}
