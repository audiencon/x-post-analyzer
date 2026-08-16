/* eslint-disable @next/next/no-img-element */
'use client';

import type { InspirationExample } from '@/actions/inspiration';
import { cn } from '@/lib/utils';

interface InspirationCardProps {
  example: InspirationExample;
  index: number;
  onSelect: (text: string) => void;
}

function formatHeat(value: number | undefined) {
  if (!value) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.0', '')}k`;
  return String(value);
}

function formatDay(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function stripUrls(text: string) {
  return text.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
}

function avatarSrc(url?: string) {
  if (!url) return null;
  return url.replace('_normal.', '_bigger.');
}

function initials(name?: string, handle?: string) {
  const source = name?.trim() || handle?.trim() || '?';
  const parts = source.replace(/^@/, '').split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return letters.toUpperCase() || '?';
}

export function InspirationCard({ example, index, onSelect }: InspirationCardProps) {
  const heat = formatHeat(example.metrics?.like_count);
  const day = formatDay(example.createdAt);
  const line = stripUrls(example.text);
  const byline = example.userName || (example.userHandle ? `@${example.userHandle}` : 'Unknown');
  const photo = avatarSrc(example.userAvatarUrl);
  const mark = initials(example.userName, example.userHandle);

  return (
    <article className="border-t border-white/8 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <p className="font-heading w-6 shrink-0 text-sm text-white/28">
            {String(index + 1).padStart(2, '0')}
          </p>
          {photo ? (
            <img
              src={photo}
              alt=""
              className="size-8 shrink-0 object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center bg-white/8 text-[10px] tracking-wide text-white/45">
              {mark}
            </span>
          )}
          <p className="min-w-0 truncate text-xs text-white/45">
            {byline}
            {example.userHandle && example.userName ? (
              <span className="text-white/28"> · @{example.userHandle}</span>
            ) : null}
          </p>
        </div>
        <p className="shrink-0 text-[11px] tracking-[0.14em] text-white/30 uppercase">
          {[day, heat ? `${heat} heat` : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      <p className="font-heading mt-3 text-xl leading-snug text-[oklch(0.93_0.015_80)]">{line}</p>

      {example.mediaUrl && example.mediaType === 'photo' ? (
        <img
          src={example.mediaUrl}
          alt=""
          className="mt-4 max-h-48 w-full object-cover object-center opacity-90"
          loading="lazy"
        />
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onSelect(example.text)}
          className={cn(
            'text-sm text-[oklch(0.72_0.16_28)] hover:text-[oklch(0.8_0.16_28)]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[oklch(0.72_0.16_28)]'
          )}
        >
          Use this line
        </button>
      </div>
    </article>
  );
}
