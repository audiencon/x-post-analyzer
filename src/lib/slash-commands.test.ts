import { describe, expect, it } from 'vitest';
import {
  filterSlashCommands,
  groupedSlashCommands,
  slashCommandsFor,
  slashGroupOf,
  slashMenuTitle,
} from '@/lib/slash-commands';

describe('slashCommandsFor', () => {
  it('offers thread writes on an empty post in a thread', () => {
    const ids = slashCommandsFor({ empty: true, thread: true }).map(command => command.id);
    expect(ids).toContain('continue');
    expect(ids).toContain('proof');
    expect(ids).toContain('turn');
    expect(ids).toContain('closer');
    expect(ids).toContain('ask');
    expect(ids).toContain('extend');
    expect(ids).not.toContain('improve');
    expect(ids).not.toContain('thread');
  });

  it('keeps rewrite commands on a filled thread post', () => {
    const ids = slashCommandsFor({ empty: false, thread: true }).map(command => command.id);
    expect(ids).toContain('improve');
    expect(ids).toContain('extend');
    expect(ids).toContain('continue');
    expect(ids).toContain('closer');
  });

  it('starts a single draft with inserts, not thread writes', () => {
    const ids = slashCommandsFor({ empty: true, thread: false }).map(command => command.id);
    expect(ids).toContain('improve');
    expect(ids).toContain('thread');
    expect(ids).not.toContain('continue');
  });
});

describe('filterSlashCommands', () => {
  it('matches /extend on an empty thread post', () => {
    const matches = filterSlashCommands(slashCommandsFor({ empty: true, thread: true }), 'ext');
    expect(matches.map(command => command.id)).toContain('extend');
  });
});

describe('slash menu groups', () => {
  it('puts empty-thread commands in the next-post group', () => {
    const context = { empty: true, thread: true };
    const commands = slashCommandsFor(context);
    expect(slashGroupOf(commands.find(command => command.id === 'continue')!, context)).toBe(
      'next'
    );
    expect(slashGroupOf(commands.find(command => command.id === 'extend')!, context)).toBe('next');
    expect(groupedSlashCommands(commands, context).map(section => section.group)).toEqual([
      'next',
      'blank',
    ]);
  });

  it('separates rewrite-this from write-next on a filled thread post', () => {
    const context = { empty: false, thread: true };
    const groups = groupedSlashCommands(slashCommandsFor(context), context);
    expect(groups.find(section => section.group === 'this')?.items.map(item => item.id)).toContain(
      'improve'
    );
    expect(groups.find(section => section.group === 'next')?.items.map(item => item.id)).toContain(
      'continue'
    );
  });

  it('titles the empty-thread menu as writing the next post', () => {
    expect(slashMenuTitle({ empty: true, thread: true }, '')).toBe('Write the next post');
  });
});
