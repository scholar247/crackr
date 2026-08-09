'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { defaultDashboardPath, type UserRole } from '@/lib/roles';
import { PREP_LEVELS, PREP_LEVEL_LABELS, type PrepLevel } from '@/lib/prep-level';
import { cn } from '@/lib/utils';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const TARGET_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i);

export function OnboardingClient({ name, role, exams }: { name: string; role: UserRole; exams: ExamOption[] }) {
  const { update } = useSession();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR + 1);
  const [level, setLevel] = useState<PrepLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const examsByProgram = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? exams.filter((e) => e.name.toLowerCase().includes(q)) : exams;
    return filtered.reduce<Record<string, ExamOption[]>>((acc, exam) => {
      (acc[exam.programName] ??= []).push(exam);
      return acc;
    }, {});
  }, [exams, search]);

  const selectedExams = selectedIds.map((id) => exams.find((e) => e.id === id)!).filter(Boolean);
  const canSubmit = selectedIds.length > 0 && primaryId !== null && level !== null;

  function toggleExam(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        setPrimaryId((current) => (current === id ? (next[0] ?? null) : current));
        return next;
      }
      setPrimaryId((current) => current ?? id);
      return [...prev, id];
    });
  }

  async function handleContinue() {
    if (!canSubmit || !primaryId || !level) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetYear,
          level,
          primaryExamId: primaryId,
          additionalExamIds: selectedIds.filter((id) => id !== primaryId),
        }),
      });
      if (!res.ok) throw new Error('Failed to complete onboarding');

      // Best-effort only — the JWT's cached onboardingCompleted flag only refreshes via
      // this call or a full re-login, and it can fail silently (seen in practice as a
      // ClientFetchError from next-auth). Its result is never used for the redirect below,
      // and its failure must not surface as an error: the onboarding data is already saved
      // by this point. The dashboard/onboarding-page gates re-check the DB directly instead
      // of trusting this cached value, so a failed refresh here has no effect on correctness.
      update().catch(() => {});

      // Hard navigation, not router.replace(): forces a full reload so every server
      // component (including the dashboard's own fresh DB check) re-runs from scratch.
      window.location.href = defaultDashboardPath(role);
    } catch {
      toast.error('Something went wrong — please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-headline-lg text-foreground">Welcome{name ? `, ${name.split(' ')[0]}` : ''}!</h1>
      <p className="text-body-md mt-1.5 text-muted-foreground">
        Tell us what you&apos;re preparing for so we can curate content for you.
      </p>

      <section className="mt-8">
        <p className="text-label-caps uppercase text-muted-foreground">Which exams are you preparing for?</p>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams…"
            className="pl-9"
          />
        </div>

        <div className="mt-3 max-h-72 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
          {Object.keys(examsByProgram).length === 0 ? (
            <p className="text-body-sm p-2 text-muted-foreground">No exams match your search.</p>
          ) : (
            Object.entries(examsByProgram).map(([programName, programExams]) => (
              <div key={programName}>
                <p className="text-label-caps px-1 uppercase text-muted-foreground">{programName}</p>
                <div className="mt-1.5 space-y-1.5">
                  {programExams.map((exam) => {
                    const selected = selectedIds.includes(exam.id);
                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => toggleExam(exam.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-body-sm transition-colors',
                          selected ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border text-foreground hover:bg-accent'
                        )}
                      >
                        {exam.name}
                        {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {selectedExams.length > 0 && (
        <section className="mt-6">
          <p className="text-label-caps uppercase text-muted-foreground">Mark your primary exam</p>
          <p className="text-body-sm mt-1 text-muted-foreground">
            Your primary exam drives your default dashboard and recommendations; the rest are tracked alongside it.
          </p>
          <div className="mt-2 space-y-1.5">
            {selectedExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-body-sm text-foreground">{exam.name}</span>
                <button
                  type="button"
                  onClick={() => setPrimaryId(exam.id)}
                  className={cn(
                    'text-label-caps rounded-full border px-2.5 py-1 uppercase transition-colors',
                    primaryId === exam.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {primaryId === exam.id ? 'Primary' : 'Set primary'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-label-caps uppercase text-muted-foreground">Target year</p>
          <Select value={String(targetYear)} onValueChange={(v) => setTargetYear(Number(v))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_YEARS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-label-caps uppercase text-muted-foreground">Your level</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PREP_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={cn(
                  'text-body-sm rounded-lg border px-2 py-2 text-center transition-colors',
                  level === l
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:bg-accent'
                )}
              >
                {PREP_LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Button className="mt-8 w-full" size="lg" onClick={handleContinue} disabled={!canSubmit || submitting}>
        {submitting ? 'Setting up…' : 'Continue'}
      </Button>
    </main>
  );
}
