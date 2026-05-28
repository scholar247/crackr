'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, Filter,
  CheckCircle2, XCircle, BookMarked, LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { AnswerSelector } from '@/components/mcq/answer-selector';
import type { MCQClient } from '@/types';
import { cn } from '@/lib/utils';

const ContentBlockRenderer = dynamic(
  () => import('@/components/mcq/content-block-renderer').then((m) => m.ContentBlockRenderer),
  { ssr: false }
);

interface PYPPracticeClientProps {
  pypId: string;
  examId: string;
  isLoggedIn?: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

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
      </div>
      <div className="text-sm line-clamp-3 text-foreground">
        <ContentBlockRenderer blocks={mcq.question} />
      </div>
      <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
        Solve →
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
            onSelect={handleSelect}
            submitted={submitted}
          />

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

          {submitted && mcq.explanation && mcq.explanation.length > 0 && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-success uppercase tracking-wide">Explanation</p>
              <div className="text-sm">
                <ContentBlockRenderer blocks={mcq.explanation} />
              </div>
            </div>
          )}

          {submitted && !isLoggedIn && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Track your progress</p>
                  <p className="text-xs text-muted-foreground">Sign in free to save results and build streaks.</p>
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

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  difficulty,
  questionType,
  totalCount,
  onDifficultyChange,
  onQuestionTypeChange,
}: {
  difficulty: string;
  questionType: string;
  totalCount: number;
  onDifficultyChange: (v: string) => void;
  onQuestionTypeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
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

      {totalCount > 0 && (
        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
          {totalCount.toLocaleString()} question{totalCount !== 1 ? 's' : ''} match
        </p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PYPPracticeClient({ pypId, isLoggedIn = false }: PYPPracticeClientProps) {
  const [difficulty, setDifficulty] = useState('all');
  const [questionType, setQuestionType] = useState('all');
  const [page, setPage] = useState(1);
  const [activeMCQ, setActiveMCQ] = useState<MCQClient | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const mcqParams = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: '24', isActive: 'true', pypId });
    if (difficulty && difficulty !== 'all') p.set('difficulty', difficulty);
    if (questionType && questionType !== 'all') p.set('questionType', questionType);
    return p;
  }, [pypId, difficulty, questionType, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['pyp-mcqs', mcqParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/public/mcqs?${mcqParams}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const mcqs: MCQClient[] = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalCount: number = meta.total ?? 0;

  const handleDifficultyChange = (v: string) => { setDifficulty(v); setPage(1); };
  const handleQuestionTypeChange = (v: string) => { setQuestionType(v); setPage(1); };

  const filterPanel = (
    <FilterPanel
      difficulty={difficulty}
      questionType={questionType}
      totalCount={totalCount}
      onDifficultyChange={handleDifficultyChange}
      onQuestionTypeChange={handleQuestionTypeChange}
    />
  );

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
          {filterPanel}
        </div>
      </aside>

      {/* Main */}
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

        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="max-w-xs sm:max-w-sm">
            <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
            <div className="mt-2">{filterPanel}</div>
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
            <p className="text-muted-foreground">
              {totalCount === 0 && difficulty === 'all' && questionType === 'all'
                ? 'No questions have been added to this paper yet.'
                : 'No questions match your filters.'}
            </p>
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
