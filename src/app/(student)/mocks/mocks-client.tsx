'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, Clock, CheckCircle2, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ExamScopedFilter, EMPTY_FILTER } from '@/components/filters/ExamScopedFilter';
import type { ExamScopedFilterValue } from '@/components/filters/ExamScopedFilter';
import type { MockSessionClient, UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

async function fetchProfile(): Promise<UserProfile | null> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function fetchMocks() {
  return ((await (await fetch('/api/mocks')).json()).data) as MockSessionClient[];
}

async function fetchMCQCount(params: URLSearchParams): Promise<number> {
  const res = await fetch(`/api/mcq/count?${params}`);
  if (!res.ok) return 0;
  return (await res.json()).data?.count ?? 0;
}

const TIME_PRESETS = [
  { label: 'No limit', value: 0 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

const QUICK_COUNT_PRESETS = [20, 40, 60];

// ─── Quick Mock Tab ────────────────────────────────────────────────────────────

function QuickMockTab({
  profile,
  onGenerate,
  isPending,
}: {
  profile: UserProfile | null;
  onGenerate: (count: number, duration: number | undefined) => void;
  isPending: boolean;
}) {
  const [count, setCount] = useState(40);
  const [timePreset, setTimePreset] = useState(60);

  const primaryExam = profile?.primaryExamId;

  return (
    <div className="space-y-5 py-2">
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
        <p className="text-sm font-medium">Profile-based generation</p>
        <p className="text-xs text-muted-foreground">
          Questions are selected from your primary exam syllabus, prioritizing weak topics.
        </p>
        {primaryExam && (
          <Badge variant="outline" className="text-xs mt-1">
            Primary exam: {primaryExam}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Questions</Label>
          <Badge variant="outline" className="font-bold">{count}</Badge>
        </div>
        <Slider min={10} max={100} step={10} value={[count]} onValueChange={([v]) => setCount(v)} />
        <div className="flex gap-2">
          {QUICK_COUNT_PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setCount(p)}
              className={cn('rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
                count === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Time limit</Label>
        <div className="flex gap-2">
          {TIME_PRESETS.map(({ label, value }) => (
            <button key={value} type="button" onClick={() => setTimePreset(value)}
              className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                timePreset === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => onGenerate(count, timePreset > 0 ? timePreset : undefined)}
        disabled={isPending || !primaryExam}
      >
        <Zap className="h-4 w-4 mr-2" />
        {isPending ? 'Generating…' : 'Generate Quick Mock'}
      </Button>

      {!primaryExam && (
        <p className="text-xs text-destructive text-center">
          Complete onboarding to set your primary exam first.
        </p>
      )}
    </div>
  );
}

// ─── Custom Mock Tab ────────────────────────────────────────────────────────────

function CustomMockTab({
  profile,
  onGenerate,
  isPending,
}: {
  profile: UserProfile | null;
  onGenerate: (
    filter: ExamScopedFilterValue,
    count: number,
    duration: number | undefined,
    includePreviousYear: boolean,
    useWeightage: boolean
  ) => void;
  isPending: boolean;
}) {
  const [examSource, setExamSource] = useState<'profile' | 'all'>('profile');
  const [filter, setFilter] = useState<ExamScopedFilterValue>({
    ...EMPTY_FILTER,
    examId: profile?.primaryExamId ?? null,
  });
  const [count, setCount] = useState(40);
  const [timePreset, setTimePreset] = useState(60);
  const [includePY, setIncludePY] = useState(false);
  const [useWeightage, setUseWeightage] = useState(false);

  const COUNT_PRESETS = [10, 25, 50, 100];

  // Build count query params
  const countParams = useMemo(() => {
    const p = new URLSearchParams({ isActive: 'true' });
    if (filter.examId) p.set('examIds', filter.examId);
    if (filter.subjectId && !filter.topicId) p.set('subjectId', filter.subjectId);
    if (filter.topicId) p.set('topicId', filter.topicId);
    if (filter.difficulty.length === 1) p.set('difficulty', filter.difficulty[0]);
    if (includePY) p.set('isPreviousYear', 'true');
    return p;
  }, [filter, includePY]);

  const { data: availableCount = 0 } = useQuery({
    queryKey: ['mcq-count-mock', countParams.toString()],
    queryFn: () => fetchMCQCount(countParams),
    staleTime: 3000,
  });

  const isShort = availableCount > 0 && availableCount < count;

  return (
    <div className="space-y-5 py-2">
      <ExamScopedFilter
        examSource={examSource}
        profile={profile}
        value={filter}
        onChange={setFilter}
        show={{ exam: true, subject: true, topic: true, difficulty: true }}
        layout="vertical"
        showEscapeHatch={true}
        isEscapeHatchActive={examSource === 'all'}
        onEscapeHatch={() => setExamSource('all')}
        onExitEscapeHatch={() => {
          setExamSource('profile');
          setFilter((f) => ({ ...f, examId: profile?.primaryExamId ?? null }));
        }}
      />

      <div className="flex items-center justify-between">
        <Label className="font-normal text-sm">Include previous year questions</Label>
        <Switch checked={includePY} onCheckedChange={setIncludePY} />
      </div>

      {filter.examId && (
        <div className="flex items-center justify-between">
          <Label className="font-normal text-sm">Proportional to exam weightage</Label>
          <Switch checked={useWeightage} onCheckedChange={setUseWeightage} />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Number of questions</Label>
          <Badge variant="outline" className="font-bold">{count}</Badge>
        </div>
        <Slider min={10} max={200} step={5} value={[count]} onValueChange={([v]) => setCount(v)} />
        <div className="flex gap-2">
          {COUNT_PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setCount(p)}
              className={cn('rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
                count === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Time limit</Label>
        <div className="flex gap-2">
          {TIME_PRESETS.map(({ label, value }) => (
            <button key={value} type="button" onClick={() => setTimePreset(value)}
              className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                timePreset === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {availableCount > 0 && (
        <div className={cn('rounded-lg border px-3 py-2 text-sm',
          isShort ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                  : 'border-success/30 bg-success/5 text-success')}>
          {isShort
            ? `Only ${availableCount} questions match these filters. Adjust or reduce count.`
            : `${availableCount.toLocaleString()} questions available`}
        </div>
      )}

      <Button
        className="w-full"
        onClick={() => onGenerate(filter, Math.min(count, availableCount || count), timePreset > 0 ? timePreset : undefined, includePY, useWeightage)}
        disabled={isPending || availableCount === 0}
      >
        <Settings2 className="h-4 w-4 mr-2" />
        {isPending ? 'Generating…' : 'Generate Mock'}
      </Button>
    </div>
  );
}

// ─── Main Client ───────────────────────────────────────────────────────────────

export function MocksClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: mocks, isLoading } = useQuery({ queryKey: ['mocks'], queryFn: fetchMocks });

  const generateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/mocks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to generate mock');
      }
      return (await res.json()).data as MockSessionClient;
    },
    onSuccess: (mock) => {
      qc.invalidateQueries({ queryKey: ['mocks'] });
      setShowCreate(false);
      router.push(`/mocks/${mock.id}/take`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleQuickGenerate = (count: number, duration: number | undefined) => {
    generateMutation.mutate({
      filters: {
        examId: profile?.primaryExamId,
        subjectIds: [],
        topicIds: profile?.weakTopicIds?.slice(0, 5) ?? [],
        tagIds: [],
        difficulty: profile?.preferredDifficulty ?? 'MIXED',
        questionCount: count,
        duration,
        includeWeightage: false,
        includePreviousYear: false,
      },
    });
  };

  const handleCustomGenerate = (
    filter: ExamScopedFilterValue,
    count: number,
    duration: number | undefined,
    includePreviousYear: boolean,
    includeWeightage: boolean
  ) => {
    generateMutation.mutate({
      filters: {
        examId: filter.examId ?? undefined,
        subjectIds: filter.subjectId ? [filter.subjectId] : [],
        topicIds: filter.topicId ? [filter.topicId] : [],
        tagIds: filter.tagIds,
        difficulty: filter.difficulty[0] ?? 'MIXED',
        questionCount: count,
        duration,
        includeWeightage,
        includePreviousYear,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="h-4 w-4" />
        Create Mock Test
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (mocks?.length ?? 0) === 0 ? (
        <EmptyState
          icon="test"
          title="No mock tests yet"
          description="Generate your first mock to simulate exam conditions and track your score."
        />
      ) : (
        <div className="space-y-3">
          {mocks?.map((mock) => {
            const completed = !!mock.attempt;
            const pct = completed && mock.attempt
              ? Math.round((mock.attempt.marksObtained / mock.attempt.totalMarks) * 100)
              : null;
            return (
              <div key={mock.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  completed ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary')}>
                  {completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{mock.mcqIds.length} questions</span>
                    {mock.filters.difficulty && mock.filters.difficulty !== 'MIXED' && (
                      <Badge variant="outline" className="text-xs">{mock.filters.difficulty}</Badge>
                    )}
                    {completed && pct !== null && (
                      <Badge variant="outline" className={cn('text-xs', pct >= 60 ? 'border-success text-success' : 'border-destructive text-destructive')}>
                        {pct}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(mock.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
                <Button variant="ghost" size="sm"
                  onClick={() => router.push(completed ? `/mocks/${mock.id}/results` : `/mocks/${mock.id}/take`)}>
                  {completed ? 'Results' : 'Continue'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Mock Test</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="quick">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                Quick Mock
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" />
                Custom Mock
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick">
              <QuickMockTab
                profile={profile ?? null}
                onGenerate={handleQuickGenerate}
                isPending={generateMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="custom">
              <CustomMockTab
                profile={profile ?? null}
                onGenerate={handleCustomGenerate}
                isPending={generateMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
