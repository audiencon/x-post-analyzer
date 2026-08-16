'use client';

import { useEffect, useState } from 'react';
import { deleteThread, listThreads } from '@/actions/threads';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { STUDIO_PATH, type StudioDraft } from '@/lib/studio-draft';
import { cn } from '@/lib/utils';

type ThreadItem = {
  id: string;
  title: string;
  tweets: string[];
  roast: string | null;
  scores: unknown;
  postedAt: Date | null;
  updatedAt: Date;
};

function draftSnippet(tweets: string[]) {
  const text = tweets
    .find(tweet => tweet.trim())
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Blank page';
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

function draftWhen(updatedAt: Date) {
  const date = new Date(updatedAt);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StudioDrafts({
  activeId,
  onNew,
  onLoad,
  variant = 'menu',
}: {
  activeId?: string;
  onNew: () => void;
  onLoad: (id: string, draft: StudioDraft) => void;
  variant?: 'menu' | 'rail';
}) {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadItem[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    listThreads().then(setThreads);
  }, [session?.user, activeId]);

  if (!session?.user) {
    return (
      <a
        href={`/auth/login?next=${STUDIO_PATH}`}
        className="px-4 py-4 text-xs text-white/45 hover:text-white"
      >
        Sign in to keep drafts
      </a>
    );
  }

  const list = (
    <ul className="space-y-0.5">
      {threads.length === 0 ? (
        <li className="px-3 py-4 text-xs text-white/35">Nothing saved yet.</li>
      ) : (
        threads.map(thread => (
          <li key={thread.id} className="group flex items-center">
            <button
              type="button"
              className={cn(
                'min-w-0 flex-1 px-3 py-2.5 text-left text-sm',
                thread.id === activeId ? 'bg-white/8 text-white' : 'text-white/60 hover:bg-white/4 hover:text-white'
              )}
              onClick={() => {
                onLoad(thread.id, {
                  tweets: thread.tweets,
                  title: thread.title,
                  roast: thread.roast ?? undefined,
                  scores:
                    thread.scores &&
                    typeof thread.scores === 'object' &&
                    'engagement' in thread.scores
                      ? (thread.scores as StudioDraft['scores'])
                      : undefined,
                  postedAt: thread.postedAt,
                });
                setOpen(false);
              }}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate">{thread.title}</span>
                <span className="shrink-0 text-[10px] tracking-wide text-white/30 uppercase">
                  {thread.postedAt ? 'Posted' : draftWhen(thread.updatedAt)}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-white/35">
                {draftSnippet(thread.tweets)}
              </span>
            </button>
            <button
              type="button"
              aria-label="Delete draft"
              className="px-2 text-white/25 opacity-0 group-hover:opacity-100 hover:text-white"
              onClick={async () => {
                await deleteThread(thread.id);
                setThreads(prev => prev.filter(item => item.id !== thread.id));
                if (thread.id === activeId) onNew();
              }}
            >
              ×
            </button>
          </li>
        ))
      )}
    </ul>
  );

  if (variant === 'rail') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <p className="text-[11px] tracking-[0.16em] text-white/35 uppercase">Drafts</p>
          <button type="button" onClick={onNew} className="text-xs text-white/50 hover:text-white">
            New
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
      </div>
    );
  }

  return (
    <div className="relative mb-6">
      <Button size="sm" variant="ghost" onClick={() => setOpen(value => !value)}>
        Drafts
      </Button>
      {open ? (
        <div className="absolute top-full left-0 z-30 mt-2 w-72 border border-white/10 bg-[oklch(0.16_0.014_50)] p-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-none"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
          >
            New draft
          </Button>
          <div className="mt-2 max-h-72 overflow-y-auto">{list}</div>
        </div>
      ) : null}
    </div>
  );
}
