'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Radio, ExternalLink, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LiveSessionClient, CourseClient } from '@/types/course.types';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LIVE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

interface TeacherAllLiveClientProps {
  sessions: LiveSessionClient[];
  courseMap: Record<string, CourseClient>;
}

export function TeacherAllLiveClient({ sessions, courseMap }: TeacherAllLiveClientProps) {
  const upcoming = sessions
    .filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = sessions
    .filter((s) => s.status === 'COMPLETED' || s.status === 'CANCELLED')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">All your scheduled and past sessions</p>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {upcoming.map((s) => {
              const course = courseMap[s.courseId];
              return (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[s.status])}>
                        {s.status === 'LIVE' && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse mr-1" />
                        )}
                        {s.status}
                      </span>
                      <span className="font-medium truncate">{s.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course?.title && <span className="mr-1">{course.title} · </span>}
                      {format(new Date(s.scheduledAt), 'EEE d MMM · h:mm a')} · {s.duration}min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status === 'LIVE' && s.joinUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={s.joinUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Open
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/teacher/courses/${s.courseId}/live`}>
                        <Radio className="h-3.5 w-3.5 mr-1.5" />Manage
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card py-12 flex flex-col items-center text-muted-foreground">
            <Radio className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No upcoming sessions</p>
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <details>
            <summary className="text-sm font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer mb-3 list-none">
              Past Sessions ({past.length})
            </summary>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border mt-3">
              {past.map((s) => {
                const course = courseMap[s.courseId];
                return (
                  <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[s.status])}>
                          {s.status}
                        </span>
                        <span className="font-medium truncate">{s.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {course?.title && <span className="mr-1">{course.title} · </span>}
                        {format(new Date(s.scheduledAt), 'EEE d MMM · h:mm a')}
                      </p>
                    </div>
                    {s.recordingUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-3.5 w-3.5 mr-1.5" />Recording
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
