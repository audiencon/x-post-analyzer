import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { SITE } from '@/config/site';
import type { Crumb } from '@/lib/schema';

export function LegalArticle({
  kicker,
  title,
  crumbs,
  children,
}: {
  kicker: string;
  title: string;
  crumbs: Crumb[];
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Breadcrumbs items={crumbs} />
      <p className="mt-6 text-xs tracking-[0.2em] text-white/40 uppercase">{kicker}</p>
      <h1 className="font-heading mt-3 text-4xl tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-sm text-white/40">Last updated {SITE.legalUpdatedLabel}.</p>
      <article className="legal-prose mt-10 space-y-10 text-sm leading-7 text-white/65 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:text-white [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </article>
    </main>
  );
}
