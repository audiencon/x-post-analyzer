'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { stashStudioDraft, STUDIO_PATH, type StudioDraft } from '@/lib/studio-draft';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function OpenInStudioButton({
  draft,
  label = 'Open in Studio',
  variant = 'outline',
  className,
}: {
  draft: StudioDraft;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      className={cn(className)}
      onClick={() => {
        stashStudioDraft(draft);
        track('studio_opened', { source: label });
        router.push(STUDIO_PATH);
      }}
    >
      {label}
    </Button>
  );
}
