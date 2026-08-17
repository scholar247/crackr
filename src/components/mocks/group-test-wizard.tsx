'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionBuilder, emptySection, type SectionDraft } from '@/components/mocks/section-builder';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

interface AudienceOption {
  id: string;
  name: string;
}

const STEPS = ['Exam', 'Sections', 'Invite', 'Schedule'] as const;

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
}

export function GroupTestWizard({
  examOptions,
  audienceOptions,
  canAssignByGroup,
}: {
  examOptions: ExamOption[];
  audienceOptions: AudienceOption[];
  canAssignByGroup: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examId, setExamId] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([emptySection()]);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState<string>('1');
  const [emailsRaw, setEmailsRaw] = useState('');
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
  const [schedulingMode, setSchedulingMode] = useState<'FIXED' | 'FLEXIBLE'>('FLEXIBLE');
  const [startsAt, setStartsAt] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [endsAt, setEndsAt] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [submitting, setSubmitting] = useState(false);

  const examsByProgram = useMemo(() => {
    return examOptions.reduce<Record<string, ExamOption[]>>((acc, exam) => {
      (acc[exam.programName] ??= []).push(exam);
      return acc;
    }, {});
  }, [examOptions]);

  const selectedExam = examOptions.find((e) => e.id === examId);
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  const emails = useMemo(() => parseEmails(emailsRaw), [emailsRaw]);

  const canContinueStep0 = Boolean(examId);
  const canContinueStep1 =
    sections.length >= ASSESSMENT_LIMITS.MIN_SECTIONS &&
    sections.every((s) => s.title.trim() && s.questionCount >= 1) &&
    totalQuestions >= ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS &&
    totalQuestions <= ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS;
  const canContinueStep2 = emails.length + selectedAudienceIds.length > 0;

  function toggleAudience(id: string) {
    setSelectedAudienceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreate() {
    if (!title.trim()) return toast.error('Give this test a title.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/assessments/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          examId,
          durationMinutes,
          maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
          schedulingMode,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          emails,
          audienceIds: selectedAudienceIds,
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
      if (!res.ok) throw new Error(json.error ?? 'Could not create test');
      const report = json.data.inviteReport;
      toast.success(`Test created — ${report.matched} invited directly, ${report.pending} pending signup`);
      router.push(`/mocks/${json.data.assessment.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
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
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {step === 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <Label htmlFor="group-wizard-exam">Which exam is this test for?</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="group-wizard-exam" className="mt-2">
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
              <Label htmlFor="group-wizard-emails">Invite by email</Label>
              <p className="mt-1 text-xs text-muted-foreground">One per line or comma-separated. People without an account yet will be invited automatically once they sign up.</p>
              <Textarea
                id="group-wizard-emails"
                className="mt-2"
                rows={5}
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                placeholder="alice@example.com, bob@example.com"
              />
              {emailsRaw.trim() && <p className="mt-1.5 text-xs text-muted-foreground">{emails.length} valid email{emails.length !== 1 ? 's' : ''} recognized.</p>}
            </div>

            {canAssignByGroup && (
              <div className="rounded-xl border border-border bg-card p-5">
                <Label>Invite an existing group</Label>
                {audienceOptions.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No groups yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {audienceOptions.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox checked={selectedAudienceIds.includes(a.id)} onCheckedChange={() => toggleAudience(a.id)} />
                        {a.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <Label htmlFor="group-wizard-title">Title</Label>
              <Input id="group-wizard-title" className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${selectedExam?.name ?? ''} Group Test`} />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="group-wizard-duration">Duration per person (minutes)</Label>
                  <Input
                    id="group-wizard-duration"
                    className="mt-1.5"
                    type="number"
                    min={ASSESSMENT_LIMITS.MIN_DURATION_MINUTES}
                    max={ASSESSMENT_LIMITS.MAX_DURATION_MINUTES}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="group-wizard-max-attempts">Max attempts</Label>
                  <Input
                    id="group-wizard-max-attempts"
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={ASSESSMENT_LIMITS.MAX_ATTEMPTS_CAP}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <Label>Scheduling</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSchedulingMode('FIXED')}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${schedulingMode === 'FIXED' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}`}
                >
                  <p className="font-medium text-foreground">Fixed time for everyone</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Everyone starts at the exact same moment.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSchedulingMode('FLEXIBLE')}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${schedulingMode === 'FLEXIBLE' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}`}
                >
                  <p className="font-medium text-foreground">Flexible window</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Each person can start any time within the window.</p>
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="group-wizard-starts-at">{schedulingMode === 'FIXED' ? 'Starts at' : 'Window opens'}</Label>
                  <Input id="group-wizard-starts-at" className="mt-1.5" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="group-wizard-ends-at">{schedulingMode === 'FIXED' ? 'Ends at' : 'Window closes'}</Label>
                  <Input id="group-wizard-ends-at" className="mt-1.5" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
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
                <li>
                  {emails.length} email{emails.length !== 1 ? 's' : ''}
                  {canAssignByGroup && ` + ${selectedAudienceIds.length} group${selectedAudienceIds.length !== 1 ? 's' : ''}`} invited
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 ? !canContinueStep0 : step === 1 ? !canContinueStep1 : !canContinueStep2}
          >
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleCreate} disabled={submitting}>
            <Sparkles className="h-4 w-4" /> {submitting ? 'Creating…' : 'Create test'}
          </Button>
        )}
      </div>
    </div>
  );
}
