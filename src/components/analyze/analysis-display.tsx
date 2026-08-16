'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RoastCardExport } from '@/components/roast-card/RoastCardExport';
import { OpenInStudioButton } from '@/components/studio/open-in-studio-button';
import { ShareRoastButton } from '@/components/roast-card/share-roast-button';
import { InkScore } from '@/components/tool/ink-score';
import { RewriteAngles } from './rewrite-angles';
import { ScoresCard } from './scores-card';
import { StyleExamples } from './style-examples';
import { PayoutDesk } from './desk-flags';
import type { AnalysisResult } from '@/actions/analyze';
import { buildDesk } from '@/lib/x-monetization';
import { toast } from 'sonner';

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  content: string;
  handleReturn: () => void;
  showSuggestions: boolean;
  handleGetSuggestions: () => void;
  isGettingSuggestions: boolean;
  streamedRoast?: string;
  goal?: string;
  children?: React.ReactNode;
}

function verdictLine(score: number) {
  if (score < 40) return 'This will die in the feed.';
  if (score < 55) return 'Fine. Fine does not travel.';
  if (score < 70) return 'It can live. It is not done.';
  if (score < 85) return 'Close. One harder line.';
  return 'Ship it. Or get greedier.';
}

function leakLine(scores: AnalysisResult['scores'], payout?: number) {
  const entries = [
    { label: 'Engage', value: scores.engagement },
    { label: 'Warmth', value: scores.friendliness },
    { label: 'Viral', value: scores.virality },
    ...(typeof payout === 'number' ? ([{ label: 'Payout', value: payout }] as const) : []),
  ];
  const worst = entries.reduce((a, b) => (b.value < a.value ? b : a));
  if (worst.value >= 70) return null;
  return `${worst.label} is the leak.`;
}

function draftStats(content: string) {
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return { chars, words };
}

