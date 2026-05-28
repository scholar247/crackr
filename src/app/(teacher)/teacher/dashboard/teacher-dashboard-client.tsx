'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Users, Video, Radio, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CourseClient, LiveSessionClient } from '@/types/course.types';

type CourseWithCount = CourseClient & { studentCount: number };

interface TeacherDashboardClientProps {
  teacherName: string;
  courses: CourseWithCount[];
  upcomingSessions: LiveSessionClient[];
  liveNow: LiveSessionClient[];
  stats: { totalStudents: number; totalCourses: number; totalSessions: number };
}

export function TeacherDashboardClient({
  teacherName,
  courses,
  upcomingSessions,
  liveNow,
  stats,
}: TeacherDashboardClientProps) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {teacherName}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your courses</p>
      </div>

      {/* Live now banner */}
      {liveNow.length > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">You're live now!</p>
              <p className="text-sm text-muted-foreground">{liveNow[0].title}</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-red-500 hover:bg-red-600 text-white">
            <Link href={`/teacher/courses/${liveNow[0].courseId}/live`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Manage
            </Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users },
          { label: 'My Courses', value: stats.totalCourses, icon: BookOpen },
          { label: 'Sessions Done', value: stats.totalSessions, icon: Video },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Courses */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">My Courses</h2>
            <Link href="/teacher/courses" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {courses.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.studentCount} students</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/teacher/courses/${c.id}/live`}>Live</Link>
                </Button>
              </div>
            ))}
            {courses.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                You haven't been assigned to any courses yet.
              </p>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Upcoming Live Sessions</h2>
            <Link href="/teacher/live" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                    s.status === 'LIVE'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-sky-500/10 text-sky-500'
                  )}
                >
                  <Radio className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.scheduledAt), 'd MMM, h:mm a')}
                  </p>
                </div>
                {s.status === 'LIVE' ? (
                  <span className="text-xs font-semibold text-red-500 px-2 py-0.5 bg-red-500/10 rounded-full">
                    LIVE
                  </span>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/courses/${s.courseId}/live`}>Go Live</Link>
                  </Button>
                )}
              </div>
            ))}
            {upcomingSessions.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                No upcoming sessions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
