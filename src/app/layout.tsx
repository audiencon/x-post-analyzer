import type { Metadata } from 'next';
import { Figtree, Newsreader } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { AnalyticsProvider } from '@/components/analytics/posthog-provider';
import { AppChrome } from '@/components/app-chrome';
import { SITE, SITE_OG_IMAGE } from '@/config/site';
import { cn } from '@/lib/utils';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'PostRoast — The last stop before you hit Post',
    template: '%s | PostRoast',
  },
  description: SITE.description,
  keywords: [
    'X post roast',
    'tweet critique',
    'AI writing coach',
    'Original Content Rewards',
    'X thread editor',
  ],
  authors: [{ name: SITE.founder.name, url: SITE.founder.url }],
  creator: SITE.founder.name,
  publisher: SITE.name,
  category: 'technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE.url,
    title: 'PostRoast — Your tweet is fine. Fine does not get you followers.',
    description: SITE.shortDescription,
    siteName: SITE.name,
    images: [
      {
        url: SITE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'PostRoast roast before and after',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostRoast — The last stop before you hit Post',
    description: SITE.shortDescription,
    images: [SITE_OG_IMAGE],
    creator: SITE.founder.handle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', figtree.variable, newsreader.variable)}>
      <body className="min-h-screen bg-[oklch(0.145_0.018_50)] font-sans text-[oklch(0.93_0.015_80)] antialiased">
        <AnalyticsProvider>
          <AppChrome>{children}</AppChrome>
          <Toaster position="bottom-right" theme="dark" closeButton richColors />
          <Analytics />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
