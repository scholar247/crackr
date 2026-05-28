import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

// Inline SVG illustrations — no external deps
function BookSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="10" y="15" width="44" height="52" rx="4" fill="currentColor" className="text-muted/50" />
      <rect x="14" y="15" width="40" height="52" rx="4" fill="currentColor" className="text-muted" />
      <rect x="20" y="25" width="28" height="3" rx="1.5" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="20" y="32" width="22" height="3" rx="1.5" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="20" y="39" width="25" height="3" rx="1.5" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="20" y="46" width="18" height="3" rx="1.5" fill="currentColor" className="text-muted-foreground/30" />
      <circle cx="58" cy="58" r="16" fill="currentColor" className="text-primary/20" />
      <path d="M52 58h12M58 52v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
    </svg>
  );
}

function ChartSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="8" y="50" width="12" height="20" rx="2" fill="currentColor" className="text-muted" />
      <rect x="24" y="36" width="12" height="34" rx="2" fill="currentColor" className="text-muted" />
      <rect x="40" y="24" width="12" height="46" rx="2" fill="currentColor" className="text-primary/30" />
      <rect x="56" y="16" width="12" height="54" rx="2" fill="currentColor" className="text-primary/50" />
      <path d="M8 72h64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-border" />
      <circle cx="60" cy="20" r="12" fill="currentColor" className="text-primary/20" />
      <path d="M55 16l3 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
    </svg>
  );
}

function TestSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="16" y="10" width="48" height="60" rx="6" fill="currentColor" className="text-muted" />
      <rect x="22" y="20" width="36" height="4" rx="2" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="22" y="28" width="28" height="4" rx="2" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="22" y="40" width="8" height="8" rx="2" fill="currentColor" className="text-muted-foreground/20" />
      <rect x="34" y="40" width="8" height="8" rx="2" fill="currentColor" className="text-muted-foreground/20" />
      <rect x="22" y="52" width="8" height="8" rx="2" fill="currentColor" className="text-muted-foreground/20" />
      <rect x="34" y="52" width="8" height="8" rx="2" fill="currentColor" className="text-primary/40" />
      <circle cx="58" cy="58" r="16" fill="currentColor" className="text-success/20" />
      <path d="M52 58l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success" />
    </svg>
  );
}

function SearchSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="34" cy="34" r="22" fill="currentColor" className="text-muted" />
      <circle cx="34" cy="34" r="16" fill="currentColor" className="text-background" />
      <circle cx="28" cy="28" r="6" fill="currentColor" className="text-muted/50" />
      <path d="M50 50l16 16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-muted" />
      <path d="M30 42a12 12 0 0 0 8-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
    </svg>
  );
}

function InboxSVG() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="8" y="20" width="64" height="44" rx="6" fill="currentColor" className="text-muted" />
      <path d="M8 32l32 22 32-22" stroke="currentColor" strokeWidth="2" className="text-background" fill="none" />
      <circle cx="60" cy="20" r="12" fill="currentColor" className="text-primary/20" />
      <path d="M55 20h10M60 15v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<string, React.ReactNode> = {
  book: <BookSVG />,
  chart: <ChartSVG />,
  test: <TestSVG />,
  search: <SearchSVG />,
  inbox: <InboxSVG />,
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const illustration = typeof icon === 'string' ? ILLUSTRATIONS[icon as string] : icon;

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      {illustration && (
        <div className="mb-5 opacity-80">{illustration}</div>
      )}
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
