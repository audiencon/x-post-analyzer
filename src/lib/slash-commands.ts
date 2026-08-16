import type { RewriteKind, ThreadWriteKind } from '@/config/prompt';
import { STUDIO_STARTERS } from '@/lib/studio-starters';

export type SlashGroup = 'next' | 'this' | 'shape' | 'format' | 'blank';

export type SlashCommand =
  | { id: RewriteKind; title: string; description: string; category: 'ai' }
  | { id: ThreadWriteKind; title: string; description: string; category: 'thread' }
  | { id: 'bold' | 'italic' | 'highlight'; title: string; description: string; category: 'format' }
  | { id: string; title: string; description: string; category: 'insert'; insert: string }
  | { id: 'add-post'; title: string; description: string; category: 'action' };

export type SlashContext = {
  empty: boolean;
  thread: boolean;
};

const AI_COMMANDS: SlashCommand[] = [
  { id: 'improve', title: 'Improve', description: 'Rewrite this post. Same point, cleaner.', category: 'ai' },
  { id: 'hook', title: 'Hook', description: 'Rewrite this post. Harder first line.', category: 'ai' },
  { id: 'short', title: 'Shorten', description: 'Rewrite this post. Cut it under 180.', category: 'ai' },
  { id: 'punchy', title: 'Punchy', description: 'Rewrite this post. More heat.', category: 'ai' },
  { id: 'extend', title: 'Extend', description: 'Rewrite this post. Add one concrete detail.', category: 'ai' },
  { id: 'clarify', title: 'Clarify', description: 'Rewrite this post. Say it plainly.', category: 'ai' },
  { id: 'formal', title: 'Formal', description: 'Rewrite this post. Tighter register.', category: 'ai' },
  { id: 'casual', title: 'Casual', description: 'Rewrite this post. Talk like a person.', category: 'ai' },
  { id: 'list', title: 'List it', description: 'Rewrite this post as 3–5 short lines.', category: 'ai' },
  { id: 'contrast', title: 'Contrast', description: 'Rewrite this post as before / after.', category: 'ai' },
  { id: 'receipt', title: 'Receipt', description: 'Rewrite this post with the proof in it.', category: 'ai' },
];

const THREAD_COMMANDS: SlashCommand[] = [
  {
    id: 'continue',
    title: 'Next beat',
    description: 'Writes the next post from the last one. Does not rewrite this box.',
    category: 'thread',
  },
  {
    id: 'proof',
    title: 'Add proof',
    description: 'Next post: the example or number that makes the last one true.',
    category: 'thread',
  },
  {
    id: 'turn',
    title: 'The turn',
    description: 'Next post: the contradiction. The “but.”',
    category: 'thread',
  },
  {
    id: 'closer',
    title: 'End it',
    description: 'Next post: the last line. Land the thread.',
    category: 'thread',
  },
  {
    id: 'ask',
    title: 'Ask',
    description: 'Next post: a real question the last one earned. Not bait.',
    category: 'thread',
  },
];

const NEXT_EXTEND: SlashCommand = {
  id: 'extend',
  title: 'One more detail',
  description: 'Next post: one concrete add. Leaves the last post alone.',
  category: 'ai',
};

const INSERT_COMMANDS: SlashCommand[] = STUDIO_STARTERS.map(starter => ({
  id: starter.id,
  title: starter.title,
  description: starter.hint,
  category: 'insert' as const,
  insert: starter.insert,
}));

const ACTION_COMMANDS: SlashCommand[] = [
  {
    id: 'add-post',
    title: 'Empty box',
    description: 'Add a blank post. Use Next beat to write it.',
    category: 'action',
  },
];

const FORMAT_COMMANDS: SlashCommand[] = [
  { id: 'bold', title: 'Bold', description: 'Emphasize the selection.', category: 'format' },
  { id: 'italic', title: 'Italic', description: 'Lean the selection.', category: 'format' },
  { id: 'highlight', title: 'Mark', description: 'Ink the selection.', category: 'format' },
];

export function slashCommandsFor(context: SlashContext): SlashCommand[] {
  if (context.thread && context.empty) {
    return [...THREAD_COMMANDS, NEXT_EXTEND, ...ACTION_COMMANDS];
  }

  if (context.thread) {
    return [...AI_COMMANDS, ...THREAD_COMMANDS, ...ACTION_COMMANDS, ...FORMAT_COMMANDS];
  }

  return [...AI_COMMANDS, ...INSERT_COMMANDS, ...ACTION_COMMANDS, ...FORMAT_COMMANDS];
}

export function slashGroupOf(command: SlashCommand, context: SlashContext): SlashGroup {
  if (command.category === 'thread') return 'next';
  if (command.id === 'extend' && context.thread && context.empty) return 'next';
  if (command.category === 'ai') return 'this';
  if (command.category === 'insert') return 'shape';
  if (command.category === 'format') return 'format';
  return 'blank';
}

export function slashGroupLabel(group: SlashGroup): string {
  switch (group) {
    case 'next':
      return 'Writes the next post';
    case 'this':
      return 'Rewrites this post';
    case 'shape':
      return 'Paste an opener';
    case 'format':
      return 'Format';
    case 'blank':
      return 'Empty box';
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function groupedSlashCommands(commands: SlashCommand[], context: SlashContext) {
  const order: SlashGroup[] = ['next', 'this', 'shape', 'format', 'blank'];
  return order
    .map(group => ({
      group,
      label: slashGroupLabel(group),
      items: commands.filter(command => slashGroupOf(command, context) === group),
    }))
    .filter(section => section.items.length > 0);
}

export function orderedSlashCommands(commands: SlashCommand[], context: SlashContext) {
  return groupedSlashCommands(commands, context).flatMap(section => section.items);
}

export function slashMenuTitle(context: SlashContext, query: string) {
  if (query) return `/${query}`;
  if (context.thread && context.empty) return 'Write the next post';
  if (context.thread) return 'This post or the next';
  return 'Commands';
}

export function slashMenuHint(context: SlashContext, query: string) {
  if (query) return null;
  if (context.thread && context.empty) {
    return 'These fill this empty box from the last post. They do not change post 1.';
  }
  if (context.thread) {
    return 'Rewrite this one, or write the next post in the following box.';
  }
  return 'Rewrite this draft, paste an opener, or add a post.';
}

export function filterSlashCommands(commands: SlashCommand[], query: string) {
  const q = query.toLowerCase();
  if (!q) return commands;
  return commands.filter(
    command =>
      command.id.includes(q) ||
      command.title.toLowerCase().includes(q) ||
      command.description.toLowerCase().includes(q)
  );
}

export const SLASH_TAIL_RE =
  /\/(improve|extend|short|hook|punchy|clarify|formal|casual|list|contrast|receipt|continue|proof|turn|closer|ask)\b\s*$/i;
