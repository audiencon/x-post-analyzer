'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ThreadComposer } from '@/components/cursor/ThreadComposer';
import { StudioSidebar } from '@/components/cursor/StudioSidebar';
import { StudioDrafts } from '@/components/cursor/StudioDrafts';
import { CommandPalette } from '@/components/cursor/CommandPalette';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { markThreadPosted, saveThread } from '@/actions/threads';
import { authClient } from '@/lib/auth-client';
import { isScratchDraft, takeStudioDraft, type StudioDraft, type StudioScores } from '@/lib/studio-draft';
import { pickStudioStarters } from '@/lib/studio-starters';
import { visiblePostText } from '@/lib/editor-helpers';
import { buildDesk, type DraftDesk } from '@/lib/x-monetization';
import { composeOnXUrl, firstPostText, restPostsText } from '@/lib/x-compose';
import { toast } from 'sonner';

export function CursorClient() {
  const { data: session } = authClient.useSession();
  const [externalInsert, setExternalInsert] = useState('');
  const [externalThread, setExternalThread] = useState<string[] | undefined>(undefined);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [critiqueOpen, setCritiqueOpen] = useState(true);
  const [composerKey, setComposerKey] = useState('new');
  const [threadId, setThreadId] = useState<string | undefined>();
  const [tweets, setTweets] = useState<string[]>(['']);
  const [roast, setRoast] = useState<string | undefined>();
  const [scores, setScores] = useState<StudioScores | undefined>();
  const [desk, setDesk] = useState<DraftDesk | undefined>();
  const [goal, setGoal] = useState<string | undefined>();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [postedAt, setPostedAt] = useState<Date | null>(null);
  const [saveCode, setSaveCode] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const capReachedRef = useRef(false);
  const paletteStarter = useMemo(() => pickStudioStarters(1)[0], []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const draft = takeStudioDraft();
    if (!draft) return;
    setExternalThread(draft.tweets);
    setTweets(draft.tweets);
    setRoast(draft.roast);
    setScores(draft.scores);
    setDesk(draft.desk ?? buildDesk(draft.tweets.map(visiblePostText).join('\n\n---\n\n')));
    setGoal(draft.goal);
    if (draft.threadId) setThreadId(draft.threadId);
    setPostedAt(draft.postedAt ? new Date(draft.postedAt) : null);
    setComposerKey(draft.threadId ?? `roast-${Date.now()}`);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    if (isScratchDraft(tweets)) return;
    if (!threadId && capReachedRef.current) return;

    const handle = window.setTimeout(async () => {
      setSaveState('saving');
      setSaveError(null);
      setSaveCode(null);
      const saved = await saveThread({
        id: threadId,
        tweets,
        roast,
        scores,
      });
      if (!saved.ok) {
        if (saved.code === 'scratch') {
          setSaveState('idle');
          return;
        }
        if (saved.code === 'cap') capReachedRef.current = true;
        setSaveState('error');
        setSaveError(saved.error);
        setSaveCode(saved.code);
        return;
      }
      setThreadId(saved.id);
      setSaveState('saved');
    }, 1600);

    return () => window.clearTimeout(handle);
  }, [tweets, threadId, roast, scores, session?.user]);

  const loadDraft = (id: string, draft: StudioDraft) => {
    setThreadId(id);
    setExternalThread(draft.tweets);
    setTweets(draft.tweets);
    setRoast(draft.roast);
    setScores(draft.scores);
    setDesk(draft.desk ?? buildDesk(draft.tweets.map(visiblePostText).join('\n\n---\n\n')));
    setGoal(draft.goal);
    setPostedAt(draft.postedAt ? new Date(draft.postedAt) : null);
    setComposerKey(id);
    setSaveState('saved');
  };

  const newDraft = () => {
    setThreadId(undefined);
    setExternalThread(['']);
    setTweets(['']);
    setRoast(undefined);
    setScores(undefined);
    setDesk(undefined);
    setGoal(undefined);
    setPostedAt(null);
    setComposerKey(`new-${Date.now()}`);
    setSaveState('idle');
    setSaveError(null);
    setSaveCode(null);
  };

  const composeOnX = () => {
    const text = firstPostText(tweets);
    if (!text) return;
    const rest = restPostsText(tweets);
    window.open(composeOnXUrl(text), '_blank', 'noopener,noreferrer');
    if (rest.length === 0) return;
    void navigator.clipboard.writeText(rest.join('\n\n---\n\n')).then(
      () => {
        toast('First post is on X. The rest is copied.', {
          description:
            rest.length === 1
              ? 'Paste the next post as a reply.'
              : `Paste the other ${rest.length} posts as replies.`,
        });
      },
      () => {
        toast('First post is on X.', {
          description: 'Copy the other posts from Studio. X only takes the first one.',
        });
      }
    );
  };

  const togglePosted = async () => {
    if (!session?.user) {
      setSaveError('Sign in to mark a draft as posted.');
      return;
    }

    try {
      let id = threadId;
      if (!id) {
        const saved = await saveThread({ tweets, roast, scores });
        if (!saved.ok) {
          setSaveState('error');
          setSaveError(saved.error);
          setSaveCode(saved.code);
          return;
        }
        id = saved.id;
        setThreadId(id);
      }
      const next = await markThreadPosted(id, !postedAt);
      setPostedAt(next.postedAt);
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Could not mark as posted.');
    }
  };

  const actions = useMemo(
    () => [
      {
        id: 'focus-composer',
        title: 'Focus composer',
        hint: 'Write the next line',
        onRun: () => {
          const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
          editor?.focus();
        },
      },
      {
        id: 'toggle-sidebar',
        title: critiqueOpen ? 'Hide critique' : 'Show critique',
        hint: ']',
        onRun: () => setCritiqueOpen(prev => !prev),
      },
      {
        id: 'toggle-drafts',
        title: draftsOpen ? 'Hide drafts' : 'Show drafts',
        hint: '[',
        onRun: () => setDraftsOpen(prev => !prev),
      },
      {
        id: 'new-draft',
        title: 'New draft',
        hint: 'N',
        onRun: newDraft,
      },
      {
        id: 'compose-x',
        title: 'Compose on X',
        hint: 'First post',
        onRun: composeOnX,
      },
      {
        id: 'mark-posted',
        title: postedAt ? 'Unmark posted' : 'Mark as posted',
        onRun: () => {
          void togglePosted();
        },
      },
      ...(paletteStarter
        ? [
            {
              id: 'random-starter',
              title: `Start: ${paletteStarter.title}`,
              hint: 'Opener',
              onRun: () => setExternalInsert(paletteStarter.insert),
            },
          ]
        : []),
      {
        id: 'go-roast',
        title: 'Roast a draft',
        hint: 'Roast',
        onRun: () => {
          window.location.href = '/roast';
        },
      },
      {
        id: 'go-desk',
        title: 'Open Desk',
        hint: 'Desk',
        onRun: () => {
          window.location.href = '/desk';
        },
      },
    ],
    [critiqueOpen, draftsOpen, paletteStarter, postedAt, tweets, threadId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (sidebarOpen) {
          setSidebarOpen(false);
          e.stopPropagation();
        }
        if (paletteOpen) {
          setPaletteOpen(false);
          e.stopPropagation();
        }
      }

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'b' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (window.matchMedia('(min-width: 1024px)').matches) {
          setCritiqueOpen(prev => !prev);
        } else {
          setSidebarOpen(prev => !prev);
        }
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        newDraft();
      }

      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setDraftsOpen(prev => !prev);
      }

      if (e.key === ']' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCritiqueOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, paletteOpen]);

  const saveLabel =
    saveState === 'saving'
      ? 'Saving'
      : saveState === 'saved'
        ? 'Saved'
        : (saveError ?? (session?.user ? 'Unsaved' : 'Sign in to keep drafts'));

  const draftText = visiblePostText(tweets.find(tweet => tweet.trim()) ?? '');

  return (
    <div className="flex h-svh flex-col bg-[oklch(0.132_0.016_50)]">
      <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/8 px-4">
        <nav className="flex items-center gap-5 text-sm text-white/45">
          <Link href="/" className="font-heading text-base text-white">
            PostRoast
          </Link>
          <Link href="/roast" className="hover:text-white">
            Roast
          </Link>
          <Link href="/ideas" className="hover:text-white">
            Ideas
          </Link>
        </nav>
        <p className="font-heading text-sm tracking-tight text-white/80">Studio</p>
        <div className="flex items-center justify-end gap-3 text-xs text-white/40">
          <span className={saveState === 'error' ? 'max-w-[14rem] truncate text-[oklch(0.78_0.12_28)]' : undefined}>
            {saveLabel}
          </span>
          {saveCode === 'cap' ? (
            <Link href="/account" className="text-[oklch(0.72_0.16_28)] hover:text-white">
              Upgrade
            </Link>
          ) : null}
          <span className="hidden tracking-wide text-white/25 uppercase sm:inline">
            N · [ · ] · ⌘K
          </span>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden hover:text-white sm:inline"
          >
            ⌘K
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="hover:text-white lg:hidden"
          >
            Critique
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {draftsOpen ? (
          <aside className="hidden w-64 shrink-0 flex-col border-r border-white/8 lg:flex">
            <StudioDrafts variant="rail" activeId={threadId} onNew={newDraft} onLoad={loadDraft} />
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setDraftsOpen(true)}
            className="hidden w-10 shrink-0 border-r border-white/8 text-[11px] tracking-[0.2em] text-white/30 uppercase [writing-mode:vertical-rl] hover:text-white lg:flex lg:items-center lg:justify-center"
          >
            Drafts
          </button>
        )}

        <section className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-10 sm:px-10">
            <div className="lg:hidden">
              <StudioDrafts activeId={threadId} onNew={newDraft} onLoad={loadDraft} />
            </div>
            <ThreadComposer
              key={composerKey}
              externalInsert={externalInsert}
              externalThread={externalThread}
              onTweetsChange={setTweets}
              onComposeOnX={composeOnX}
              onMarkPosted={session?.user ? togglePosted : undefined}
              posted={Boolean(postedAt)}
              onInserted={() => {
                setTimeout(() => {
                  setExternalInsert('');
                  setExternalThread(undefined);
                }, 100);
              }}
            />
          </div>
        </section>

        {critiqueOpen ? (
          <aside className="hidden h-full w-[360px] shrink-0 flex-col overflow-hidden border-l border-white/8 lg:flex">
            <StudioSidebar
              onInsert={t => setExternalInsert(t)}
              onInsertThread={next => setExternalThread(next)}
              draftText={draftText}
              roast={roast}
              scores={scores}
              desk={desk}
              goal={goal}
            />
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setCritiqueOpen(true)}
            className="hidden w-10 shrink-0 border-l border-white/8 text-[11px] tracking-[0.2em] text-white/30 uppercase [writing-mode:vertical-rl] hover:text-white lg:flex lg:items-center lg:justify-center"
          >
            Critique
          </button>
        )}
      </div>

      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent className="max-h-[90vh] border-white/10 bg-[oklch(0.14_0.016_50)] p-0 sm:max-w-lg">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <p className="text-sm text-white/70">Critique</p>
            <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)}>
              Close
            </Button>
          </div>
          <div className="max-h-[calc(90vh-52px)] overflow-y-auto px-4 pb-4">
            <StudioSidebar
              onInsert={t => {
                setExternalInsert(t);
                setSidebarOpen(false);
              }}
              onInsertThread={nextTweets => {
                setExternalThread(nextTweets);
                setSidebarOpen(false);
              }}
              draftText={draftText}
              roast={roast}
              scores={scores}
              desk={desk}
              goal={goal}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={actions} />
    </div>
  );
}
