'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreCard } from '@/components/shared/score-card';
import { ContentBlockRenderer } from '@/components/mcq/content-block-renderer';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { Check, X, RefreshCcw } from 'lucide-react';
import type { MockSessionClient, MCQClient } from '@/types';
import { cn } from '@/lib/utils';

interface MockResultsClientProps {
  mock: MockSessionClient;
  mcqs: MCQClient[];
}

export function MockResultsClient({ mock, mcqs }: MockResultsClientProps) {
  const attempt = mock.attempt!;
  const [activeTab, setActiveTab] = useState<'overview' | 'review'>('overview');

  const responseMap = new Map(attempt.responses.map(r => [r.mcqId, r]));

  // Difficulty breakdown
  const diffData = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map(diff => {
    const diffMcqs = mcqs.filter(m => m.difficulty === diff);
    const correct = diffMcqs.filter(m => responseMap.get(m.id)?.isCorrect).length;
    return {
      name: diff.charAt(0) + diff.slice(1).toLowerCase(),
      Correct: correct,
      Incorrect: diffMcqs.length - correct,
    };
  }).filter(d => d.Correct + d.Incorrect > 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mock Results</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(mock.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/mocks">
            <RefreshCcw className="h-4 w-4" />
            New Mock
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review">Question Review</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <ScoreCard
            marksObtained={attempt.marksObtained}
            totalMarks={attempt.totalMarks}
            timeTakenSeconds={attempt.timeTakenSeconds}
          />

          {diffData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-semibold">Difficulty Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={diffData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Correct" fill="oklch(0.696 0.17 162.5)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Incorrect" fill="oklch(0.645 0.246 16.4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4 mt-4">
          {mcqs.map((mcq, i) => {
            const response = responseMap.get(mcq.id);
            const isCorrect = response?.isCorrect;
            const correctIds = mcq.options.filter(o => o.isCorrect).map(o => o.id);

            return (
              <div key={mcq.id} className={cn(
                'rounded-xl border p-5 space-y-4',
                isCorrect ? 'border-success/40 bg-success/5' : response?.selectedOptionIds.length ? 'border-destructive/40 bg-destructive/5' : 'border-border'
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isCorrect ? 'bg-success text-success-foreground' :
                    response?.selectedOptionIds.length ? 'bg-destructive text-destructive-foreground' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {isCorrect ? <Check className="h-4 w-4" /> : response?.selectedOptionIds.length ? <X className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                      <DifficultyBadge difficulty={mcq.difficulty} />
                    </div>
                    <div className="text-sm">
                      <ContentBlockRenderer blocks={mcq.question} />
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 pl-10">
                  {mcq.options.map((opt, j) => {
                    const optLabel = ['A', 'B', 'C', 'D', 'E', 'F'][j];
                    const wasSelected = response?.selectedOptionIds.includes(opt.id);
                    const isOptCorrect = opt.isCorrect;

                    return (
                      <div key={opt.id} className={cn(
                        'flex gap-2 rounded-lg border px-3 py-2 text-sm',
                        isOptCorrect ? 'border-success bg-success/10' :
                        wasSelected ? 'border-destructive bg-destructive/10' :
                        'border-border'
                      )}>
                        <span className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          isOptCorrect ? 'bg-success text-success-foreground' :
                          wasSelected ? 'bg-destructive text-destructive-foreground' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {optLabel}
                        </span>
                        <ContentBlockRenderer blocks={opt.content} />
                        <span className="ml-auto text-xs">
                          {isOptCorrect && <span className="text-success">✓</span>}
                          {wasSelected && !isOptCorrect && <span className="text-destructive">✗</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {mcq.explanation && mcq.explanation.length > 0 && (
                  <div className="pl-10 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Explanation</p>
                    <ContentBlockRenderer blocks={mcq.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
