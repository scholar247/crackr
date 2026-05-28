'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ExamClient, UserProfile } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
];

const CATEGORY_LABELS: Record<string, string> = {
  ENGINEERING: 'Engineering', MEDICAL: 'Medical', MANAGEMENT: 'Management',
  BANKING: 'Banking', GOVERNMENT: 'Government', SCHOOL: 'School', OTHER: 'Other',
};

const PREP_LEVELS = [
  { id: 'BEGINNER', label: 'Beginner', description: 'Building foundation' },
  { id: 'INTERMEDIATE', label: 'Intermediate', description: 'Solving practice questions' },
  { id: 'ADVANCED', label: 'Advanced', description: 'Revision & mock tests' },
];

const DIFFICULTIES = [
  { id: 'EASY', label: 'Easy' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HARD', label: 'Hard' },
  { id: 'MIXED', label: 'Mixed' },
];

async function fetchProfile(): Promise<UserProfile | null> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function fetchAllExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/exams');
  return (await res.json()).data ?? [];
}

export function SettingsClient() {
  const { data: profile, refetch } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: allExams = [] } = useQuery({ queryKey: ['exams-all'], queryFn: fetchAllExams });

  const [targetExamIds, setTargetExamIds] = useState<string[]>([]);
  const [primaryExamId, setPrimaryExamId] = useState('');
  const [preparationLevel, setPreparationLevel] = useState('BEGINNER');
  const [targetYear, setTargetYear] = useState<number | undefined>();
  const [preferredDifficulty, setPreferredDifficulty] = useState('MIXED');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [examChanged, setExamChanged] = useState(false);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setTargetExamIds(profile.targetExamIds ?? []);
      setPrimaryExamId(profile.primaryExamId ?? '');
      setPreparationLevel(profile.preparationLevel ?? 'BEGINNER');
      setTargetYear(profile.targetYear);
      setPreferredDifficulty(profile.preferredDifficulty ?? 'MIXED');
      setDailyGoal(profile.dailyGoalQuestions ?? 20);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        targetExamIds,
        primaryExamId: primaryExamId || targetExamIds[0],
        preparationLevel,
        targetYear,
        preferredDifficulty,
        dailyGoalQuestions: dailyGoal,
      };
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Profile updated');
      refetch();
      setExamChanged(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleExam = (id: string) => {
    const wasIn = targetExamIds.includes(id);
    const next = wasIn ? targetExamIds.filter((x) => x !== id) : [...targetExamIds, id];
    setTargetExamIds(next);
    if (wasIn && primaryExamId === id) setPrimaryExamId(next[0] ?? '');
    if (next.length === 1) setPrimaryExamId(next[0]);
    setExamChanged(true);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const examsByCategory = allExams.reduce<Record<string, ExamClient[]>>((acc, e) => {
    const cat = e.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Exam selection */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Target Exams</h2>
          <p className="text-sm text-muted-foreground">Select all the exams you are preparing for.</p>
        </div>

        {examChanged && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0" />
            Your exam selection changed — save to update practice and mock pages.
          </div>
        )}

        <div className="space-y-5">
          {CATEGORY_ORDER.filter((c) => examsByCategory[c]).map((category) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {CATEGORY_LABELS[category]}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {examsByCategory[category].map((exam) => {
                  const selected = targetExamIds.includes(exam.id);
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => toggleExam(exam.id)}
                      className={cn(
                        'relative rounded-xl border-2 p-3 text-left transition-all',
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                      <p className="font-medium text-sm pr-5">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.conductedBy}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {targetExamIds.length >= 2 && (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Primary Exam</p>
            <div className="flex flex-wrap gap-2">
              {targetExamIds.map((id) => {
                const exam = allExams.find((e) => e.id === id);
                if (!exam) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPrimaryExamId(id)}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                      primaryExamId === id
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
      </section>

      <Separator />

      {/* Preparation level */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Preparation Level</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {PREP_LEVELS.map(({ id, label, description }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreparationLevel(id)}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                preparationLevel === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              {preparationLevel === id && <Check className="h-4 w-4 text-primary mt-2" />}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Target year */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Target Year <span className="font-normal text-muted-foreground text-base">(optional)</span></h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTargetYear(undefined)}
            className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
              !targetYear ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
          >
            Not set
          </button>
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setTargetYear(targetYear === year ? undefined : year)}
              className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                targetYear === year ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
            >
              {year}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Preferences */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Practice Preferences</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Daily question goal</p>
            <Badge variant="outline" className="font-bold">{dailyGoal} questions</Badge>
          </div>
          <Slider min={5} max={200} step={5} value={[dailyGoal]} onValueChange={([v]) => setDailyGoal(v)} />
          <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>200</span></div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Preferred difficulty</p>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreferredDifficulty(id)}
                className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                  preferredDifficulty === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-2">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || targetExamIds.length === 0}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save all changes'}
        </Button>
      </div>
    </div>
  );
}
