import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Footer } from '@/components/footer';
import { Analytics } from '@vercel/analytics/react';
import { BannerSpot } from '@/components/spots/banner-spot';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const baseUrl = 'https://postroast.app';
const ogImageUrl = `${baseUrl}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'PostRoast - AI-Powered X (Twitter) Post Analysis & Roasting',
    template: '%s | PostRoast',
  },
  description:
    'Get your X (Twitter) posts roasted by AI! PostRoast analyzes your content for engagement, clarity, and provides actionable feedback to improve.',
  keywords: [
    'X',
    'Twitter',
    'post roast',
    'post analyzer',
    'social media analysis',
    'AI analysis',
    'engagement',
    'virality',
    'social media',
    'content optimization',
  ],
  authors: [{ name: 'Audiencon', url: 'https://github.com/audiencon' }],
  creator: 'Audiencon',
  publisher: 'Audiencon',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'PostRoast - Roast Your Posts for Peak Performance',
    description:
      'Get AI-powered feedback on your social media posts. PostRoast helps improve engagement, clarity, and reach.',
    siteName: 'PostRoast',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'PostRoast - AI-Powered Social Post Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostRoast - Roast Your Posts for Peak Performance',
    description:
      'Get AI-powered feedback on your social media posts. PostRoast helps improve engagement, clarity, and reach.',
    images: [ogImageUrl],
    creator: '@audiencon',
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
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-[#111] font-sans text-white antialiased`}>
        <BannerSpot id="spot-banner" />
        {children}
        <Footer />
        <Toaster position="bottom-right" theme="dark" closeButton richColors />
        <Analytics />
      </body>
    </html>
  );
}
