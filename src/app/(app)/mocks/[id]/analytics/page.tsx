import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle, SkipForward } from 'lucide-react';
import { auth } from '@/lib/auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_COLORS } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AssessmentAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const assessment = await assessmentRepository.findById(id);
  if (!assessment) notFound();
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) notFound();

  const [questions, topics] = await Promise.all([assessmentRepository.getQuestionAnalytics(id), assessmentRepository.getTopicAnalytics(id)]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/mocks/${id}/participants`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to participants
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-foreground">Analytics</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {assessment.title} · based on {questions.totalCompleted} completed attempt{questions.totalCompleted === 1 ? '' : 's'}
      </p>

      {questions.totalCompleted === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No completed attempts yet — analytics will appear once participants submit.</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-foreground">Topic performance</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Topic</th>
                    <th className="px-4 py-2.5">Questions</th>
                    <th className="px-4 py-2.5">Attempts</th>
                    <th className="px-4 py-2.5">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topics.topics.map((t) => (
                    <tr key={t.nodeId}>
                      <td className="px-4 py-2.5 text-foreground">{t.nodeName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.questionCount}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.attempted}</td>
                      <td className="px-4 py-2.5 text-foreground">{t.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">Question performance</h2>
            <div className="mt-3 space-y-2">
              {questions.questions.map((q, i) => (
                <div key={q.questionId} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">{i + 1}</span>
                      <p className="line-clamp-2 text-sm text-foreground">{q.stem}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge className={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
                      {q.questionId === questions.hardestQuestionId && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3" /> Hardest
                        </Badge>
                      )}
                      {q.questionId === questions.mostSkippedQuestionId && (
                        <Badge variant="secondary">
                          <SkipForward className="h-3 w-3" /> Most skipped
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400">Correct {q.correctPct}%</span>
                    <span className="text-destructive">Wrong {q.wrongPct}%</span>
                    <span className="text-muted-foreground">Skipped {q.skippedPct}%</span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="bg-emerald-500" style={{ width: `${q.correctPct}%` }} />
                    <div className="bg-destructive" style={{ width: `${q.wrongPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
