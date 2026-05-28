'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CourseLessonWithAccess } from '@/types/course.types';

interface LessonPlayerProps {
  lesson: CourseLessonWithAccess;
  courseId: string;
  prevLesson?: CourseLessonWithAccess | null;
  nextLesson?: CourseLessonWithAccess | null;
  onComplete?: () => void;
  onNavigate?: (lessonId: string) => void;
}

export function LessonPlayer({
  lesson,
  courseId,
  prevLesson,
  nextLesson,
  onComplete,
  onNavigate,
}: LessonPlayerProps) {
  const [isCompleted, setIsCompleted] = useState(lesson.completionStatus === 'completed');
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const markComplete = useCallback(async () => {
    if (isCompleted || isMarkingComplete) return;
    setIsMarkingComplete(true);
    try {
      await fetch(`/api/courses/${courseId}/lessons/${lesson.id}/complete`, { method: 'POST' });
      setIsCompleted(true);
      onComplete?.();
      toast.success('Lesson completed!');
    } catch {
      toast.error('Failed to mark lesson complete');
    } finally {
      setIsMarkingComplete(false);
    }
  }, [courseId, lesson.id, isCompleted, isMarkingComplete, onComplete]);

  // Auto-complete text lessons on scroll + time
  useEffect(() => {
    if (lesson.type !== 'TEXT' || isCompleted) return;
    const timer = setTimeout(() => {
      const el = textRef.current;
      if (!el) return;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      if (atBottom) markComplete();
    }, 30000);
    return () => clearTimeout(timer);
  }, [lesson.type, isCompleted, markComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Lesson content */}
      <div className="flex-1 overflow-auto">
        {lesson.type === 'VIDEO' && (
          <VideoLesson lesson={lesson} onComplete={markComplete} />
        )}
        {lesson.type === 'TEXT' && (
          <TextLesson lesson={lesson} ref={textRef} />
        )}
        {lesson.type === 'PDF' && (
          <PdfLesson lesson={lesson} onComplete={markComplete} />
        )}
        {lesson.type === 'QUIZ' && (
          <QuizLesson lesson={lesson} courseId={courseId} />
        )}
      </div>

      {/* Footer nav */}
      <div className="border-t border-border bg-card px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled={!prevLesson}
          onClick={() => prevLesson && onNavigate?.(prevLesson.id)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {lesson.type === 'PDF' && (
            <Button variant="ghost" size="sm" onClick={markComplete} disabled={isCompleted || isMarkingComplete}>
              {isCompleted ? (
                <><CheckCircle className="h-4 w-4 mr-1.5 text-success" />Completed</>
              ) : (
                'Mark Complete'
              )}
            </Button>
          )}
          {isCompleted && lesson.type !== 'PDF' && (
            <span className="flex items-center gap-1.5 text-sm text-success font-medium">
              <CheckCircle className="h-4 w-4" />
              Completed
            </span>
          )}
        </div>

        <Button
          variant={nextLesson ? 'default' : 'outline'}
          size="sm"
          disabled={!nextLesson}
          onClick={() => nextLesson && onNavigate?.(nextLesson.id)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Video Lesson ──────────────────────────────────────────────────────────────

function VideoLesson({ lesson, onComplete }: { lesson: CourseLessonWithAccess; onComplete: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasCompleted, setHasCompleted] = useState(lesson.completionStatus === 'completed');

  const youtubeId = lesson.videoUrl ? extractYouTubeId(lesson.videoUrl) : null;
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`
    : lesson.videoUrl;

  useEffect(() => {
    if (hasCompleted) return;
    // Auto-complete after 80% of duration
    if (!lesson.duration) return;
    const completeAt = lesson.duration * 0.8 * 1000;
    const timer = setTimeout(() => {
      if (!hasCompleted) {
        setHasCompleted(true);
        onComplete();
      }
    }, completeAt);
    return () => clearTimeout(timer);
  }, [lesson.duration, hasCompleted, onComplete]);

  return (
    <div className="space-y-4 p-4">
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No video available
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
        )}
      </div>

      {lesson.notesUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={lesson.notesUrl} download={lesson.notesName ?? 'notes'}>
            <Download className="h-4 w-4 mr-2" />
            Download Notes
          </a>
        </Button>
      )}
    </div>
  );
}

// ─── Text Lesson ──────────────────────────────────────────────────────────────

const TextLesson = React.forwardRef<HTMLDivElement, { lesson: CourseLessonWithAccess }>(
  function TextLesson({ lesson }, ref) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>
        {lesson.textContent ? (
          <div
            ref={ref}
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.textContent }}
          />
        ) : (
          <p className="text-muted-foreground">No content available.</p>
        )}
      </div>
    );
  }
);

// ─── PDF Lesson ───────────────────────────────────────────────────────────────

function PdfLesson({ lesson, onComplete: _onComplete }: { lesson: CourseLessonWithAccess; onComplete: () => void }) {
  return (
    <div className="space-y-4 p-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        {lesson.pdfUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open PDF
            </a>
          </Button>
        )}
      </div>
      {lesson.pdfUrl ? (
        <iframe
          src={lesson.pdfUrl}
          className="w-full rounded-xl border border-border"
          style={{ height: 'calc(100vh - 300px)' }}
          title={lesson.pdfDisplayName ?? lesson.title}
        />
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No PDF available
        </div>
      )}
    </div>
  );
}

// ─── Quiz Lesson ──────────────────────────────────────────────────────────────

function QuizLesson({ lesson, courseId }: { lesson: CourseLessonWithAccess; courseId: string }) {
  void courseId;
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">📝</span>
      </div>
      <div>
        <h2 className="text-xl font-bold">{lesson.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">Test your understanding of this topic</p>
      </div>
      {lesson.linkedTestId ? (
        <Button asChild>
          <a href={`/tests/${lesson.linkedTestId}/take`} target="_blank" rel="noopener noreferrer">
            Start Quiz
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      ) : (
        <Button disabled>No quiz linked</Button>
      )}
    </div>
  );
}

import React from 'react';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export { cn };
