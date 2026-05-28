import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { LiveSessionCard } from '@/components/courses/live-session-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Live Sessions | crackr' };

export default async function CourseLivePage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { courseId } = await params;

  const [{ upcoming, past }, courseData] = await Promise.all([
    serverGet<{ upcoming: any[]; past: any[] }>(`/api/courses/${courseId}/live`),
    serverGet<{ course: any; enrollment: any; subjects: any[]; isLive: boolean }>(`/api/courses/${courseId}`),
  ]);

  if (!courseData.course) notFound();

  const course = courseData.course;
  const enrollment = courseData.enrollment;
  const isEnrolled = enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED';

  const liveNow = upcoming.filter((s) => s.status === 'LIVE');
  const scheduled = upcoming.filter((s) => s.status === 'SCHEDULED');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{course.title} — Live Sessions</h1>
      </div>

      {/* LIVE NOW banner */}
      {liveNow.length > 0 && (
        <div className="rounded-xl overflow-hidden">
          {liveNow.map((s) => (
            <div key={s.id} className="bg-gradient-to-r from-rose-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wide">Live Now</span>
              </div>
              <h2 className="text-xl font-bold">{s.title}</h2>
              {s.joinUrl && isEnrolled && (
                <Button className="mt-3 bg-white text-rose-600 hover:bg-white/90" asChild>
                  <a href={s.joinUrl} target="_blank" rel="noopener noreferrer">
                    Join Live Class →
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {scheduled.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Upcoming Sessions
          </h2>
          <div className="space-y-3">
            {scheduled.map((s) => (
              <LiveSessionCard
                key={s.id}
                session={{
                  ...s,
                  joinUrl: isEnrolled ? s.joinUrl ?? undefined : undefined,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground list-none flex items-center gap-2">
            Past Sessions ({past.length})
          </summary>
          <div className="mt-3 space-y-3">
            {past.map((s) => (
              <LiveSessionCard key={s.id} session={s} />
            ))}
          </div>
        </details>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Sessions will appear here when scheduled</p>
        </div>
      )}
    </div>
  );
}
