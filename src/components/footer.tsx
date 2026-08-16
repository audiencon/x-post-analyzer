'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/8 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center">
        <div className="text-sm text-white/45">
          Free to roast.{' '}
          <a href="/#pricing" className="underline decoration-white/20 underline-offset-4 hover:text-white">
            Paid to remember.
          </a>
        </div>
        <nav className="flex flex-wrap items-center gap-5 text-sm text-white/45" aria-label="Footer">
          <Link href="/desk" className="hover:text-white">
            Desk
          </Link>
          <Link href="/roast" className="hover:text-white">
            Roast
          </Link>
          <Link href="/ideas" className="hover:text-white">
            Ideas
          </Link>
          <Link href="/studio" className="hover:text-white">
            Studio
          </Link>
          <Link href="/faq" className="hover:text-white">
            FAQ
          </Link>
          <Link href="/vs" className="hover:text-white">
            Compare
          </Link>
          <Link href="/founder" className="hover:text-white">
            Founder
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link
            href="https://x.com/audiencon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            @audiencon
          </Link>
        </nav>
      </div>
    </footer>
  );
}
