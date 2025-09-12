import type { Editor } from '@tiptap/react';

// Remove wrapping quotes and trailing asterisks from model output
export function sanitizeModelOutput(text: string): string {
  const withoutQuotes = text.replace(/^["'\u201C\u201D]+/, '').replace(/["'\u201C\u201D]+$/, '');
  const withoutTrailingAsterisks = withoutQuotes.replace(/\s*\*+$/g, '');
  return withoutTrailingAsterisks;
}

// Convert plain text with newlines into HTML paragraphs and <br> preserving double-space look
export function textToHtmlWithParagraphs(value: string): string {
  const paragraphs = value.split(/\n\n+/g).map(p =>
    p
      .split(/\n/g)
      .map(line => (line === '' ? '<br>' : escapeHtml(line)))
      .join('<br>')
  );
  // Add an extra <br> between paragraphs to preserve visual spacing
  return paragraphs.map(p => `<p>${p}</p>`).join('<br>');
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
  editor.commands.setContent(html);
  (editor as unknown as { setContentSettingFlag?: (s: boolean) => void }).setContentSettingFlag?.(
    false
  );
}

// Highlight the entire document
export function highlightEntireDoc(editor: Editor, color: string = 'rgba(34, 197, 94, 0.3)') {
  const docSize = editor.state.doc.content.size;
  applyHighlightRange(editor, 1, Math.max(1, docSize), color);
}
