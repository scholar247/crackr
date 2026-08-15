'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, Pencil, Search, Check, GraduationCap, School, Target, BookMarked } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PREP_LEVELS, PREP_LEVEL_LABELS, type PrepLevel } from '@/lib/prep-level';
import { cn } from '@/lib/utils';

interface ProfileUser {
  name: string | null;
  email: string;
  image: string | null;
  college: string | null;
  degree: string | null;
  passingYear: number | null;
  targetYear: number | null;
  level: PrepLevel | null;
  targetProgramId: string | null;
}

interface ExamTarget {
  examId: string;
  examName: string;
  examSlug: string;
  programName: string;
  isPrimary: boolean;
}

interface ProgramOption {
  id: string;
  name: string;
}

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

interface FormValues {
  name: string;
  college: string;
  degree: string;
  passingYear: string;
  targetYear: string;
  level: PrepLevel | '';
  targetProgramId: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const TARGET_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i);
const PASSING_YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR + 3 - i);

async function postJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error as string) ?? `Request failed (${res.status})`);
  }
  return (await res.json()).data;
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function ProfileClient({
  user,
  examTargets: initialExamTargets,
  programs,
  exams,
}: {
  user: ProfileUser;
  examTargets: ExamTarget[];
  programs: ProgramOption[];
  exams: ExamOption[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(initialExamTargets.map((t) => t.examId));
  const [primaryExamId, setPrimaryExamId] = useState<string | null>(
    initialExamTargets.find((t) => t.isPrimary)?.examId ?? initialExamTargets[0]?.examId ?? null
  );

  const form = useForm<FormValues>({
    defaultValues: {
      name: user.name ?? '',
      college: user.college ?? '',
      degree: user.degree ?? '',
      passingYear: user.passingYear ? String(user.passingYear) : '',
      targetYear: user.targetYear ? String(user.targetYear) : '',
      level: user.level ?? '',
      targetProgramId: user.targetProgramId ?? '',
    },
  });

  const examsByProgram = useMemo(() => {
    const q = examSearch.trim().toLowerCase();
    const filtered = q ? exams.filter((e) => e.name.toLowerCase().includes(q)) : exams;
    return filtered.reduce<Record<string, ExamOption[]>>((acc, exam) => {
      (acc[exam.programName] ??= []).push(exam);
      return acc;
    }, {});
  }, [exams, examSearch]);

  function toggleExam(id: string) {
    setSelectedExamIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        setPrimaryExamId((current) => (current === id ? (next[0] ?? null) : current));
        return next;
      }
      setPrimaryExamId((current) => current ?? id);
      return [...prev, id];
    });
  }

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      postJson('/api/v1/me/profile', 'PATCH', {
        name: data.name || undefined,
        college: data.college || undefined,
        degree: data.degree || undefined,
        passingYear: data.passingYear ? Number(data.passingYear) : undefined,
        targetYear: data.targetYear ? Number(data.targetYear) : undefined,
        level: data.level || undefined,
        targetProgramId: data.targetProgramId || undefined,
        examIds: selectedExamIds.length > 0 ? selectedExamIds : undefined,
        primaryExamId: primaryExamId ?? undefined,
      }),
    onSuccess: () => {
      toast.success('Profile updated');
      setIsEditing(false);
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCancel() {
    form.reset();
    setSelectedExamIds(initialExamTargets.map((t) => t.examId));
    setPrimaryExamId(initialExamTargets.find((t) => t.isPrimary)?.examId ?? initialExamTargets[0]?.examId ?? null);
    setIsEditing(false);
  }

  const targetProgram = programs.find((p) => p.id === user.targetProgramId);
  const selectedExams = selectedExamIds.map((id) => exams.find((e) => e.id === id)!).filter(Boolean);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        {!isEditing && (
          <Button size="sm" className="gap-1.5" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <Avatar className="h-16 w-16">
          {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
          <AvatarFallback className="text-lg">{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {isEditing ? (
            <Input
              {...form.register('name')}
              placeholder="Your name"
              className="text-body-lg h-auto border-none p-0 font-semibold shadow-none focus-visible:ring-0"
            />
          ) : (
            <p className="text-body-lg font-semibold text-foreground">{user.name || 'Unnamed'}</p>
          )}
          <p className="text-body-sm mt-0.5 flex items-center gap-1.5 text-muted-foreground">
            <Lock className="h-3 w-3" /> {user.email}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-body-md flex items-center gap-2 font-semibold text-foreground">
            <School className="h-4 w-4 text-muted-foreground" /> Academic Details
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="College">
              {isEditing ? (
                <Input {...form.register('college')} placeholder="e.g. IIT Delhi" />
              ) : (
                <ReadValue value={user.college} />
              )}
            </Field>
            <Field label="Degree">
              {isEditing ? (
                <Input {...form.register('degree')} placeholder="e.g. B.Tech CSE" />
              ) : (
                <ReadValue value={user.degree} />
              )}
            </Field>
            <Field label="Passing Year">
              {isEditing ? (
                <Controller
                  control={form.control}
                  name="passingYear"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {PASSING_YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <ReadValue value={user.passingYear} />
              )}
            </Field>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-body-md flex items-center gap-2 font-semibold text-foreground">
            <Target className="h-4 w-4 text-muted-foreground" /> Exam Preparation
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Target Year">
              {isEditing ? (
                <Controller
                  control={form.control}
                  name="targetYear"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <ReadValue value={user.targetYear} />
              )}
            </Field>
            <Field label="Level">
              {isEditing ? (
                <Controller
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-1.5">
                      {PREP_LEVELS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => field.onChange(l)}
                          className={cn(
                            'text-body-sm rounded-lg border px-2 py-2 text-center transition-colors',
                            field.value === l
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:bg-accent'
                          )}
                        >
                          {PREP_LEVEL_LABELS[l]}
                        </button>
                      ))}
                    </div>
                  )}
                />
              ) : (
                <ReadValue value={user.level ? PREP_LEVEL_LABELS[user.level] : null} />
              )}
            </Field>
            <Field label="Target Program">
              {isEditing ? (
                <Controller
                  control={form.control}
                  name="targetProgramId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <ReadValue value={targetProgram?.name ?? null} />
              )}
            </Field>
          </div>

          <div className="mt-5">
            <p className="text-label-caps mb-2 flex items-center gap-1.5 uppercase text-muted-foreground">
              <BookMarked className="h-3.5 w-3.5" /> Targeting Exams
            </p>

            {isEditing ? (
              <div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="Search exams…"
                    className="pl-9"
                  />
                </div>
                <div className="mt-2 max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
                  {Object.keys(examsByProgram).length === 0 ? (
                    <p className="text-body-sm p-2 text-muted-foreground">No exams match your search.</p>
                  ) : (
                    Object.entries(examsByProgram).map(([programName, programExams]) => (
                      <div key={programName}>
                        <p className="text-label-caps px-1 uppercase text-muted-foreground">{programName}</p>
                        <div className="mt-1.5 space-y-1.5">
                          {programExams.map((exam) => {
                            const selected = selectedExamIds.includes(exam.id);
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

                {selectedExams.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {selectedExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <span className="text-body-sm text-foreground">{exam.name}</span>
                        <button
                          type="button"
                          onClick={() => setPrimaryExamId(exam.id)}
                          className={cn(
                            'text-label-caps rounded-full border px-2.5 py-1 uppercase transition-colors',
                            primaryExamId === exam.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {primaryExamId === exam.id ? 'Primary' : 'Set primary'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : initialExamTargets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {initialExamTargets.map((t) => (
                  <span
                    key={t.examId}
                    className={cn(
                      'text-label-caps flex items-center gap-1.5 rounded-full border px-3 py-1.5 uppercase',
                      t.isPrimary ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    <GraduationCap className="h-3 w-3" />
                    {t.examName}
                    {t.isPrimary && ' · Primary'}
                  </span>
                ))}
              </div>
            ) : (
              <ReadValue value={null} />
            )}
          </div>
        </section>

        {isEditing && (
          <div className="mt-6 flex items-center gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-label-caps mb-1.5 uppercase text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ReadValue({ value }: { value: string | number | null }) {
  return <p className={cn('text-body-sm', value ? 'text-foreground' : 'italic text-muted-foreground')}>{value ?? 'Not set'}</p>;
}
