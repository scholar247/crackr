'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Radio, Video, Layers, ChevronLeft, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CourseClient } from '@/types/course.types';

const TYPE_ICON: Record<string, React.ElementType> = {
  LIVE: Radio,
  RECORDED: Video,
  HYBRID: Layers,
};

const TYPE_COLOR: Record<string, string> = {
  LIVE: 'text-red-500',
  RECORDED: 'text-blue-500',
  HYBRID: 'text-purple-500',
};

function SidebarSkeleton() {
  return (
    <div className="space-y-1 px-3 pt-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg px-3 py-3 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CourseListSidebar() {
  const params = useParams();
  const activeCourseId = params?.courseId as string | undefined;

  const [courses, setCourses] = useState<CourseClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) return;
      const json = await res.json();
      setCourses(json.data ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = search
    ? courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : courses;

  return (
    <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card shrink-0 h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href="/courses"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All Courses
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Course list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <SidebarSkeleton />
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            {search ? 'No courses match.' : 'No courses available.'}
          </p>
        ) : (
          <nav className="space-y-0.5 px-2">
            {filtered.map((course) => {
              const TypeIcon = TYPE_ICON[course.type] ?? Video;
              const isActive = course.id === activeCourseId;
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-colors group',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className={cn('text-sm font-medium leading-snug line-clamp-2', isActive ? '' : '')}>
                    {course.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'flex items-center gap-1 text-[10px] font-medium',
                      isActive ? 'text-primary-foreground/70' : TYPE_COLOR[course.type]
                    )}>
                      <TypeIcon className="h-3 w-3" />
                      {course.type === 'HYBRID' ? 'Live+Rec' : course.type === 'RECORDED' ? 'Recorded' : 'Live'}
                    </span>
                    {course.enrolledCount > 0 && (
                      <span className={cn(
                        'text-[10px]',
                        isActive ? 'text-primary-foreground/60' : 'text-muted-foreground'
                      )}>
                        {course.enrolledCount.toLocaleString()} enrolled
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer count */}
      {!loading && (
        <div className="px-4 py-2.5 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
        </div>
      )}
    </aside>
  );
}
