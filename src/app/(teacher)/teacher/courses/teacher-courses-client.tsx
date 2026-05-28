'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Video, Users, Radio, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CourseClient } from '@/types/course.types';

type CourseWithCount = CourseClient & { studentCount: number };

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-green-500/10 text-green-600 dark:text-green-400',
  DRAFT: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-orange-500/10 text-orange-600',
  COMING_SOON: 'bg-sky-500/10 text-sky-600',
};

export function TeacherCoursesClient({ courses }: { courses: CourseWithCount[] }) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-sm text-muted-foreground mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} assigned</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Course</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Type</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.startDate ? format(new Date(c.startDate), 'd MMM yyyy') : 'No start date'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[c.status] ?? '')}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{c.studentCount.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.type}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1 flex-wrap">
                    <Button variant="outline" size="sm" asChild className="text-primary border-primary/30 hover:bg-primary/10">
                      <Link href={`/teacher/courses/${c.id}/content`}>
                        <FileEdit className="h-3.5 w-3.5 mr-1" />
                        Content
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/teacher/courses/${c.id}/students`}>
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Students
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/teacher/courses/${c.id}/live`}>
                        <Radio className="h-3.5 w-3.5 mr-1" />
                        Live
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  You haven't been assigned to any courses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
