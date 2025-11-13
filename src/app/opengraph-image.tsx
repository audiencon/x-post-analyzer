import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PostRoast - AI-Powered X (Twitter) Post Analysis & Roasting';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('failed to load font data');
}

export default async function Image() {
  const text = 'Post Roast Get AI-powered insights to improve your posts engagement and reach';
  const interFontData = await loadGoogleFont('Inter:wght@400;700;900', text);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#010101',
          position: 'relative',
        }}
      >
        {/* Grid Pattern Background - Vertical lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
          }}
        >
          {Array.from({ length: Math.ceil(1200 / 40) }).map((_, i) => (
            <div
              key={`v-${i}`}
              style={{
                width: '40px',
                height: '100%',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>
        {/* Grid Pattern Background - Horizontal lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {Array.from({ length: Math.ceil(630 / 40) }).map((_, i) => (
            <div
              key={`h-${i}`}
              style={{
                width: '100%',
                height: '40px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>
        <div tw="relative flex flex-col items-center justify-center mb-8 size-16">
          <div
            tw="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', filter: 'blur(10px)' }}
          />
          <div
            tw="relative flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-lg size-16"
            style={{ width: '64px', height: '64px' }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: '900',
                color: '#000000',
                letterSpacing: '-0.05em',
                fontFamily: 'Inter',
              }}
            >
              𝕏
            </span>
          </div>
        </div>
        {/* Logo and Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '60px',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            <span
              style={{
                fontSize: '64px',
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: '-0.05em',
                fontFamily: 'Inter',
              }}
            >
              Post Roast
            </span>
          </div>

          {/* Slogan */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '32px',
              lineHeight: '1.4',
              fontFamily: 'Inter',
              fontWeight: 400,
              maxWidth: '900px',
            }}
          >
            Get AI-powered insights to improve your posts&apos; engagement and reach
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interFontData,
          style: 'normal',
        },
      ],
    }
  );
}
