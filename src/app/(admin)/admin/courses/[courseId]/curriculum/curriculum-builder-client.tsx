'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, Link2, Video,
  FileText, FileIcon, HelpCircle, ClipboardList, X, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import type { CourseSubjectWithTopics, CourseLessonWithAccess } from '@/types/course.types';
import type { LessonType } from '@/types/course.types';

const LESSON_ICONS: Record<LessonType, React.ElementType> = {
  VIDEO: Video,
  TEXT: FileText,
  PDF: FileIcon,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

interface CurriculumBuilderClientProps {
  courseId: string;
  courseTitle: string;
  initialCurriculum: CourseSubjectWithTopics[];
}

export function CurriculumBuilderClient({ courseId, courseTitle, initialCurriculum }: CurriculumBuilderClientProps) {
  const router = useRouter();
  const [curriculum, setCurriculum] = useState(initialCurriculum);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    initialCurriculum[0]?.topics[0]?.id ?? null
  );
  const [editingSubject, setEditingSubject] = useState<{ id?: string; title: string; color?: string } | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ id?: string; subjectId: string; title: string } | null>(null);
  const [lessonModal, setLessonModal] = useState<{ topicId: string; lesson?: CourseLessonWithAccess } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedTopic = curriculum
    .flatMap((s) => s.topics)
    .find((t) => t.id === selectedTopicId) ?? null;
  const selectedSubject = curriculum.find((s) => s.topics.some((t) => t.id === selectedTopicId)) ?? null;

  // ─── Subject CRUD ─────────────────────────────────────────────────────────────

  const saveSubject = async () => {
    if (!editingSubject) return;
    const isNew = !editingSubject.id;
    const url = isNew
      ? `/api/admin/courses/${courseId}/subjects`
      : `/api/admin/courses/${courseId}/subjects/${editingSubject.id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editingSubject.title, color: editingSubject.color }),
    });
    if (!res.ok) { toast.error('Failed to save subject'); return; }
    const { data: saved } = await res.json();

    setCurriculum((prev) => isNew
      ? [...prev, { ...saved, topics: [] }]
      : prev.map((s) => s.id === saved.id ? { ...s, ...saved } : s)
    );
    setEditingSubject(null);
    toast.success(isNew ? 'Subject added' : 'Subject updated');
  };

  const deleteSubject = async (subjectId: string) => {
    if (!confirm('Delete this subject and all its topics/lessons?')) return;
    const res = await fetch(`/api/admin/courses/${courseId}/subjects/${subjectId}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setCurriculum((prev) => prev.filter((s) => s.id !== subjectId));
    if (selectedSubject?.id === subjectId) setSelectedTopicId(null);
    toast.success('Subject deleted');
  };

  const handleSubjectDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = curriculum.findIndex((s) => s.id === active.id);
    const newIdx = curriculum.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(curriculum, oldIdx, newIdx);
    setCurriculum(reordered);

    await fetch(`/api/admin/courses/${courseId}/subjects/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
    }).catch(() => { toast.error('Reorder failed — refreshing'); router.refresh(); });
  };

  // ─── Topic CRUD ───────────────────────────────────────────────────────────────

  const saveTopic = async () => {
    if (!editingTopic) return;
    const isNew = !editingTopic.id;
    const { subjectId, ...topicData } = editingTopic;
    const url = isNew
      ? `/api/admin/courses/${courseId}/subjects/${subjectId}/topics`
      : `/api/admin/courses/${courseId}/subjects/${subjectId}/topics/${editingTopic.id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: topicData.title }),
    });
    if (!res.ok) { toast.error('Failed to save topic'); return; }
    const { data: saved } = await res.json();

    setCurriculum((prev) => prev.map((s) => s.id === subjectId ? {
      ...s,
      topics: isNew
        ? [...s.topics, { ...saved, lessons: [] }]
        : s.topics.map((t) => t.id === saved.id ? { ...t, ...saved } : t),
    } : s));
    setEditingTopic(null);
    if (isNew) setSelectedTopicId(saved.id);
    toast.success(isNew ? 'Topic added' : 'Topic updated');
  };

  const deleteTopic = async (subjectId: string, topicId: string) => {
    if (!confirm('Delete this topic and all its lessons?')) return;
    const res = await fetch(`/api/admin/courses/${courseId}/subjects/${subjectId}/topics/${topicId}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setCurriculum((prev) => prev.map((s) => s.id === subjectId
      ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
      : s
    ));
    if (selectedTopicId === topicId) setSelectedTopicId(null);
    toast.success('Topic deleted');
  };

  const handleTopicDragEnd = async (subjectId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCurriculum((prev) => prev.map((s) => {
      if (s.id !== subjectId) return s;
      const oldIdx = s.topics.findIndex((t) => t.id === active.id);
      const newIdx = s.topics.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(s.topics, oldIdx, newIdx);

      fetch(`/api/admin/courses/${courseId}/subjects/${subjectId}/topics/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((t) => t.id) }),
      }).catch(() => router.refresh());

      return { ...s, topics: reordered };
    }));
  };

  // ─── Lesson CRUD ──────────────────────────────────────────────────────────────

  const saveLesson = async (topicId: string, data: Partial<CourseLessonWithAccess>, lessonId?: string) => {
    const subjectId = curriculum.find((s) => s.topics.some((t) => t.id === topicId))?.id;
    if (!subjectId) return;

    const isNew = !lessonId;
    const url = isNew
      ? `/api/admin/courses/${courseId}/subjects/${subjectId}/topics/${topicId}/lessons`
      : `/api/admin/courses/${courseId}/subjects/${subjectId}/topics/${topicId}/lessons/${lessonId}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to save lesson'); return; }
    const { data: saved } = await res.json();

    setCurriculum((prev) => prev.map((s) => s.id === subjectId ? {
      ...s,
      topics: s.topics.map((t) => t.id === topicId ? {
        ...t,
        lessons: isNew
          ? [...t.lessons, { ...saved, isLocked: false, completionStatus: 'available' as const }]
          : t.lessons.map((l) => l.id === saved.id ? { ...l, ...saved } : l),
      } : t),
    } : s));
    setLessonModal(null);
    toast.success(isNew ? 'Lesson added' : 'Lesson updated');
  };

  const deleteLesson = async (subjectId: string, topicId: string, lessonId: string) => {
    const res = await fetch(`/api/admin/courses/${courseId}/subjects/${subjectId}/topics/${topicId}/lessons/${lessonId}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete lesson'); return; }
    setCurriculum((prev) => prev.map((s) => s.id === subjectId ? {
      ...s,
      topics: s.topics.map((t) => t.id === topicId ? { ...t, lessons: t.lessons.filter((l) => l.id !== lessonId) } : t),
    } : s));
    toast.success('Lesson deleted');
  };

  const handleLessonDragEnd = async (topicId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const subjectId = curriculum.find((s) => s.topics.some((t) => t.id === topicId))?.id;
    if (!subjectId) return;

    setCurriculum((prev) => prev.map((s) => s.id === subjectId ? {
      ...s,
      topics: s.topics.map((t) => {
        if (t.id !== topicId) return t;
        const oldIdx = t.lessons.findIndex((l) => l.id === active.id);
        const newIdx = t.lessons.findIndex((l) => l.id === over.id);
        const reordered = arrayMove(t.lessons, oldIdx, newIdx);

        fetch(`/api/admin/courses/${courseId}/subjects/${subjectId}/topics/${topicId}/lessons/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: reordered.map((l) => l.id) }),
        }).catch(() => router.refresh());

        return { ...t, lessons: reordered };
      }),
    } : s));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT: Subject/Topic tree */}
      <div className="w-72 border-r border-border bg-card flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm truncate">{courseTitle}</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingSubject({ title: '', color: '#6366f1' })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubjectDragEnd}>
            <SortableContext items={curriculum.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {curriculum.map((subject) => (
                <SortableSubject
                  key={subject.id}
                  subject={subject}
                  selectedTopicId={selectedTopicId}
                  onSelectTopic={setSelectedTopicId}
                  onEditSubject={() => setEditingSubject({ id: subject.id, title: subject.title, color: subject.color })}
                  onDeleteSubject={() => deleteSubject(subject.id)}
                  onAddTopic={() => setEditingTopic({ subjectId: subject.id, title: '' })}
                  onEditTopic={(t) => setEditingTopic({ id: t.id, subjectId: subject.id, title: t.title })}
                  onDeleteTopic={(t) => deleteTopic(subject.id, t.id)}
                  sensors={sensors}
                  onTopicDragEnd={(e) => handleTopicDragEnd(subject.id, e)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* RIGHT: Lesson list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTopic && selectedSubject ? (
          <>
            <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card shrink-0">
              <div>
                <p className="text-xs text-muted-foreground">{selectedSubject.title}</p>
                <h2 className="font-semibold">{selectedTopic.title}</h2>
              </div>
              <Button
                size="sm"
                onClick={() => setLessonModal({ topicId: selectedTopic.id })}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Lesson
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleLessonDragEnd(selectedTopic.id, e)}
              >
                <SortableContext
                  items={selectedTopic.lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedTopic.lessons.map((lesson) => (
                    <SortableLesson
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={() => setLessonModal({ topicId: selectedTopic.id, lesson })}
                      onDelete={() => deleteLesson(selectedSubject.id, selectedTopic.id, lesson.id)}
                      onToggleFree={async () => {
                        await saveLesson(selectedTopic.id, { isFree: !lesson.isFree }, lesson.id);
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {selectedTopic.lessons.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <p className="font-medium">No lessons yet</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setLessonModal({ topicId: selectedTopic.id })}>
                    <Plus className="h-4 w-4 mr-1.5" />Add Lesson
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a topic to manage its lessons
          </div>
        )}
      </div>

      {/* Subject edit dialog */}
      <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject?.id ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={editingSubject?.title ?? ''}
                onChange={(e) => setEditingSubject((s) => s ? { ...s, title: e.target.value } : s)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <input
                type="color"
                value={editingSubject?.color ?? '#6366f1'}
                onChange={(e) => setEditingSubject((s) => s ? { ...s, color: e.target.value } : s)}
                className="h-9 w-full rounded-md border border-input cursor-pointer"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingSubject(null)}>Cancel</Button>
              <Button onClick={saveSubject}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic edit dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic?.id ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={editingTopic?.title ?? ''}
                onChange={(e) => setEditingTopic((t) => t ? { ...t, title: e.target.value } : t)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingTopic(null)}>Cancel</Button>
              <Button onClick={saveTopic}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson modal */}
      {lessonModal && (
        <LessonFormModal
          topicId={lessonModal.topicId}
          lesson={lessonModal.lesson}
          onSave={saveLesson}
          onClose={() => setLessonModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sortable Subject ─────────────────────────────────────────────────────────

function SortableSubject({
  subject, selectedTopicId, onSelectTopic, onEditSubject, onDeleteSubject,
  onAddTopic, onEditTopic, onDeleteTopic, sensors, onTopicDragEnd,
}: {
  subject: CourseSubjectWithTopics;
  selectedTopicId: string | null;
  onSelectTopic: (id: string) => void;
  onEditSubject: () => void;
  onDeleteSubject: () => void;
  onAddTopic: () => void;
  onEditTopic: (t: CourseSubjectWithTopics['topics'][0]) => void;
  onDeleteTopic: (t: CourseSubjectWithTopics['topics'][0]) => void;
  sensors: ReturnType<typeof useSensors>;
  onTopicDragEnd: (e: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subject.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Subject row */}
      <div className="flex items-center gap-1 px-2 py-1.5 group">
        <button {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-1">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: subject.color ?? '#6366f1' }}
        />
        <span className="flex-1 text-xs font-bold uppercase tracking-wider text-muted-foreground truncate px-1">
          {subject.title}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onAddTopic} className="p-1 hover:text-primary transition-colors" title="Add topic">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button onClick={onEditSubject} className="p-1 hover:text-primary transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDeleteSubject} className="p-1 hover:text-destructive transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Topics */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTopicDragEnd}>
        <SortableContext items={subject.topics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {subject.topics.map((topic) => (
            <SortableTopic
              key={topic.id}
              topic={topic}
              isSelected={selectedTopicId === topic.id}
              onSelect={() => onSelectTopic(topic.id)}
              onEdit={() => onEditTopic(topic)}
              onDelete={() => onDeleteTopic(topic)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableTopic({
  topic, isSelected, onSelect, onEdit, onDelete,
}: {
  topic: CourseSubjectWithTopics['topics'][0];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 pl-6 pr-2 py-1.5 cursor-pointer group transition-colors rounded-sm mx-2',
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50'
      )}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-0.5" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm truncate">{topic.title}</span>
      <span className="text-xs text-muted-foreground shrink-0">{topic.lessons.length}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-0.5 hover:text-primary transition-colors">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5 hover:text-destructive transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Sortable Lesson ──────────────────────────────────────────────────────────

function SortableLesson({
  lesson, onEdit, onDelete, onToggleFree,
}: {
  lesson: CourseLessonWithAccess;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFree: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const Icon = LESSON_ICONS[lesson.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 mb-2 group hover:border-primary/40 transition-colors"
    >
      <button {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm font-medium truncate">{lesson.title}</span>
      {lesson.duration && (
        <span className="text-xs text-muted-foreground shrink-0">{Math.ceil(lesson.duration / 60)}m</span>
      )}
      <button
        onClick={onToggleFree}
        className={cn(
          'shrink-0 text-xs px-2 py-0.5 rounded-full border transition-colors',
          lesson.isFree ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'border-border text-muted-foreground hover:border-primary/40'
        )}
        title="Toggle free preview"
      >
        {lesson.isFree ? 'Free' : 'Locked'}
      </button>
      <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Lesson Form Modal ────────────────────────────────────────────────────────

function LessonFormModal({
  topicId, lesson, onSave, onClose,
}: {
  topicId: string;
  lesson?: CourseLessonWithAccess;
  onSave: (topicId: string, data: Partial<CourseLessonWithAccess>, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<LessonType>(lesson?.type ?? 'VIDEO');
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '');
  const [textContent, setTextContent] = useState(lesson?.textContent ?? '');
  const [pdfUrl, setPdfUrl] = useState(lesson?.pdfUrl ?? '');
  const [pdfDisplayName, setPdfDisplayName] = useState(lesson?.pdfDisplayName ?? '');
  const [linkedTestId, setLinkedTestId] = useState(lesson?.linkedTestId ?? '');
  const [notesUrl, setNotesUrl] = useState(lesson?.notesUrl ?? '');
  const [notesName, setNotesName] = useState(lesson?.notesName ?? '');
  const [isFree, setIsFree] = useState(lesson?.isFree ?? false);
  const [duration, setDuration] = useState(lesson?.duration?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title) { toast.error('Title is required'); return; }
    setSaving(true);
    await onSave(topicId, {
      title, type, videoUrl: videoUrl || undefined, duration: duration ? parseInt(duration) * 60 : undefined,
      textContent: textContent || undefined, pdfUrl: pdfUrl || undefined, pdfDisplayName: pdfDisplayName || undefined,
      linkedTestId: linkedTestId || undefined, notesUrl: notesUrl || undefined, notesName: notesName || undefined,
      isFree,
    }, lesson?.id);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2 flex-wrap">
              {(['VIDEO', 'TEXT', 'PDF', 'QUIZ', 'ASSIGNMENT'] as LessonType[]).map((t) => {
                const Icon = LESSON_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {type === 'VIDEO' && (
            <>
              <div className="space-y-1.5">
                <Label>Video URL (YouTube or direct)</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={0} />
              </div>
            </>
          )}

          {type === 'TEXT' && (
            <div className="space-y-1.5">
              <Label>Content (HTML)</Label>
              <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={6} placeholder="<p>Lesson content...</p>" />
            </div>
          )}

          {type === 'PDF' && (
            <>
              <div className="space-y-1.5">
                <Label>PDF URL</Label>
                <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input value={pdfDisplayName} onChange={(e) => setPdfDisplayName(e.target.value)} placeholder="Chapter 1 Notes" />
              </div>
            </>
          )}

          {(type === 'QUIZ' || type === 'ASSIGNMENT') && (
            <div className="space-y-1.5">
              <Label>Linked Test ID</Label>
              <Input value={linkedTestId} onChange={(e) => setLinkedTestId(e.target.value)} placeholder="test document ID" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Notes URL</Label>
              <Input value={notesUrl} onChange={(e) => setNotesUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Notes Name</Label>
              <Input value={notesName} onChange={(e) => setNotesName(e.target.value)} placeholder="PDF name" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Free Preview</p>
              <p className="text-xs text-muted-foreground">Allow non-enrolled users to view</p>
            </div>
            <Switch checked={isFree} onCheckedChange={setIsFree} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Lesson'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
