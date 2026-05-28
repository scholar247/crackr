'use client';

import Link from 'next/link';
import {
  Play, Clock, BookOpen, ArrowRight,
  Trophy, TrendingUp, Zap, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CourseWithEnrollment } from '@/types/course.types';

interface MyCoursesClientProps {
  courses: (CourseWithEnrollment & { progress: number })[];
}

function statusBadge(type: string) {
  if (type === 'LIVE') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  if (type === 'HYBRID') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
  return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
}

function progressLabel(pct: number) {
  if (pct === 0) return { text: 'Not started', cls: 'text-muted-foreground' };
  if (pct === 100) return { text: 'Completed', cls: 'text-success' };
  return { text: `${pct}% done`, cls: 'text-primary' };
}

export function MyCoursesClient({ courses }: MyCoursesClientProps) {
  if (courses.length === 0) {
    return (
      <div className="p-8 md:p-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-primary/60" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">No enrolled courses yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Browse our course catalog and enroll to start your structured preparation.
          </p>
        </div>
        <Button asChild>
          <Link href="/courses">Browse Courses <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
        </Button>
      </div>
    );
  }

  const completed = courses.filter((c) => c.progress === 100);
  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const notStarted = courses.filter((c) => c.progress === 0);
  const avgProgress = Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">Your enrolled courses and progress</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/courses">Browse more <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, value: courses.length, label: 'Enrolled', color: 'text-primary' },
          { icon: TrendingUp, value: `${avgProgress}%`, label: 'Avg progress', color: 'text-sky-500' },
          { icon: Zap, value: inProgress.length, label: 'In progress', color: 'text-amber-500' },
          { icon: CheckCircle2, value: completed.length, label: 'Completed', color: 'text-emerald-500' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={cn('shrink-0', color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Courses grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
          const { text: progText, cls: progCls } = progressLabel(course.progress);
          return (
            <div
              key={course.id}
              className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
            >
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-muted">
                <div
                  className={cn(
                    'h-full transition-all',
                    course.progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                  )}
                  style={{ width: `${course.progress}%` }}
                />
              </div>

              <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {course.progress === 100 ? (
                      <Trophy className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Play className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1 flex-wrap mb-1">
                      <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-semibold', statusBadge(course.type))}>
                        {course.type}
                      </span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{course.level}</span>
                    </div>
                    <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {course.totalLessons > 0 && (
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" /> {course.totalLessons} lessons
                    </span>
                  )}
                  {course.totalHours > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {course.totalHours}h
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-1 mt-auto">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={cn('font-semibold', progCls)}>{progText}</span>
                  </div>
                  <Progress value={course.progress} className="h-1.5" />
                </div>

                {/* CTA */}
                <Button
                  asChild size="sm"
                  className={cn('w-full gap-1.5', course.progress === 100 && 'variant-ghost')}
                  variant={course.progress === 100 ? 'outline' : 'default'}
                >
                  <Link href={`/courses/${course.id}/learn`}>
                    {course.progress === 0 ? 'Start Learning' : course.progress === 100 ? 'Review' : 'Continue'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
