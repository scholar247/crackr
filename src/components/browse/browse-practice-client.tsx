'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, Filter, X, LogIn,
  CheckCircle2, XCircle, BookMarked,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { AnswerSelector } from '@/components/mcq/answer-selector';
import { TopicTreeSelect } from '@/components/filters/TopicTreeSelect';
import type { MCQClient, TopicTreeNode, Difficulty } from '@/types';
import { cn } from '@/lib/utils';

const ContentBlockRenderer = dynamic(
  () => import('@/components/mcq/content-block-renderer').then((m) => m.ContentBlockRenderer),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrowsePracticeClientProps {
  subjectId?: string | null;
  examId?: string | null;
  initialTopicTree?: TopicTreeNode[];
  /** For exam mode: list of {id, name} subjects linked to the exam */
  examSubjects?: { id: string; name: string }[];
  isLoggedIn?: boolean;
}

// ─── API fetchers ─────────────────────────────────────────────────────────────

async function fetchMCQs(params: URLSearchParams) {
  const res = await fetch(`/api/public/mcqs?${params}`);
  return res.json();
}

async function fetchMCQCount(params: URLSearchParams): Promise<number> {
  const res = await fetch(`/api/public/mcqs/count?${params}`);
  if (!res.ok) return 0;
  return (await res.json()).data?.count ?? 0;
}

async function fetchTopicTree(subjectId: string, examId?: string | null): Promise<TopicTreeNode[]> {
  if (examId) {
    const res = await fetch(`/api/public/exams/${examId}/subjects/${subjectId}/topics`);
    return (await res.json()).data ?? [];
  }
  const res = await fetch(`/api/public/subjects/${subjectId}/topics?tree=true`);
  return (await res.json()).data ?? [];
}

// ─── MCQ Card ─────────────────────────────────────────────────────────────────

function MCQCard({ mcq, onClick }: { mcq: MCQClient; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left hover:shadow-md hover:border-primary/30 transition-all space-y-3 group"
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
      <div className="text-sm line-clamp-3 text-foreground">
        <ContentBlockRenderer blocks={mcq.question} />
      </div>
      <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
        <span>Solve →</span>
      </div>
    </button>
  );
}

// ─── Practice Modal ────────────────────────────────────────────────────────────

function PracticeModal({
  mcq,
  open,
  onClose,
  isLoggedIn,
}: {
  mcq: MCQClient;
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = useCallback((optionId: string) => {
    if (submitted) return;
    if (mcq.questionType === 'SINGLE') {
      setSelectedIds([optionId]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    }
  }, [mcq.questionType, submitted]);

  const handleSubmit = useCallback(async () => {
    const correct = mcq.options.filter((o) => o.isCorrect).map((o) => o.id);
    const correct_ =
      correct.length === selectedIds.length && correct.every((id) => selectedIds.includes(id));
    setIsCorrect(correct_);
    setSubmitted(true);

    // Fire-and-forget — records attempt if logged in, silently skips if 401
    fetch(`/api/public/mcqs/${mcq.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedOptionIds: selectedIds, timeTakenSeconds: 0 }),
    }).catch(() => {});
  }, [mcq, selectedIds]);

  const handleClose = () => {
    setSelectedIds([]);
    setSubmitted(false);
    setIsCorrect(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <DifficultyBadge difficulty={mcq.difficulty} />
            {mcq.questionType === 'MULTIPLE' && (
              <Badge variant="outline" className="text-xs">Select all correct answers</Badge>
            )}
            {mcq.isPreviousYear && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">PYQ</Badge>
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
            onSelect={handleSelect}
            submitted={submitted}
          />

          {/* Result banner */}
          {submitted && (
            <div className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-sm font-medium',
              isCorrect
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            )}>
              {isCorrect
                ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                : <XCircle className="h-5 w-5 shrink-0" />}
              <span>{isCorrect ? 'Correct! Well done.' : 'Incorrect. Review the explanation below.'}</span>
            </div>
          )}

          {/* Explanation */}
          {submitted && mcq.explanation && mcq.explanation.length > 0 && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-success uppercase tracking-wide">Explanation</p>
              <div className="text-sm">
                <ContentBlockRenderer blocks={mcq.explanation} />
              </div>
            </div>
          )}

          {/* Sign-in nudge for guests */}
          {submitted && !isLoggedIn && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Track your progress</p>
                  <p className="text-xs text-muted-foreground">Sign in free to save results, build streaks & get analytics.</p>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/sign-in">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Sign In
                </Link>
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!submitted ? (
              <Button onClick={handleSubmit} className="flex-1" disabled={selectedIds.length === 0}>
                Submit Answer
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

// ─── Filter Sidebar ────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

function FilterPanel({
  subjectId,
  examId,
  topicId,
  topicTree,
  difficulty,
  questionType,
  isPreviousYear,
  onTopicChange,
  onDifficultyChange,
  onQuestionTypeChange,
  onPreviousYearChange,
  totalCount,
}: {
  subjectId?: string | null;
  examId?: string | null;
  topicId: string | null;
  topicTree: TopicTreeNode[];
  difficulty: string;
  questionType: string;
  isPreviousYear: boolean;
  onTopicChange: (id: string | null) => void;
  onDifficultyChange: (v: string) => void;
  onQuestionTypeChange: (v: string) => void;
  onPreviousYearChange: (v: boolean) => void;
  totalCount: number;
}) {
  const flatTree = useMemo(() => {
    function flatten(nodes: TopicTreeNode[]): TopicTreeNode[] {
      const out: TopicTreeNode[] = [];
      for (const n of nodes) { out.push(n); out.push(...flatten(n.children)); }
      return out;
    }
    return flatten(topicTree);
  }, [topicTree]);

  const selectedTopicNode = topicId ? flatTree.find((n) => n.id === topicId) ?? null : null;

  return (
    <div className="space-y-5">
      {/* Topic picker */}
      {topicTree.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Topic</p>
          <TopicTreeSelect
            tree={topicTree}
            value={topicId}
            onChange={onTopicChange}
            placeholder="All topics"
            selectableAll
            selectedTopic={selectedTopicNode}
          />
          {topicId && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => onTopicChange(null)}
            >
              <X className="h-3 w-3" /> Clear topic
            </button>
          )}
        </div>
      )}

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Difficulty</p>
        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Question type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
        <Select value={questionType} onValueChange={onQuestionTypeChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="SINGLE">Single Correct</SelectItem>
            <SelectItem value="MULTIPLE">Multiple Correct</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Previous year */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Previous Year Only</p>
        <button
          type="button"
          onClick={() => onPreviousYearChange(!isPreviousYear)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
            isPreviousYear ? 'bg-primary' : 'bg-muted'
          )}
          role="switch"
          aria-checked={isPreviousYear}
        >
          <span className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            isPreviousYear ? 'translate-x-4' : 'translate-x-0'
          )} />
        </button>
      </div>

      {/* Total count */}
      {totalCount > 0 && (
        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
          {totalCount.toLocaleString()} question{totalCount !== 1 ? 's' : ''} match
        </p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function BrowsePracticeClient({
  subjectId,
  examId,
  initialTopicTree = [],
  examSubjects = [],
  isLoggedIn = false,
}: BrowsePracticeClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter state (synced with URL)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    subjectId ?? searchParams.get('subject') ?? (examSubjects[0]?.id ?? null)
  );
  const [topicId, setTopicId] = useState<string | null>(searchParams.get('topic') ?? null);
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') ?? 'all');
  const [questionType, setQuestionType] = useState(searchParams.get('type') ?? 'all');
  const [isPreviousYear, setIsPreviousYear] = useState(searchParams.get('pyq') === 'true');
  const [page, setPage] = useState(1);
  const [activeMCQ, setActiveMCQ] = useState<MCQClient | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // In exam mode, fetch topic tree for selected subject within exam
  const effectiveSubjectId = subjectId ?? selectedSubjectId;
  const { data: dynamicTopicTree = [] } = useQuery({
    queryKey: ['public-topic-tree', effectiveSubjectId, examId],
    queryFn: () => fetchTopicTree(effectiveSubjectId!, examId),
    enabled: !!effectiveSubjectId && examSubjects.length > 0, // only in exam mode
    staleTime: 5 * 60 * 1000,
  });

  const topicTree = examSubjects.length > 0 ? dynamicTopicTree : initialTopicTree;

  // Sync URL params
  const updateURL = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v && v !== 'all' && v !== 'false') params.set(k, v);
      else params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleTopicChange = (id: string | null) => {
    setTopicId(id);
    setPage(1);
    updateURL({ topic: id });
  };
  const handleDifficultyChange = (v: string) => {
    setDifficulty(v);
    setPage(1);
    updateURL({ difficulty: v });
  };
  const handleQuestionTypeChange = (v: string) => {
    setQuestionType(v);
    setPage(1);
    updateURL({ type: v });
  };
  const handlePreviousYearChange = (v: boolean) => {
    setIsPreviousYear(v);
    setPage(1);
    updateURL({ pyq: v ? 'true' : null });
  };
  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    setTopicId(null);
    setPage(1);
    updateURL({ subject: id, topic: null });
  };

  // Build MCQ query params
  const mcqParams = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: '24', isActive: 'true' });
    if (examId) p.set('examIds', examId);
    if (effectiveSubjectId && !topicId) p.set('subjectId', effectiveSubjectId);
    if (topicId) p.set('topicId', topicId);
    if (difficulty && difficulty !== 'all') p.set('difficulty', difficulty);
    if (questionType && questionType !== 'all') p.set('questionType', questionType);
    if (isPreviousYear) p.set('isPreviousYear', 'true');
    return p;
  }, [examId, effectiveSubjectId, topicId, difficulty, questionType, isPreviousYear, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['public-mcqs', mcqParams.toString()],
    queryFn: () => fetchMCQs(mcqParams),
    staleTime: 30 * 1000,
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['public-mcq-count', mcqParams.toString()],
    queryFn: () => fetchMCQCount(mcqParams),
    staleTime: 30 * 1000,
  });

  const mcqs: MCQClient[] = data?.data ?? [];
  const meta = data?.meta ?? {};

  const filterPanel = (
    <FilterPanel
      subjectId={effectiveSubjectId}
      examId={examId}
      topicId={topicId}
      topicTree={topicTree}
      difficulty={difficulty}
      questionType={questionType}
      isPreviousYear={isPreviousYear}
      onTopicChange={handleTopicChange}
      onDifficultyChange={handleDifficultyChange}
      onQuestionTypeChange={handleQuestionTypeChange}
      onPreviousYearChange={handlePreviousYearChange}
      totalCount={totalCount}
    />
  );

  return (
    <div className="flex gap-8">
      {/* ── Desktop sidebar filter ─────────────────────────────────────────── */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-1">
          {/* Subject picker in exam mode */}
          {examSubjects.length > 0 && (
            <div className="space-y-2 pb-4 mb-4 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subject</p>
              <div className="space-y-1">
                {examSubjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSubjectChange(s.id)}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2 text-sm transition-colors',
                      selectedSubjectId === s.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {filterPanel}
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Mobile filter trigger */}
        <div className="flex items-center justify-between lg:hidden">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? `${totalCount.toLocaleString()} questions` : ''}
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFilterOpen(true)}>
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>

        {/* Mobile filter dialog */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="max-w-xs sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-1">
              {examSubjects.length > 0 && (
                <div className="space-y-2 pb-4 mb-4 border-b border-border">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subject</p>
                  <div className="space-y-1">
                    {examSubjects.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { handleSubjectChange(s.id); setFilterOpen(false); }}
                        className={cn(
                          'w-full text-left rounded-lg px-3 py-2 text-sm transition-colors',
                          selectedSubjectId === s.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filterPanel}
            </div>
          </DialogContent>
        </Dialog>

        {/* MCQ Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : mcqs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No questions match your filters.</p>
            <button
              type="button"
              className="mt-3 text-sm text-primary hover:underline"
              onClick={() => {
                setTopicId(null);
                setDifficulty('all');
                setQuestionType('all');
                setIsPreviousYear(false);
                setPage(1);
                updateURL({ topic: null, difficulty: null, type: null, pyq: null });
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {mcqs.map((mcq) => (
              <MCQCard key={mcq.id} mcq={mcq} onClick={() => setActiveMCQ(mcq)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {(meta.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Practice modal */}
      {activeMCQ && (
        <PracticeModal
          mcq={activeMCQ}
          open={!!activeMCQ}
          onClose={() => setActiveMCQ(null)}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
