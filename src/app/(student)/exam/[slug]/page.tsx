import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  BookOpen, Clock, Target, TrendingUp,
  ArrowRight, Play, Trophy, Star, Zap,
  FileText, Users, Calendar, ExternalLink,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { getExamConfig, ACCENT_COLORS } from '@/lib/exam-config';
import { serverGet } from '@/lib/server-fetch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ExamCountdown } from './exam-countdown';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = getExamConfig(slug);
  if (!config) return { title: 'Exam Hub | crackr' };
  return {
    title: `${config.name} Preparation | crackr`,
    description: config.heroDesc,
  };
}

function SubjectProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
      <circle
        cx="26" cy="26" r={r}
        stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="fill-foreground">
        {pct}%
      </text>
    </svg>
  );
}

const TIP_ICON_COLORS: Record<string, string> = {
  indigo: 'text-indigo-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  sky: 'text-sky-500',
  emerald: 'text-emerald-500',
  violet: 'text-violet-500',
  pink: 'text-pink-500',
  primary: 'text-primary',
};

export default async function ExamHubPage({ params }: Props) {
  const { slug } = await params;

  const config = getExamConfig(slug);
  if (!config) notFound();

  const session = await auth();
  if (!session) redirect('/sign-in');

  const accent = ACCENT_COLORS[config.accentColor] ?? ACCENT_COLORS.primary;

  // Fetch DB exam for live data (courses, practice links)
  const { dbExam, allCourses, enrollmentMap: enrollmentMapData } =
    await serverGet<{ dbExam: any | null; allCourses: any[]; enrollmentMap: Record<string, number> }>(`/api/student/exam/${slug}`).catch(() => ({
      dbExam: null, allCourses: [], enrollmentMap: {}
    }));

  const enrollmentMap = new Map(Object.entries(enrollmentMapData));

  const enrolledCourses = allCourses.filter((c) => enrollmentMap.has(c.id));
  const availableCourses = allCourses.filter((c) => !enrollmentMap.has(c.id));

  const practiceBase = dbExam ? `/practice?examId=${dbExam.id}` : '/practice';

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `radial-gradient(ellipse at top left, color-mix(in oklch, var(--color-primary) 12%, transparent), transparent 60%), var(--color-background)`,
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold border', accent.badge, accent.border)}>
                  {config.name} 2025
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {config.category}
                </span>
                <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 text-xs font-semibold">
                  {config.totalQuestions}Q · {config.totalMarks}M · {config.durationMinutes}min
                </span>
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {config.heroTagline}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-xl">
                  {config.heroDesc}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild size="lg" className="gap-2">
                  <Link href={practiceBase}>
                    <Zap className="h-4 w-4" />
                    Practice Now
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/mocks">
                    <FileText className="h-4 w-4" />
                    Take a Mock
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="gap-2">
                  <a href={config.officialSite} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Official Site
                  </a>
                </Button>
              </div>
            </div>

            {/* Countdown */}
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 min-w-72">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <Calendar className="h-3.5 w-3.5" />
                Exam Countdown
              </div>
              <ExamCountdown targetDate={config.examDate} />
              <p className="text-xs text-muted-foreground mt-4">
                {config.examDateLabel} · Conducted by {config.conductedBy}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10">

        {/* ── Exam Pattern ──────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Exam Pattern</h2>
            <span className="text-xs text-muted-foreground">
              +{config.correctMarks} correct · {config.negativeLabel}
            </span>
          </div>

          <div className={cn(
            'grid gap-3',
            config.subjects.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
            config.subjects.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
          )}>
            {config.subjects.map((sub) => (
              <div
                key={sub.shortName}
                className="group rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-xs"
                    style={{ backgroundColor: sub.color + '20', color: sub.color }}
                  >
                    {sub.shortName.slice(0, 2).toUpperCase()}
                  </div>
                  <SubjectProgressRing pct={0} color={sub.color} />
                </div>

                <div>
                  <p className="font-semibold text-sm leading-tight">{sub.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub.weight.toFixed(1)}% of paper</p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold" style={{ color: sub.color }}>{sub.questions} Q</span>
                  <span className="text-muted-foreground">{sub.marks} marks</span>
                </div>

                <Button
                  asChild size="sm" variant="ghost"
                  className="w-full h-7 text-xs gap-1 hover:bg-background/60"
                >
                  <Link href={`${practiceBase}&subjectFilter=${encodeURIComponent(sub.name)}`}>
                    Practice <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Key Facts ─────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Target, label: 'Questions', value: String(config.totalQuestions), sub: 'per paper', color: 'text-indigo-500' },
            { icon: Trophy, label: 'Total Marks', value: String(config.totalMarks), sub: `+${config.correctMarks}/correct`, color: 'text-amber-500' },
            { icon: Clock, label: 'Duration', value: `${Math.floor(config.durationMinutes / 60)}h ${config.durationMinutes % 60 > 0 ? config.durationMinutes % 60 + 'm' : ''}`.trim(), sub: `${config.durationMinutes} minutes`, color: 'text-sky-500' },
            ...config.keyFacts.slice(0, 1).map(({ label, value }) => ({
              icon: Star, label, value, sub: config.conductedBy, color: 'text-emerald-500' as string,
            })),
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
              <Icon className={cn('h-5 w-5', color)} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </section>

        {/* ── Key Facts table ───────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-sm">Key Facts</h2>
          </div>
          <div className="divide-y divide-border">
            {config.keyFacts.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-muted-foreground">Marking Scheme</span>
              <span className="text-sm font-semibold">+{config.correctMarks} / {config.negativeLabel}</span>
            </div>
          </div>
        </section>

        {/* ── My enrolled courses ───────────────────────────────────────────── */}
        {enrolledCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Continue Learning</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/my-courses">My courses <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((course) => {
                const progress = enrollmentMap.get(course.id) ?? 0;
                return (
                  <div
                    key={course.id}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    <div className="h-1.5 w-full bg-muted">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Play className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{course.type} · {course.level}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      <Button asChild size="sm" className="w-full gap-1.5">
                        <Link href={`/courses/${course.id}/learn`}>
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Available courses ─────────────────────────────────────────────── */}
        {availableCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {enrolledCourses.length > 0 ? 'More Courses' : `${config.name} Courses`}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/courses">Browse all <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className={cn(
                            'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                            course.type === 'LIVE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            course.type === 'HYBRID' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                            'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                          )}>
                            {course.type}
                          </span>
                        </div>
                        <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {course.totalLessons > 0 && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" /> {course.totalLessons} lessons
                        </span>
                      )}
                      {course.totalHours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {course.totalHours}h
                        </span>
                      )}
                      {course.enrolledCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {course.enrolledCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
                      <Link href={`/courses/${course.id}`}>
                        View Course <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── No courses ────────────────────────────────────────────────────── */}
        {allCourses.length === 0 && (
          <section className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center space-y-3">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="font-semibold">No {config.name} courses yet</p>
            <p className="text-sm text-muted-foreground">Courses will appear here once published.</p>
            <Button asChild variant="outline" size="sm">
              <Link href={practiceBase}>Start Practising MCQs</Link>
            </Button>
          </section>
        )}

        {/* ── Preparation Strategy ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Preparation Strategy</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.tips.map(({ title, desc, colorKey }) => {
              const iconColor = TIP_ICON_COLORS[colorKey] ?? 'text-primary';
              return (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <div className={cn('mt-0.5 shrink-0', iconColor)}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Quick Progress Snapshot ───────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Your {config.name} Progress</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/progress">
                Full Analytics <TrendingUp className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center space-y-1 py-4">
              <p className="text-3xl font-bold text-primary">{enrolledCourses.length}</p>
              <p className="text-sm text-muted-foreground">Courses enrolled</p>
            </div>
            <div className="text-center space-y-1 py-4 sm:border-x border-border">
              <p className="text-3xl font-bold">
                {enrolledCourses.length > 0
                  ? Math.round(enrolledCourses.reduce((s, c) => s + (enrollmentMap.get(c.id) ?? 0), 0) / enrolledCourses.length)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg course progress</p>
            </div>
            <div className="text-center space-y-1 py-4">
              <p className="text-3xl font-bold text-amber-500">{allCourses.length}</p>
              <p className="text-sm text-muted-foreground">Available courses</p>
            </div>
          </div>
          {!dbExam && (
            <div className="px-5 pb-4 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {config.name} exam data not yet seeded — practice links may be generic.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
