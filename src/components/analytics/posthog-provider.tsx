'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { authClient } from '@/lib/auth-client';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
let started = false;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!key || started) return;
    started = true;
    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  useEffect(() => {
    if (!key || !session?.user) return;
    posthog.identify(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    });
  }, [session?.user]);

  if (!key) return children;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
