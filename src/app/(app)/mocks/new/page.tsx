import Link from 'next/link';
import { Clock, Users, Swords, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODES = [
  {
    href: '/mocks/new/self',
    icon: Clock,
    title: 'Self Mock',
    description: 'Pick an exam, subjects, question counts, and marking scheme — take it at your own pace, tracked or just for practice.',
    enabled: true,
  },
  {
    href: '/mocks/new/group',
    icon: Users,
    title: 'Group Test',
    description: 'Invite specific people by email or an existing group, on a fixed time for everyone or a flexible window.',
    enabled: true,
  },
  {
    href: '/mocks/new/challenge',
    icon: Swords,
    title: 'Challenge',
    description: 'Go head-to-head with another user on the same test and compare results when you’re both done.',
    enabled: true,
  },
  {
    href: '/mocks/new/open',
    icon: Globe2,
    title: 'Open Mock',
    description: 'Covers every subject of the exam automatically. Open to any student targeting this exam — no invite list needed.',
    enabled: true,
  },
] as const;

export default function NewMockPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Create a mock, test, or challenge</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Choose how you want to set this up.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const content = (
            <div className={cn('flex h-full flex-col rounded-xl border border-border bg-card p-5', mode.enabled ? 'transition-colors hover:border-primary/40 hover:bg-muted/30' : 'opacity-60')}>
              <Icon className="h-6 w-6 text-primary" />
              <p className="mt-3 font-semibold text-foreground">{mode.title}</p>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{mode.description}</p>
              {!mode.enabled && <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Coming soon</p>}
            </div>
          );
          return mode.enabled ? (
            <Link key={mode.href} href={mode.href}>
              {content}
            </Link>
          ) : (
            <div key={mode.href} aria-disabled>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
