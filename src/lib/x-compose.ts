import { visiblePostText } from '@/lib/editor-helpers';

const COMPOSE_TEXT_CAP = 2000;

export function writtenPosts(tweets: string[]) {
  return tweets.map(tweet => visiblePostText(tweet).trim()).filter(Boolean);
}

export function firstPostText(tweets: string[]) {
  return writtenPosts(tweets)[0] ?? '';
}

export function restPostsText(tweets: string[]) {
  return writtenPosts(tweets).slice(1);
}

export function composeOnXUrl(text: string) {
  const clean = visiblePostText(text).trim().slice(0, COMPOSE_TEXT_CAP);
  return `https://x.com/intent/post?text=${encodeURIComponent(clean)}`;
}
