'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Flame, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { ContentBlockRenderer } from '@/components/mcq/content-block-renderer';
import { AnswerSelector } from '@/components/mcq/answer-selector';
import { ExamScopedFilter, EMPTY_FILTER } from '@/components/filters/ExamScopedFilter';
import type { ExamScopedFilterValue } from '@/components/filters/ExamScopedFilter';
import { usePracticeStore, getComboInfo } from '@/stores/practice-store';
import type { MCQClient, UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

const BlockMath = dynamic(() => import('react-katex').then(m => m.BlockMath), { ssr: false });

async function fetchMCQs(params: URLSearchParams) {
  const res = await fetch(`/api/mcq?${params}`);
  return res.json();
}

async function fetchProfile(): Promise<UserProfile | null> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function fetchMCQCount(params: URLSearchParams): Promise<number> {
  const p = new URLSearchParams(params);
  const res = await fetch(`/api/mcq/count?${p}`);
  if (!res.ok) return 0;
  return (await res.json()).data?.count ?? 0;
}

// ─── XP Pop overlay ──────────────────────────────────────────────────────────

function XpPop({ xp, key: _key }: { xp: number; key: number }) {
  return (
    <span
      className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-gold animate-xp-pop select-none z-10"
      style={{ color: 'var(--color-gold)' }}
    >
      +{xp} XP
    </span>
  );
}

function ComboBadge({ streak }: { streak: number }) {
  const { tier, label } = getComboInfo(streak);
  if (tier === 0) return null;
  const colors = [
    '',
    'border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    'border-orange-400 text-orange-500 bg-orange-50 dark:bg-orange-950/30',
    'border-red-400 text-red-500 bg-red-50 dark:bg-red-950/30',
  ];
  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold animate-combo-flash', colors[tier])}>
      <Flame className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

// ─── MCQ Card ─────────────────────────────────────────────────────────────────

function MCQCard({ mcq, onClick }: { mcq: MCQClient; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left hover:shadow-md hover:border-primary/30 transition-all space-y-3"
    >
      <div className="flex items-center gap-2">
        <DifficultyBadge difficulty={mcq.difficulty} />
        {mcq.questionType === 'MULTIPLE' && (
          <Badge variant="outline" className="text-xs">Multi</Badge>
        )}
        {mcq.isPreviousYear && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">PYQ</Badge>
        )}
      </div>
      <div className="text-sm line-clamp-3">
        <ContentBlockRenderer blocks={mcq.question} />
      </div>
    </button>
  );
}

// ─── Practice Modal ────────────────────────────────────────────────────────────

function PracticeModal({ mcq, open, onClose }: { mcq: MCQClient; open: boolean; onClose: () => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [xpKey, setXpKey] = useState(0);
  const { recordAnswer } = usePracticeStore();

  const isCorrect = useMemo(() => {
    const correct = mcq.options.filter(o => o.isCorrect).map(o => o.id);
    return (
      submitted &&
      correct.length === selectedIds.length &&
      correct.every(id => selectedIds.includes(id))
    );
  }, [submitted, selectedIds, mcq.options]);

  const handleSubmit = () => {
    setSubmitted(true);
    if (isCorrect) setXpKey(k => k + 1);
    const correct = mcq.options.filter(o => o.isCorrect).map(o => o.id);
    const wasCorrect =
      correct.length === selectedIds.length && correct.every(id => selectedIds.includes(id));
    recordAnswer(wasCorrect);
    fetch(`/api/mcq/${mcq.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedOptionIds: selectedIds, timeTakenSeconds: 0 }),
    }).catch(() => {});
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <DifficultyBadge difficulty={mcq.difficulty} />
            {mcq.questionType === 'MULTIPLE' && (
              <Badge variant="outline" className="text-xs">Select all correct</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="text-sm leading-relaxed">
            <ContentBlockRenderer blocks={mcq.question} />
          </div>

          <AnswerSelector
            options={mcq.options}
            questionType={mcq.questionType}
            selectedIds={selectedIds}
            onSelect={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
            submitted={submitted}
          />

          {submitted && mcq.explanation && mcq.explanation.length > 0 && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-success uppercase tracking-wide">Explanation</p>
              <div className="text-sm">
                <ContentBlockRenderer blocks={mcq.explanation} />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!submitted ? (
              <Button onClick={handleSubmit} className="flex-1" disabled={selectedIds.length === 0}>
                Submit
              </Button>
            ) : (
              <Button onClick={handleClose} className="flex-1">Next Question</Button>
            )}
            <Button variant="outline" onClick={handleClose}>Skip</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Practice Browser ─────────────────────────────────────────────────────────

export function PracticeBrowser() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [activeMCQ, setActiveMCQ] = useState<MCQClient | null>(null);
  const [examSource, setExamSource] = useState<'profile' | 'all'>('profile');
  const { stats } = usePracticeStore();

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  // Initialize filter from query params (for Syllabus deep-links) or profile
  const [filter, setFilter] = useState<ExamScopedFilterValue>(() => ({
    ...EMPTY_FILTER,
    examId: searchParams.get('examId') ?? null,
    topicId: searchParams.get('topicId') ?? null,
    subjectId: searchParams.get('subjectId') ?? null,
  }));

  // Once profile loads, set primary exam if no examId in URL
  useEffect(() => {
    if (profile?.primaryExamId && !filter.examId && !searchParams.get('examId')) {
      setFilter((f) => ({ ...f, examId: profile.primaryExamId }));
    }
  }, [profile?.primaryExamId]);

  // Build MCQ query params from filter
  const mcqParams = useMemo(() => {
    const p = new URLSearchParams({
      page: String(page),
      pageSize: '24',
      isActive: 'true',
    });
    if (filter.examId) p.set('examIds', filter.examId);
    if (filter.subjectId && !filter.topicId) p.set('subjectId', filter.subjectId);
    if (filter.topicId) p.set('topicId', filter.topicId);
    if (filter.difficulty.length === 1) p.set('difficulty', filter.difficulty[0]);
    if (filter.questionType) p.set('questionType', filter.questionType);
    if (filter.isPreviousYear) p.set('isPreviousYear', 'true');
    return p;
  }, [filter, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['mcqs-practice', mcqParams.toString()],
    queryFn: () => fetchMCQs(mcqParams),
  });

  // Count query (debounced via staleTime)
  const { data: countData } = useQuery({
    queryKey: ['mcq-count', mcqParams.toString()],
    queryFn: () => fetchMCQCount(mcqParams),
    staleTime: 3000,
  });

  const mcqs: MCQClient[] = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalCount = countData ?? meta.total ?? 0;
  const hasActivity = (stats.correct + stats.incorrect) > 0;
  const { tier: comboTier, label: comboLabel } = getComboInfo(stats.streak);

  return (
    <div className="space-y-5">
      {/* Session stats bar */}
      {hasActivity && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm"
               style={{ borderColor: 'color-mix(in oklch, var(--color-gold) 40%, transparent)', backgroundColor: 'color-mix(in oklch, var(--color-gold) 10%, transparent)' }}>
            <Star className="h-4 w-4" style={{ color: 'var(--color-gold)' }} />
            <span className="font-bold" style={{ color: 'var(--color-gold)' }}>{stats.xp}</span>
            <span className="text-muted-foreground">XP</span>
          </div>
          <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-sm">
            <span className="font-semibold text-success">{stats.correct}</span>
            <span className="text-muted-foreground ml-1">correct</span>
          </div>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm">
            <span className="font-semibold text-destructive">{stats.incorrect}</span>
            <span className="text-muted-foreground ml-1">incorrect</span>
          </div>
          <div className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm',
            stats.streak >= 5 ? 'border-orange-400/40 bg-orange-50 dark:bg-orange-950/20' : 'border-border')}>
            <Flame className={cn('h-4 w-4',
              stats.streak >= 10 ? 'text-red-500' : stats.streak >= 5 ? 'text-orange-500' :
              stats.streak >= 3 ? 'text-amber-500' : 'text-muted-foreground')} />
            <span className="font-bold">{stats.streak}</span>
            <span className="text-muted-foreground">streak</span>
          </div>
          <div className="rounded-lg border border-border px-3 py-2 text-sm">
            <span className="font-semibold">{stats.sessionAccuracy.toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">accuracy</span>
          </div>
        </div>
      )}

      {/* Exam-scoped filter */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Filters</p>
          {totalCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalCount.toLocaleString()} questions
            </Badge>
          )}
        </div>
        <ExamScopedFilter
          examSource={examSource}
          profile={profile}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
          show={{ exam: true, subject: true, topic: true, difficulty: true, questionType: true, isPreviousYear: true }}
          layout="horizontal"
          showEscapeHatch={true}
          isEscapeHatchActive={examSource === 'all'}
          onEscapeHatch={() => setExamSource('all')}
          onExitEscapeHatch={() => {
            setExamSource('profile');
            setFilter((f) => ({ ...f, examId: profile?.primaryExamId ?? null }));
          }}
        />
      </div>

      {/* MCQ Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : mcqs.length === 0 ? (
        <EmptyState
          icon="search"
          title="No questions found"
          description="Try adjusting your filters or selecting a different topic."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mcqs.map((mcq) => (
            <MCQCard key={mcq.id} mcq={mcq} onClick={() => setActiveMCQ(mcq)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(meta.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{meta.total} questions total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="flex items-center px-3">{page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {activeMCQ && (
        <PracticeModal
          mcq={activeMCQ}
          open={!!activeMCQ}
          onClose={() => setActiveMCQ(null)}
        />
      )}
    </div>
  );
}
