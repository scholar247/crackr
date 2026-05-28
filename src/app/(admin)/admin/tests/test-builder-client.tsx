'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check, ChevronRight, ChevronLeft, Search, Trash2, GripVertical, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentBlockRenderer } from '@/components/mcq/content-block-renderer';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { ExamScopedFilter, EMPTY_FILTER } from '@/components/filters/ExamScopedFilter';
import type { ExamScopedFilterValue } from '@/components/filters/ExamScopedFilter';
import { CreateTestSchema, type CreateTestInput } from '@/schemas';
import type { MCQClient, ExamClient, SubjectClient, TestClient, TopicTreeNode } from '@/types';
import { cn } from '@/lib/utils';

interface TestBuilderClientProps {
  mode: 'create' | 'edit';
  initialData?: TestClient;
}

const STEPS = ['Basic Info', 'Questions', 'Access', 'Settings', 'Publish'];
type Step = 0 | 1 | 2 | 3 | 4;

const CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
];

async function fetchAllExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/exams');
  return (await res.json()).data ?? [];
}

async function fetchSubjectsForExams(examId: string): Promise<SubjectClient[]> {
  if (!examId) return [];
  const res = await fetch(`/api/exams/subjects?examIds=${examId}`);
  return (await res.json()).data ?? [];
}

async function fetchTopicsForExamSubject(examId: string, subjectId: string): Promise<TopicTreeNode[]> {
  const res = await fetch(`/api/exams/${examId}/subjects/${subjectId}/topics`);
  return (await res.json()).data ?? [];
}

async function searchMCQs(params: URLSearchParams) {
  return ((await (await fetch(`/api/admin/mcq?${params}`)).json()).data) as MCQClient[];
}

async function fetchUsers() {
  return ((await (await fetch('/api/admin/users')).json()).data) as { id: string; name: string; email: string }[];
}

async function fetchGroups() {
  return ((await (await fetch('/api/admin/groups')).json()).data) as { id: string; name: string }[];
}

