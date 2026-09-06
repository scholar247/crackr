'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Globe2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from '@/components/mocks/tag-input';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

const DIFFICULTIES = [
  { value: 'ANY', label: 'Mixed' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXPERT', label: 'Expert' },
] as const;

// No section builder here on purpose — an open mock always covers every subject of the
// exam (built server-side from the exam's syllabus tree, see createOpenMock). The only
// per-question choices left to the creator are uniform across all of them.
export function OpenMockForm({ examOptions }: { examOptions: ExamOption[] }) {
  const router = useRouter();
  const [examId, setExamId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentInstructions, setStudentInstructions] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [bannerImage, setBannerImage] = useState('');
  const [questionsPerSubject, setQuestionsPerSubject] = useState(10);
  const [marksPerQuestion, setMarksPerQuestion] = useState(4);
  const [negativeMarksPerQuestion, setNegativeMarksPerQuestion] = useState(1);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]['value']>('ANY');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [maxAttempts, setMaxAttempts] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const examsByProgram = useMemo(() => {
    return examOptions.reduce<Record<string, ExamOption[]>>((acc, exam) => {
      (acc[exam.programName] ??= []).push(exam);
      return acc;
    }, {});
  }, [examOptions]);

  const selectedExam = examOptions.find((e) => e.id === examId);
  const canSubmit = Boolean(examId) && title.trim().length >= 3;

  async function handleCreate() {
    if (!examId) return toast.error('Pick an exam first.');
    if (!title.trim()) return toast.error('Give this mock a title.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/assessments/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
          studentInstructions: studentInstructions.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          bannerImage: bannerImage.trim() || undefined,
          examId,
          questionsPerSubject,
          marksPerQuestion,
          negativeMarksPerQuestion,
          difficulty: difficulty === 'ANY' ? undefined : difficulty,
          durationMinutes,
          maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not create mock');
      toast.success('Open mock published');
      router.push(`/mocks/${json.data.assessment.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid max-w-4xl gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <Label htmlFor="open-mock-exam">Which exam is this for?</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger id="open-mock-exam" className="mt-2">
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
          <p className="mt-2 text-xs text-muted-foreground">
            Covers every subject in {selectedExam?.name ?? 'this exam'}&apos;s syllabus automatically — there&apos;s no
            per-subject picker for an open mock.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Assessment metadata</p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="open-mock-title">Title</Label>
              <Input
                id="open-mock-title"
                className="mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${selectedExam?.name ?? ''} Full Mock`}
              />
            </div>
            <div>
              <Label htmlFor="open-mock-description">Description</Label>
              <Textarea
                id="open-mock-description"
                className="mt-1.5"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this mock…"
              />
            </div>
            <div>
              <Label htmlFor="open-mock-instructions">Student instructions</Label>
              <Textarea
                id="open-mock-instructions"
                className="mt-1.5"
                rows={3}
                value={studentInstructions}
                onChange={(e) => setStudentInstructions(e.target.value)}
                placeholder="Enter instructions shown to students before starting…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TagInput tags={tags} onChange={setTags} />
              <div>
                <Label htmlFor="open-mock-banner">Banner image URL</Label>
                <Input
                  id="open-mock-banner"
                  className="mt-1.5"
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Per-subject question settings</p>
          <p className="mt-1 text-xs text-muted-foreground">Applied uniformly to every subject section.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="open-mock-qcount">Questions per subject</Label>
              <Input
                id="open-mock-qcount"
                className="mt-1.5"
                type="number"
                min={ASSESSMENT_LIMITS.MIN_QUESTIONS_PER_SECTION}
                max={ASSESSMENT_LIMITS.MAX_QUESTIONS_PER_SECTION}
                value={questionsPerSubject}
                onChange={(e) => setQuestionsPerSubject(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="open-mock-difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger id="open-mock-difficulty" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="open-mock-marks">Marks per correct answer</Label>
              <Input
                id="open-mock-marks"
                className="mt-1.5"
                type="number"
                min={0}
                max={ASSESSMENT_LIMITS.MAX_MARKS}
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="open-mock-negative">Negative marks per wrong answer</Label>
              <Input
                id="open-mock-negative"
                className="mt-1.5"
                type="number"
                min={0}
                max={ASSESSMENT_LIMITS.MAX_MARKS}
                value={negativeMarksPerQuestion}
                onChange={(e) => setNegativeMarksPerQuestion(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Timing</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="open-mock-duration">Duration (minutes)</Label>
              <Input
                id="open-mock-duration"
                className="mt-1.5"
                type="number"
                min={ASSESSMENT_LIMITS.MIN_DURATION_MINUTES}
                max={ASSESSMENT_LIMITS.MAX_DURATION_MINUTES}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="open-mock-max-attempts">Max attempts per student (optional, blank = unlimited)</Label>
              <Input
                id="open-mock-max-attempts"
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

        <Button type="button" onClick={handleCreate} disabled={submitting || !canSubmit}>
          <Sparkles className="h-4 w-4" /> {submitting ? 'Publishing…' : 'Publish open mock'}
        </Button>
      </div>

      <div className="lg:col-span-4">
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Globe2 className="h-4 w-4 text-primary" /> Who can take this
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open to any student who has <span className="font-medium text-foreground">{selectedExam?.name ?? 'this exam'}</span> in
            their target exams — not the whole platform, and not a hand-picked invite list.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Every subject in the syllabus gets its own section automatically, at {questionsPerSubject} questions each.
          </p>
        </div>
      </div>
    </div>
  );
}
