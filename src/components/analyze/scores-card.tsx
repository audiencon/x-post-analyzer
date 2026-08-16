'use client';

interface AdvancedAnalytics {
  readability: {
    score: number;
    level: string;
    description: string;
  };
  sentiment: {
    score: number;
    type: string;
    emotions: string[];
  };
  timing: {
    bestTime: string;
    timezone: string;
    peakDays: string[];
  };
  hashtags: {
    recommended: string[];
    reach: string;
  };
  audience: {
    primary: string;
    interests: string[];
    age: string;
  };
  keywords: {
    optimal: string[];
    trending: string[];
  };
}

export function ScoresCard({ analytics }: { analytics: AdvancedAnalytics }) {
  if (!analytics?.readability) return null;

  return (
    <section>
      <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">Margins</p>
      <h2 className="font-heading mt-2 text-[clamp(2rem,4vw,3rem)] tracking-tight">
        The boring facts that still matter.
      </h2>
      <dl className="mt-10 grid gap-x-10 gap-y-8 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-white/35 uppercase">Readability</dt>
          <dd className="mt-2 leading-6 text-white/70">
            {analytics.readability.level}. {analytics.readability.description}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-white/35 uppercase">Tone</dt>
          <dd className="mt-2 leading-6 text-white/70">
            {analytics.sentiment.type}
            {analytics.sentiment.emotions.length
              ? ` · ${analytics.sentiment.emotions.join(', ')}`
              : ''}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-white/35 uppercase">Audience</dt>
          <dd className="mt-2 leading-6 text-white/70">
            {analytics.audience.primary}, {analytics.audience.age}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.16em] text-white/35 uppercase">When</dt>
          <dd className="mt-2 leading-6 text-white/70">
            {analytics.timing.bestTime} {analytics.timing.timezone}
            {analytics.timing.peakDays.length ? ` · ${analytics.timing.peakDays.join(', ')}` : ''}
          </dd>
        </div>
      </dl>
    </section>
  );
}
