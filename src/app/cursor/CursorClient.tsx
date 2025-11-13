'use client';

import { useState, useMemo, useEffect } from 'react';
import { ThreadComposer } from '@/components/cursor/ThreadComposer';
import { StudioSidebar } from '@/components/cursor/StudioSidebar';
import { CommandPalette } from '@/components/cursor/CommandPalette';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MessageSquare, X } from 'lucide-react';
import { PostPreviewSpot } from '@/components/spots/post-preview-spot';

export function CursorClient() {
  const [externalInsert, setExternalInsert] = useState('');
  const [externalThread, setExternalThread] = useState<string[] | undefined>(undefined);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const actions = useMemo(
    () => [
      {
        id: 'focus-composer',
        title: 'Focus Composer',
        hint: 'Focus the text editor',
        onRun: () => {
          // Focus the first editor
          const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
          if (editor) {
            editor.focus();
            // Scroll into view if needed
            editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
      },
      {
        id: 'toggle-sidebar',
        title: sidebarOpen ? 'Close Sidebar' : 'Open Sidebar',
        hint: 'Toggle AI assistant sidebar',
        onRun: () => setSidebarOpen(prev => !prev),
      },
    ],
    [sidebarOpen]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
        return;
      }

      // Escape to close dialogs
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

      // Don't interfere if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // B key to toggle sidebar (when not in input)
      if (e.key === 'b' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, paletteOpen]);

  return (
    <main className="relative min-h-[calc(100vh-80px)] w-full">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#111]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-4" aria-label="Main navigation">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              aria-label="Return to home page"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-white/20" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1d9bf0]" aria-hidden="true" />
              <h1 className="text-lg font-semibold text-white">𝕏 Cursor</h1>
            </div>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-xs text-white/60 sm:block">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Ctrl/Cmd+K</kbd>{' '}
              for commands
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPaletteOpen(true)}
              className="hidden text-white/60 hover:text-white sm:flex"
              aria-label="Open command palette"
            >
              Commands
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
              className="flex text-white/60 hover:text-white lg:hidden"
              aria-label="Open AI assistant sidebar"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {/* Ad Spots between Header and Studio */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="grid gap-3 py-4 sm:grid-cols-1 md:grid-cols-3">
          <PostPreviewSpot
            id="spot-cursor-1"
            content=""
            className="rounded-lg border border-white/10"
            showScores={false}
          />
          <PostPreviewSpot
            id="spot-cursor-2"
            content=""
            className="rounded-lg border border-white/10"
            showScores={false}
          />
          <PostPreviewSpot
            id="spot-cursor-3"
            content=""
            className="rounded-lg border border-white/10"
            showScores={false}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto flex min-h-[calc(100vh-80px-57px)] w-full max-w-7xl flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:p-6">
        {/* Editor Section */}
        <section
          className="flex min-h-[calc(100vh-80px-57px-32px)] flex-1 flex-col"
          aria-label="Thread composer"
        >
          <div className="flex-1 rounded-lg border border-white/10 bg-[#0b0b0b] p-3 sm:p-4 lg:p-6">
            <div className="mx-auto w-full max-w-3xl">
              <div className="mb-4 hidden sm:block">
                <h2 className="text-sm font-medium text-white/60">Compose your thread</h2>
                <p className="mt-1 text-xs text-white/40">
                  Write, edit, and refine your X posts with AI-powered assistance
                </p>
              </div>
              <ThreadComposer
                externalInsert={externalInsert}
                externalThread={externalThread}
                onInserted={() => {
                  // Clear after a small delay to avoid triggering effects during render
                  setTimeout(() => {
                    setExternalInsert('');
                    setExternalThread(undefined);
                  }, 100);
                }}
              />
            </div>
          </div>
        </section>

        {/* Desktop Sidebar */}
        <aside
          className="hidden w-full shrink-0 lg:block lg:w-[360px]"
          aria-label="AI Assistant sidebar"
        >
          <StudioSidebar
            onInsert={t => setExternalInsert(t)}
            onInsertThread={tweets => setExternalThread(tweets)}
          />
        </aside>
      </div>

      {/* Mobile Sidebar Dialog */}
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent className="max-h-[90vh] border-white/10 bg-[#0b0b0b] p-0 sm:max-w-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-white">AI Assistant</h2>
              <p className="mt-0.5 text-xs text-white/50">Press Esc to close</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 p-0"
              aria-label="Close sidebar"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex max-h-[calc(90vh-60px)] flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <StudioSidebar
                onInsert={t => {
                  setExternalInsert(t);
                  setSidebarOpen(false);
                }}
                onInsertThread={tweets => {
                  setExternalThread(tweets);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={actions} />
    </main>
  );
}
