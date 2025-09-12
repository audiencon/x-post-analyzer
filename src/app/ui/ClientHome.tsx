'use client';

import { useMemo, useState } from 'react';
import { AnalyzeForm } from '@/components/analyze/analyze-form';
import { CommandPalette } from '@/components/cursor/CommandPalette';
import { Button } from '@/components/ui/button';
import { StudioComponent } from '@/components/studio';

export default function ClientHome() {
  const [showCursor, setShowCursor] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const actions = useMemo(
    () => [
      {
        id: 'toggle-cursor',
        title: showCursor ? 'Close Cursor Mode' : 'Open Cursor Mode',
        onRun: () => setShowCursor(s => !s),
      },
      {
        id: 'focus-composer',
        title: 'Focus Composer',
        onRun: () => setShowCursor(true),
      },
    ],
    [showCursor]
  );

  return (
    <div className="relative w-full">
      <div className="mb-4 flex w-full items-center justify-end gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/60">Press Ctrl/Cmd+K for commands</div>
          <Button size="sm" variant="secondary" onClick={() => setShowCursor(s => !s)}>
            {showCursor ? 'Close' : '𝕏 Cursor'}
          </Button>
        </div>
      </div>

      {showCursor ? <StudioComponent /> : <AnalyzeForm />}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={actions} />
    </div>
  );
}
