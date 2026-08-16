'use client';

import { useState } from 'react';
import { publishRoast } from '@/actions/roasts';
import { track } from '@/lib/analytics';
import type { AnalysisResult } from '@/actions/analyze';
import { toast } from 'sonner';

export function ShareRoastButton({
  roastId,
  content,
  roast,
  scores,
  analysis,
}: {
  roastId?: string;
  content: string;
  roast: string;
  scores: AnalysisResult['scores'];
  analysis?: AnalysisResult;
}) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const id = await publishRoast({ id: roastId, content, roast, scores, analysis });
      const url = `${window.location.origin}/r/${id}`;
      await navigator.clipboard.writeText(url);
      track('roast_shared', { roast_id: id });
      toast.success('Public roast link copied.');
    } catch {
      toast.error('Could not publish this roast.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      className="text-sm text-white/40 hover:text-white disabled:opacity-40"
    >
      {busy ? 'Publishing…' : 'Share'}
    </button>
  );
}
