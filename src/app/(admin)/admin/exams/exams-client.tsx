'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, GraduationCap,
  BookOpen, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ExamClient, ExamSectionClient, SubjectClient, TopicClient } from '@/types';
import { cn } from '@/lib/utils';

const EXAM_CATEGORIES = ['ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER'] as const;
const DIFFICULTY_PROFILES = ['EASY', 'MEDIUM', 'HARD', 'MIXED'] as const;

async function fetchExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/admin/exams?activeOnly=false');
  return (await res.json()).data ?? [];
}

async function fetchSubjects(): Promise<SubjectClient[]> {
  const res = await fetch('/api/admin/subjects');
  return (await res.json()).data ?? [];
}

async function fetchTopicTree(subjectId: string): Promise<TopicClient[]> {
  const res = await fetch(`/api/subjects/${subjectId}/topics?tree=false`);
  return (await res.json()).data ?? [];
}

async function fetchSections(examId: string): Promise<ExamSectionClient[]> {
  const res = await fetch(`/api/admin/exams/${examId}/sections`);
  return (await res.json()).data ?? [];
}

interface ExamFormData {
  name: string;
  fullName: string;
  category: string;
  conductedBy: string;
  description?: string;
  subjectIds: string[];
  isFeatured: boolean;
  isActive: boolean;
}

interface SectionFormData {
  subjectId: string;
  topicId: string;
  displayName?: string;
  weightage?: number;
  difficultyProfile: string;
  syllabusNotes?: string;
  order: number;
}

