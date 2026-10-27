'use client';

import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogContent } from '@/components/blog/blog-content';
import { InlineMarkdown } from '@/components/questions/inline-markdown';
import { DIFFICULTY_COLORS, cn } from '@/lib/utils';

export interface ReviewOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

export interface ReviewQuestion {
  questionId: number;
  stem: string;
  difficulty: string;
  explanation?: string | null;
  selectedOptionKeys?: string[] | null;
  isCorrect?: boolean | null;
  options: ReviewOption[];
}

type ReviewFilter = 'all' | 'correct' | 'wrong' | 'unattempted';

function matchesFilter(q: ReviewQuestion, filter: ReviewFilter): boolean {
  const attempted = Boolean(q.selectedOptionKeys?.[0]);
  if (filter === 'all') return true;
  if (filter === 'correct') return attempted && q.isCorrect === true;
  if (filter === 'wrong') return attempted && q.isCorrect === false;
  return !attempted;
}

// Shared review renderer for a submitted attempt's question-by-question breakdown — used
// by both the self-results page and the organizer's per-student report, so the "answer vs
// correct answer vs explanation" UI only exists once.
export function AttemptReview({ questions }: { questions: ReviewQuestion[] }) {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const counts = useMemo(
    () => ({
      all: questions.length,
      correct: questions.filter((q) => matchesFilter(q, 'correct')).length,
      wrong: questions.filter((q) => matchesFilter(q, 'wrong')).length,
      unattempted: questions.filter((q) => matchesFilter(q, 'unattempted')).length,
    }),
    [questions],
  );

  const filtered = useMemo(() => questions.filter((q) => matchesFilter(q, filter)), [questions, filter]);

  return (
    <div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as ReviewFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="correct">Correct ({counts.correct})</TabsTrigger>
          <TabsTrigger value="wrong">Wrong ({counts.wrong})</TabsTrigger>
          <TabsTrigger value="unattempted">Unattempted ({counts.unattempted})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No questions in this filter.</p>
      ) : (
        <Accordion type="single" collapsible className="mt-3">
          {filtered.map((q) => {
            const originalIndex = questions.indexOf(q);
            const selected = q.selectedOptionKeys?.[0];
            return (
              <AccordionItem key={q.questionId} value={String(q.questionId)}>
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">{originalIndex + 1}</span>
                    <span className="text-left">{!selected ? 'Not attempted' : q.isCorrect ? 'Correct' : 'Incorrect'}</span>
                    <Badge className={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <BlogContent content={q.stem} />
                  <div className="mt-3 space-y-2">
                    {q.options.map((option) => {
                      const isCorrectOption = option.isCorrect;
                      const isSelectedOption = selected === option.key;
                      return (
                        <div
                          key={option.key}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm',
                            isCorrectOption && 'border-emerald-500/50 bg-emerald-500/10',
                            isSelectedOption && !isCorrectOption && 'border-destructive/50 bg-destructive/10',
                            !isCorrectOption && !isSelectedOption && 'border-border',
                          )}
                        >
                          <span className="font-mono text-xs text-muted-foreground">{option.key}</span>
                          <InlineMarkdown content={option.text} className="flex-1 text-foreground" />
                          {isCorrectOption && <Check className="h-4 w-4 text-emerald-600" />}
                          {isSelectedOption && !isCorrectOption && <X className="h-4 w-4 text-destructive" />}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                      <BlogContent content={q.explanation} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
