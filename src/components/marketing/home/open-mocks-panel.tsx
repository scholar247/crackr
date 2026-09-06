import Link from 'next/link';
import { Globe2, Trophy, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface OpenMockEntry {
  id: string;
  title: string;
  examName: string;
  durationSeconds: number | null;
  attempted: boolean;
  rank?: number;
  totalRanked?: number;
  percentage?: number;
}

// Open mocks (createOpenMock) across every exam the user targets — not just their primary
// one, matching user_exam_targets rather than a single exam. Rank/score only ever shown
// for mocks the user has actually submitted (assessmentRepository.getAssessmentReport,
// called only for that small subset) — never a fabricated placeholder for one they
// haven't attempted, those get a plain "Join" CTA instead.
export function OpenMocksPanel({ mocks }: { mocks: OpenMockEntry[] }) {
  if (mocks.length === 0) return null;

  return (
    <section className="bg-surface-container-lowest py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <span className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary">
          <Globe2 className="h-3.5 w-3.5" /> Open to your exams
        </span>
        <h2 className="text-headline-lg mt-1 text-foreground">Open Mocks You Can Join</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mocks.map((mock) => (
            <Card
              key={mock.id}
              className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-lg"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 pt-6">
                <div>
                  <Badge variant="info">{mock.examName}</Badge>
                  <p className="text-body-md mt-2 line-clamp-2 font-semibold text-foreground">{mock.title}</p>
                  {mock.durationSeconds && (
                    <p className="text-body-sm mt-1 text-muted-foreground">{Math.round(mock.durationSeconds / 60)} min</p>
                  )}
                </div>

                {mock.attempted && mock.rank ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning">
                      <Trophy className="h-4 w-4" /> Rank #{mock.rank}
                      {mock.totalRanked ? ` / ${mock.totalRanked}` : ''}
                    </span>
                    <Link href={`/mocks/${mock.id}`} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                  </div>
                ) : (
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/mocks/${mock.id}`}>
                      Join Now <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
