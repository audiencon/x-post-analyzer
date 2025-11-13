'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface CharacterCounterProps {
  text: string;
  maxLength?: number;
  showProgress?: boolean;
  className?: string;
}

// X (Twitter) character limits
const X_CHAR_LIMIT = 280;

export function CharacterCounter({
  text,
  maxLength = X_CHAR_LIMIT,
  showProgress = true,
  className,
}: CharacterCounterProps) {
  const count = text.length;
  const remaining = maxLength - count;
  const percentage = (count / maxLength) * 100;

  const status = useMemo(() => {
    if (count === 0) return 'empty';
    if (count <= maxLength * 0.8) return 'safe';
    if (count <= maxLength * 0.95) return 'warning';
    if (count <= maxLength) return 'danger';
    return 'over';
  }, [count, maxLength]);

  const colorClasses = {
    empty: 'text-white/40',
    safe: 'text-emerald-400',
    warning: 'text-yellow-400',
    danger: 'text-orange-400',
    over: 'text-red-400',
  };

  const progressColorClasses = {
    empty: 'bg-white/10',
    safe: 'bg-emerald-500',
    warning: 'bg-yellow-500',
    danger: 'bg-orange-500',
    over: 'bg-red-500',
  };

  const getStatusIcon = () => {
    if (status === 'over') {
      return <AlertCircle className="h-3 w-3" />;
    }
    if (status === 'safe' && count > 0) {
      return <CheckCircle2 className="h-3 w-3" />;
    }
    return null;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showProgress && (
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full transition-all duration-200', progressColorClasses[status])}
            style={{
              width: `${Math.min(percentage, 100)}%`,
            }}
          />
        </div>
      )}
      <div className={cn('flex items-center gap-1.5 text-xs font-medium', colorClasses[status])}>
        {getStatusIcon()}
        <span>
          {count}/{maxLength}
        </span>
        {status === 'over' && (
          <span className="text-[10px] opacity-80">({Math.abs(remaining)} over)</span>
        )}
        {status === 'safe' && remaining < 50 && (
          <span className="text-[10px] opacity-60">({remaining} left)</span>
        )}
      </div>
    </div>
  );
}
