import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'PostRoast Studio — finish the draft after the roast';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
        <div
          style={{
            fontSize: 88,
            fontStyle: 'italic',
            lineHeight: 1,
            marginTop: 36,
          }}
        >
          Studio
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#c9b8a8',
            marginTop: 28,
            maxWidth: 880,
            lineHeight: 1.35,
          }}
        >
          Finish the draft after the roast. Threads, rewrite, and a red pen.
        </div>
      </div>
    ),
    size
  );
}
