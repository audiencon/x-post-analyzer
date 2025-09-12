'use client';

import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Code,
  Type,
  Zap,
  Target,
  MessageSquare,
  Hash,
  Highlighter,
  Sparkles,
  Undo,
  Redo,
} from 'lucide-react';
import { Copy as CopyIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { RewriteKind } from '@/config/prompt';
import { textToHtmlWithParagraphs } from '@/lib/editor-helpers';

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
  suppressExternalSync?: boolean; // when true, don't set content from value
}

interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'ai' | 'format';
}

const SLASH_COMMANDS: SlashCommand[] = [
  // AI Commands
  {
    id: 'improve',
    title: 'Improve',
    description: 'Polish clarity and engagement',
    icon: <Type className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'extend',
    title: 'Extend',
    description: 'Add crisp detail or example',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'short',
    title: 'Shorten',
    description: 'Make concise under ~180 chars',
    icon: <Zap className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'hook',
    title: 'Hook',
    description: 'Rewrite to a stronger hook',
    icon: <Target className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'punchy',
    title: 'Punchy',
    description: 'Increase energy and punch',
    icon: <Sparkles className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'clarify',
    title: 'Clarify',
    description: 'Simplify complex wording',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'formal',
    title: 'Formal',
    description: 'More formal tone',
    icon: <Type className="h-4 w-4" />,
    category: 'ai',
  },
  {
    id: 'casual',
    title: 'Casual',
    description: 'More casual, friendly tone',
    icon: <Hash className="h-4 w-4" />,
    category: 'ai',
  },
  // Format Commands
  {
    id: 'bold',
    title: 'Bold',
    description: 'Make text bold',
    icon: <Bold className="h-4 w-4" />,
    category: 'format',
  },
  {
    id: 'italic',
    title: 'Italic',
    description: 'Make text italic',
    icon: <Italic className="h-4 w-4" />,
    category: 'format',
  },
  {
    id: 'code',
    title: 'Code',
    description: 'Format as code',
    icon: <Code className="h-4 w-4" />,
    category: 'format',
  },
  {
    id: 'highlight',
    title: 'Highlight',
    description: 'Highlight text',
    icon: <Highlighter className="h-4 w-4" />,
    category: 'format',
  },
];

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
  suppressExternalSync,
}: TipTapEditorProps) {
  type EditorWithFlag = Editor & { setContentSettingFlag?: (setting: boolean) => void };
  const isSettingContent = useRef(false);
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
    onSelectionUpdate: ({ editor }) => {
      if (!onSelectionChange) return;
      const { from, to } = editor.state.selection;
      onSelectionChange(from, to);
    },
    onUpdate: ({ editor }) => {
      // Only update if we're not in the middle of setting content
      if (!isSettingContent.current) {
        onChange(editor.getText());
      }
    },
    editorProps: {
      attributes: {
        class: `${className ?? ''} outline-none prose prose-invert max-w-none`,
        'data-placeholder': placeholder ?? '',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (suppressExternalSync) return; // don't override while streaming
    const normalize = (t: string) => t.replace(/\s+/g, ' ').trim();
    const current = normalize(editor.getText());
    const next = normalize(value.replace(/\n/g, ' '));
    if (current === next) return;

    if (!value) {
      editor.commands.clearContent();
      return;
    }

    const html = textToHtmlWithParagraphs(value);

    editor.commands.setContent(html);
  }, [value, editor, suppressExternalSync]);

  useEffect(() => {
    if (editor) {
      // Add a method to set the content setting flag
      (editor as EditorWithFlag).setContentSettingFlag = (setting: boolean) => {
        isSettingContent.current = setting;
      };

      if (onEditorReady) {
        onEditorReady(editor);
      }
    }
  }, [editor, onEditorReady]);

  const executeCommand = (command: SlashCommand) => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(0, from, '\n');
    const slashMatch = textBefore.match(/\/(\w*)$/);

    if (slashMatch) {
      // Replace the slash command with the result
      const slashIndex = textBefore.lastIndexOf('/');
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - (textBefore.length - slashIndex), to: from })
        .run();
    }

    if (command.category === 'ai' && onSlashCommand) {
      onSlashCommand(command.id);
    } else if (command.category === 'format') {
      // Execute formatting commands
      switch (command.id) {
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'code':
          editor.chain().focus().toggleCode().run();
          break;
        case 'highlight':
          editor.chain().focus().toggleHighlight().run();
          break;
      }
    }
  };

  if (!editor) return null;

  // loading overlay controlled by loadingAction

  return (
    <>
      {/* Always visible toolbar with undo/redo and formatting */}
      <div className="mb-2 flex items-center justify-between gap-1 rounded-lg border border-[#333] bg-[#0a0a0a] p-2">
        <div className="flex items-center gap-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10 disabled:opacity-50"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10 disabled:opacity-50"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex h-8 items-center gap-1 rounded px-2 text-xs hover:bg-white/10"
            onClick={() => {
              const text = editor.getText();
              if (!text.trim()) return;
              navigator.clipboard
                .writeText(text)
                .then(() => toast.success('Copied tweet to clipboard', { duration: 2000 }))
                .catch(() =>
                  toast.error('Failed to copy', {
                    description: 'Please try again.',
                    duration: 2000,
                  })
                );
            }}
            title="Copy tweet"
          >
            <CopyIcon className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>
      </div>
      <BubbleMenu
        editor={editor}
        options={{
          placement: 'bottom',
        }}
        shouldShow={({ from, to }) => {
          // Show when text is selected and we have AI actions
          return from !== to;
        }}
      >
        <div className="flex items-center gap-1 rounded-lg border border-[#333] bg-[#0a0a0a] p-2 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('improve')}
              disabled={loadingAction === 'improve'}
              title="Improve clarity and engagement"
            >
              {loadingAction === 'improve' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <Type className="h-3 w-3" />
              <span className="relative">Improve</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('extend')}
              disabled={loadingAction === 'extend'}
              title="Add details and examples"
            >
              {loadingAction === 'extend' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <MessageSquare className="h-3 w-3" />
              <span className="relative">Extend</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('short')}
              disabled={loadingAction === 'short'}
              title="Make concise and punchy"
            >
              {loadingAction === 'short' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <Zap className="h-3 w-3" />
              <span className="relative">Short</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('hook')}
              disabled={loadingAction === 'hook'}
              title="Create a strong hook"
            >
              {loadingAction === 'hook' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <Target className="h-3 w-3" />
              <span className="relative">Hook</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('punchy')}
              disabled={loadingAction === 'punchy'}
              title="Increase energy and punch"
            >
              {loadingAction === 'punchy' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <Zap className="h-3 w-3" />
              <span className="relative">Punchy</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('clarify')}
              disabled={loadingAction === 'clarify'}
              title="Simplify and clarify"
            >
              {loadingAction === 'clarify' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <MessageSquare className="h-3 w-3" />
              <span className="relative">Clarify</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('formal')}
              disabled={loadingAction === 'formal'}
              title="Make more formal"
            >
              {loadingAction === 'formal' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <Type className="h-3 w-3" />
              <span className="relative">Formal</span>
            </button>
            <button
              className="relative flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
              onClick={() => onAiAction?.('casual')}
              disabled={loadingAction === 'casual'}
              title="Make more casual"
            >
              {loadingAction === 'casual' && (
                <div className="absolute inset-0 animate-pulse rounded bg-white/10" />
              )}
              <Hash className="h-3 w-3" />
              <span className="relative">Casual</span>
            </button>
          </div>
        </div>
      </BubbleMenu>

      {/* Slash Command Floating Menu */}
      <FloatingMenu
        editor={editor}
        options={{
          placement: 'bottom-start',
        }}
        shouldShow={({ editor }) => {
          const { from } = editor.state.selection;
          const textBefore = editor.state.doc.textBetween(0, from, '\n');
          const slashMatch = textBefore.match(/\/(\w*)$/);

          if (!slashMatch) return false;

          const query = slashMatch[1].toLowerCase();
          const availableCommands = SLASH_COMMANDS.filter(
            command => command.id.includes(query) || command.title.toLowerCase().includes(query)
          );

          return availableCommands.length > 0;
        }}
      >
        <div className="w-80 rounded-lg border border-[#333] bg-[#0a0a0a] p-2 shadow-lg backdrop-blur-sm">
          <div className="mb-2 text-xs font-medium text-white/70">Commands</div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {(() => {
              if (!editor) return [];
              const { from } = editor.state.selection;
              const textBefore = editor.state.doc.textBetween(0, from, '\n');
              const slashMatch = textBefore.match(/\/(\w*)$/);
              if (!slashMatch) return [];

              const query = slashMatch[1].toLowerCase();
              return SLASH_COMMANDS.filter(
                command => command.id.includes(query) || command.title.toLowerCase().includes(query)
              );
            })().map(command => (
              <button
                key={command.id}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-white/10"
                onClick={() => executeCommand(command)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10 text-white/70">
                  {command.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{command.title}</div>
                  <div className="text-xs text-white/60">{command.description}</div>
                </div>
                <div className="text-xs text-white/40">/{command.id}</div>
              </button>
            ))}
            {(() => {
              if (!editor) return null;
              const { from } = editor.state.selection;
              const textBefore = editor.state.doc.textBetween(0, from, '\n');
              const slashMatch = textBefore.match(/\/(\w*)$/);
              if (!slashMatch) return null;

              const query = slashMatch[1].toLowerCase();
              const availableCommands = SLASH_COMMANDS.filter(
                command => command.id.includes(query) || command.title.toLowerCase().includes(query)
              );

              return availableCommands.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/50">No commands found</div>
              ) : null;
            })()}
          </div>
        </div>
      </FloatingMenu>

      <div className="relative">
        <EditorContent
          editor={editor}
          disabled={!!loadingAction}
          className={loadingAction ? 'opacity-50' : ''}
        />
        {loadingAction && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-3 py-2 text-sm text-white">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              <span>AI is {loadingAction}ing...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
