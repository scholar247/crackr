'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Video, FileText, FileIcon, HelpCircle, CheckCircle,
  ChevronDown, ChevronRight, Edit3, Check, X, Lock, Unlock,
  ExternalLink, Download, Clock, AlertCircle, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { CourseLessonClient, LessonType } from '@/types/course.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicWithLessons {
  id: string;
  title: string;
  lessonCount: number;
  lessons: CourseLessonClient[];
}

interface SubjectWithTopics {
  id: string;
  title: string;
  color?: string;
  topics: TopicWithLessons[];
}

interface ContentClientProps {
  courseId: string;
  courseTitle: string;
  curriculum: SubjectWithTopics[];
}

// ─── Icons & colours ─────────────────────────────────────────────────────────

const LESSON_ICONS: Record<LessonType, React.ElementType> = {
  VIDEO: Video,
  TEXT: FileText,
  PDF: FileIcon,
  QUIZ: HelpCircle,
  ASSIGNMENT: CheckCircle,
};

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: 'Video',
  TEXT: 'Text',
  PDF: 'PDF',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Assignment',
};

// ─── Inline lesson editor ─────────────────────────────────────────────────────

interface LessonEditorProps {
  lesson: CourseLessonClient;
  courseId: string;
  onSaved: (updated: CourseLessonClient) => void;
  onCancel: () => void;
}

