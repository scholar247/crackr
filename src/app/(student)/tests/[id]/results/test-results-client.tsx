'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreCard } from '@/components/shared/score-card';
import { ContentBlockRenderer } from '@/components/mcq/content-block-renderer';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X } from 'lucide-react';
import type { TestClient, TestAttemptClient, MCQClient } from '@/types';
import { cn } from '@/lib/utils';

interface TestResultsClientProps {
  test: TestClient;
  attempt: TestAttemptClient;
  mcqs: MCQClient[];
  showExplanation: boolean;
}

export function TestResultsClient({
  test,
  attempt,
  mcqs,
  showExplanation,
}: TestResultsClientProps) {
  const responseMap = new Map(attempt.responses.map((r) => [r.mcqId, r]));

  return (
    <Tabs defaultValue="overview">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review">Review Answers</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tests">
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Link>
        </Button>
      </div>

      <TabsContent value="overview">
        <ScoreCard
          marksObtained={attempt.marksObtained}
          totalMarks={attempt.totalMarks}
          timeTakenSeconds={attempt.timeTakenSeconds}
          passMark={test.passMark}
          rank={attempt.rank}
          percentile={attempt.percentile}
        />
      </TabsContent>

      <TabsContent value="review" className="space-y-4 mt-4">
        {mcqs.map((mcq, i) => {
          const response = responseMap.get(mcq.id);
          const isCorrect = response?.isCorrect;
          const wasAttempted = (response?.selectedOptionIds?.length ?? 0) > 0;

          return (
            <div
              key={mcq.id}
              className={cn(
                'rounded-xl border p-5 space-y-4',
                isCorrect
                  ? 'border-success/40 bg-success/5'
                  : wasAttempted
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-border'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isCorrect
                      ? 'bg-success text-success-foreground'
                      : wasAttempted
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCorrect ? (
                    <Check className="h-4 w-4" />
                  ) : wasAttempted ? (
                    <X className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                    <DifficultyBadge difficulty={mcq.difficulty} />
                    {!wasAttempted && (
                      <span className="text-xs text-muted-foreground italic">Not attempted</span>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed">
                    <ContentBlockRenderer blocks={mcq.question} />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pl-10">
                {mcq.options.map((opt, j) => {
                  const label = ['A', 'B', 'C', 'D', 'E', 'F'][j];
                  const wasSelected = response?.selectedOptionIds?.includes(opt.id);
                  const isOptCorrect = opt.isCorrect;

                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        'flex gap-2 rounded-lg border px-3 py-2 text-sm',
                        isOptCorrect
                          ? 'border-success bg-success/10'
                          : wasSelected
                          ? 'border-destructive bg-destructive/10'
                          : 'border-border'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          isOptCorrect
                            ? 'bg-success text-success-foreground'
                            : wasSelected
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {label}
                      </span>
                      <ContentBlockRenderer blocks={opt.content} />
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && mcq.explanation && mcq.explanation.length > 0 && (
                <div className="pl-10 rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wider">
                    Explanation
                  </p>
                  <div className="text-muted-foreground">
                    <ContentBlockRenderer blocks={mcq.explanation} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </TabsContent>
    </Tabs>
  );
}
