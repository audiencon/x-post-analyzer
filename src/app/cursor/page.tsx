import { redirect } from 'next/navigation';
import { STUDIO_PATH } from '@/lib/studio-draft';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio',
  alternates: { canonical: '/studio' },
  robots: { index: false, follow: true },
};

export default function CursorPage() {
  redirect(STUDIO_PATH);
}
