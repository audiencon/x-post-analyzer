'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { isThreadWriteKind, type RewriteKind } from '@/config/prompt';
import { storedToEditorHtml, textToHtmlWithParagraphs } from '@/lib/editor-helpers';
import {
  filterSlashCommands,
  groupedSlashCommands,
  orderedSlashCommands,
  slashCommandsFor,
  slashMenuHint,
  slashMenuTitle,
  type SlashCommand,
  type SlashContext,
} from '@/lib/slash-commands';
import { cn } from '@/lib/utils';

interface TipTapEditorProps {
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  className?: string;
  onAiAction?: (kind: RewriteKind) => void;
  loadingAction?: string | null;
  onSlashCommand?: (command: string) => void;
  onEditorReady?: (editor: Editor) => void;
  onAddPost?: () => void;
  suppressExternalSync?: boolean;
  slashContext?: SlashContext;
}

type SlashState = { query: string; from: number; to: number };

const SELECTION_REWRITES: RewriteKind[] = ['improve', 'hook', 'short', 'punchy'];

function readSlashState(editor: Editor): SlashState | null {
  const { from } = editor.state.selection;
  if (from !== editor.state.selection.to) return null;
  const textBefore = editor.state.doc.textBetween(Math.max(0, from - 48), from, '\n');
  if (/https?:\/\/\S*$/i.test(textBefore) || textBefore.endsWith('://')) return null;
  const match = textBefore.match(/\/(\w*)$/);
  if (!match) return null;
  const query = match[1];
  return { query, from: from - query.length - 1, to: from };
}

function filterCommands(query: string, context: SlashContext) {
  return orderedSlashCommands(filterSlashCommands(slashCommandsFor(context), query), context);
}

