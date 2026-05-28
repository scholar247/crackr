'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TopicTreeSelect } from './TopicTreeSelect';
import type { ExamClient, SubjectClient, TopicTreeNode, UserProfile, Difficulty } from '@/types';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExamScopedFilterValue {
  examId: string | null;
  subjectId: string | null;
  topicId: string | null;
  difficulty: string[];
  questionType: string | null;
  tagIds: string[];
  isPreviousYear: boolean | null;
}

export const EMPTY_FILTER: ExamScopedFilterValue = {
  examId: null,
  subjectId: null,
  topicId: null,
  difficulty: [],
  questionType: null,
  tagIds: [],
  isPreviousYear: null,
};

export interface ExamScopedFilterProps {
  examSource: 'profile' | 'all';
  profile?: UserProfile | null;
  value: ExamScopedFilterValue;
  onChange: (value: ExamScopedFilterValue) => void;
  show?: {
    exam?: boolean;
    subject?: boolean;
    topic?: boolean;
    difficulty?: boolean;
    questionType?: boolean;
    tags?: boolean;
    isPreviousYear?: boolean;
  };
  layout?: 'horizontal' | 'vertical';
  showEscapeHatch?: boolean;
  onEscapeHatch?: () => void;
  /** When true, shows an info banner: "Browsing all exams" with a Back link */
  isEscapeHatchActive?: boolean;
  onExitEscapeHatch?: () => void;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchAllExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/exams');
  return (await res.json()).data ?? [];
}

async function fetchSubjectsForExams(examIds: string[]): Promise<SubjectClient[]> {
  if (!examIds.length) return [];
  const res = await fetch(`/api/exams/subjects?examIds=${examIds.join(',')}`);
  return (await res.json()).data ?? [];
}

async function fetchTopicsForExamSubject(
  examId: string,
  subjectId: string
): Promise<TopicTreeNode[]> {
  const res = await fetch(`/api/exams/${examId}/subjects/${subjectId}/topics`);
  return (await res.json()).data ?? [];
}

const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
];

const CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
];

// ─── Main component ────────────────────────────────────────────────────────────

