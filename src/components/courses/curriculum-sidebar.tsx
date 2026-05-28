'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  FileText,
  FileIcon,
  HelpCircle,
  ClipboardList,
  Search,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { CourseSubjectWithTopics, CourseLessonWithAccess } from '@/types/course.types';
import type { LessonType } from '@/types/course.types';

const LESSON_ICONS: Record<LessonType, React.ElementType> = {
  VIDEO: Play,
  TEXT: FileText,
  PDF: FileIcon,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

interface CurriculumSidebarProps {
  courseId: string;
  courseTitle: string;
  curriculum: CourseSubjectWithTopics[];
  activeLessonId?: string;
  progress: number;
  onLessonSelect?: (lessonId: string) => void;
}

export function CurriculumSidebar({
  courseId,
  courseTitle,
  curriculum,
  activeLessonId,
  progress,
  onLessonSelect,
}: CurriculumSidebarProps) {
  const [search, setSearch] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(curriculum.map((s) => s.id))
  );
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    new Set(curriculum.flatMap((s) => s.topics.map((t) => t.id)))
  );
  const router = useRouter();

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const searchLower = search.toLowerCase();
  const filtered = curriculum.map((subject) => ({
    ...subject,
    topics: subject.topics.map((topic) => ({
      ...topic,
      lessons: topic.lessons.filter(
        (l) => !searchLower || l.title.toLowerCase().includes(searchLower)
      ),
    })).filter((t) => !searchLower || t.lessons.length > 0 || t.title.toLowerCase().includes(searchLower)),
  })).filter((s) => !searchLower || s.topics.length > 0 || s.title.toLowerCase().includes(searchLower));

  const currentTopic = curriculum
    .flatMap((s) => s.topics)
    .find((t) => t.lessons.some((l) => l.id === activeLessonId));

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-bold truncate mb-3">{courseTitle}</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Curriculum tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.map((subject) => (
          <div key={subject.id}>
            {/* Subject header */}
            <button
              onClick={() => toggleSubject(subject.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: subject.color ?? 'var(--color-primary)' }}
              />
              <span className="flex-1 text-left">{subject.title}</span>
              {expandedSubjects.has(subject.id) ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>

            {expandedSubjects.has(subject.id) && (
              <div className="ml-2">
                {subject.topics.map((topic) => (
                  <div key={topic.id}>
                    {/* Topic header */}
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <span className="flex-1 text-left font-medium">{topic.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {topic.lessons.length}
                      </span>
                      {expandedTopics.has(topic.id) ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>

                    {expandedTopics.has(topic.id) && (
                      <div className="ml-3">
                        {topic.lessons.map((lesson) => (
                          <LessonRow
                            key={lesson.id}
                            lesson={lesson}
                            courseId={courseId}
                            isActive={lesson.id === activeLessonId}
                            onSelect={onLessonSelect}
                          />
                        ))}

                        {/* Practice this topic CTA */}
                        {topic.id === currentTopic?.id && (
                          <button
                            onClick={() => {
                              router.push(`/mocks/generate?courseTopicId=${topic.id}&courseId=${courseId}`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/5 transition-colors rounded"
                          >
                            <Target className="h-3.5 w-3.5" />
                            Practice this Topic
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            No lessons found
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          asChild
        >
          <Link href={`/mocks/generate?courseId=${courseId}`}>
            <Target className="h-3.5 w-3.5 mr-1.5" />
            Practice Full Course
          </Link>
        </Button>
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  courseId,
  isActive,
  onSelect,
}: {
  lesson: CourseLessonWithAccess;
  courseId: string;
  isActive: boolean;
  onSelect?: (id: string) => void;
}) {
  const Icon = LESSON_ICONS[lesson.type];

  const content = (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : lesson.completionStatus === 'locked'
          ? 'text-muted-foreground/50 cursor-not-allowed'
          : 'text-foreground hover:bg-accent/50'
      )}
      onClick={() => {
        if (lesson.completionStatus !== 'locked' && onSelect) onSelect(lesson.id);
      }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {lesson.completionStatus === 'completed' ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : lesson.completionStatus === 'locked' ? (
          <Lock className="h-4 w-4" />
        ) : isActive ? (
          <Play className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>

      {/* Type icon */}
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      {/* Title */}
      <span className="flex-1 truncate text-xs">{lesson.title}</span>

      {/* Duration */}
      {lesson.duration && (
        <span className="text-xs text-muted-foreground shrink-0">
          {Math.ceil(lesson.duration / 60)}m
        </span>
      )}
    </div>
  );

  if (lesson.completionStatus === 'locked') return content;

  return (
    <Link
      href={`/courses/${courseId}/learn?lesson=${lesson.id}`}
      onClick={(e) => {
        if (onSelect) {
          e.preventDefault();
          onSelect(lesson.id);
        }
      }}
    >
      {content}
    </Link>
  );
}