function ExamRow({ exam, onEdit, onDelete, onManageSections }: {
  exam: ExamClient;
  onEdit: (exam: ExamClient) => void;
  onDelete: (exam: ExamClient) => void;
  onManageSections: (exam: ExamClient) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <GraduationCap className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{exam.name}</span>
          {exam.isFeatured && (
            <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          )}
          {!exam.isActive && (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-xs h-4 px-1">{exam.category}</Badge>
          <span className="text-xs text-muted-foreground">{exam.conductedBy}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{exam.mcqCount} MCQs</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="outline" size="sm" onClick={() => onManageSections(exam)}>
          <BookOpen className="h-3.5 w-3.5" />
          Syllabus
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(exam)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{exam.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate the exam. Existing MCQ mappings will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(exam)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function ExamsClient() {
  const qc = useQueryClient();

  // Exam dialog state
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamClient | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Sections dialog state
  const [sectionsExam, setSectionsExam] = useState<ExamClient | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ExamSectionClient | null>(null);
  const [sectionSubjectId, setSectionSubjectId] = useState('');

  const { data: exams, isLoading } = useQuery({ queryKey: ['admin-exams'], queryFn: fetchExams });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });
  const { data: sections } = useQuery({
    queryKey: ['exam-sections', sectionsExam?.id],
    queryFn: () => fetchSections(sectionsExam!.id),
    enabled: !!sectionsExam,
  });
  const { data: topicsForSection } = useQuery({
    queryKey: ['topics', sectionSubjectId],
    queryFn: () => fetchTopicTree(sectionSubjectId),
    enabled: !!sectionSubjectId,
  });

  const examForm = useForm<ExamFormData>({
    defaultValues: { name: '', fullName: '', category: 'ENGINEERING', conductedBy: '', subjectIds: [], isFeatured: false, isActive: true },
  });

  const sectionForm = useForm<SectionFormData>({
    defaultValues: { subjectId: '', topicId: '', difficultyProfile: 'MIXED', order: 0 },
  });

  // ─── Exam mutations ───────────────────────────────────────────────────────────

  const saveExamMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const payload = { ...data, subjectIds: selectedSubjectIds };
      if (editingExam) {
        const res = await fetch(`/api/admin/exams/${editingExam.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      } else {
        const res = await fetch('/api/admin/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      toast.success(editingExam ? 'Exam updated' : 'Exam created');
      setExamDialogOpen(false);
      setEditingExam(null);
      examForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      toast.success('Exam deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Section mutations ────────────────────────────────────────────────────────

  const saveSectionMutation = useMutation({
    mutationFn: async (data: SectionFormData) => {
      if (editingSection) {
        const res = await fetch(`/api/admin/exams/${sectionsExam!.id}/sections/${editingSection.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      } else {
        const res = await fetch(`/api/admin/exams/${sectionsExam!.id}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-sections', sectionsExam?.id] });
      toast.success(editingSection ? 'Section updated' : 'Section added');
      setSectionDialogOpen(false);
      setEditingSection(null);
      sectionForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await fetch(`/api/admin/exams/${sectionsExam!.id}/sections/${sectionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-sections', sectionsExam?.id] });
      toast.success('Section removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const openAddExam = () => {
    setEditingExam(null);
    setSelectedSubjectIds([]);
    examForm.reset({ name: '', fullName: '', category: 'ENGINEERING', conductedBy: '', isFeatured: false, isActive: true });
    setExamDialogOpen(true);
  };

  const openEditExam = (exam: ExamClient) => {
    setEditingExam(exam);
    setSelectedSubjectIds(exam.subjectIds);
    examForm.reset({
      name: exam.name,
      fullName: exam.fullName,
      category: exam.category,
      conductedBy: exam.conductedBy,
      description: exam.description,
      isFeatured: exam.isFeatured,
      isActive: exam.isActive,
    });
    setExamDialogOpen(true);
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{exams?.length ?? 0} exams configured</span>
        <Button size="sm" onClick={openAddExam}>
          <Plus className="h-4 w-4" />
          Add Exam
        </Button>
      </div>

      {/* Exam list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !exams?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground rounded-xl border border-dashed border-border">
          <GraduationCap className="h-10 w-10 opacity-30" />
          <p className="font-medium">No exams configured</p>
          <Button size="sm" onClick={openAddExam}><Plus className="h-4 w-4" />Add Exam</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {exams.map((exam) => (
            <ExamRow
              key={exam.id}
              exam={exam}
              onEdit={openEditExam}
              onDelete={(e) => deleteExamMutation.mutate(e.id)}
              onManageSections={(e) => setSectionsExam(e)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={(open) => { setExamDialogOpen(open); if (!open) setEditingExam(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={examForm.handleSubmit((data) => saveExamMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Short Name <span className="text-destructive">*</span></Label>
                <Input {...examForm.register('name', { required: true })} placeholder="JEE Main" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input {...examForm.register('fullName', { required: true })} placeholder="Joint Entrance Examination (Main)" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Controller
                  control={examForm.control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXAM_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Conducted by <span className="text-destructive">*</span></Label>
                <Input {...examForm.register('conductedBy', { required: true })} placeholder="NTA" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...examForm.register('description')} rows={2} className="resize-none" placeholder="Brief description…" />
            </div>

            <div className="space-y-2">
              <Label>Subjects covered</Label>
              <div className="flex flex-wrap gap-2">
                {subjects?.map((s) => {
                  const selected = selectedSubjectIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Controller
                  control={examForm.control}
                  name="isFeatured"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} id="featured" />}
                />
                <Label htmlFor="featured" className="font-normal cursor-pointer">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={examForm.control}
                  name="isActive"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} id="active" />}
                />
                <Label htmlFor="active" className="font-normal cursor-pointer">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExamDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveExamMutation.isPending}>
                {saveExamMutation.isPending ? 'Saving…' : editingExam ? 'Save Changes' : 'Create Exam'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sections / Syllabus Builder Dialog */}
      <Dialog open={!!sectionsExam} onOpenChange={(open) => { if (!open) setSectionsExam(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Syllabus: {sectionsExam?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button size="sm" onClick={() => { setEditingSection(null); sectionForm.reset(); setSectionDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add Section
            </Button>

            {sections && sections.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                {sections.map((sec, i) => {
                  const sub = subjects?.find((s) => s.id === sec.subjectId);
                  return (
                    <div key={sec.id} className={cn('flex items-center gap-3 px-4 py-3', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sec.displayName ?? `Section ${i + 1}`}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {sub && <Badge variant="outline" className="text-xs h-4 px-1">{sub.name}</Badge>}
                          <Badge variant="outline" className="text-xs h-4 px-1">{sec.difficultyProfile}</Badge>
                          {sec.weightage != null && <span className="text-xs text-muted-foreground">{sec.weightage}%</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditingSection(sec); sectionForm.reset({ subjectId: sec.subjectId, topicId: sec.topicId, displayName: sec.displayName, weightage: sec.weightage, difficultyProfile: sec.difficultyProfile, syllabusNotes: sec.syllabusNotes, order: sec.order }); setSectionSubjectId(sec.subjectId); setSectionDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove section?</AlertDialogTitle>
                              <AlertDialogDescription>MCQ mappings to this section will be preserved.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteSectionMutation.mutate(sec.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No sections yet. Add sections to define the syllabus.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={(open) => { setSectionDialogOpen(open); if (!open) setEditingSection(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Syllabus Section'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={sectionForm.handleSubmit((data) => saveSectionMutation.mutate(data))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subject <span className="text-destructive">*</span></Label>
              <Controller
                control={sectionForm.control}
                name="subjectId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => { field.onChange(val); setSectionSubjectId(val); sectionForm.setValue('topicId', ''); }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects?.filter((s) => !sectionsExam?.subjectIds || sectionsExam.subjectIds.includes(s.id)).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Topic <span className="text-destructive">*</span></Label>
              <Controller
                control={sectionForm.control}
                name="topicId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!sectionSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                    <SelectContent>
                      {topicsForSection?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Display Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input {...sectionForm.register('displayName')} placeholder="e.g. Mechanics & Waves" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty Profile</Label>
                <Controller
                  control={sectionForm.control}
                  name="difficultyProfile"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_PROFILES.map((d) => (
                          <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Weightage %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...sectionForm.register('weightage', { valueAsNumber: true })}
                  placeholder="—"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Syllabus Notes</Label>
              <Textarea {...sectionForm.register('syllabusNotes')} rows={2} className="resize-none" placeholder="Optional notes for this section…" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveSectionMutation.isPending}>
                {saveSectionMutation.isPending ? 'Saving…' : editingSection ? 'Save Changes' : 'Add Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