export function ExamScopedFilter({
  examSource,
  profile,
  value,
  onChange,
  show = {},
  layout = 'horizontal',
  showEscapeHatch = true,
  onEscapeHatch,
  isEscapeHatchActive = false,
  onExitEscapeHatch,
}: ExamScopedFilterProps) {
  const showExam = show.exam !== false;
  const showSubject = show.subject !== false;
  const showTopic = show.topic !== false;
  const showDifficulty = show.difficulty !== false;
  const showQuestionType = show.questionType === true;
  const showTags = show.tags === true;
  const showIsPreviousYear = show.isPreviousYear === true;

  // ── Exam options ───────────────────────────────────────────────────────────
  const { data: allExams } = useQuery({
    queryKey: ['exams-all'],
    queryFn: fetchAllExams,
    staleTime: 1000 * 60 * 60,
    enabled: examSource === 'all' || isEscapeHatchActive,
  });

  // Profile exams: filter allExams to targetExamIds
  const profileExamIds = profile?.targetExamIds ?? [];
  const examOptions: ExamClient[] = examSource === 'profile' && !isEscapeHatchActive
    ? (allExams ?? []).filter((e) => profileExamIds.includes(e.id))
    : (allExams ?? []);

  // Group exams by category for the dropdown
  const examsByCategory = examOptions.reduce<Record<string, ExamClient[]>>((acc, exam) => {
    const cat = exam.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exam);
    return acc;
  }, {});

  // ── Subjects ───────────────────────────────────────────────────────────────
  const { data: subjects, isFetching: subjectsFetching } = useQuery({
    queryKey: ['exam-subjects', value.examId],
    queryFn: () => fetchSubjectsForExams(value.examId ? [value.examId] : []),
    enabled: !!value.examId,
    staleTime: 1000 * 60 * 60,
  });

  // ── Topics ─────────────────────────────────────────────────────────────────
  const { data: topicTree, isFetching: topicsFetching } = useQuery({
    queryKey: ['exam-subject-topics', value.examId, value.subjectId],
    queryFn: () => fetchTopicsForExamSubject(value.examId!, value.subjectId!),
    enabled: !!value.examId && !!value.subjectId,
    staleTime: 1000 * 60 * 60,
  });

  // When examId changes, reset subject + topic
  const handleExamChange = (examId: string | null) => {
    onChange({ ...value, examId, subjectId: null, topicId: null });
  };

  // When subjectId changes, reset topic
  const handleSubjectChange = (subjectId: string | null) => {
    onChange({ ...value, subjectId, topicId: null });
  };

  const handleTopicChange = (topicId: string | null) => {
    onChange({ ...value, topicId });
  };

  const toggleDifficulty = (d: string) => {
    const current = value.difficulty;
    onChange({
      ...value,
      difficulty: current.includes(d) ? current.filter((x) => x !== d) : [...current, d],
    });
  };

  const isHorizontal = layout === 'horizontal';
  const containerClass = isHorizontal
    ? 'flex flex-wrap items-end gap-3'
    : 'flex flex-col gap-4';

  const fieldClass = isHorizontal ? 'min-w-[160px]' : 'w-full';

  return (
    <div className="space-y-3">
      {/* Escape hatch active banner */}
      {isEscapeHatchActive && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 shrink-0" />
          <span>Browsing all exams — not filtered to your profile.</span>
          {onExitEscapeHatch && (
            <button
              type="button"
              onClick={onExitEscapeHatch}
              className="ml-auto text-xs underline hover:no-underline shrink-0"
            >
              Back to my exams
            </button>
          )}
        </div>
      )}

      <div className={containerClass}>
        {/* Exam select */}
        {showExam && (
          <div className={cn('space-y-1', fieldClass, isHorizontal && 'flex-1')}>
            {!isHorizontal && <p className="text-xs font-medium text-muted-foreground">Exam</p>}
            <Select
              value={value.examId ?? '__all__'}
              onValueChange={(v) => handleExamChange(v === '__all__' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All exams</SelectItem>
                {CATEGORY_ORDER.filter((c) => examsByCategory[c]).map((category) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </div>
                    {examsByCategory[category].map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subject select */}
        {showSubject && (
          <div className={cn('space-y-1', fieldClass, isHorizontal && 'flex-1')}>
            {!isHorizontal && <p className="text-xs font-medium text-muted-foreground">Subject</p>}
            {subjectsFetching ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : (
              <Select
                value={value.subjectId ?? '__all__'}
                onValueChange={(v) => handleSubjectChange(v === '__all__' ? null : v)}
                disabled={!value.examId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={value.examId ? 'All subjects' : 'Select exam first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All subjects</SelectItem>
                  {(subjects ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Topic tree select */}
        {showTopic && (
          <div className={cn('space-y-1', fieldClass, isHorizontal && 'flex-1 min-w-[200px]')}>
            {!isHorizontal && <p className="text-xs font-medium text-muted-foreground">Topic</p>}
            {topicsFetching ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : (
              <TopicTreeSelect
                tree={topicTree ?? []}
                value={value.topicId}
                onChange={handleTopicChange}
                placeholder={value.subjectId ? 'All topics' : 'Select subject first'}
                disabled={!value.subjectId}
              />
            )}
          </div>
        )}

        {/* Difficulty pills */}
        {showDifficulty && (
          <div className={cn('space-y-1', fieldClass)}>
            {!isHorizontal && <p className="text-xs font-medium text-muted-foreground">Difficulty</p>}
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTY_OPTIONS.map(({ value: d, label }) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDifficulty(d)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    value.difficulty.includes(d)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question type */}
        {showQuestionType && (
          <div className={cn('space-y-1', fieldClass, isHorizontal && 'w-40')}>
            {!isHorizontal && <p className="text-xs font-medium text-muted-foreground">Type</p>}
            <Select
              value={value.questionType ?? '__all__'}
              onValueChange={(v) => onChange({ ...value, questionType: v === '__all__' ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any type</SelectItem>
                <SelectItem value="SINGLE">Single answer</SelectItem>
                <SelectItem value="MULTIPLE">Multiple answers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Previous year toggle */}
        {showIsPreviousYear && (
          <div className={cn('flex items-center gap-2', isHorizontal ? 'mt-auto pb-0.5' : '')}>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  isPreviousYear: value.isPreviousYear === true ? null : true,
                })
              }
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                value.isPreviousYear
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary'
              )}
            >
              Previous Year Only
            </button>
          </div>
        )}
      </div>

      {/* Escape hatch */}
      {showEscapeHatch && examSource === 'profile' && !isEscapeHatchActive && onEscapeHatch && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Looking for a different exam?</span>
          <button
            type="button"
            onClick={onEscapeHatch}
            className="text-xs text-primary underline hover:no-underline"
          >
            Browse all exams →
          </button>
        </div>
      )}
    </div>
  );
}
