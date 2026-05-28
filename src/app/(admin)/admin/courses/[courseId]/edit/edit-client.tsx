'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { CourseClient } from '@/types/course.types';
import type { ExamClient, UserClient } from '@/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  courseId: string;
  exams: ExamClient[];
  teachers: UserClient[];
}

function FormSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

export function EditCourseClient({ courseId, exams, teachers }: Props) {
  const router = useRouter();

  const [course, setCourse] = useState<CourseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [examId, setExamId] = useState('');
  const [type, setType] = useState('LIVE');
  const [level, setLevel] = useState('BEGINNER');
  const [language, setLanguage] = useState('English');
  const [tagsInput, setTagsInput] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [primaryTeacherId, setPrimaryTeacherId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionDays, setSessionDays] = useState<number[]>([]);
  const [typicalSessionTime, setTypicalSessionTime] = useState('');
  const [maxEnrollments, setMaxEnrollments] = useState('');
  const [isSubscriptionRequired, setIsSubscriptionRequired] = useState(false);
  const [status, setStatus] = useState('DRAFT');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`);
        if (!res.ok) throw new Error('Course not found');
        const json = await res.json();
        const c: CourseClient = json.data;
        setCourse(c);

        setTitle(c.title);
        setSlug(c.slug ?? '');
        setShortDescription(c.shortDescription ?? '');
        setDescription(c.description ?? '');
        setThumbnailUrl(c.thumbnailUrl ?? '');
        setBannerUrl(c.bannerUrl ?? '');
        setExamId(c.examId);
        setType(c.type);
        setLevel(c.level);
        setLanguage(c.language);
        setTagsInput(c.tags.join(', '));
        setTeacherIds(c.teacherIds);
        setPrimaryTeacherId(c.primaryTeacherId ?? '');
        setStartDate(toDateInputValue(c.startDate));
        setEndDate(toDateInputValue(c.endDate));
        setSessionDays(c.sessionDays);
        setTypicalSessionTime(c.typicalSessionTime ?? '');
        setMaxEnrollments(c.maxEnrollments != null ? String(c.maxEnrollments) : '');
        setIsSubscriptionRequired(c.isSubscriptionRequired);
        setStatus(c.status);
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  const toggleTeacher = (id: string) => {
    setTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleSessionDay = (day: number) => {
    setSessionDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        title,
        slug: slug || undefined,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        bannerUrl: bannerUrl || undefined,
        examId,
        type,
        level,
        language,
        tags,
        teacherIds,
        primaryTeacherId: primaryTeacherId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sessionDays,
        typicalSessionTime: typicalSessionTime || undefined,
        maxEnrollments: maxEnrollments ? parseInt(maxEnrollments, 10) : undefined,
        isSubscriptionRequired,
        status,
      };

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Save failed');
      }

      toast.success('Course saved');
      router.push('/admin/courses');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <FormSkeleton />
      </div>
    );
  }

  if (fetchError || !course) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <p className="text-sm text-destructive">{fetchError ?? 'Course not found'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Edit Course</h1>
            <p className="text-xs text-muted-foreground truncate max-w-sm">{course.title}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* Basic Info */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated if blank" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Language</Label>
            <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="shortDesc">Short Description</Label>
            <Input id="shortDesc" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={160} placeholder="Up to 160 characters" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="description">Full Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input id="thumbnailUrl" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bannerUrl">Banner URL</Label>
            <Input id="bannerUrl" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-xs font-normal text-muted-foreground">(comma-separated)</span></Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="nimcet, mca, entrance" />
          </div>
        </div>
      </section>

      {/* Exam & Type */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Exam & Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Exam <span className="text-destructive">*</span></Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LIVE">Live</SelectItem>
                <SelectItem value="RECORDED">Recorded</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Teachers */}
      {teachers.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Teachers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {teachers.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <Checkbox
                  checked={teacherIds.includes(t.id)}
                  onCheckedChange={() => toggleTeacher(t.id)}
                />
                <span className="text-sm truncate">{t.name}</span>
              </label>
            ))}
          </div>
          {teacherIds.length > 0 && (
            <div className="space-y-1.5">
              <Label>Primary Teacher</Label>
              <Select value={primaryTeacherId} onValueChange={setPrimaryTeacherId}>
                <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select primary" /></SelectTrigger>
                <SelectContent>
                  {teachers
                    .filter((t) => teacherIds.includes(t.id))
                    .map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>
      )}

      {/* Schedule */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sessionTime">Typical Session Time</Label>
            <Input id="sessionTime" value={typicalSessionTime} onChange={(e) => setTypicalSessionTime(e.target.value)} placeholder="e.g. 8:00 PM IST" />
          </div>
          <div className="space-y-2">
            <Label>Session Days</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleSessionDay(idx)}
                  className={`rounded-md px-3 py-1 text-xs font-medium border transition-colors ${
                    sessionDays.includes(idx)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Access & Status */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Access & Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxEnrollments">Max Enrollments</Label>
            <Input
              id="maxEnrollments"
              type="number"
              min={1}
              value={maxEnrollments}
              onChange={(e) => setMaxEnrollments(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Checkbox
              id="subReq"
              checked={isSubscriptionRequired}
              onCheckedChange={(v) => setIsSubscriptionRequired(!!v)}
            />
            <Label htmlFor="subReq" className="cursor-pointer">Subscription required</Label>
          </div>
        </div>
      </section>

      {/* Bottom save */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/courses">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
