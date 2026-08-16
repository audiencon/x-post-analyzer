import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { listRoasts } from '@/actions/roasts';
import { buttonVariants } from '@/components/ui/button';
import { HistoryStudioLink } from '@/components/studio/history-studio-link';
import { HistoryShareLink } from '@/components/studio/history-share-link';
import { RoastAgainButton } from '@/components/studio/roast-again-button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'History',
  robots: { index: false, follow: false },
};

function scoreLabel(scores: unknown) {
  if (!scores || typeof scores !== 'object') return null;
  const value = scores as { engagement?: number; friendliness?: number; virality?: number };
  if (
    typeof value.engagement !== 'number' ||
    typeof value.friendliness !== 'number' ||
    typeof value.virality !== 'number'
  ) {
    return null;
  }
  return Math.round((value.engagement + value.friendliness + value.virality) / 3);
}

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?next=/history');
  }

  const roasts = await listRoasts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-ink-soft text-xs tracking-[0.2em] uppercase">History</p>
      <h1 className="font-heading mt-3 text-4xl tracking-tight">Your roasts</h1>
      <p className="mt-3 text-white/55">
        Signed-in roasts are saved here. Pro removes the daily cap.
      </p>

      {roasts.length === 0 ? (
        <div className="mt-10 space-y-4">
          <p className="text-white/60">Nothing saved yet.</p>
          <Link href="/roast" className={buttonVariants()}>
            Roast a post
          </Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-white/8 border-y border-white/8">
          {roasts.map(item => (
            <li key={item.id} className="py-6">
              <p className="text-xs text-white/40">
                {item.createdAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {scoreLabel(item.scores) !== null ? ` · ${scoreLabel(item.scores)}` : ''}
              </p>
              <p className="mt-2 text-sm text-white/70">{item.content}</p>
              <p className="font-heading mt-3 text-lg text-[oklch(0.86_0.08_28)]">“{item.roast}”</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <RoastAgainButton
                  content={item.content}
                  className="text-sm text-white/50 hover:text-white"
                />
                <HistoryStudioLink content={item.content} roast={item.roast} scores={item.scores} />
                <HistoryShareLink
                  id={item.id}
                  content={item.content}
                  roast={item.roast}
                  scores={item.scores}
                  isPublic={item.isPublic}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