export function TestBuilderClient({ mode, initialData }: TestBuilderClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [selectedMCQIds, setSelectedMCQIds] = useState<string[]>(initialData?.mcqIds ?? []);
  const [accessUserIds, setAccessUserIds] = useState<string[]>(initialData?.allowedUserIds ?? []);
  const [accessGroupIds, setAccessGroupIds] = useState<string[]>(initialData?.allowedGroupIds ?? []);

  // Exam / subject / topic state for step 1 (separate from ExamScopedFilter used in step 2)
  const [selectedExamId, setSelectedExamId] = useState(initialData?.examId ?? '');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Step 2 MCQ filter (pre-filled from step 1 exam)
  const [mcqFilter, setMcqFilter] = useState<ExamScopedFilterValue>({
    ...EMPTY_FILTER,
    examId: initialData?.examId ?? null,
  });
  const [mcqSearch, setMcqSearch] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateTestInput>({
    resolver: zodResolver(CreateTestSchema) as any,
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          examId: initialData.examId,
          subjectIds: initialData.subjectIds ?? [],
          topicIds: initialData.topicIds ?? [],
          tagIds: initialData.tagIds,
          duration: initialData.duration,
          passMark: initialData.passMark,
          totalMarks: initialData.totalMarks,
          accessType: initialData.accessType,
          allowedUserIds: initialData.allowedUserIds,
          allowedGroupIds: initialData.allowedGroupIds,
          mcqIds: initialData.mcqIds,
          shuffleQuestions: initialData.shuffleQuestions,
          shuffleOptions: initialData.shuffleOptions,
          showExplanation: initialData.showExplanation,
          negativeMarking: initialData.negativeMarking,
          negativeMarkValue: initialData.negativeMarkValue,
          status: initialData.status,
        }
      : {
          examId: '',
          subjectIds: [],
          topicIds: [],
          tagIds: [],
          accessType: 'ALL',
          allowedUserIds: [],
          allowedGroupIds: [],
          mcqIds: [],
          shuffleQuestions: false,
          shuffleOptions: false,
          showExplanation: 'AFTER_SUBMIT',
          negativeMarking: false,
          negativeMarkValue: 0,
          totalMarks: 100,
          passMark: 40,
          duration: 60,
          status: 'DRAFT',
        },
  });

  const watchAccessType = form.watch('accessType');
  const watchNegativeMarking = form.watch('negativeMarking');

  // Queries
  const { data: allExams = [] } = useQuery({ queryKey: ['exams-all'], queryFn: fetchAllExams });
  const { data: subjectsForExam, isFetching: subjectsFetching } = useQuery({
    queryKey: ['exam-subjects', selectedExamId],
    queryFn: () => fetchSubjectsForExams(selectedExamId),
    enabled: !!selectedExamId,
    staleTime: 1000 * 60 * 60,
  });

  // MCQ query for step 2
  const mcqParams = useMemo(() => {
    const p = new URLSearchParams({ pageSize: '50', isActive: 'true' });
    if (mcqFilter.examId) p.set('examIds', mcqFilter.examId);
    if (mcqFilter.subjectId && !mcqFilter.topicId) p.set('subjectId', mcqFilter.subjectId);
    if (mcqFilter.topicId) p.set('topicId', mcqFilter.topicId);
    if (mcqFilter.difficulty.length === 1) p.set('difficulty', mcqFilter.difficulty[0]);
    if (mcqFilter.questionType) p.set('questionType', mcqFilter.questionType);
    if (mcqFilter.isPreviousYear) p.set('isPreviousYear', 'true');
    if (mcqSearch) p.set('search', mcqSearch);
    return p;
  }, [mcqFilter, mcqSearch]);

  const { data: mcqResults } = useQuery({
    queryKey: ['mcq-search-builder', mcqParams.toString()],
    queryFn: () => searchMCQs(mcqParams),
    enabled: step === 1,
  });

  const { data: users } = useQuery({ queryKey: ['admin-users-list'], queryFn: fetchUsers, enabled: step === 2 });
  const { data: groups } = useQuery({ queryKey: ['admin-groups'], queryFn: fetchGroups, enabled: step === 2 });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateTestInput) => {
      const url = mode === 'edit' ? `/api/admin/tests/${initialData!.id}` : '/api/admin/tests';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          mcqIds: selectedMCQIds,
          allowedUserIds: accessUserIds,
          allowedGroupIds: accessGroupIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        const fieldErrors: Record<string, string[]> = err.details?.fieldErrors ?? {};
        const fieldMessages = Object.entries(fieldErrors)
          .map(([field, msgs]) => `• ${field}: ${(msgs as string[]).join(', ')}`)
          .join('\n');
        throw Object.assign(new Error(err.error ?? 'Save failed'), { fieldMessages });
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(mode === 'create' ? 'Test created!' : 'Test updated!');
      router.push('/admin/tests');
    },
    onError: (err: Error & { fieldMessages?: string }) => {
      if (err.fieldMessages) {
        toast.error(err.message, { description: err.fieldMessages });
      } else {
        toast.error(err.message);
      }
    },
  });

  const toggleMCQ = (id: string) => {
    setSelectedMCQIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePublish = (status: 'DRAFT' | 'PUBLISHED') => {
    form.setValue('status', status);
    const values = form.getValues();
    saveMutation.mutate({ ...values, status });
  };

  const examsByCategory = allExams.reduce<Record<string, ExamClient[]>>((acc, e) => {
    const cat = e.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  const subjectMap = Object.fromEntries((subjectsForExam ?? []).map((s) => [s.id, s]));

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId);
    form.setValue('examId', examId);
    form.setValue('subjectIds', []);
    form.setValue('topicIds', []);
    setSelectedSubjectId('');
    // Pre-fill step 2 MCQ filter
    setMcqFilter((f) => ({ ...f, examId, subjectId: null, topicId: null }));
  };

  const toggleSubject = (id: string) => {
    const current = form.getValues('subjectIds') ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    form.setValue('subjectIds', next, { shouldValidate: true });
  };

  // Sync mcqFilter with step 2 when user advances
  const handleStepAdvance = () => {
    if (step === 0) {
      setMcqFilter((f) => ({ ...f, examId: selectedExamId || null }));
    }
    setStep((s) => (s + 1) as Step);
  };

  const selectedSubjectIds = form.watch('subjectIds') ?? [];

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <button
              onClick={() => i < step && setStep(i as Step)}
              disabled={i > step}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                i === step ? 'text-primary' :
                i < step ? 'text-success cursor-pointer' :
                'text-muted-foreground cursor-not-allowed'
              )}
            >
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs',
                i === step ? 'border-primary bg-primary text-primary-foreground' :
                i < step ? 'border-success bg-success text-success-foreground' :
                'border-border text-muted-foreground'
              )}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 mx-2 h-px', i < step ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Step 1: Basic Info ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5 max-w-2xl">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input {...form.register('title')} placeholder="Test title…" />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register('description')} placeholder="Optional description…" rows={2} />
          </div>

          {/* Exam — primary gate */}
          <div className="space-y-2">
            <Label>Exam <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground">
              Select an exam to scope subjects and MCQs in this test.
            </p>
            <Select value={selectedExamId} onValueChange={handleExamSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam…" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.filter((c) => examsByCategory[c]).map((category) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </div>
                    {examsByCategory[category].map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject (cascades from exam) */}
          {selectedExamId && (
            <div className="space-y-2">
              <Label>Subject(s) <span className="text-destructive">*</span></Label>
              {subjectsFetching ? (
                <div className="flex gap-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(subjectsForExam ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5',
                        selectedSubjectIds.includes(s.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </button>
                  ))}
                  {(subjectsForExam ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No subjects found for this exam.</p>
                  )}
                </div>
              )}
              {form.formState.errors.subjectIds && (
                <p className="text-xs text-destructive">{form.formState.errors.subjectIds.message}</p>
              )}

              {/* Selected summary */}
              {selectedSubjectIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedSubjectIds.map((id) => {
                    const s = subjectMap[id];
                    return s ? (
                      <Badge key={id} variant="secondary" className="gap-1 pl-2" style={{ borderColor: s.color + '60', backgroundColor: s.color + '20' }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                        <button type="button" onClick={() => toggleSubject(id)} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Duration / Marks / Negative */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (minutes) <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} {...form.register('duration', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Total Marks <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} {...form.register('totalMarks', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Pass Mark</Label>
              <Input type="number" min={0} {...form.register('passMark', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Negative mark / wrong answer</Label>
              <div className="flex items-center gap-3 h-10">
                <Controller
                  control={form.control}
                  name="negativeMarking"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={(v) => {
                      field.onChange(v);
                      if (!v) form.setValue('negativeMarkValue', 0);
                    }} />
                  )}
                />
                {watchNegativeMarking ? (
                  <Input type="number" step="0.25" min={0} placeholder="e.g. 0.25" className="w-28"
                    {...form.register('negativeMarkValue', { valueAsNumber: true })} />
                ) : (
                  <span className="text-xs text-muted-foreground">Off</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Questions ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Exam-scoped filter — pre-filled from step 1 */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Filter Questions</p>
            <ExamScopedFilter
              examSource="all"
              value={mcqFilter}
              onChange={setMcqFilter}
              show={{ exam: true, subject: true, topic: true, difficulty: true, isPreviousYear: true }}
              layout="horizontal"
              showEscapeHatch={false}
            />
            {/* Additional text search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search within filtered MCQs…"
                className="pl-9"
                value={mcqSearch}
                onChange={(e) => setMcqSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-sm text-muted-foreground">{selectedMCQIds.length} selected</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Available */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <div className="rounded-xl border border-border divide-y divide-border max-h-[480px] overflow-y-auto">
                {(mcqResults ?? []).filter((m) => !selectedMCQIds.includes(m.id)).map((mcq) => (
                  <button key={mcq.id} onClick={() => toggleMCQ(mcq.id)}
                    className="w-full text-left p-3 hover:bg-accent transition-colors">
                    <div className="flex items-start gap-2">
                      <DifficultyBadge difficulty={mcq.difficulty} />
                      <div className="text-xs line-clamp-2 flex-1">
                        <ContentBlockRenderer blocks={mcq.question} />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                ))}
                {(mcqResults?.filter((m) => !selectedMCQIds.includes(m.id)).length ?? 0) === 0 && (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    {!mcqFilter.examId ? 'Select an exam to see questions' : 'No matching questions'}
                  </p>
                )}
              </div>
            </div>

            {/* Selected */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Selected</p>
              <div className="rounded-xl border border-border divide-y divide-border max-h-[480px] overflow-y-auto">
                {selectedMCQIds.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground text-center">No questions added yet</p>
                )}
                {selectedMCQIds.map((mcqId, i) => {
                  const mcq = mcqResults?.find((m) => m.id === mcqId);
                  return (
                    <div key={mcqId} className="flex items-center gap-2 p-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                      <div className="flex-1 text-xs line-clamp-1">
                        {mcq ? <ContentBlockRenderer blocks={mcq.question} /> : mcqId}
                      </div>
                      <button onClick={() => toggleMCQ(mcqId)} className="shrink-0">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Access ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5 max-w-xl">
          <div className="space-y-2">
            <Label>Access Type</Label>
            <Controller control={form.control} name="accessType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All users</SelectItem>
                    <SelectItem value="USERS">Specific users</SelectItem>
                    <SelectItem value="GROUPS">Groups</SelectItem>
                  </SelectContent>
                </Select>
              )} />
          </div>

          {watchAccessType === 'USERS' && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl border border-border p-2">
                {users?.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                    <input type="checkbox" checked={accessUserIds.includes(u.id)}
                      onChange={() => setAccessUserIds((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])}
                      className="rounded" />
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {watchAccessType === 'GROUPS' && (
            <div className="space-y-2">
              <Label>Select Groups</Label>
              <div className="flex flex-wrap gap-2">
                {groups?.map((g) => (
                  <button key={g.id}
                    onClick={() => setAccessGroupIds((prev) => prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id])}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      accessGroupIds.includes(g.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary')}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Settings ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5 max-w-xl">
          {(['shuffleQuestions', 'shuffleOptions'] as const).map((name) => (
            <div key={name} className="flex items-center justify-between">
              <Label className="font-normal">
                {name === 'shuffleQuestions' ? 'Shuffle question order' : 'Shuffle answer options'}
              </Label>
              <Controller control={form.control} name={name}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
          ))}

          <div className="space-y-2">
            <Label>Show Explanations</Label>
            <Controller control={form.control} name="showExplanation"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEVER">Never</SelectItem>
                    <SelectItem value="AFTER_SUBMIT">After submission</SelectItem>
                    <SelectItem value="AFTER_DEADLINE">After deadline</SelectItem>
                  </SelectContent>
                </Select>
              )} />
          </div>

          <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-1">
            <p className="text-sm font-medium">Negative Marking</p>
            {watchNegativeMarking ? (
              <p className="text-sm text-muted-foreground">
                Enabled — {form.watch('negativeMarkValue')} mark(s) deducted per wrong answer.
                <button type="button" className="ml-2 text-xs text-primary underline" onClick={() => setStep(0)}>
                  Edit in step 1
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Disabled</p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 5: Publish ────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-5 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date/Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="datetime-local" {...form.register('startAt')} />
            </div>
            <div className="space-y-2">
              <Label>End Date/Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="datetime-local" {...form.register('endAt')} />
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handlePublish('DRAFT')} disabled={saveMutation.isPending}>
              Save as Draft
            </Button>
            <Button onClick={() => handlePublish('PUBLISHED')} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Publish Test'}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleStepAdvance}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
