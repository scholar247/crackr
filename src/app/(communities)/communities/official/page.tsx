import { ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { CommunitySearchBox } from '@/components/community/community-search-box';
import { CommunityGrid } from '@/components/community/community-grid';

export const dynamic = 'force-dynamic';

export default async function OfficialCommunitiesPage() {
  const session = await auth();
  const official = await communityRepository.findVisibleToUser(session?.user.id ?? null, session?.user.role ?? null, { kind: 'OFFICIAL' });

  return (
    <div>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/40 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="font-headline-lg text-headline-lg text-foreground">Official Communities</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Communities officially created and managed by admins — one per exam, the canonical place to discuss it.</p>
        <CommunitySearchBox className="mt-2 w-full max-w-sm" />
      </div>

      {official.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No official communities yet.</p>
      ) : (
        <CommunityGrid items={official} />
      )}
    </div>
  );
}
