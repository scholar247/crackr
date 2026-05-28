'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateMCQSchema, type CreateMCQInput } from '@/schemas';
import type { MCQClient, SubjectClient, ExamClient, ExamSectionClient, Tag, Difficulty, TopicTreeNode } from '@/types';
import { cn } from '@/lib/utils';
import { TopicTreeSelect } from '@/components/filters/TopicTreeSelect';

const MCQEditor = dynamic(
  () => import('@/components/editor/mcq-editor').then((m) => m.MCQEditor),
  { ssr: false }
);

const ContentBlockRenderer = dynamic(
  () => import('@/components/mcq/content-block-renderer').then((m) => m.ContentBlockRenderer),
  { ssr: false }
);

interface MCQFormProps {
  initialData?: MCQClient;
  mode: 'create' | 'edit';
}

const DIFFICULTY_OPTIONS: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
const OPTION_IDS = ['A', 'B', 'C', 'D', 'E', 'F'];

const EXAM_CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
] as const;

const EXAM_CATEGORY_LABELS: Record<string, string> = {
  ENGINEERING: 'Engineering', MEDICAL: 'Medical', MANAGEMENT: 'Management',
  BANKING: 'Banking', GOVERNMENT: 'Government', SCHOOL: 'School', OTHER: 'Other',
};

async function fetchSubjects(): Promise<SubjectClient[]> {
  const res = await fetch('/api/subjects');
  return (await res.json()).data as SubjectClient[];
}

async function fetchExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/exams');
  return (await res.json()).data as ExamClient[];
}

async function fetchExamSections(examId: string): Promise<ExamSectionClient[]> {
  const res = await fetch(`/api/exams/${examId}/sections`);
  return (await res.json()).data as ExamSectionClient[];
}

async function fetchTopicTree(examIds: string[], subjectId: string): Promise<TopicTreeNode[]> {
  const params = new URLSearchParams({ examIds: examIds.join(','), subjectId });
  const res = await fetch(`/api/topics/for-exams?${params}`);
  return (await res.json()).data as TopicTreeNode[];
}

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch('/api/tags');
  return (await res.json()).data as Tag[];
}

