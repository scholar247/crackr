'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionBuilder, emptySection, type SectionDraft } from '@/components/mocks/section-builder';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

const STEPS = ['Exam', 'Sections', 'Review'] as const;

export function SelfMockWizard({ examOptions }: { examOptions: ExamOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examId, setExamId] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([emptySection()]);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const examsByProgram = useMemo(() => {
    return examOptions.reduce<Record<string, ExamOption[]>>((acc, exam) => {
      (acc[exam.programName] ??= []).push(exam);
      return acc;
    }, {});
  }, [examOptions]);

  const selectedExam = examOptions.find((e) => e.id === examId);
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);

  const canContinueStep0 = Boolean(examId);
  const canContinueStep1 =
    sections.length >= ASSESSMENT_LIMITS.MIN_SECTIONS &&
    sections.every((s) => s.title.trim() && s.questionCount >= 1) &&
    totalQuestions >= ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS &&
    totalQuestions <= ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS;

  async function handleCreate() {
    if (!title.trim()) return toast.error('Give this mock a title.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/assessments/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          examId,
          durationMinutes,
          maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
          sections: sections.map((s) => ({
            title: s.title,
            nodeId: s.nodeId,
            questionCount: s.questionCount,
            difficulty: s.difficulty === 'ANY' ? undefined : s.difficulty,
            marks: s.marks,
            negativeMarks: s.negativeMarks,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not create mock');
      toast.success('Mock created');
      router.push(`/mocks/${json.data.assessment.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${i === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {step === 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <Label htmlFor="wizard-exam">Which exam is this mock for?</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="wizard-exam" className="mt-2">
                <SelectValue placeholder="Select an exam…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(examsByProgram).map(([programName, exams]) => (
                  <SelectGroup key={programName}>
                    <SelectLabel>{programName}</SelectLabel>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 1 && <SectionBuilder examId={examId} sections={sections} onChange={setSections} />}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <Label htmlFor="wizard-title">Title</Label>
              <Input id="wizard-title" className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${selectedExam?.name ?? ''} Mock`} />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="wizard-duration">Duration (minutes)</Label>
                  <Input
                    id="wizard-duration"
                    className="mt-1.5"
                    type="number"
                    min={ASSESSMENT_LIMITS.MIN_DURATION_MINUTES}
                    max={ASSESSMENT_LIMITS.MAX_DURATION_MINUTES}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="wizard-max-attempts">Max attempts (optional, blank = unlimited)</Label>
                  <Input
                    id="wizard-max-attempts"
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={ASSESSMENT_LIMITS.MAX_ATTEMPTS_CAP}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <p className="text-sm font-semibold text-foreground">Summary</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Exam: {selectedExam?.name}</li>
                <li>
                  {sections.length} section{sections.length !== 1 ? 's' : ''}, {totalQuestions} questions total
                </li>
                <li>{durationMinutes} minutes</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < 2 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === 0 ? !canContinueStep0 : !canContinueStep1}>
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleCreate} disabled={submitting}>
            <Sparkles className="h-4 w-4" /> {submitting ? 'Creating…' : 'Create mock'}
          </Button>
        )}
      </div>
    </div>
  );
}