export function TipTapEditor({
  value,
  placeholder,
  onChange,
  onSelectionChange,
  className,
  onAiAction,
  loadingAction,
  onSlashCommand,
  onEditorReady,
  onAddPost,
  suppressExternalSync,
  slashContext = { empty: false, thread: false },
}: TipTapEditorProps) {
  type EditorWithFlag = Editor & { setContentSettingFlag?: (setting: boolean) => void };
  const isSettingContent = useRef(false);
  const lastSyncedValue = useRef<string>(value);
  const slashRef = useRef<SlashState | null>(null);
  const indexRef = useRef(0);
  const editorRef = useRef<Editor | null>(null);
  const onSlashCommandRef = useRef(onSlashCommand);
  const onAddPostRef = useRef(onAddPost);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const runCommandRef = useRef<(command: SlashCommand) => void>(() => {});
  const onAiActionRef = useRef(onAiAction);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; flip: boolean } | null>(
    null
  );
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);
  const [selPos, setSelPos] = useState<{ top: number; left: number; flip: boolean } | null>(null);
  const [activeMarks, setActiveMarks] = useState({ bold: false, italic: false, highlight: false });

  const slashContextRef = useRef(slashContext);
  slashContextRef.current = slashContext;
  onSlashCommandRef.current = onSlashCommand;
  onAddPostRef.current = onAddPost;
  onChangeRef.current = onChange;
  onSelectionChangeRef.current = onSelectionChange;
  onAiActionRef.current = onAiAction;

  const filtered = useMemo(
    () => filterCommands(slash?.query ?? '', slashContext),
    [slash?.query, slashContext.empty, slashContext.thread]
  );

  const syncSlash = (instance: Editor) => {
    const next = readSlashState(instance);
    slashRef.current = next;
    setSlash(next);
    if (!next) {
      indexRef.current = 0;
      setSlashIndex(0);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
    ],
    content: value,
    immediatelyRender: false,
    onSelectionUpdate: ({ editor: instance }) => {
      syncSlash(instance);
      const { from, to } = instance.state.selection;
      setSelection(from !== to ? { from, to } : null);
      setActiveMarks({
        bold: instance.isActive('bold'),
        italic: instance.isActive('italic'),
        highlight: instance.isActive('highlight'),
      });
      onSelectionChangeRef.current?.(from, to);
    },
    onUpdate: ({ editor: instance }) => {
      syncSlash(instance);
      if (!isSettingContent.current) {
        const next = instance.getHTML();
        if (next !== lastSyncedValue.current) {
          lastSyncedValue.current = next;
          onChangeRef.current(next);
        }
      }
    },
    editorProps: {
      attributes: {
        class: `${className ?? ''} outline-none max-w-none`,
        'data-placeholder': placeholder ?? '',
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          onAddPostRef.current?.();
          return true;
        }

        const open = slashRef.current;
        if (!open) return false;

        const items = filterCommands(open.query, slashContextRef.current);
        if (items.length === 0) return false;

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = (indexRef.current + 1) % items.length;
          indexRef.current = next;
          setSlashIndex(next);
          return true;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const next = (indexRef.current - 1 + items.length) % items.length;
          indexRef.current = next;
          setSlashIndex(next);
          return true;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          const command = items[indexRef.current] ?? items[0];
          if (command) runCommandRef.current(command);
          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          slashRef.current = null;
          setSlash(null);
          return true;
        }

        return false;
      },
    },
  });

  editorRef.current = editor;

  const runCommand = (command: SlashCommand) => {
    const instance = editorRef.current;
    if (!instance) return;
    const open = slashRef.current ?? readSlashState(instance);
    if (open) {
      instance.chain().focus().deleteRange({ from: open.from, to: open.to }).run();
    }
    slashRef.current = null;
    setSlash(null);
    indexRef.current = 0;
    setSlashIndex(0);

    switch (command.category) {
      case 'ai':
      case 'thread':
        onSlashCommandRef.current?.(command.id);
        return;
      case 'insert':
        instance.chain().focus().insertContent(textToHtmlWithParagraphs(command.insert)).run();
        return;
      case 'action':
        onAddPostRef.current?.();
        return;
      case 'format':
        switch (command.id) {
          case 'bold':
            instance.chain().focus().toggleBold().run();
            return;
          case 'italic':
            instance.chain().focus().toggleItalic().run();
            return;
          case 'highlight':
            instance.chain().focus().toggleHighlight().run();
            return;
          default: {
            const _exhaustive: never = command;
            return _exhaustive;
          }
        }
        return;
      default: {
        const _exhaustive: never = command;
        void _exhaustive;
      }
    }
  };

  runCommandRef.current = runCommand;

  useEffect(() => {
    if (!editor) return;
    if (suppressExternalSync) return;
    if (isSettingContent.current) return;

    const normalize = (t: string) => t.replace(/\s+/g, ' ').trim();
    const current = normalize(editor.getText());
    const incoming = storedToEditorHtml(value);
    const incomingPlain = normalize(value.replace(/<[^>]+>/g, ' ').replace(/\n/g, ' '));

    const { from, to } = editor.state.selection;
    if (from !== to) return;

    if (current === incomingPlain || value === lastSyncedValue.current) {
      return;
    }

    isSettingContent.current = true;
    lastSyncedValue.current = value;

    if (!value) {
      editor.commands.clearContent();
      isSettingContent.current = false;
      return;
    }

    editor.commands.setContent(incoming, { emitUpdate: false });
    setTimeout(() => {
      isSettingContent.current = false;
    }, 0);
  }, [value, editor, suppressExternalSync]);

  useEffect(() => {
    if (!editor) return;
    (editor as EditorWithFlag).setContentSettingFlag = (setting: boolean) => {
      isSettingContent.current = setting;
    };
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!slash || slashIndex < filtered.length) return;
    indexRef.current = 0;
    setSlashIndex(0);
  }, [filtered.length, slash, slashIndex]);

  useEffect(() => {
    if (!editor || !slash) {
      setMenuPos(null);
      return;
    }

    const place = () => {
      try {
        const coords = editor.view.coordsAtPos(slash.to);
        const width = 320;
        const height = Math.min(360, 48 + filtered.length * 52);
        const left = Math.min(Math.max(12, coords.left), window.innerWidth - width - 12);
        const flip = coords.bottom + 8 + height > window.innerHeight;
        const top = flip ? coords.top - 8 : coords.bottom + 8;
        setMenuPos({ top, left, flip });
      } catch {
        setMenuPos(null);
      }
    };

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [editor, slash, filtered.length]);

  useEffect(() => {
    if (!editor || !selection || slash) {
      setSelPos(null);
      return;
    }

    const place = () => {
      try {
        const start = editor.view.coordsAtPos(selection.from);
        const end = editor.view.coordsAtPos(selection.to);
        const width = 420;
        const left = Math.min(
          Math.max(12, (start.left + end.left) / 2 - width / 2),
          window.innerWidth - width - 12
        );
        const flip = start.top - 52 < 12;
        const top = flip ? end.bottom + 8 : start.top - 8;
        setSelPos({ top, left, flip });
      } catch {
        setSelPos(null);
      }
    };

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [editor, selection, slash]);

  if (!editor) return null;

  const formatSelection = (mark: 'bold' | 'italic' | 'highlight') => {
    const chain = editor.chain().focus();
    switch (mark) {
      case 'bold':
        chain.toggleBold().run();
        break;
      case 'italic':
        chain.toggleItalic().run();
        break;
      case 'highlight':
        chain.toggleHighlight().run();
        break;
      default: {
        const _exhaustive: never = mark;
        void _exhaustive;
      }
    }
    setActiveMarks({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      highlight: editor.isActive('highlight'),
    });
  };

  return (
    <>
      {selection && selPos && !slash
        ? createPortal(
            <div
              className="fixed z-50 flex select-none items-center gap-1 border border-white/10 bg-[oklch(0.16_0.014_50)] px-2 py-1.5 shadow-[0_18px_40px_oklch(0.1_0.02_50_/_0.5)]"
              onMouseDown={event => event.preventDefault()}
              style={{
                top: selPos.flip ? selPos.top : undefined,
                bottom: selPos.flip ? undefined : window.innerHeight - selPos.top,
                left: selPos.left,
              }}
            >
              <button
                type="button"
                onMouseDown={event => {
                  event.preventDefault();
                  formatSelection('bold');
                }}
                className={cn(
                  'min-w-7 px-1.5 text-sm font-semibold',
                  activeMarks.bold ? 'text-white' : 'text-white/40 hover:text-white'
                )}
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={event => {
                  event.preventDefault();
                  formatSelection('italic');
                }}
                className={cn(
                  'min-w-7 px-1.5 text-sm italic',
                  activeMarks.italic ? 'text-white' : 'text-white/40 hover:text-white'
                )}
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={event => {
                  event.preventDefault();
                  formatSelection('highlight');
                }}
                className={cn(
                  'min-w-7 px-1.5 text-xs tracking-wide',
                  activeMarks.highlight
                    ? 'text-[oklch(0.78_0.14_28)]'
                    : 'text-white/40 hover:text-white'
                )}
              >
                Mark
              </button>
              <span className="mx-1 h-4 w-px bg-white/10" />
              {SELECTION_REWRITES.map(kind => (
                <button
                  key={kind}
                  type="button"
                  disabled={loadingAction === kind}
                  onMouseDown={event => {
                    event.preventDefault();
                    onAiActionRef.current?.(kind);
                  }}
                  className={cn(
                    'px-1.5 text-xs',
                    kind === 'improve'
                      ? 'text-[oklch(0.72_0.16_28)] hover:text-[oklch(0.8_0.16_28)]'
                      : 'text-white/45 hover:text-white',
                    loadingAction === kind && 'opacity-40'
                  )}
                >
                  {loadingAction === kind ? '…' : kind[0].toUpperCase() + kind.slice(1)}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      {slash && menuPos && filtered.length > 0
        ? createPortal(
            <div
              className="fixed z-50 w-96 border border-white/10 bg-[oklch(0.16_0.014_50)] py-1 shadow-[0_24px_48px_oklch(0.1_0.02_50_/_0.55)]"
              style={{
                top: menuPos.flip ? undefined : menuPos.top,
                bottom: menuPos.flip ? window.innerHeight - menuPos.top : undefined,
                left: menuPos.left,
              }}
            >
              <div className="px-3 py-2.5">
                <p className="text-[11px] tracking-[0.16em] text-white/30 uppercase">
                  {slashMenuTitle(slashContext, slash.query)}
                </p>
                {slashMenuHint(slashContext, slash.query) ? (
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    {slashMenuHint(slashContext, slash.query)}
                  </p>
                ) : null}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {groupedSlashCommands(filtered, slashContext).map(section => {
                  const offset = filtered.findIndex(command => command === section.items[0]);
                  return (
                    <div key={section.group}>
                      <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.14em] text-white/25 uppercase">
                        {section.label}
                      </p>
                      {section.items.map((command, itemIndex) => {
                        const index = offset + itemIndex;
                        return (
                          <button
                            key={`${section.group}-${command.id}`}
                            type="button"
                            onMouseEnter={() => {
                              indexRef.current = index;
                              setSlashIndex(index);
                            }}
                            onMouseDown={event => {
                              event.preventDefault();
                              runCommand(command);
                            }}
                            className={cn(
                              'flex w-full px-3 py-2.5 text-left',
                              index === slashIndex ? 'bg-white/7 text-white' : 'text-white/70'
                            )}
                          >
                            <span>
                              <span className="block text-sm">{command.title}</span>
                              <span className="text-xs leading-5 text-white/40">
                                {command.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}

      <div className="relative">
        <EditorContent
          editor={editor}
          className={loadingAction ? 'pointer-events-none opacity-50' : ''}
        />
        {loadingAction ? (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-white/45">
            {isThreadWriteKind(loadingAction) ? 'Writing…' : 'Rewriting…'}
          </p>
        ) : null}
      </div>
    </>
  );
}
