import { notFound, redirect } from 'next/navigation';
import { Users, MessageSquare, CalendarDays } from 'lucide-react';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { isAdmin } from '@/lib/roles';
import { formatDate } from '@/lib/utils';
import { MemberManager } from '@/components/community/member-manager';

export const dynamic = 'force-dynamic';

export default async function CommunityMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  if (!session?.user) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/communities/${slug}/members`)}`);

  const community = await communityRepository.findBySlug(slug);
  if (!community) notFound();

  const membership = await communityRepository.getMembership(community.id, session.user.id);
  const platformAdmin = isAdmin(session.user.role);
  if (membership?.role !== 'OWNER' && membership?.role !== 'MODERATOR' && !platformAdmin) notFound();

  const members = await communityRepository.listMembers(community.id);
  // A platform admin managing a community they never joined gets OWNER-equivalent
  // controls in the UI — same override communityRepository.removeMember/updateMemberRole
  // already grant them server-side; the UI just has to stop hiding those actions.
  const effectiveRole = membership?.role ?? (platformAdmin ? 'OWNER' : 'MEMBER');

  const stats = [
    { label: 'Total Members', value: community.memberCount, icon: Users },
    { label: 'Total Posts', value: community.postCount, icon: MessageSquare },
    { label: 'Created', value: formatDate(community.createdAt), icon: CalendarDays },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-success">
        <span className="h-2 w-2 rounded-full bg-success" /> Admin Dashboard
      </div>
      <h1 className="mt-1 font-headline-lg text-headline-lg text-foreground">Manage: {community.name}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-label-caps uppercase text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-headline-lg text-headline-lg text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-headline-md text-headline-md text-foreground">Members</h2>
        <div className="mt-4">
          <MemberManager
            communityId={community.id}
            myRole={effectiveRole as 'OWNER' | 'MODERATOR'}
            initialMembers={members.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString() }))}
          />
        </div>
      </div>
    </div>
  );
}
