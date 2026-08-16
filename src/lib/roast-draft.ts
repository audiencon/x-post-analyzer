export const ROAST_DRAFT_KEY = 'postroast.roastDraft';
const LEGACY_IDEA_KEY = 'postroast.ideaDraft';

export function stashRoastDraft(content: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ROAST_DRAFT_KEY, content);
}

export function takeRoastDraft(): string | null {
  if (typeof window === 'undefined') return null;
  const next = sessionStorage.getItem(ROAST_DRAFT_KEY) ?? sessionStorage.getItem(LEGACY_IDEA_KEY);
  sessionStorage.removeItem(ROAST_DRAFT_KEY);
  sessionStorage.removeItem(LEGACY_IDEA_KEY);
  return next?.trim() ? next : null;
}
