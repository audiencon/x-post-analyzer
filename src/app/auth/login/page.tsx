import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/config/site';
import { isTwitterAuthEnabled } from '@/lib/auth';
import { crumbsFor, pageGraph } from '@/lib/schema';
import type { Metadata } from 'next';

const description = 'Sign in to PostRoast to roast an X draft. Ten free roasts a day after you sign in.';
const crumbs = crumbsFor('/auth/login', 'Sign in');

export const metadata: Metadata = {
  title: 'Sign in',
  description,
  alternates: { canonical: '/auth/login' },
  openGraph: {
    title: 'Sign in | PostRoast',
    description,
    url: `${SITE.url}/auth/login`,
  },
};

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <JsonLd
        data={pageGraph({
          path: '/auth/login',
          name: 'Sign in',
          description,
          crumbs,
          includeApp: false,
        })}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="font-heading mt-6 mb-8 text-4xl tracking-tight">Sign in</h1>
      <Suspense>
        <AuthForm mode="login" twitterEnabled={isTwitterAuthEnabled()} />
      </Suspense>
    </main>
  );
}
