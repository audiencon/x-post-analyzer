import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { isTwitterAuthEnabled } from '@/lib/auth';
import { crumbsFor, pageGraph } from '@/lib/schema';
import type { Metadata } from 'next';

const description =
  'Create a PostRoast account. Free stays free: ten roasts a day, three drafts, and eight critiques.';
const crumbs = crumbsFor('/auth/register', 'Create account');

export const metadata: Metadata = {
  title: 'Create account',
  description,
  alternates: { canonical: '/auth/register' },
  openGraph: {
    title: 'Create account | PostRoast',
    description,
    url: `${SITE.url}/auth/register`,
  },
};

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <JsonLd
        data={pageGraph({
          path: '/auth/register',
          name: 'Create account',
          description,
          crumbs,
          includeApp: false,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="font-heading mt-6 mb-8 text-4xl tracking-tight">Create account</h1>
      <p className="mb-8 max-w-md text-white/55">
        Free stays free. An account keeps your roasts and unlocks Pro when you want history and no
        daily cap.
      </p>
      <Suspense>
        <AuthForm mode="register" twitterEnabled={isTwitterAuthEnabled()} />
      </Suspense>
    </main>
  );
}
