'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type CommandAction = {
  id: string;
  title: string;
  hint?: string;
  onRun: () => void;
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandAction[];
}

export function CommandPalette({ open, onOpenChange, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      a => a.title.toLowerCase().includes(q) || (a.hint?.toLowerCase().includes(q) ?? false)
    );
  }, [actions, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const run = (action: CommandAction) => {
    onOpenChange(false);
    action.onRun();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-none border-white/10 bg-[oklch(0.16_0.014_50)] p-0 text-[oklch(0.93_0.015_80)] sm:max-w-lg"
      >
        <div className="border-b border-white/8 px-4 py-3">
          <Input
            placeholder="Go to…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(i => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(i => Math.max(0, i - 1));
              } else if (e.key === 'Enter' && filtered[active]) {
                e.preventDefault();
                run(filtered[active]);
              }
            }}
            className="h-8 border-0 bg-transparent px-0 text-base text-[oklch(0.93_0.015_80)] shadow-none placeholder:text-white/30 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.map((action, index) => (
            <button
              key={action.id}
              onClick={() => run(action)}
              onMouseEnter={() => setActive(index)}
              className={`flex w-full items-baseline justify-between px-4 py-2.5 text-left text-sm ${
                index === active ? 'bg-white/6 text-white' : 'text-white/70'
              }`}
            >
              <span>{action.title}</span>
              {action.hint ? (
                <span className="ml-4 text-[11px] tracking-wide text-white/30 uppercase">
                  {action.hint}
                </span>
              ) : null}
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/35">Nothing matches.</div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
