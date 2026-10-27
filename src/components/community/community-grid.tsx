import Link from 'next/link';
import { Users, ShieldCheck, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface CommunityCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  visibility: string;
  memberCount: number;
}

export function CommunityGrid({ items }: { items: CommunityCardData[] }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/communities/${c.slug}`}
          className={`relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
            c.kind === 'OFFICIAL' ? 'pt-5' : ''
          }`}
        >
          {c.kind === 'OFFICIAL' && <div className="absolute inset-x-0 top-0 h-1 bg-success" />}
          <div className="flex items-center justify-between">
            {c.kind === 'OFFICIAL' ? (
              <Badge variant="secondary">
                <ShieldCheck className="h-3 w-3" /> Official
              </Badge>
            ) : (
              <span />
            )}
            {c.visibility === 'PRIVATE' && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <p className="mt-3 font-label-md text-foreground">{c.name}</p>
          {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
          </p>
        </Link>
      ))}
    </div>
  );
}
