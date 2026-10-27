import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

/** Compact card for the top-right of the blog detail page, paired with the title/summary. */
export function AuthorCard({
  authorId,
  name,
  imageUrl,
  college,
  degree,
  updatedAt,
}: {
  authorId?: string | null;
  name: string;
  imageUrl?: string | null;
  college?: string | null;
  degree?: string | null;
  updatedAt: string;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Avatar className="h-11 w-11 shrink-0">
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-sm leading-tight">
        <p className="font-medium text-foreground">{name}</p>
        {(degree || college) && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{[degree, college].filter(Boolean).join(' · ')}</p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          Updated {new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );

  if (!authorId) return content;
  return (
    <Link href={`/authors/${authorId}`} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}