export function MCQForm({ initialData, mode }: MCQFormProps) {
  const router = useRouter();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(initialData?.examIds ?? []);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(initialData?.examSectionIds ?? []);
  const [difficultyPerExam, setDifficultyPerExam] = useState<Record<string, Difficulty>>(
    initialData?.difficultyPerExam ?? {}
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateMCQInput>({
    resolver: zodResolver(CreateMCQSchema) as any,
    defaultValues: initialData
      ? {
          subjectId: initialData.subjectId,
          topicId: initialData.topicId,
          examIds: initialData.examIds,
          examSectionIds: initialData.examSectionIds,
          difficultyPerExam: initialData.difficultyPerExam ?? {},
          tagIds: initialData.tagIds,
          difficulty: initialData.difficulty,
          questionType: initialData.questionType,
          question: initialData.question,
          options: initialData.options,
          explanation: initialData.explanation ?? [],
          hint: initialData.hint ?? [],
          isActive: initialData.isActive,
          isPreviousYear: initialData.isPreviousYear ?? false,
          source: initialData.source ?? '',
        }
      : {
          difficulty: 'MEDIUM',
          questionType: 'SINGLE',
          question: [],
          options: [
            { id: 'A', content: [], isCorrect: false },
            { id: 'B', content: [], isCorrect: false },
            { id: 'C', content: [], isCorrect: false },
            { id: 'D', content: [], isCorrect: false },
          ],
          tagIds: [],
          examIds: [],
          examSectionIds: [],
          difficultyPerExam: {},
          isActive: true,
          isPreviousYear: false,
        },
  });

  const { fields: optionFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const watchSubjectId = form.watch('subjectId');
  const watchTopicId = form.watch('topicId');
  const watchQuestionType = form.watch('questionType');
  const watchQuestion = form.watch('question');
  const watchOptions = form.watch('options');

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });
  const { data: allExams } = useQuery({ queryKey: ['exams'], queryFn: fetchExams });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags });

  // Topic tree from for-exams API (requires both exam + subject selection)
  const canFetchTopicTree = selectedExamIds.length > 0 && !!watchSubjectId;
  const { data: topicTree = [], isFetching: topicTreeLoading } = useQuery({
    queryKey: ['topic-tree-for-exams', selectedExamIds, watchSubjectId],
    queryFn: () => fetchTopicTree(selectedExamIds, watchSubjectId),
    enabled: canFetchTopicTree,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sections for all selected exams
  const { data: examSectionsMap } = useQuery({
    queryKey: ['exam-sections', selectedExamIds],
    queryFn: async () => {
      const map = new Map<string, ExamSectionClient[]>();
      await Promise.all(
        selectedExamIds.map(async (examId) => {
          const sections = await fetchExamSections(examId);
          map.set(examId, sections);
        })
      );
      return map;
    },
    enabled: selectedExamIds.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateMCQInput) => {
      const url = mode === 'edit' ? `/api/admin/mcq/${initialData!.id}` : '/api/admin/mcq';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tagIds: selectedTagIds,
          examIds: selectedExamIds,
          examSectionIds: selectedSectionIds,
          difficultyPerExam,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        const fieldErrors = err.details?.fieldErrors;
        const error = new Error(err.error ?? 'Save failed') as Error & { fieldMessages?: string };
        if (fieldErrors) {
          error.fieldMessages = Object.entries(fieldErrors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
            .join('\n');
        }
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(mode === 'create' ? 'MCQ created!' : 'MCQ updated!');
      router.push('/admin/mcq');
    },
    onError: (err: Error & { fieldMessages?: string }) => {
      if (err.fieldMessages) {
        toast.error(err.message, { description: err.fieldMessages });
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleCorrectToggle = (optionIndex: number) => {
    const current = form.getValues('options');
    if (watchQuestionType === 'SINGLE') {
      current.forEach((_, i) => {
        form.setValue(`options.${i}.isCorrect`, i === optionIndex);
      });
    } else {
      form.setValue(`options.${optionIndex}.isCorrect`, !current[optionIndex].isCorrect);
    }
  };

  const addOption = () => {
    if (optionFields.length >= 6) return;
    append({ id: OPTION_IDS[optionFields.length], content: [], isCorrect: false });
  };

  const onSubmit = form.handleSubmit((data) => {
    if (selectedExamIds.length === 0) {
      toast.error('Please select at least one exam');
      return;
    }
    saveMutation.mutate({
      ...(data as CreateMCQInput),
      tagIds: selectedTagIds,
      examIds: selectedExamIds,
      examSectionIds: selectedSectionIds,
      difficultyPerExam,
    });
  });

  const toggleExam = (examId: string) => {
    const removing = selectedExamIds.includes(examId);
    setSelectedExamIds((prev) =>
      removing ? prev.filter((id) => id !== examId) : [...prev, examId]
    );
    if (removing) {
      // Remove sections belonging to this exam if deselecting
      const examSections = examSectionsMap?.get(examId)?.map((s) => s.id) ?? [];
      setSelectedSectionIds((prev) => prev.filter((id) => !examSections.includes(id)));
      // Remove per-exam difficulty entry
      setDifficultyPerExam((prev) => {
        const next = { ...prev };
        delete next[examId];
        return next;
      });
      // Reset topic if topic tree might be invalid now
      form.setValue('topicId', '');
    }
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  // Group exams by category
  const examsByCategory = (allExams ?? []).reduce<Record<string, ExamClient[]>>((acc, e) => {
    const cat = e.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  // Find the selected topic node for breadcrumb (flatten tree)
  function flattenTree(nodes: TopicTreeNode[]): TopicTreeNode[] {
    const result: TopicTreeNode[] = [];
    function walk(node: TopicTreeNode) { result.push(node); node.children.forEach(walk); }
    nodes.forEach(walk);
    return result;
  }
  const flatTopics = flattenTree(topicTree);
  const selectedTopicNode = watchTopicId ? flatTopics.find((n) => n.id === watchTopicId) ?? null : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <Label>Question <span className="text-destructive">*</span></Label>
            <Controller
              control={form.control}
              name="question"
              render={({ field }) => (
                <MCQEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Type the question. Use $...$ for inline math, $$...$$ for block math."
                />
              )}
            />
            {form.formState.errors.question && (
              <p className="text-xs text-destructive">{form.formState.errors.question.message as string}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-normal text-muted-foreground">Multiple correct</Label>
                  <Switch
                    checked={watchQuestionType === 'MULTIPLE'}
                    onCheckedChange={(v) => form.setValue('questionType', v ? 'MULTIPLE' : 'SINGLE')}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={optionFields.length >= 6}>
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </Button>
              </div>
            </div>

            {optionFields.map((field, i) => {
              const isCorrect = watchOptions?.[i]?.isCorrect;
              return (
                <div key={field.id} className={cn(
                  'rounded-lg border p-3 space-y-2 transition-colors',
                  isCorrect ? 'border-success bg-success/5' : 'border-border'
                )}>
                  <div className="flex items-center gap-2">
                    <Badge variant={isCorrect ? 'success' : 'secondary'} className="w-7 h-7 rounded-full flex items-center justify-center text-sm p-0">
                      {OPTION_IDS[i]}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">Mark correct:</span>
                    <Switch
                      checked={isCorrect ?? false}
                      onCheckedChange={() => handleCorrectToggle(i)}
                    />
                    {optionFields.length > 2 && (
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Controller
                    control={form.control}
                    name={`options.${i}.content`}
                    render={({ field: f }) => (
                      <MCQEditor value={f.value} onChange={f.onChange} placeholder={`Option ${OPTION_IDS[i]}…`} />
                    )}
                  />
                </div>
              );
            })}

            {form.formState.errors.options && (
              <p className="text-xs text-destructive">{form.formState.errors.options.message as string}</p>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label>Explanation <span className="text-muted-foreground">(optional)</span></Label>
            <Controller
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <MCQEditor value={field.value} onChange={field.onChange} placeholder="Explain the correct answer…" />
              )}
            />
          </div>

          <Separator />

          {/* ── Exam Mapping ──────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <Label>Exam Mapping <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mt-0.5">Select all exams this question appears in.</p>
            </div>

            {allExams && allExams.length > 0 ? (
              <div className="space-y-4">
                {EXAM_CATEGORY_ORDER.filter((cat) => examsByCategory[cat]).map((category) => (
                  <div key={category}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      {EXAM_CATEGORY_LABELS[category]}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {examsByCategory[category].map((exam) => {
                        const selected = selectedExamIds.includes(exam.id);
                        return (
                          <button
                            key={exam.id}
                            type="button"
                            onClick={() => toggleExam(exam.id)}
                            className={cn(
                              'relative rounded-xl border-2 p-2.5 text-left transition-all',
                              selected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            {selected && (
                              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </span>
                            )}
                            <p className="font-medium text-xs pr-5 leading-snug">{exam.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{exam.conductedBy}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exams configured yet.</p>
            )}

            {selectedExamIds.length === 0 && (
              <p className="text-xs text-destructive">At least one exam is required</p>
            )}
          </div>

          {/* ── Per-exam difficulty ───────────────────────────────────────── */}
          {selectedExamIds.length > 0 && (
            <div className="space-y-2">
              <Label>Difficulty per Exam <span className="text-muted-foreground">(optional)</span></Label>
              <p className="text-xs text-muted-foreground">Override difficulty for specific exams.</p>
              <div className="space-y-2">
                {selectedExamIds.map((examId) => {
                  const exam = allExams?.find((e) => e.id === examId);
                  return (
                    <div key={examId} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground flex-1 truncate">{exam?.name ?? examId}</span>
                      <Select
                        value={difficultyPerExam[examId] ?? '__default__'}
                        onValueChange={(val) =>
                          setDifficultyPerExam((prev) => {
                            if (val === '__default__') {
                              const next = { ...prev };
                              delete next[examId];
                              return next;
                            }
                            return { ...prev, [examId]: val as Difficulty };
                          })
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">Default</SelectItem>
                          {DIFFICULTY_OPTIONS.map((d) => (
                            <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Exam Sections ─────────────────────────────────────────────── */}
          {selectedExamIds.length > 0 && examSectionsMap && (
            <div className="space-y-3">
              <Label>Exam Sections <span className="text-muted-foreground">(optional)</span></Label>
              <p className="text-xs text-muted-foreground">Tag this question to specific syllabus sections.</p>
              <div className="space-y-3">
                {selectedExamIds.map((examId) => {
                  const sections = examSectionsMap.get(examId) ?? [];
                  const exam = allExams?.find((e) => e.id === examId);
                  if (sections.length === 0) return null;
                  return (
                    <div key={examId}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{exam?.name}</p>
                      <div className="space-y-1 pl-2">
                        {sections.map((section) => (
                          <div key={section.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`section-${section.id}`}
                              checked={selectedSectionIds.includes(section.id)}
                              onCheckedChange={() => toggleSection(section.id)}
                            />
                            <Label htmlFor={`section-${section.id}`} className="font-normal cursor-pointer text-sm">
                              {section.displayName ?? section.topicId}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Subject & Topic ───────────────────────────────────────────── */}
          <div className="space-y-3">
            <Label>Subject & Topic <span className="text-destructive">*</span></Label>

            {/* Subject select */}
            <Controller
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue('topicId', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />

            {/* Topic tree select */}
            {!watchSubjectId && (
              <p className="text-xs text-muted-foreground">Select a subject to pick a topic.</p>
            )}

            {watchSubjectId && selectedExamIds.length === 0 && (
              <p className="text-xs text-muted-foreground">Select at least one exam above to browse syllabus topics.</p>
            )}

            {watchSubjectId && selectedExamIds.length > 0 && (
              <TopicTreeSelect
                tree={topicTree}
                value={watchTopicId ?? null}
                onChange={(id) => form.setValue('topicId', id ?? '')}
                placeholder={topicTreeLoading ? 'Loading topics…' : 'Select topic'}
                disabled={topicTreeLoading}
                selectableAll
              />
            )}

            {form.formState.errors.topicId && (
              <p className="text-xs text-destructive">{form.formState.errors.topicId.message}</p>
            )}
          </div>

          {/* ── Difficulty + Status ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Difficulty</Label>
              <Controller
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d.charAt(0) + d.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-10">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {form.watch('isActive') ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="isPreviousYear"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isPreviousYear"
                    />
                  )}
                />
                <Label htmlFor="isPreviousYear" className="font-normal cursor-pointer">Previous year question</Label>
              </div>
            </div>
          </div>

          {/* ── Tags ─────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTagIds((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      )
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
              {saveMutation.isPending ? 'Saving…' : mode === 'create' ? 'Create MCQ' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Live Preview Panel */}
      <div className="hidden lg:block">
        <div className="sticky top-4 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Live Preview</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="text-sm font-medium">
              {watchQuestion?.length > 0 ? (
                <ContentBlockRenderer blocks={watchQuestion} />
              ) : (
                <span className="text-muted-foreground italic">Question preview…</span>
              )}
            </div>

            <div className="space-y-2">
              {watchOptions?.map((opt, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3 rounded-lg border p-3 text-sm',
                    opt.isCorrect ? 'border-success bg-success/5' : 'border-border'
                  )}
                >
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    opt.isCorrect ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {OPTION_IDS[i]}
                  </span>
                  <div className="flex-1">
                    {opt.content?.length > 0 ? (
                      <ContentBlockRenderer blocks={opt.content} />
                    ) : (
                      <span className="text-muted-foreground italic">Option {OPTION_IDS[i]}…</span>
                    )}
                  </div>
                  {opt.isCorrect && (
                    <Badge variant="success" className="text-xs self-start">✓ Correct</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
