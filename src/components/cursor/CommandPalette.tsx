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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      a => a.title.toLowerCase().includes(q) || (a.hint?.toLowerCase().includes(q) ?? false)
    );
  }, [actions, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2 border-[#333] bg-[#101010] p-0 text-white sm:max-w-lg">
        <div className="border-b border-[#222] p-2">
          <Input
            placeholder="Type a command... (Ctrl/Cmd+K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 bg-[#0c0c0c] text-sm text-white placeholder:text-white/40 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.map(action => (
            <button
              key={action.id}
              onClick={() => {
                onOpenChange(false);
                action.onRun();
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5"
            >
              <span>{action.title}</span>
              {action.hint && <span className="text-xs text-white/40">{action.hint}</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-white/50">No commands</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