function NoteList({
  label,
  items,
  sting = false,
}: {
  label: string;
  items: string[];
  sting?: boolean;
}) {
  return (
    <div>
      <p
        className={
          sting
            ? 'text-ink-soft text-[11px] tracking-[0.18em] uppercase'
            : 'text-[11px] tracking-[0.18em] text-white/35 uppercase'
        }
      >
        {label}
      </p>
      <ol className="mt-4 space-y-4">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4 text-[0.95rem] leading-7 text-white/68">
            <span className="font-heading w-7 shrink-0 text-white/28">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AnalysisDisplay({
  analysis,
  content,
  handleReturn,
  showSuggestions,
  handleGetSuggestions,
  isGettingSuggestions,
  streamedRoast,
  goal,
  children,
}: AnalysisDisplayProps) {
  const [copiedDraft, setCopiedDraft] = useState(false);

  if (!analysis) return null;

  const roastLine =
    streamedRoast ||
    analysis.analysis?.weaknesses?.[0] ||
    analysis.analysis?.synthesis ||
    'This draft is trying not to be disliked. That is why nobody will remember it.';

  const globalScore = Math.round(
    (analysis.scores.engagement + analysis.scores.friendliness + analysis.scores.virality) / 3
  );
  const notes = analysis.analysis;
  const desk = analysis.desk ?? buildDesk(content);
  const leak = leakLine(analysis.scores, desk.payout);
  const { chars, words } = draftStats(content);
  const dyingNotes = notes?.weaknesses?.filter(item => item !== roastLine) ?? [];

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedDraft(true);
      toast.success('Draft copied.');
      setTimeout(() => setCopiedDraft(false), 2000);
    } catch {
      toast.error('Could not copy.');
    }
  };

  return (
    <motion.div
      key="analysis"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="flex items-baseline justify-between gap-6">
        <button
          type="button"
          onClick={handleReturn}
          className="text-sm text-white/40 hover:text-white"
        >
          Another draft
        </button>
        <p className="text-[11px] tracking-[0.18em] text-white/28 uppercase">
          Critique · {words} {words === 1 ? 'word' : 'words'} · {chars}
        </p>
      </div>

      <section className="border-ink mt-10 border-l-2 pl-6 sm:pl-8">
        <p className="text-ink-soft text-[11px] tracking-[0.2em] uppercase">The roast</p>
        <p className="font-heading text-ink-soft mt-5 max-w-[22ch] text-[clamp(2.15rem,4.6vw,4rem)] leading-[1.06] tracking-tight sm:max-w-[28ch]">
          {roastLine}
        </p>
      </section>

      <section className="border-rule mt-14 grid items-end gap-10 border-y py-10 sm:grid-cols-[auto_1fr] sm:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-heading text-copy text-[5.5rem] leading-none tracking-tight sm:text-[7rem]">
            {globalScore}
          </p>
          <p className="mt-2 text-[11px] tracking-[0.18em] text-white/30 uppercase">of 100</p>
          <p className="mt-4 max-w-[16rem] text-sm leading-6 text-white/55">
            {verdictLine(globalScore)}
            {leak ? ` ${leak}` : ''}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          <InkScore
            label="Engage"
            value={analysis.scores.engagement}
            sting={analysis.scores.engagement < 55}
          />
          <InkScore
            label="Warmth"
            value={analysis.scores.friendliness}
            sting={analysis.scores.friendliness < 55}
          />
          <InkScore
            label="Viral"
            value={analysis.scores.virality}
            sting={analysis.scores.virality < 55}
          />
          <InkScore label="Payout" value={desk.payout} sting={desk.payout < 55} />
        </motion.div>
      </section>

      <section className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
        <aside>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">The draft</p>
            <button
              type="button"
              onClick={copyDraft}
              className="text-xs text-white/35 hover:text-white"
            >
              {copiedDraft ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="border-ink/50 bg-paper-2/80 mt-4 border-l px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-[1.06rem] leading-8 whitespace-pre-wrap text-white/78">{content}</p>
          </div>
        </aside>
        <div className="space-y-11">
          {notes?.synthesis ? (
            <div>
              <p className="text-[11px] tracking-[0.18em] text-white/35 uppercase">The read</p>
              <p className="font-heading text-copy mt-3 text-[1.65rem] leading-snug">
                {notes.synthesis}
              </p>
            </div>
          ) : null}
          {dyingNotes.length ? <NoteList label="What dies" items={dyingNotes} sting /> : null}
          {notes?.strengths?.length ? (
            <NoteList label="What lives" items={notes.strengths} />
          ) : null}
          {notes?.recommendations?.length ? (
            <NoteList label="Fix these" items={notes.recommendations} />
          ) : null}
        </div>
      </section>

      <PayoutDesk desk={desk} />

      <div className="border-rule mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-10 text-sm">
        <OpenInStudioButton
          variant="ghost"
          className="text-ink-soft hover:text-ink-soft/80 h-auto rounded-none px-0 hover:bg-transparent"
          draft={{ tweets: [content], roast: roastLine, scores: analysis.scores, desk, goal }}
          label="Finish in Studio"
        />
        <span className="text-white/15">·</span>
        <ShareRoastButton
          roastId={analysis.roastId}
          content={content}
          roast={roastLine}
          scores={analysis.scores}
          analysis={analysis}
        />
        <span className="text-white/15">·</span>
        <RoastCardExport content={content} roast={roastLine} scores={analysis.scores} />
      </div>

      <div className="mt-20">
        <RewriteAngles
          content={content}
          roast={roastLine}
          scores={analysis.scores}
          desk={desk}
          goal={goal}
        />
      </div>

      {!showSuggestions && !isGettingSuggestions ? (
        <button
          type="button"
          onClick={handleGetSuggestions}
          className="mt-16 text-sm text-white/40 hover:text-white"
        >
          More versions
        </button>
      ) : null}

      {children}

      <div className="mt-20">
        <ScoresCard analytics={analysis.analytics} />
      </div>
      <div className="mt-20">
        <StyleExamples content={content} />
      </div>
    </motion.div>
  );
}
