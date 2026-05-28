'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Users, Clock, Lock, Play, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CourseWithEnrollment } from '@/types/course.types';

interface CourseCardProps {
  course: CourseWithEnrollment;
}

const TYPE_COLORS: Record<string, string> = {
  LIVE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  RECORDED: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  HYBRID: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export function CourseCard({ course }: CourseCardProps) {
  const isEnrolled = course.enrollment?.status === 'ACTIVE' || course.enrollment?.status === 'COMPLETED';
  const progress = course.enrollment?.progress ?? 0;
  const isComingSoon = course.status === 'COMING_SOON';

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        )}

        {/* LIVE NOW badge */}
        {course.isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE NOW
          </div>
        )}

        {/* Lock overlay for subscription */}
        {course.isSubscriptionRequired && !isEnrolled && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">
              <Lock className="h-3 w-3" />
              Premium
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', TYPE_COLORS[course.type])}>
            {course.type}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {LEVEL_LABELS[course.level]}
          </span>
          {isComingSoon && (
            <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 text-xs font-semibold">
              Coming Soon
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          {course.shortDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.shortDescription}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {course.totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.totalLessons} lessons
            </span>
          )}
          {course.totalHours > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.totalHours}h
            </span>
          )}
          {course.enrolledCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.enrolledCount.toLocaleString()} enrolled
            </span>
          )}
        </div>

        {/* Schedule for LIVE/HYBRID */}
        {(course.type === 'LIVE' || course.type === 'HYBRID') && course.sessionDays.length > 0 && course.typicalSessionTime && (
          <p className="text-xs text-muted-foreground">
            {formatDays(course.sessionDays)} · {course.typicalSessionTime} IST
          </p>
        )}

        {/* Progress for enrolled */}
        {isEnrolled && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          {isEnrolled ? (
            <Button asChild size="sm" className="w-full">
              <Link href={`/courses/${course.id}/learn`}>
                Continue Learning
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href={`/courses/${course.id}`}>
                {isComingSoon ? 'Learn More' : 'View Course'}
                <Play className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDays(days: number[]): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map((d) => names[d]).join('/');
}
