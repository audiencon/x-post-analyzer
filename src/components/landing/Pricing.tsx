import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Roast',
    price: '$0',
    note: 'Account required',
    points: ['10 roasts a day', '3 saved drafts', '8 critiques a day'],
    href: '/roast',
    cta: 'Start roasting',
    featured: true,
  },
  {
    name: 'Pro',
    price: '$19',
    note: 'Monthly',
    points: ['Unlimited roasts', 'Saved roast history', '3 drafts, 8 critiques a day'],
    href: '/account',
    cta: 'Upgrade to Pro',
    featured: false,
  },
  {
    name: 'Studio',
    price: '$32',
    note: 'For daily writers',
    points: ['Everything in Pro', 'Unlimited drafts', 'Unlimited critique', 'Studio workspace'],
    href: '/account',
    cta: 'Upgrade to Studio',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <h2 className="font-heading text-3xl tracking-tight sm:text-5xl">
        Free to roast. Paid to remember.
      </h2>
      <p className="mt-4 max-w-xl text-white/55">
        Ten free roasts a day after you sign in. Pro is volume. Studio is the workspace.{' '}
        <Link
          href="/founder"
          className="underline decoration-white/20 underline-offset-4 hover:text-white"
        >
          Founder lifetime is $199, 100 seats.
        </Link>
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {plans.map(plan => (
          <article
            key={plan.name}
            className={
              plan.featured
                ? 'rounded-2xl border border-[oklch(0.68_0.18_28_/_0.4)] bg-[oklch(0.19_0.02_40)] p-6'
                : 'rounded-2xl border border-white/8 bg-[oklch(0.17_0.014_50)] p-6'
            }
          >
            <p className="text-xs tracking-[0.18em] text-white/40 uppercase">{plan.note}</p>
            <h3 className="font-heading mt-2 text-2xl">{plan.name}</h3>
            <p className="font-heading mt-3 text-4xl">{plan.price}</p>
            <ul className="mt-6 space-y-2 text-sm text-white/60">
              {plan.points.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={cn(
                buttonVariants({
                  variant: plan.featured ? 'default' : 'outline',
                  size: 'sm',
                }),
                'mt-8'
              )}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
