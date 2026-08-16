'use client';

import { useState } from 'react';
import { exportRoastCard, type RoastCardPayload } from '@/lib/roast-card-export';
import { toast } from 'sonner';

export function RoastCardExport(payload: RoastCardPayload) {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportRoastCard(payload);
    } catch {
      toast.error('Could not export the roast card. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      className="text-sm text-white/40 hover:text-white disabled:opacity-40"
    >
      {busy ? 'Saving…' : 'Save PNG'}
    </button>
  );
}
