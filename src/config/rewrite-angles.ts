export const REWRITE_ANGLE_IDS = ['sharper', 'warmer', 'shorter'] as const;
export type RewriteAngleId = (typeof REWRITE_ANGLE_IDS)[number];

export type RewriteAngle = {
  id: RewriteAngleId;
  label: string;
  note: string;
  text: string;
};

export const REWRITE_ANGLE_COPY: Record<RewriteAngleId, { label: string; note: string }> = {
  sharper: { label: 'Sharper', note: 'More bite. Same claim.' },
  warmer: { label: 'Warmer', note: 'Same point. More human.' },
  shorter: { label: 'Shorter', note: 'The line that gets a reply.' },
};
