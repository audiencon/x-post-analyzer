import { ImageResponse } from 'next/og';
import { getPublicRoast } from '@/actions/roasts';
import { globalScore } from '@/lib/scores';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roast = await getPublicRoast(id);
  const score = roast ? globalScore(roast.scores) : 0;
  const line = roast?.roast ?? 'This draft is trying not to be disliked.';
  const draft = roast?.content ?? 'Paste a draft. Get a roast.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#2a221c',
          color: '#f3ebe3',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            background: '#c44b32',
          }}
        />
        <div style={{ fontSize: 22, letterSpacing: 4, color: '#c9b8a8' }}>POSTROAST</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 28 }}>
          <div style={{ fontSize: 72, fontStyle: 'italic' }}>{score}</div>
          <div style={{ fontSize: 18, color: '#c9b8a8', marginBottom: 12 }}>GLOBAL SCORE</div>
        </div>
        <div
          style={{
            fontSize: 36,
            fontStyle: 'italic',
            lineHeight: 1.25,
            color: '#e8d2c4',
            marginTop: 28,
            maxWidth: 1000,
          }}
        >
          “{line.slice(0, 160)}
          {line.length > 160 ? '…' : ''}”
        </div>
        <div style={{ fontSize: 22, color: '#b7a89a', marginTop: 28, maxWidth: 1000 }}>
          {draft.slice(0, 140)}
          {draft.length > 140 ? '…' : ''}
        </div>
      </div>
    ),
    size
  );
}
