import type { Editor } from '@tiptap/react';

// Remove wrapping quotes and trailing asterisks from model output
export function sanitizeModelOutput(text: string): string {
  const withoutQuotes = text.replace(/^["'\u201C\u201D]+/, '').replace(/["'\u201C\u201D]+$/, '');
  const withoutTrailingAsterisks = withoutQuotes.replace(/\s*\*+$/g, '');
  return withoutTrailingAsterisks;
}

export function isEditorHtml(value: string) {
  return /<\/?(p|br|strong|em|mark|code)\b/i.test(value);
}

export function visiblePostText(value: string) {
  if (!value) return '';
  if (!isEditorHtml(value)) return value;
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n+$/g, '');
}

export function extractPostFromNote(note: string) {
  const trimmed = note.trim();
  if (!trimmed) return '';

  const fence = trimmed.match(/```(?:[a-zA-Z]+)?\n([\s\S]*?)```/);
  if (fence?.[1]?.trim()) return fence[1].trim();

  const withoutTools = trimmed
    .replace(/<writeTweet>[\s\S]*?<\/writeTweet>/gi, '')
    .replace(/writeTweet\([^)]*\)/gi, '')
    .trim();

  const lines = (withoutTools || trimmed).split('\n');
  if (
    lines.length > 2 &&
    /^(here|try|consider|rewrite|version|option|draft|sure|updated|this)\b/i.test(lines[0]) &&
    lines[1].trim() === ''
  ) {
    return lines.slice(2).join('\n').trim();
  }

  return withoutTools || trimmed;
}

export function storedToEditorHtml(value: string) {
  if (!value) return '';
  return isEditorHtml(value) ? value : textToHtmlWithParagraphs(value);
}

export function textToHtmlWithParagraphs(value: string): string {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) return '';

  const paragraphs = normalized
    .split(/\n\n+/)
    .map(block =>
      block
        .split('\n')
        .map(line => escapeHtml(line))
        .join('<br>')
    )
    .filter(Boolean);

  return paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('');
}

// Minimal HTML escape for text nodes
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Apply highlight to a range, keeping cursor at end
export function applyHighlightRange(
  editor: Editor,
  from: number,
  to: number,
  color: string = 'rgba(34, 197, 94, 0.3)'
) {
  editor
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .setHighlight({ color })
    .setTextSelection(to)
    .run();
}

// Insert a paragraph break during streaming
export function insertStreamLineBreak(editor: Editor) {
  editor.commands.insertContent('\n\n');
}

// Safely set HTML content while suppressing external sync hooks if available
export function setContentSafely(editor: Editor, html: string) {
  (editor as unknown as { setContentSettingFlag?: (s: boolean) => void }).setContentSettingFlag?.(
    true
  );
  // Use emitUpdate: false to prevent onChange
  editor.commands.setContent(html, { emitUpdate: false });
  (editor as unknown as { setContentSettingFlag?: (s: boolean) => void }).setContentSettingFlag?.(
    false
  );
}

// Highlight the entire document
export function highlightEntireDoc(editor: Editor, color: string = 'rgba(34, 197, 94, 0.3)') {
  const docSize = editor.state.doc.content.size;
  applyHighlightRange(editor, 1, Math.max(1, docSize), color);
}
