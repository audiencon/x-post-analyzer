'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Lightbulb, MessageSquare, Rocket } from 'lucide-react';

interface ContentTemplatesProps {
  onSelect: (template: string) => void;
  className?: string;
}

const TEMPLATES = [
  {
    id: 'thread',
    name: 'Thread Starter',
    icon: <MessageSquare className="h-4 w-4" />,
    content: '🧵 Thread:\n\n1/ ',
    description: 'Start a thread',
  },
  {
    id: 'question',
    name: 'Question Hook',
    icon: <Lightbulb className="h-4 w-4" />,
    content: 'What if I told you...\n\n',
    description: 'Engage with a question',
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: <Rocket className="h-4 w-4" />,
    content: '🚀 Big news!\n\n',
    description: 'Make an announcement',
  },
  {
    id: 'tip',
    name: 'Quick Tip',
    icon: <Sparkles className="h-4 w-4" />,
    content: '💡 Quick tip:\n\n',
    description: 'Share a tip',
  },
  {
    id: 'story',
    name: 'Story Hook',
    icon: <TrendingUp className="h-4 w-4" />,
    content: 'A year ago, I...\n\n',
    description: 'Tell a story',
  },
];

export function ContentTemplates({ onSelect, className }: ContentTemplatesProps) {
  return (
    <div className={className}>
      <div className="mb-2 text-xs font-medium text-white/70">Quick Templates</div>
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map(template => (
          <Button
            key={template.id}
            size="sm"
            variant="outline"
            onClick={() => onSelect(template.content)}
            className="h-auto border-white/10 bg-[#111] px-3 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"
            title={template.description}
          >
            <span className="mr-1.5">{template.icon}</span>
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

