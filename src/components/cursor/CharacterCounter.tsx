'use client';

import { useMemo } from 'react';
import { visiblePostText } from '@/lib/editor-helpers';
import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  text: string;
  maxLength?: number;
  showProgress?: boolean;
  className?: string;
}

const X_CHAR_LIMIT = 280;

export function CharacterCounter({
  text,
  maxLength = X_CHAR_LIMIT,
  className,
}: CharacterCounterProps) {
  const count = visiblePostText(text).length;
  const remaining = maxLength - count;
  const over = count > maxLength;

  const tone = useMemo(() => {
    if (count === 0) return 'empty';
    if (over) return 'over';
    if (count > maxLength * 0.92) return 'tight';
    return 'ok';
  }, [count, maxLength, over]);

  return (
    <p
      className={cn(
        'font-heading text-[11px] tabular-nums tracking-wide',
        tone === 'empty' && 'text-white/25',
        tone === 'ok' && 'text-white/35',
        tone === 'tight' && 'text-white/55',
        tone === 'over' && 'text-[oklch(0.72_0.16_28)]',
        className
      )}
    >
      {over ? `${Math.abs(remaining)} over` : remaining}
    </p>
  );
}
