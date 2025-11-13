'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Sparkles, Zap, Target } from 'lucide-react';

interface WritingQualityMetricsProps {
  text: string;
  className?: string;
}

interface Metric {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  description: string;
}

export function WritingQualityMetrics({ text, className }: WritingQualityMetricsProps) {
  const metrics = useMemo(() => {
    if (!text.trim()) return null;

    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Average words per sentence
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

    // Readability score (simplified Flesch-like)
    // Higher is better (0-100 scale)
    const readability = Math.max(
      0,
      Math.min(
        100,
        206.835 - 1.015 * avgWordsPerSentence - 84.6 * (words.length / sentences.length || 1)
      )
    );

    // Engagement score based on:
    // - Question marks, exclamation marks
    // - Short sentences (better for X)
    // - Action words
    const questions = (text.match(/\?/g) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    const actionWords =
      text.match(/\b(do|make|get|create|build|start|launch|ship|learn|grow)\b/gi)?.length || 0;
    const engagement = Math.min(
      100,
      Math.round(
        (questions * 10 +
          exclamations * 8 +
          actionWords * 5 +
          (avgWordsPerSentence < 15 ? 20 : 0)) /
          2
      )
    );

    // Clarity score (based on sentence length and complexity)
    const clarity = Math.max(
      0,
      Math.min(100, 100 - (avgWordsPerSentence > 20 ? (avgWordsPerSentence - 20) * 2 : 0))
    );

    // Hook strength (first sentence impact)
    const firstSentence = sentences[0] || '';
    const hookScore = Math.min(
      100,
      Math.round(
        (firstSentence.length < 100 ? 30 : 0) +
          (questions > 0 ? 20 : 0) +
          (exclamations > 0 ? 15 : 0) +
          (firstSentence.match(/\b(you|your|we|our)\b/gi)?.length || 0) * 10
      )
    );

    return {
      readability: Math.round(readability),
      engagement: Math.min(100, engagement),
      clarity: Math.round(clarity),
      hook: hookScore,
    };
  }, [text]);

  if (!metrics || !text.trim()) {
    return (
      <div className={cn('rounded-lg border border-white/10 bg-[#0e0e0e] p-3', className)}>
        <p className="text-xs text-white/40">Start writing to see quality metrics</p>
      </div>
    );
  }

  const metricData: Metric[] = [
    {
      label: 'Readability',
      value: metrics.readability,
      max: 100,
      icon: <Target className="h-3 w-3" />,
      description: 'How easy your text is to read',
    },
    {
      label: 'Engagement',
      value: metrics.engagement,
      max: 100,
      icon: <Sparkles className="h-3 w-3" />,
      description: 'Potential for audience interaction',
    },
    {
      label: 'Clarity',
      value: metrics.clarity,
      max: 100,
      icon: <Zap className="h-3 w-3" />,
      description: 'How clear and concise your message is',
    },
    {
      label: 'Hook',
      value: metrics.hook,
      max: 100,
      icon: <TrendingUp className="h-3 w-3" />,
      description: 'Opening line impact',
    },
  ];

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-emerald-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 80) return 'bg-emerald-500/20';
    if (value >= 60) return 'bg-yellow-500/20';
    if (value >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className={cn('rounded-lg border border-white/10 bg-[#0e0e0e] p-3', className)}>
      <div className="mb-2 text-xs font-medium text-white/70">Writing Quality</div>
      <div className="grid grid-cols-2 gap-2">
        {metricData.map(metric => (
          <div
            key={metric.label}
            className={cn('rounded-md border border-white/5 p-2', getScoreBgColor(metric.value))}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-white/60">{metric.icon}</span>
                <span className="text-[10px] font-medium text-white/70">{metric.label}</span>
              </div>
              <span className={cn('text-xs font-bold', getScoreColor(metric.value))}>
                {metric.value}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={cn('h-full transition-all duration-300', getScoreColor(metric.value))}
                style={{
                  width: `${(metric.value / metric.max) * 100}%`,
                  backgroundColor: 'currentColor',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
