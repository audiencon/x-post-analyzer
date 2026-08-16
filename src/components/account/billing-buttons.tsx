'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { openBillingPortal, startCheckout } from '@/actions/billing';
import type { PaidPlan } from '@/config/billing';
import { track } from '@/lib/analytics';

export function UpgradeButton({
  configured,
  plan = 'pro',
  label,
}: {
  configured: boolean;
  plan?: PaidPlan;
  label: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      track('checkout_started', { plan });
      await startCheckout(plan, 'month');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={pending || !configured}>
        {pending ? 'Redirecting…' : label}
      </Button>
      {!configured ? (
        <p className="text-sm text-white/45">
          Stripe price IDs are missing on this environment. Checkout stays off until they are set.
        </p>
      ) : null}
      {error ? <p className="text-sm text-[oklch(0.72_0.16_28)]">{error}</p> : null}
    </div>
  );
}

export function ManageBillingButton() {
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await openBillingPortal();
      }}
    >
      {pending ? 'Opening…' : 'Manage billing'}
    </Button>
  );
}
