import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ATTEMPT_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SUBMITTED: STATUS_COLORS.PUBLISHED,
  EXPIRED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
  ABANDONED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
};

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const assessment = await assessmentRepository.findById(id);
  if (!assessment) notFound();
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) notFound();

  const { participants, pendingInvites } = await assessmentRepository.listParticipants(id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Participants</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{assessment.title}</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {participants.map((p) => (
              <tr key={p.userId}>
                <td className="px-4 py-2.5 text-foreground">{p.name ?? '—'}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-2.5">
                  {p.attempt ? (
                    <Badge className={ATTEMPT_STATUS_COLORS[p.attempt.status]}>{p.attempt.status.replace('_', ' ')}</Badge>
                  ) : (
                    <Badge variant="secondary">Not started</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-foreground">{p.attempt?.score ?? '—'}</td>
              </tr>
            ))}
            {pendingInvites.map((invite) => (
              <tr key={invite.id} className="opacity-70">
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
                <td className="px-4 py-2.5 text-muted-foreground">{invite.email}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">Pending signup</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">—</td>
              </tr>
            ))}
          </tbody>
        </table>
        {participants.length === 0 && pendingInvites.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No participants invited yet.</p>
        )}
      </div>
    </div>
  );
}
