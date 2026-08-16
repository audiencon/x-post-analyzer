import { cn } from '@/lib/utils';

export function InkScore({
  label,
  value,
  sting = false,
  compact = false,
}: {
  label: string;
  value: number;
  sting?: boolean;
  compact?: boolean;
}) {
  const hot = sting || value < 50;
  return (
    <div className="min-w-0">
      <p className="text-[11px] tracking-[0.16em] text-white/40 uppercase">{label}</p>
      <p
        className={cn(
          'font-heading mt-1 tracking-tight',
          compact ? 'text-2xl' : 'text-4xl',
          hot ? 'text-[oklch(0.72_0.18_28)]' : 'text-[oklch(0.93_0.015_80)]'
        )}
      >
        {value}
      </p>
      <div className="mt-3 h-px bg-white/10">
        <div
          className={cn(
            'h-px origin-left transition-[width] duration-700 ease-out',
            hot ? 'bg-ink' : 'bg-white/45'
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
