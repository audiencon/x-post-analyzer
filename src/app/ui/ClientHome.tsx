'use client';

import { AnalyzeForm } from '@/components/analyze/analyze-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function ClientHome() {
  return (
    <div className="relative w-full">
      <div className="mb-4 flex w-full items-center justify-end gap-3">
        <Link href="/cursor">
          <Button size="sm" variant="secondary" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>𝕏 Cursor</span>
          </Button>
        </Link>
      </div>

      <AnalyzeForm />
    </div>
  );
}
