'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Flag, ChevronLeft, ChevronRight, Send, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentBlockRenderer } from '@/components/mcq/content-block-renderer';
import { AnswerSelector } from '@/components/mcq/answer-selector';
import { Timer } from './timer';
import { QuestionNavigator } from './question-navigator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { MCQClient } from '@/types';
import type { SubmitAttemptInput } from '@/schemas';
import { cn } from '@/lib/utils';

interface TestTakingUIProps {
  mcqs: MCQClient[];
  startedAt: string;
  durationSeconds?: number; // undefined = untimed
  onSubmit: (data: SubmitAttemptInput) => Promise<void>;
  submitLabel?: string;
}

type QuestionStatus = 'unanswered' | 'answered' | 'review';

export function TestTakingUI({
  mcqs,
  startedAt,
  durationSeconds,
  onSubmit,
  submitLabel = 'Submit Test',
}: TestTakingUIProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questionStartTimes, setQuestionStartTimes] = useState<Map<number, number>>(
    new Map([[0, Date.now()]])
  );
  const [timings, setTimings] = useState<Map<string, number>>(new Map());
  const [showNav, setShowNav] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentMCQ = mcqs[currentIdx];

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const current = next.get(currentMCQ.id) ?? [];
      if (currentMCQ.questionType === 'SINGLE') {
        next.set(currentMCQ.id, [optionId]);
      } else {
        if (current.includes(optionId)) {
          next.set(currentMCQ.id, current.filter((id) => id !== optionId));
        } else {
          next.set(currentMCQ.id, [...current, optionId]);
        }
      }
      return next;
    });
  };

  const navigateTo = (idx: number) => {
    // Record time on current question
    const start = questionStartTimes.get(currentIdx) ?? Date.now();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    setTimings((prev) => {
      const next = new Map(prev);
      next.set(currentMCQ.id, (next.get(currentMCQ.id) ?? 0) + elapsed);
      return next;
    });

    setCurrentIdx(idx);
    setQuestionStartTimes((prev) => new Map(prev).set(idx, Date.now()));
    setShowNav(false);
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  };

  const statuses: QuestionStatus[] = mcqs.map((mcq, i) => {
    if (flagged.has(i)) return 'review';
    if (answers.has(mcq.id) && (answers.get(mcq.id)?.length ?? 0) > 0) return 'answered';
    return 'unanswered';
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    const start = questionStartTimes.get(currentIdx) ?? Date.now();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const finalTimings = new Map(timings);
    finalTimings.set(currentMCQ.id, (finalTimings.get(currentMCQ.id) ?? 0) + elapsed);

    const totalTime = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);

    const payload: SubmitAttemptInput = {
      responses: mcqs.map((mcq) => ({
        mcqId: mcq.id,
        selectedOptionIds: answers.get(mcq.id) ?? [],
        timeTakenSeconds: finalTimings.get(mcq.id) ?? 0,
      })),
      timeTakenSeconds: totalTime,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const answeredCount = [...answers.values()].filter((v) => v.length > 0).length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 bg-background z-10">
        <button
          onClick={() => setShowNav(!showNav)}
          className="md:hidden p-2 rounded-lg hover:bg-accent"
          aria-label="Toggle question navigator"
        >
          {showNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <span className="text-sm font-medium">
          Question {currentIdx + 1} / {mcqs.length}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {answeredCount}/{mcqs.length} answered
          </span>
          {durationSeconds && (
            <Timer
              durationSeconds={durationSeconds}
              startedAt={startedAt}
              onExpire={() => {
                toast.warning('Time is up! Submitting automatically…');
                setShowConfirm(false);
                handleSubmit();
              }}
            />
          )}
          <Button
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:block">{submitLabel}</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Question header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {currentMCQ.questionType === 'MULTIPLE' ? 'Multiple correct' : 'Single correct'}
                </Badge>
              </div>
              <button
                onClick={toggleFlag}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  flagged.has(currentIdx)
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={flagged.has(currentIdx)}
              >
                <Flag className="h-3.5 w-3.5" />
                {flagged.has(currentIdx) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Question content */}
            <div className="text-base leading-relaxed">
              <ContentBlockRenderer blocks={currentMCQ.question} />
            </div>

            {/* Answer options */}
            <AnswerSelector
              options={currentMCQ.options}
              questionType={currentMCQ.questionType}
              selectedIds={answers.get(currentMCQ.id) ?? []}
              onSelect={handleSelect}
            />

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 pb-16 md:pb-4">
              <Button
                variant="outline"
                onClick={() => navigateTo(currentIdx - 1)}
                disabled={currentIdx === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {currentIdx < mcqs.length - 1 ? (
                <Button onClick={() => navigateTo(currentIdx + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setShowConfirm(true)}>
                  <Send className="h-4 w-4" />
                  {submitLabel}
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Desktop navigator sidebar */}
        <aside className="hidden md:flex flex-col w-72 border-l border-border bg-card p-4 overflow-y-auto">
          <QuestionNavigator
            count={mcqs.length}
            currentIndex={currentIdx}
            statuses={statuses}
            onNavigate={navigateTo}
          />
        </aside>
      </div>

      {/* Mobile navigator bottom sheet */}
      {showNav && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Question Navigator</span>
            <button onClick={() => setShowNav(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <QuestionNavigator
            count={mcqs.length}
            currentIndex={currentIdx}
            statuses={statuses}
            onNavigate={navigateTo}
          />
        </div>
      )}

      {/* Submit confirm dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {mcqs.length} questions.
              {mcqs.length - answeredCount > 0 && ` ${mcqs.length - answeredCount} question(s) left unanswered.`}
              {' '}You cannot change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
