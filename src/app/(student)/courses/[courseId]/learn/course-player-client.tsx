'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurriculumSidebar } from '@/components/courses/curriculum-sidebar';
import { LessonPlayer } from '@/components/courses/lesson-player';
import { LiveSessionCard } from '@/components/courses/live-session-card';
import type {
  CourseSubjectWithTopics,
  CourseLessonWithAccess,
  LiveSessionClient,
  CourseAnnouncementClient,
} from '@/types/course.types';

interface CoursePlayerClientProps {
  courseId: string;
  courseTitle: string;
  curriculum: CourseSubjectWithTopics[];
  activeLesson: CourseLessonWithAccess | null;
  activeLessonId?: string;
  prevLesson: CourseLessonWithAccess | null;
  nextLesson: CourseLessonWithAccess | null;
  progress: number;
  upcomingSessions: LiveSessionClient[];
  announcements: CourseAnnouncementClient[];
}

export function CoursePlayerClient({
  courseId,
  courseTitle,
  curriculum,
  activeLesson: initialLesson,
  activeLessonId: initialLessonId,
  prevLesson: initialPrev,
  nextLesson: initialNext,
  progress,
  upcomingSessions,
  announcements,
}: CoursePlayerClientProps) {
  const router = useRouter();
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);

  const allLessons = curriculum.flatMap((s) => s.topics.flatMap((t) => t.lessons));
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? initialLesson;
  const activeIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : initialPrev;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : initialNext;

  const handleLessonSelect = (lessonId: string) => {
    setActiveLessonId(lessonId);
    router.replace(`/courses/${courseId}/learn?lesson=${lessonId}`, { scroll: false });
  };

  const handleComplete = () => {
    router.refresh();
  };

  return (
    <>
      {/* Desktop: 3-panel layout */}
      <div className="hidden lg:grid h-[calc(100vh-4rem)]" style={{ gridTemplateColumns: '300px 1fr 280px' }}>
        {/* LEFT: curriculum */}
        <CurriculumSidebar
          courseId={courseId}
          courseTitle={courseTitle}
          curriculum={curriculum}
          activeLessonId={activeLessonId}
          progress={progress}
          onLessonSelect={handleLessonSelect}
        />

        {/* MAIN: lesson player */}
        <div className="overflow-auto border-r border-border">
          {activeLesson ? (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 px-4 py-2 text-xs text-muted-foreground border-b border-border bg-card">
                <span>{courseTitle}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="truncate">{activeLesson.title}</span>
              </div>
              <LessonPlayer
                lesson={activeLesson}
                courseId={courseId}
                prevLesson={prevLesson}
                nextLesson={nextLesson}
                onComplete={handleComplete}
                onNavigate={handleLessonSelect}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a lesson to get started
            </div>
          )}
        </div>

        {/* RIGHT: info panel */}
        <div className="overflow-auto p-4 space-y-4">
          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Announcements</h3>
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  {a.isPinned && <span className="text-xs text-primary font-semibold">📌 </span>}
                  <span className="font-medium">{a.title}</span>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming session */}
          {upcomingSessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Live</h3>
              <LiveSessionCard session={upcomingSessions[0]} variant="compact" />
            </div>
          )}

          {/* Quick stats */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Course</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: tabbed layout */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-4rem)]">
        <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
          {/* Content area */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="content" className="mt-0 h-full">
              {activeLesson ? (
                <LessonPlayer
                  lesson={activeLesson}
                  courseId={courseId}
                  prevLesson={prevLesson}
                  nextLesson={nextLesson}
                  onComplete={handleComplete}
                  onNavigate={handleLessonSelect}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
                  Select a lesson from the Curriculum tab
                </div>
              )}
            </TabsContent>

            <TabsContent value="curriculum" className="mt-0 h-full">
              <CurriculumSidebar
                courseId={courseId}
                courseTitle={courseTitle}
                curriculum={curriculum}
                activeLessonId={activeLessonId}
                progress={progress}
                onLessonSelect={(id) => {
                  handleLessonSelect(id);
                }}
              />
            </TabsContent>

            <TabsContent value="info" className="mt-0 p-4 space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <span className="font-medium">{a.title}</span>
                  <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
                </div>
              ))}
              {upcomingSessions.slice(0, 3).map((s) => (
                <LiveSessionCard key={s.id} session={s} variant="compact" />
              ))}
            </TabsContent>
          </div>

          {/* Bottom tabs nav */}
          <TabsList className="rounded-none border-t border-border bg-card w-full h-12 shrink-0">
            <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
            <TabsTrigger value="curriculum" className="flex-1">Curriculum</TabsTrigger>
            <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
