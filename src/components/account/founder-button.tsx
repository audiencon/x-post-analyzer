'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { startFounderCheckout } from '@/actions/billing';
import { track } from '@/lib/analytics';

export function FounderButton({ configured, soldOut }: { configured: boolean; soldOut: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        disabled={pending || !configured || soldOut}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            track('checkout_started', { plan: 'founder' });
            await startFounderCheckout();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start checkout.');
            setPending(false);
          }
        }}
      >
        {soldOut ? 'Sold out' : pending ? 'Redirecting…' : 'Buy Founder lifetime'}
      </Button>
      {error ? <p className="text-sm text-[oklch(0.72_0.16_28)]">{error}</p> : null}
    </div>
  );
}
