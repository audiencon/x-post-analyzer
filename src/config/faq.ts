export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Do I need an account to roast a post?',
    answer:
      'Yes. Sign in, then you get ten free roasts a day. PostRoast stores the draft so it can score it and, if you want, keep history.',
  },
  {
    question: 'Does PostRoast post or schedule on X for me?',
    answer:
      'No. Compose on X opens a draft with the first post. Remaining thread posts are copied for you to paste. We do not take posting permission.',
  },
  {
    question: 'What is the difference between Pro and Studio?',
    answer:
      'Pro ($19/mo) removes the daily roast cap and keeps roast history. You still have three saved drafts and eight critiques a day. Studio ($32/mo) adds unlimited drafts and unlimited critique in the Studio workspace.',
  },
  {
    question: 'What do the four scores mean?',
    answer:
      'Engage is whether anyone stops. Warmth is whether it sounds like a person. Viral is whether anyone passes it on. Payout is whether the post-shape can earn X Original Content Rewards, ignoring your follower count.',
  },
  {
    question: 'Is the roast a guarantee of reach or payout?',
    answer:
      'No. The roast is an opinion about the draft. Scores are a reading of the words, not a forecast of likes, impressions, or Original Content Rewards cash.',
  },
  {
    question: 'What is Founder lifetime?',
    answer:
      'Founder is a one-time $199 Studio license. It includes unlimited roasts, drafts, and critique. It caps at 100 seats, then it closes.',
  },
  {
    question: 'What happens to a draft I paste?',
    answer:
      'We send it to the model that writes the roast, store it so we can show scores and history, and keep usage events for daily caps. A roast card goes public only when you click share. We do not sell drafts.',
  },
  {
    question: 'Can I use PostRoast without connecting my X account?',
    answer:
      'Yes. Email sign-in is enough. If X sign-in is offered, it is for identity only. We do not read your timeline or post as you.',
  },
];
