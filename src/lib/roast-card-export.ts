export interface RoastCardPayload {
  content: string;
  roast: string;
  scores: {
    engagement: number;
    friendliness: number;
    virality: number;
  };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  let cursorY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines - 1) {
        let rest = words.slice(words.indexOf(word)).join(' ');
        while (ctx.measureText(`${rest}…`).width > maxWidth && rest.length > 0) {
          rest = rest.slice(0, -1);
        }
        ctx.fillText(`${rest}…`, x, cursorY);
        return;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export async function exportRoastCard(payload: RoastCardPayload) {
  await document.fonts.ready;

  const width = 1200;
  const height = 630;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create roast card canvas.');

  ctx.fillStyle = '#2a221c';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#c44b32';
  ctx.fillRect(0, 0, 14, height);

  ctx.fillStyle = '#c9b8a8';
  ctx.font = '500 22px Figtree, sans-serif';
  ctx.fillText('POSTROAST', 72, 72);

  const global = Math.round(
    (payload.scores.engagement + payload.scores.friendliness + payload.scores.virality) / 3
  );

  ctx.fillStyle = '#f3ebe3';
  ctx.font = 'italic 64px Newsreader, Georgia, serif';
  ctx.fillText(`${global}`, 72, 180);
  const scoreWidth = ctx.measureText(`${global}`).width;
  ctx.font = '500 18px Figtree, sans-serif';
  ctx.fillStyle = '#c9b8a8';
  ctx.fillText('GLOBAL SCORE', 72 + scoreWidth + 18, 168);

  ctx.fillStyle = '#e8d2c4';
  ctx.font = 'italic 36px Newsreader, Georgia, serif';
  wrapText(ctx, `“${payload.roast}”`, 72, 250, 1050, 46, 3);

  ctx.fillStyle = '#b7a89a';
  ctx.font = '400 22px Figtree, sans-serif';
  wrapText(ctx, payload.content, 72, 420, 1050, 32, 3);

  ctx.fillStyle = '#c44b32';
  ctx.font = '600 16px Figtree, sans-serif';
  ctx.fillText(
    `ENGAGE ${payload.scores.engagement}   WARMTH ${payload.scores.friendliness}   VIRAL ${payload.scores.virality}`,
    72,
    580
  );

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not export roast card.');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `postroast-${global}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
