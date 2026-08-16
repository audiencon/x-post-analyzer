'use client';

import { useRouter } from 'next/navigation';
import { stashRoastDraft } from '@/lib/roast-draft';
import { cn } from '@/lib/utils';

export function RoastAgainButton({
  content,
  label = 'Roast again',
  className,
}: {
  content: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => {
        stashRoastDraft(content);
        router.push('/roast');
      }}
    >
      {label}
    </button>
  );
}