function LessonEditor({ lesson, courseId, onSaved, onCancel }: LessonEditorProps) {
  const [form, setForm] = useState({
    videoUrl: lesson.videoUrl ?? '',
    textContent: lesson.textContent ?? '',
    pdfUrl: lesson.pdfUrl ?? '',
    pdfDisplayName: lesson.pdfDisplayName ?? '',
    notesUrl: lesson.notesUrl ?? '',
    notesName: lesson.notesName ?? '',
    description: lesson.description ?? '',
    linkedTestId: lesson.linkedTestId ?? '',
    isFree: lesson.isFree,
    duration: lesson.duration ? String(lesson.duration) : '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        isFree: form.isFree,
        description: form.description || undefined,
        linkedTestId: form.linkedTestId || undefined,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
      };
      if (lesson.type === 'VIDEO') payload.videoUrl = form.videoUrl || undefined;
      if (lesson.type === 'TEXT') payload.textContent = form.textContent || undefined;
      if (lesson.type === 'PDF') {
        payload.pdfUrl = form.pdfUrl || undefined;
        payload.pdfDisplayName = form.pdfDisplayName || undefined;
      }
      if (lesson.type === 'QUIZ' || lesson.type === 'ASSIGNMENT') {
        payload.linkedTestId = form.linkedTestId || undefined;
      }
      payload.notesUrl = form.notesUrl || undefined;
      payload.notesName = form.notesName || undefined;

      const res = await fetch(`/api/teacher/courses/${courseId}/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const { data } = await res.json();
      toast.success('Lesson saved');
      onSaved(data);
    } catch {
      toast.error('Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      {/* Content field based on lesson type */}
      {lesson.type === 'VIDEO' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Video URL</Label>
          <Input
            value={form.videoUrl}
            onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
            placeholder="https://youtube.com/watch?v=... or direct video URL"
          />
          <p className="text-xs text-muted-foreground">YouTube, Vimeo, or direct MP4 link</p>
        </div>
      )}

      {lesson.type === 'TEXT' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Text Content (HTML)</Label>
          <Textarea
            value={form.textContent}
            onChange={(e) => setForm((f) => ({ ...f, textContent: e.target.value }))}
            placeholder="<p>Write your lesson content here...</p>"
            rows={8}
            className="font-mono text-xs"
          />
        </div>
      )}

      {lesson.type === 'PDF' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">PDF URL</Label>
            <Input
              value={form.pdfUrl}
              onChange={(e) => setForm((f) => ({ ...f, pdfUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">PDF Display Name</Label>
            <Input
              value={form.pdfDisplayName}
              onChange={(e) => setForm((f) => ({ ...f, pdfDisplayName: e.target.value }))}
              placeholder="e.g. Chapter 3 Notes"
            />
          </div>
        </div>
      )}

      {(lesson.type === 'QUIZ' || lesson.type === 'ASSIGNMENT') && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Linked Test ID</Label>
          <Input
            value={form.linkedTestId}
            onChange={(e) => setForm((f) => ({ ...f, linkedTestId: e.target.value }))}
            placeholder="Test ID from admin panel"
          />
          <p className="text-xs text-muted-foreground">
            Students will see a "Take Quiz" button when a test ID is linked.
          </p>
        </div>
      )}

      {/* Notes download */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Notes URL (optional)</Label>
          <Input
            value={form.notesUrl}
            onChange={(e) => setForm((f) => ({ ...f, notesUrl: e.target.value }))}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Notes File Name</Label>
          <Input
            value={form.notesName}
            onChange={(e) => setForm((f) => ({ ...f, notesName: e.target.value }))}
            placeholder="e.g. Lecture Notes.pdf"
          />
        </div>
      </div>

      {/* Description & Duration */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Description (optional)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description of what this lesson covers..."
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Duration (seconds)</Label>
          <Input
            type="number"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            placeholder="e.g. 1800 (= 30 min)"
          />
          {form.duration && (
            <p className="text-xs text-muted-foreground">
              = {Math.ceil(parseInt(form.duration) / 60)} minutes
            </p>
          )}
        </div>
      </div>

      {/* Free toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Free Preview</p>
          <p className="text-xs text-muted-foreground">
            Allow non-enrolled students to access this lesson
          </p>
        </div>
        <Switch
          checked={form.isFree}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isFree: v }))}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button onClick={save} disabled={saving} size="sm" className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  courseId,
  onUpdate,
}: {
  lesson: CourseLessonClient;
  courseId: string;
  onUpdate: (updated: CourseLessonClient) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(lesson);
  const Icon = LESSON_ICONS[current.type];

  const hasContent =
    current.videoUrl || current.textContent || current.pdfUrl || current.linkedTestId;

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      editing ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
    )}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{current.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{LESSON_TYPE_LABELS[current.type]}</span>
            {current.duration && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {Math.ceil(current.duration / 60)}m
              </span>
            )}
            {current.isFree && (
              <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
                <Unlock className="h-3 w-3" /> Free
              </span>
            )}
            {!current.isFree && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </div>
        </div>

        {/* Content status indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasContent ? (
            <span className="flex items-center gap-1 text-xs text-success font-medium">
              <Check className="h-3.5 w-3.5" /> Content ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
              <AlertCircle className="h-3.5 w-3.5" /> No content
            </span>
          )}
          {current.notesUrl && (
            <a
              href={current.notesUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Notes available"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          {current.videoUrl && (
            <a
              href={current.videoUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Preview video"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <Button
          variant="ghost" size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => setEditing(!editing)}
        >
          <Edit3 className="h-3.5 w-3.5" />
          {editing ? 'Close' : 'Edit'}
        </Button>
      </div>

      {editing && (
        <div className="px-4 pb-4">
          <LessonEditor
            lesson={current}
            courseId={courseId}
            onSaved={(updated) => {
              setCurrent(updated);
              onUpdate(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Topic accordion ──────────────────────────────────────────────────────────

function TopicAccordion({
  topic,
  courseId,
  defaultOpen = false,
}: {
  topic: TopicWithLessons;
  courseId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [lessons, setLessons] = useState(topic.lessons);

  const filledCount = lessons.filter(
    (l) => l.videoUrl || l.textContent || l.pdfUrl || l.linkedTestId
  ).length;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-muted/40 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="flex-1 text-sm font-semibold">{topic.title}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {filledCount}/{lessons.length} lessons ready
        </span>
      </button>

      {open && lessons.length > 0 && (
        <div className="p-3 space-y-2">
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              onUpdate={(updated) =>
                setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
              }
            />
          ))}
        </div>
      )}

      {open && lessons.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No lessons in this topic yet.
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContentClient({ courseId, courseTitle, curriculum }: ContentClientProps) {
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(
    curriculum[0]?.id ?? null
  );

  const totalLessons = curriculum.reduce(
    (s, sub) => s + sub.topics.reduce((ts, t) => ts + t.lessons.length, 0),
    0
  );
  const filledLessons = curriculum.reduce(
    (s, sub) =>
      s +
      sub.topics.reduce(
        (ts, t) =>
          ts + t.lessons.filter((l) => l.videoUrl || l.textContent || l.pdfUrl || l.linkedTestId).length,
        0
      ),
    0
  );
  const fillPct = totalLessons > 0 ? Math.round((filledLessons / totalLessons) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/teacher/courses" className="hover:text-primary transition-colors">
              My Courses
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate max-w-48">{courseTitle}</span>
          </div>
          <h1 className="text-2xl font-bold">Lesson Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add videos, text, PDFs and notes to each lesson.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{filledLessons}/{totalLessons} ready</p>
            <p className="text-xs text-muted-foreground">lessons have content</p>
          </div>
          <div className="h-10 w-10 relative">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="var(--color-primary)" strokeWidth="3"
                strokeDasharray={`${(fillPct / 100) * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {fillPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap">
        {curriculum.map((sub) => {
          const subTotal = sub.topics.reduce((s, t) => s + t.lessons.length, 0);
          const subFilled = sub.topics.reduce(
            (s, t) => s + t.lessons.filter((l) => l.videoUrl || l.textContent || l.pdfUrl || l.linkedTestId).length,
            0
          );
          const isOpen = openSubjectId === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setOpenSubjectId(isOpen ? null : sub.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2',
                isOpen
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary text-foreground'
              )}
            >
              {sub.title}
              <span className={cn('text-xs rounded-full px-1.5 py-0.5',
                isOpen ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {subFilled}/{subTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Topic list for selected subject */}
      {curriculum.map((sub) => (
        openSubjectId === sub.id && (
          <div key={sub.id} className="space-y-3">
            {sub.topics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                No topics in this subject.
              </div>
            ) : (
              sub.topics.map((topic, i) => (
                <TopicAccordion
                  key={topic.id}
                  topic={topic}
                  courseId={courseId}
                  defaultOpen={i === 0}
                />
              ))
            )}
          </div>
        )
      ))}

      {curriculum.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="font-semibold">No curriculum yet</p>
          <p className="text-sm text-muted-foreground">
            Ask an admin to set up the course structure first.
          </p>
        </div>
      )}
    </div>
  );
}
