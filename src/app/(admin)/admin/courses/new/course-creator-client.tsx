'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { cn, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreateCourseSchema, type CreateCourseInput } from '@/schemas/course.schema';
import type { ExamClient, UserClient } from '@/types';

const STEPS = [
  { label: 'Basic Info' },
  { label: 'Teachers' },
  { label: 'Schedule' },
  { label: 'Access' },
  { label: 'Review' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CourseCreatorClientProps {
  exams: ExamClient[];
  teachers: UserClient[];
}

export function CourseCreatorClient({ exams, teachers }: CourseCreatorClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<CreateCourseInput>({
    resolver: zodResolver(CreateCourseSchema) as never,
    defaultValues: {
      type: 'LIVE',
      level: 'BEGINNER',
      language: 'English',
      tags: [],
      teacherIds: [],
      sessionDays: [],
      isSubscriptionRequired: false,
      status: 'DRAFT',
    },
  });

  const watchType = watch('type');
  const watchTitle = watch('title');
  const watchTeacherIds = watch('teacherIds') ?? [];
  const watchSessionDays = watch('sessionDays') ?? [];

  const onSubmit = async (data: CreateCourseInput, publishNow = false) => {
    setSaving(true);
    try {
      const payload = { ...data, status: publishNow ? 'PUBLISHED' : 'DRAFT' };
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to create course');
        return;
      }
      const { data: course } = await res.json();
      toast.success(publishNow ? 'Course published!' : 'Course saved as draft');
      router.push(`/admin/courses/${course.id}/curriculum`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = () => {
    const vals = getValues();
    if (step === 0) return !!(vals.title && vals.examId && vals.type);
    return true;
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Course</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in details to launch your course</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                i < step ? 'bg-primary text-primary-foreground cursor-pointer'
                  : i === step ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1', i < step ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm font-medium">{STEPS[step].label}</p>

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...register('title')} placeholder="e.g. NIMCET 2026 Complete Prep" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                {...register('slug')}
                placeholder="auto-generated from title"
                onFocus={() => { if (!getValues('slug') && watchTitle) setValue('slug', slugify(watchTitle)); }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Short Description (max 160 chars)</Label>
              <Textarea {...register('shortDescription')} rows={2} maxLength={160} />
            </div>

            <div className="space-y-1.5">
              <Label>Thumbnail URL</Label>
              <Input {...register('thumbnailUrl')} placeholder="https://..." type="url" />
            </div>

            <div className="space-y-1.5">
              <Label>Exam *</Label>
              <Select onValueChange={(v) => setValue('examId', v)}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.examId && <p className="text-xs text-destructive">{errors.examId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Course Type *</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['LIVE', 'RECORDED', 'HYBRID'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('type', t)}
                    className={cn(
                      'rounded-xl border p-3 text-sm font-medium transition-colors text-center',
                      watchType === t ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select defaultValue="BEGINNER" onValueChange={(v) => setValue('level', v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Input {...register('language')} defaultValue="English" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Teachers */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select teachers for this course</p>
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No teachers found. Add teacher role to users first.</p>
            ) : (
              <div className="space-y-2">
                {teachers.map((t) => {
                  const isSelected = watchTeacherIds.includes(t.id);
                  const isPrimary = getValues('primaryTeacherId') === t.id;
                  return (
                    <div key={t.id} className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const cur = getValues('teacherIds') ?? [];
                          if (e.target.checked) {
                            setValue('teacherIds', [...cur, t.id]);
                            if (!getValues('primaryTeacherId')) setValue('primaryTeacherId', t.id);
                          } else {
                            setValue('teacherIds', cur.filter((id) => id !== t.id));
                            if (isPrimary) setValue('primaryTeacherId', cur.find((id) => id !== t.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-semibold text-sm shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={() => setValue('primaryTeacherId', t.id)}
                          className={cn('text-xs px-2 py-1 rounded-full border transition-colors',
                            isPrimary ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground hover:border-primary/40'
                          )}
                        >
                          {isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 2 && (
          <div className="space-y-4">
            {watchType === 'RECORDED' ? (
              <p className="text-sm text-muted-foreground italic">Schedule is optional for recorded courses.</p>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input {...register('startDate')} type="date" />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input {...register('endDate')} type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Session Days</Label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((day, i) => {
                  const isSelected = watchSessionDays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const cur = getValues('sessionDays') ?? [];
                        setValue('sessionDays', isSelected ? cur.filter((d) => d !== i) : [...cur, i]);
                      }}
                      className={cn(
                        'h-9 w-12 rounded-lg border text-sm font-medium transition-colors',
                        isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Typical Session Time (e.g. 7:00 PM)</Label>
              <Input {...register('typicalSessionTime')} placeholder="7:00 PM" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Enrollments (optional)</Label>
              <Input {...register('maxEnrollments', { valueAsNumber: true })} type="number" min={1} />
            </div>
          </div>
        )}

        {/* Step 4: Access */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium text-sm">Subscription Required</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students must subscribe to enroll</p>
              </div>
              <Switch
                checked={watch('isSubscriptionRequired')}
                onCheckedChange={(v) => setValue('isSubscriptionRequired', v)}
              />
            </div>

            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                💳 Payment Integration — Coming Soon
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Configure pricing in Payment Settings (coming soon). For now, enable subscription to restrict enrollment.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {[
                { label: 'Title', value: getValues('title') },
                { label: 'Exam', value: exams.find((e) => e.id === getValues('examId'))?.name ?? getValues('examId') },
                { label: 'Type', value: getValues('type') },
                { label: 'Level', value: getValues('level') },
                { label: 'Language', value: getValues('language') },
                { label: 'Teachers', value: (getValues('teacherIds') ?? []).length + ' selected' },
                { label: 'Subscription', value: getValues('isSubscriptionRequired') ? 'Required' : 'Free' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value ?? '—'}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={saving}
                onClick={handleSubmit((data) => onSubmit(data, false))}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={saving}
                onClick={handleSubmit((data) => onSubmit(data, true))}
              >
                {saving ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canAdvance()}
            >
              Next
            </Button>
          </div>
        )}
        {step > 0 && step < 4 && (
          <div className="flex justify-center pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              ← Back
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
