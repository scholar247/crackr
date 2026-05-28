'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check, Zap, Sprout, TrendingUp, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { ExamClient } from '@/types';
import { cn } from '@/lib/utils';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
];

const CATEGORY_LABELS: Record<string, string> = {
  ENGINEERING: 'Engineering',
  MEDICAL: 'Medical',
  MANAGEMENT: 'Management',
  BANKING: 'Banking',
  GOVERNMENT: 'Government',
  SCHOOL: 'School',
  OTHER: 'Other',
};

async function fetchExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/exams');
  return (await res.json()).data ?? [];
}

// ─── Step components ─────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              i < current
                ? 'bg-primary text-primary-foreground'
                : i === current
                ? 'bg-primary/20 text-primary border-2 border-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn('h-0.5 w-8', i < current ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1 — Exam Selection
function ExamSelectionStep({
  exams,
  selectedIds,
  primaryId,
  onToggle,
  onPrimaryChange,
}: {
  exams: ExamClient[];
  selectedIds: string[];
  primaryId: string;
  onToggle: (id: string) => void;
  onPrimaryChange: (id: string) => void;
}) {
  const byCategory = exams.reduce<Record<string, ExamClient[]>>((acc, e) => {
    const cat = e.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Which exams are you preparing for?</h2>
        <p className="text-muted-foreground mt-1">
          Select all that apply. You can change this anytime in settings.
        </p>
      </div>

      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
        {CATEGORY_ORDER.filter((c) => byCategory[c]).map((category) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {byCategory[category].map((exam) => {
                const isSelected = selectedIds.includes(exam.id);
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => onToggle(exam.id)}
                    className={cn(
                      'relative rounded-xl border-2 p-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                    <p className="font-semibold text-sm pr-5">{exam.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.conductedBy}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedIds.length >= 2 && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-semibold">Which is your primary exam?</p>
          <p className="text-xs text-muted-foreground">This will be your default for practice and quick mocks.</p>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const exam = exams.find((e) => e.id === id);
              if (!exam) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPrimaryChange(id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    primaryId === id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary'
                  )}
                >
                  {exam.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2 — Preparation level
function PreparationLevelStep({
  value,
  targetYear,
  onChange,
  onYearChange,
}: {
  value: string;
  targetYear?: number;
  onChange: (v: string) => void;
  onYearChange: (v: number | undefined) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const LEVELS = [
    {
      id: 'BEGINNER',
      icon: Sprout,
      title: 'Just starting out',
      description: "I'm new to this exam and building my foundation",
    },
    {
      id: 'INTERMEDIATE',
      icon: TrendingUp,
      title: 'Making progress',
      description: "I've studied the basics and am solving practice questions",
    },
    {
      id: 'ADVANCED',
      icon: Zap,
      title: 'Final stretch',
      description: "I'm doing revision and solving full mock tests",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Where are you in your preparation?</h2>
      </div>

      <div className="space-y-3">
        {LEVELS.map(({ id, icon: Icon, title, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'w-full rounded-xl border-2 p-4 text-left transition-all flex items-center gap-4',
              value === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
          >
            <div className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
              value === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {value === id && (
              <Check className="ml-auto h-5 w-5 shrink-0 text-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-medium">
          When are you planning to appear?{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onYearChange(targetYear === year ? undefined : year)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                targetYear === year
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3 — Daily goal + difficulty
function DailyGoalStep({
  questionCount,
  difficulty,
  onCountChange,
  onDifficultyChange,
}: {
  questionCount: number;
  difficulty: string;
  onCountChange: (v: number) => void;
  onDifficultyChange: (v: string) => void;
}) {
  const PRESETS = [10, 20, 50, 100];
  const DIFFICULTIES = [
    { id: 'EASY', label: 'Easy' },
    { id: 'MEDIUM', label: 'Medium' },
    { id: 'HARD', label: 'Hard' },
    { id: 'MIXED', label: 'Mixed', recommended: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set your daily practice goal</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Questions per day</p>
            <Badge variant="outline" className="text-sm font-bold">
              {questionCount} questions
            </Badge>
          </div>
          <Slider
            min={5}
            max={200}
            step={5}
            value={[questionCount]}
            onValueChange={([v]) => onCountChange(v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5</span>
            <span>200</span>
          </div>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onCountChange(p)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  questionCount === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium">
            Start with questions at this difficulty level
          </p>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(({ id, label, recommended }) => (
              <button
                key={id}
                type="button"
                onClick={() => onDifficultyChange(id)}
                className={cn(
                  'relative rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                  difficulty === id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                )}
              >
                {label}
                {recommended && (
                  <span className="absolute -top-2 -right-1 text-[9px] font-bold text-primary bg-primary/10 rounded px-1">
                    Recommended
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

export function OnboardingClient() {
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(0); // 0-indexed

  // Step 1 state
  const [targetExamIds, setTargetExamIds] = useState<string[]>([]);
  const [primaryExamId, setPrimaryExamId] = useState('');

  // Step 2 state
  const [preparationLevel, setPreparationLevel] = useState('BEGINNER');
  const [targetYear, setTargetYear] = useState<number | undefined>();

  // Step 3 state
  const [dailyGoal, setDailyGoal] = useState(20);
  const [difficulty, setDifficulty] = useState('MIXED');

  const { data: exams = [] } = useQuery({ queryKey: ['exams-all'], queryFn: fetchExams });

  const toggleExam = (id: string) => {
    setTargetExamIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // If only 1 selected, auto-set as primary
      if (next.length === 1) setPrimaryExamId(next[0]);
      // If primary was deselected, reset primary
      if (!next.includes(primaryExamId)) setPrimaryExamId(next[0] ?? '');
      return next;
    });
  };

  const stepMutation = useMutation({
    mutationFn: async (stepData: { step: number; data: Record<string, unknown> }) => {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      return res.json();
    },
  });

  const handleNext = async () => {
    if (step === 0) {
      if (!targetExamIds.length) {
        toast.error('Select at least one exam');
        return;
      }
      const resolvedPrimary = primaryExamId || targetExamIds[0];
      if (!resolvedPrimary) return;
      await stepMutation.mutateAsync({
        step: 1,
        data: { targetExamIds, primaryExamId: resolvedPrimary },
      });
      setPrimaryExamId(resolvedPrimary);
      setStep(1);
    } else if (step === 1) {
      await stepMutation.mutateAsync({
        step: 2,
        data: { preparationLevel, targetYear },
      });
      setStep(2);
    } else if (step === 2) {
      await stepMutation.mutateAsync({
        step: 3,
        data: { preferredDifficulty: difficulty, dailyGoalQuestions: dailyGoal },
      });
      // Force JWT token refresh so onboardingCompleted is true before navigating
      await updateSession();
      toast.success('Welcome to crackr! Your profile is ready.');
      window.location.replace('/dashboard');
    }
  };

  const canContinue =
    step === 0 ? targetExamIds.length > 0 && !!primaryExamId
    : step === 1 ? !!preparationLevel
    : true;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">crackr</span>
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center gap-3">
          <StepIndicator current={step} total={3} />
          <p className="text-sm text-muted-foreground">Step {step + 1} of 3</p>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === 0 && (
            <ExamSelectionStep
              exams={exams}
              selectedIds={targetExamIds}
              primaryId={primaryExamId}
              onToggle={toggleExam}
              onPrimaryChange={setPrimaryExamId}
            />
          )}
          {step === 1 && (
            <PreparationLevelStep
              value={preparationLevel}
              targetYear={targetYear}
              onChange={setPreparationLevel}
              onYearChange={setTargetYear}
            />
          )}
          {step === 2 && (
            <DailyGoalStep
              questionCount={dailyGoal}
              difficulty={difficulty}
              onCountChange={setDailyGoal}
              onDifficultyChange={setDifficulty}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0 || stepMutation.isPending}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canContinue || stepMutation.isPending}
          >
            {stepMutation.isPending
              ? 'Saving…'
              : step === 2
              ? 'Get started'
              : 'Continue'}
            {!stepMutation.isPending && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
