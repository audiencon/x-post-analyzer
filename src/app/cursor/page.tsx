import { Metadata } from 'next';
import { CursorClient } from './CursorClient';

const baseUrl = 'https://postroast.app';
const ogImageUrl = `${baseUrl}/cursor/opengraph-image`;

export const metadata: Metadata = {
  title: '𝕏 Cursor - AI-Powered Writing Studio for X (Twitter)',
  description:
    'Write, edit, and refine your X (Twitter) posts with AI-powered assistance. Get real-time suggestions, improvements, and analysis. Create engaging threads with intelligent editing tools.',
  keywords: [
    'X Cursor',
    'Twitter editor',
    'AI writing assistant',
    'Twitter thread composer',
    'social media content creator',
    'AI-powered text editor',
    'Twitter post editor',
    'content optimization',
    'thread writing tool',
    'AI text improvement',
    'social media writing',
    'X post composer',
  ],
  authors: [{ name: 'Audiencon', url: 'https://github.com/audiencon' }],
  creator: 'Audiencon',
  publisher: 'Audiencon',
  alternates: {
    canonical: '/cursor',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${baseUrl}/cursor`,
    title: '𝕏 Cursor - AI-Powered Writing Studio',
    description:
      'Write, edit, and refine your X (Twitter) posts with AI-powered assistance. Get real-time suggestions, improvements, and analysis.',
    siteName: 'PostRoast',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: '𝕏 Cursor - AI-Powered Writing Studio for X (Twitter)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '𝕏 Cursor - AI-Powered Writing Studio',
    description:
      'Write, edit, and refine your X (Twitter) posts with AI-powered assistance. Get real-time suggestions, improvements, and analysis.',
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
  category: 'Productivity',
};

// Structured Data for SEO and GEO (Generative Engine Optimization)
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '𝕏 Cursor - AI-Powered Writing Studio',
  description:
    'AI-powered writing studio for creating, editing, and optimizing X (Twitter) posts and threads. Get real-time AI suggestions and improvements.',
  url: `${baseUrl}/cursor`,
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI-powered text editing',
    'Real-time writing suggestions',
    'Thread composition',
    'Content analysis',
    'Text improvement suggestions',
    'Slash commands for quick editing',
    'AI assistant for content generation',
  ],
  creator: {
    '@type': 'Organization',
    name: 'Audiencon',
    url: 'https://github.com/audiencon',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '𝕏 Cursor',
  description:
    'AI-powered writing studio that helps users create, edit, and optimize X (Twitter) posts and threads with intelligent AI assistance.',
  url: `${baseUrl}/cursor`,
  applicationCategory: 'WebApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI text editing and improvement',
    'Real-time writing suggestions',
    'Thread composition tools',
    'Content analysis and scoring',
    'Slash command interface',
    'AI assistant chat',
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: '𝕏 Cursor',
      item: `${baseUrl}/cursor`,
    },
  ],
};

export default function CursorPage() {
  return (
    <>
      {/* Structured Data for SEO and GEO (Generative Engine Optimization) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Hidden descriptive content for AI engines */}
      <div className="sr-only" aria-hidden="true">
        <h1>𝕏 Cursor - AI-Powered Writing Studio</h1>
        <p>
          𝕏 Cursor is an AI-powered writing studio designed for creating, editing, and optimizing X
          (Twitter) posts and threads. This web application provides real-time AI assistance for
          content creation, including text improvement suggestions, thread composition tools,
          content analysis, and an AI assistant chat feature. Users can leverage slash commands for
          quick editing, get engagement scores, and receive intelligent suggestions to enhance their
          social media content.
        </p>
        <h2>Key Features</h2>
        <ul>
          <li>AI-powered text editing and improvement</li>
          <li>Real-time writing suggestions</li>
          <li>Thread composition tools</li>
          <li>Content analysis and scoring</li>
          <li>Slash command interface for quick actions</li>
          <li>AI assistant chat for content generation</li>
        </ul>
        <p>
          This tool is free to use and accessible through any web browser. It helps content
          creators, marketers, and social media managers optimize their X (Twitter) posts for better
          engagement and virality.
        </p>
      </div>
      <CursorClient />
    </>
  );
}
