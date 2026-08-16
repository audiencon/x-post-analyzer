import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { getUsageState } from '@/lib/usage';
import { isStripeConfigured, isStudioConfigured } from '@/lib/stripe';
import { FREE_ROASTS_PER_DAY, PRO_MONTHLY_PRICE_USD, STUDIO_MONTHLY_PRICE_USD, planLabel } from '@/config/billing';
import { ManageBillingButton, UpgradeButton } from '@/components/account/billing-buttons';
import { buttonVariants } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?next=/account');
  }

  const usage = await getUsageState();
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs tracking-[0.2em] text-[oklch(0.68_0.18_28)] uppercase">Account</p>
      <h1 className="font-heading mt-3 text-4xl tracking-tight">{user.name}</h1>
      <p className="mt-2 text-white/55">{user.email}</p>

      {params.checkout === 'success' || params.checkout === 'founder' ? (
        <p className="mt-6 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70">
          {params.checkout === 'founder'
            ? 'Founder checkout finished. Studio unlocks as soon as Stripe confirms the payment.'
            : 'Checkout finished. The paid plan unlocks as soon as Stripe confirms the subscription.'}
        </p>
      ) : null}

      <section className="mt-10 space-y-3 border-t border-white/8 pt-8">
        <h2 className="font-heading text-2xl">Plan</h2>
        <p className="text-white/70">
          {user.isStudio
            ? `${planLabel(user.plan, user.planStatus)} — unlimited roasts, drafts, and critique.`
            : user.isPro
              ? `${planLabel(user.plan, user.planStatus)} — unlimited roasts and history. Three drafts. Eight critiques a day.`
              : 'Free — 10 roasts, 3 drafts, and 8 critiques a day.'}
        </p>
        {!user.isPro ? (
          <p className="text-sm text-white/50">
            {usage.remaining ?? 0} of {FREE_ROASTS_PER_DAY} free roasts left today.
          </p>
        ) : null}
        {user.isPro ? <ManageBillingButton /> : null}
        {!user.isStudio ? (
          <div className="flex flex-wrap gap-3">
            {!user.isPro ? (
              <UpgradeButton
                configured={isStripeConfigured()}
                plan="pro"
                label={`Upgrade to Pro — $${PRO_MONTHLY_PRICE_USD}/mo`}
              />
            ) : null}
            <UpgradeButton
              configured={isStudioConfigured()}
              plan="studio"
              label={`Upgrade to Studio — $${STUDIO_MONTHLY_PRICE_USD}/mo`}
            />
            <Link href="/founder" className={buttonVariants({ variant: 'outline' })}>
              Founder lifetime
            </Link>
          </div>
        ) : null}
      </section>

      <section className="mt-10 flex flex-wrap gap-3 border-t border-white/8 pt-8">
        <Link href="/desk" className={buttonVariants({ variant: 'outline' })}>
          Desk
        </Link>
        <Link href="/history" className={buttonVariants({ variant: 'outline' })}>
          Roast history
        </Link>
        <Link href="/roast" className={buttonVariants()}>
          Roast a post
        </Link>
      </section>
    </main>
  );
}
