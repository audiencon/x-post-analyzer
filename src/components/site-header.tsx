'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { isProPlan, planLabel } from '@/config/billing';

const links = [
  { href: '/desk', label: 'Desk' },
  { href: '/roast', label: 'Roast' },
  { href: '/studio', label: 'Studio' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/#pricing', label: 'Pricing' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const isPro = isProPlan(user?.plan, user?.planStatus);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[oklch(0.14_0.015_50_/_0.86)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-heading text-lg tracking-tight">
          PostRoast
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/60 sm:flex" aria-label="Primary">
          {links
            .filter(link => link.href !== '/desk' || Boolean(user))
            .map(link => {
            const isHash = link.href.includes('#');
            const active =
              !isHash &&
              (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)));
            const className = cn('transition-colors hover:text-white', active && 'text-white');
            if (isHash) {
              return (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            }
            return (
              <Link key={link.href} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {!isPending && user ? (
            <>
              <Link href="/desk" className="hidden text-sm text-white/60 hover:text-white sm:inline">
                {isPro ? planLabel(user.plan, user.planStatus) : user.name}
              </Link>
              <button
                type="button"
                className="text-sm text-white/45 hover:text-white"
                onClick={async () => {
                  await authClient.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/login?next=/desk" className="text-sm text-white/60 hover:text-white">
              Sign in
            </Link>
          )}
          <Link href="/roast" className={buttonVariants({ size: 'sm' })}>
            Roast a post
          </Link>
        </div>
      </div>
    </header>
  );
}
