'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname === '/studio' || pathname === '/cursor';

  if (immersive) return children;

  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
