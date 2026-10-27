import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ListChecks, CalendarClock, Users, BarChart3, Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { isAdmin } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StartMockDialog } from '@/components/mocks/start-mock-dialog';
import { ChallengeControls } from '@/components/mocks/challenge-controls';
import { CountdownLobby } from '@/components/mocks/countdown-lobby';

export const dynamic = 'force-dynamic';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

export default async function MockLobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) notFound();

  const detail = await assessmentRepository.findByIdWithSections(id);
  if (!detail) notFound();
  const { assessment, sections, totalQuestions } = detail;
  const isOrganizer = assessment.creatorUserId === session!.user.id || isAdmin(session!.user.role);

  const [inProgress, latestCompleted, window, challengeRow] = await Promise.all([
    assessmentRepository.findInProgressAttempt(id, session!.user.id),
    assessmentRepository.findLatestCompletedAttempt(id, session!.user.id),
    assessment.type === 'TEST' ? assessmentRepository.resolveAccessWindow(id, session!.user.id) : Promise.resolve(null),
    assessment.type === 'CHALLENGE' ? assessmentRepository.findChallengeById(id) : Promise.resolve(null),
  ]);

  let challengeInfo = null;
  let bothCompleted = false;
  if (challengeRow) {
    const [challenger, opponent] = await Promise.all([
      userRepository.findById(challengeRow.challengerUserId),
      userRepository.findById(challengeRow.opponentUserId),
    ]);
    challengeInfo = {
      status: challengeRow.status,
      isChallenger: challengeRow.challengerUserId === session!.user.id,
      opponentName: opponent?.name ?? null,
      challengerName: challenger?.name ?? null,
      startsAt: assessment.startsAt?.toISOString() ?? null,
    };
    if (challengeRow.status === 'ACCEPTED') {
      const [challengerDone, opponentDone] = await Promise.all([
        assessmentRepository.findLatestCompletedAttempt(id, challengeRow.challengerUserId),
        assessmentRepository.findLatestCompletedAttempt(id, challengeRow.opponentUserId),
      ]);
      bothCompleted = Boolean(challengerDone && opponentDone);
    }
  }

  // A challenge only offers Start/Resume once both parties have accepted AND locked a
  // shared start moment — before that, ChallengeControls (accept/decline/Start Now) owns
  // this space instead.
  const challengeReadyToPlay = assessment.type !== 'CHALLENGE' || (challengeRow?.status === 'ACCEPTED' && Boolean(assessment.startsAt));

  const now = new Date();
  // Organizers previewing their own test skip the window gate (startAttempt does the
  // same exemption server-side) — this is purely for what the Start button shows.
  const windowNotYetOpen = Boolean(window?.from && now < window.from && !isOrganizer);
  const windowClosed = Boolean(window?.until && now > window.until && !isOrganizer);

  // Pre-start lobby: only meaningful for FIXED-mode group tests, which have a real
  // future-dated shared startsAt known ahead of time. A CHALLENGE's startsAt is only ever
  // set by "Start Now" (assessmentRepository.startChallenge sets it to the current
  // instant, never a future one) — there's no scheduled wait to show a countdown for.
  const showLobby = assessment.type === 'TEST' && assessment.schedulingMode === 'FIXED' && windowNotYetOpen && Boolean(window?.from);
  const lobbyParticipantCount = showLobby ? (await assessmentRepository.listParticipants(id)).participants.length : 0;

  return (
    <div className="max-w-2xl">
      {assessment.bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL, not an optimizable local/remote-pattern asset
        <img src={assessment.bannerImage} alt="" className="mb-4 h-40 w-full rounded-xl border border-border object-cover" />
      )}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{assessment.type === 'MOCK' ? 'Self Mock' : assessment.type === 'TEST' ? 'Group Test' : 'Challenge'}</Badge>
        <Badge>{assessment.status}</Badge>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{assessment.title}</h1>
      {assessment.description && <p className="mt-1.5 text-sm text-muted-foreground">{assessment.description}</p>}
      {assessment.tags && assessment.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {assessment.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-muted px-2.5 py-1 text-label-caps uppercase text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoCard icon={Clock} label="Duration" value={assessment.durationSeconds ? `${Math.round(assessment.durationSeconds / 60)} min` : '—'} />
        <InfoCard icon={ListChecks} label="Questions" value={String(totalQuestions)} />
        <InfoCard icon={ListChecks} label="Attempts" value={assessment.maxAttempts ? `Up to ${assessment.maxAttempts}` : 'Unlimited'} />
      </div>

      {assessment.type === 'TEST' && window && (window.from || window.until) && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-border bg-card p-4 text-sm">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-foreground">
              {assessment.schedulingMode === 'FIXED' ? 'Everyone starts together' : 'Start any time in this window'}
            </p>
            <p className="text-muted-foreground">
              {window.from ? new Intl.DateTimeFormat('en-IN', DATE_FORMAT).format(window.from) : 'Open now'} –{' '}
              {window.until ? new Intl.DateTimeFormat('en-IN', DATE_FORMAT).format(window.until) : 'No end'}
            </p>
          </div>
        </div>
      )}

      {assessment.studentInstructions && (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
          <p className="text-sm font-semibold text-foreground">Instructions</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{assessment.studentInstructions}</p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Sections</p>
        <div className="mt-3 space-y-2">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{s.title}</span>
              <span className="text-muted-foreground">
                {s.actualQuestionCount} questions · +{Number(s.defaultMarks)}/-{Number(s.defaultNegativeMarks)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {challengeInfo && !challengeReadyToPlay && (
        <div className="mt-6">
          <ChallengeControls assessmentId={id} challenge={challengeInfo} />
        </div>
      )}

      {showLobby && window?.from && (
        <CountdownLobby
          startsAt={window.from.toISOString()}
          participantSummary={`${lobbyParticipantCount} participant${lobbyParticipantCount === 1 ? '' : 's'} invited`}
        />
      )}

      {challengeReadyToPlay && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {inProgress ? (
            <Button asChild>
              <Link href={`/mocks/${id}/room?attempt=${inProgress.id}`}>Resume attempt</Link>
            </Button>
          ) : windowNotYetOpen ? (
            showLobby ? null : <Button disabled>Not open yet</Button>
          ) : windowClosed ? (
            <Button disabled>Window closed</Button>
          ) : (
            <StartMockDialog assessmentId={id} isSelfMock={assessment.type === 'MOCK'} />
          )}
          {latestCompleted && !(assessment.type === 'CHALLENGE' && bothCompleted) && (
            <Button asChild variant="outline">
              <Link href={`/mocks/${id}/results/${latestCompleted.id}`}>View last results</Link>
            </Button>
          )}
          {assessment.type === 'TEST' && (
            <Button asChild variant="outline">
              <Link href={`/mocks/${id}/leaderboard`}>
                <Trophy className="h-4 w-4" /> Leaderboard
              </Link>
            </Button>
          )}
          {isOrganizer && assessment.type === 'TEST' && (
            <Button asChild variant="outline">
              <Link href={`/mocks/${id}/participants`}>
                <Users className="h-4 w-4" /> Participants
              </Link>
            </Button>
          )}
          {assessment.type === 'CHALLENGE' && bothCompleted && latestCompleted && (
            <Button asChild variant="outline">
              <Link href={`/mocks/${id}/results/${latestCompleted.id}`}>
                <BarChart3 className="h-4 w-4" /> View comparison
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
