'use client';

import { useState } from 'react';
import { ThreadComposer } from '@/components/cursor/ThreadComposer';
import { StudioSidebar } from '@/components/cursor/StudioSidebar';

export function StudioComponent() {
  const [externalInsert, setExternalInsert] = useState('');

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-7xl gap-3 p-4">
      <div className="flex min-h-[70vh] flex-1 flex-col gap-3">
        <div className="flex-1 rounded-lg border border-white/10 bg-[#0b0b0b] p-3">
          <div className="mx-auto max-w-2xl">
            <ThreadComposer
              externalInsert={externalInsert}
              onInserted={() => setExternalInsert('')}
            />
          </div>
        </div>
      </div>

      <div className="hidden w-[360px] shrink-0 lg:block">
        <StudioSidebar onInsert={t => setExternalInsert(t)} />
      </div>
    </main>
  );
}
