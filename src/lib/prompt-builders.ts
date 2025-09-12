export function buildViralRewritePrompt(
  styleName: string,
  draft: string,
  limitTo280: boolean
): string {
  const basePrompt = `Act like you're a top-tier X (formerly Twitter) growth strategist whose posts consistently go viral, pulling in millions of views, replies, and reposts. You deeply understand the X algorithm, how it prioritizes engagement, and how to engineer posts to trigger curiosity, emotion, and conversation.

Based on the draft post I'll provide, rewrite it using the style: ${styleName}

Optimize it for:
- Hooking attention in 1 scroll
- High retention and scrolling behavior
- Triggering replies and reposts
- Clear structure with optional emojis(max 3), bullets, or visuals
- Ending with a strong CTA
- Without hashtags
- No hashtags

Add anything else that helps break the algorithm and boost engagement.`;

  const lengthConstraint = limitTo280
    ? '\n\nIMPORTANT: The final rewritten post MUST be 280 characters or less.'
    : '';

  return `${basePrompt}${lengthConstraint}

Here's my draft:
${draft}`;
}



