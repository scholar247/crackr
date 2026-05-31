import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Calculator, Cpu, Brain, BookOpen, Globe,
  Clock, Target, TrendingUp, CheckCircle2,
  AlertCircle, Circle, ArrowRight, Play,
  Trophy, Star, Zap, FileText, Users, Calendar,
} from 'lucide-react';
import { serverGet } from '@/lib/server-fetch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { NimcetCountdown } from './nimcet-countdown';
import type { SubjectClient } from '@/types';

export const metadata: Metadata = { title: 'NIMCET Preparation | scholar247' };

// NIMCET 2025 tentative date (May last week / June first week)
const NIMCET_EXAM_DATE = '2025-06-01T09:00:00+05:30';

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  'mathematics': Calculator,
  'math': Calculator,
  'computer-applications': Cpu,
  'computer': Cpu,
  'cs': Cpu,
  'analytical-ability': Brain,
  'reasoning': Brain,
  'general-english': BookOpen,
  'english': BookOpen,
  'general-awareness': Globe,
  'gk': Globe,
};

const SUBJECT_GRADIENT: Record<string, string> = {
  'mathematics': 'from-indigo-500/20 to-indigo-600/5',
  'computer-applications': 'from-sky-500/20 to-sky-600/5',
  'analytical-ability': 'from-amber-500/20 to-amber-600/5',
  'general-english': 'from-emerald-500/20 to-emerald-600/5',
  'general-awareness': 'from-pink-500/20 to-pink-600/5',
};

// NIMCET paper breakdown (hardcoded from official pattern)
const NIMCET_PATTERN = [
  { name: 'Mathematics', questions: 50, marks: 200, color: '#6366f1', key: 'mathematics', weight: 41.7 },
  { name: 'Computer Applications', questions: 10, marks: 40, color: '#0ea5e9', key: 'computer-applications', weight: 8.3 },
  { name: 'Analytical Ability & Logical Reasoning', questions: 40, marks: 160, color: '#f59e0b', key: 'analytical-ability', weight: 33.3 },
  { name: 'General English', questions: 10, marks: 40, color: '#10b981', key: 'general-english', weight: 8.3 },
  { name: 'General Awareness', questions: 10, marks: 40, color: '#ec4899', key: 'general-awareness', weight: 8.3 },
];

const NIMCET_TIPS = [
  { icon: Calculator, title: 'Master Maths First', desc: '50 questions = 41.7% of paper. Calculus, Probability & Vectors are high-yield.', color: 'text-indigo-500' },
  { icon: Brain, title: 'Speed in Reasoning', desc: '40 questions in under 40 min. Practice seating arrangements & syllogisms daily.', color: 'text-amber-500' },
  { icon: Target, title: 'Don\'t Skip Negative Marking', desc: '+4/−1 scheme. Attempt 90+ with >80% accuracy for a top-100 rank.', color: 'text-rose-500' },
  { icon: Clock, title: '2-Minute Rule', desc: 'Never spend > 2 min on any question. Mark & move. Return if time allows.', color: 'text-sky-500' },
];

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

export default async function NimcetHubPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { nimcetExam, allCourses, enrollmentMap: enrollmentMapData, subjectsMap: subjectsMapData, coverageMap: coverageMapData } =
    await serverGet<{ nimcetExam: any | null; allCourses: any[]; enrollmentMap: Record<string, number>; subjectsMap: Record<string, SubjectClient>; coverageMap: Record<string, { attempted: number; total: number; accuracy: number | null }> }>('/api/student/nimcet').catch(() => ({
      nimcetExam: null, allCourses: [], enrollmentMap: {}, subjectsMap: {}, coverageMap: {}
    }));

  const enrollmentMap = new Map(Object.entries(enrollmentMapData));
  const subjectsMap = new Map(Object.entries(subjectsMapData));
  const coverageMap = new Map(Object.entries(coverageMapData));

  const enrolledCourses = allCourses.filter((c) => enrollmentMap.has(c.id));
  const availableCourses = allCourses.filter((c) => !enrollmentMap.has(c.id));

  const examExists = !!nimcetExam;
  const practiceBase = examExists
    ? `/practice?examId=${nimcetExam!.id}`
    : '/practice';

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold border border-primary/20">
                  NIMCET 2025
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  NIT MCA Entrance
                </span>
                <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 text-xs font-semibold">
                  120Q · 480M · 120min
                </span>
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  Crack <span className="text-primary">NIMCET</span>
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-xl">
                  Your complete preparation hub — structured courses, subject-wise practice, live sessions & progress tracking.
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
                  <Link href="/syllabus">
                    <BookOpen className="h-4 w-4" />
                    Syllabus
                  </Link>
                </Button>
              </div>
            </div>

            {/* Countdown card */}
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 min-w-72">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <Calendar className="h-3.5 w-3.5" />
                Exam Countdown
              </div>
              <NimcetCountdown targetDate={NIMCET_EXAM_DATE} />
              <p className="text-xs text-muted-foreground mt-4">
                Tentative date: June 1, 2025 · 9:00 AM IST
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
            <span className="text-xs text-muted-foreground">+4 correct · −1 wrong</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {NIMCET_PATTERN.map((sub) => {
              const SubIcon = SUBJECT_ICONS[sub.key] ?? BookOpen;
              const gradKey = sub.key.split('-')[0];
              const gradClass = SUBJECT_GRADIENT[sub.key] ?? SUBJECT_GRADIENT[gradKey] ?? 'from-primary/20 to-primary/5';

              // Find coverage for this subject from coverageMap
              const subjectEntry = Array.from(subjectsMap.values()).find(
                (s) => s.name.toLowerCase().includes(sub.key.split('-')[0])
              );
              const coverage = subjectEntry ? coverageMap.get(subjectEntry.id) : null;
              const pct = coverage && coverage.total > 0
                ? Math.round((coverage.attempted / coverage.total) * 100)
                : 0;

              return (
                <div
                  key={sub.key}
                  className={cn(
                    'group rounded-xl border border-border bg-gradient-to-br p-4 space-y-3 hover:border-primary/40 transition-colors cursor-default',
                    gradClass
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: sub.color + '20', color: sub.color }}
                    >
                      <SubIcon className="h-5 w-5" />
                    </div>
                    <SubjectProgressRing pct={pct} color={sub.color} />
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
                    <Link href={`/practice?examId=${nimcetExam?.id ?? ''}&subjectFilter=${sub.name}`}>
                      Practice
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Key Stats ─────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Target, label: 'Total Questions', value: '120', sub: 'per paper', color: 'text-indigo-500' },
            { icon: Trophy, label: 'Total Marks', value: '480', sub: '+4 per correct', color: 'text-amber-500' },
            { icon: Clock, label: 'Duration', value: '2 hrs', sub: '120 minutes', color: 'text-sky-500' },
            { icon: Star, label: 'NITs Covered', value: '30+', sub: 'NIT campuses', color: 'text-emerald-500' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
              <Icon className={cn('h-5 w-5', color)} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </section>

        {/* ── My NIMCET Courses ─────────────────────────────────────────────── */}
        {enrolledCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Continue Learning</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/courses">All courses <ArrowRight className="h-3 w-3 ml-1" /></Link>
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
                    <div className="h-2 w-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
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
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {course.type} · {course.level}
                          </p>
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

        {/* ── Available NIMCET Courses ──────────────────────────────────────── */}
        {availableCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {enrolledCourses.length > 0 ? 'More Courses' : 'NIMCET Courses'}
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
                          {course.status === 'COMING_SOON' && (
                            <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 text-xs font-semibold">
                              Soon
                            </span>
                          )}
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

        {/* ── No courses state ──────────────────────────────────────────────── */}
        {allCourses.length === 0 && (
          <section className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center space-y-3">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="font-semibold">No NIMCET courses yet</p>
            <p className="text-sm text-muted-foreground">
              Courses will appear here once published by the admin team.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={practiceBase}>Start Practicing MCQs</Link>
            </Button>
          </section>
        )}

        {/* ── Strategy Tips ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Preparation Strategy</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {NIMCET_TIPS.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <div className={cn('mt-0.5 shrink-0', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Progress Snapshot ───────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Your NIMCET Progress</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/progress">Full Analytics <TrendingUp className="h-3.5 w-3.5 ml-1" /></Link>
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
              <p className="text-3xl font-bold text-amber-500">
                {subjectsMap.size}
              </p>
              <p className="text-sm text-muted-foreground">Subjects in syllabus</p>
            </div>
          </div>
          {!examExists && (
            <div className="px-5 pb-4 text-center">
              <p className="text-xs text-muted-foreground">
                NIMCET exam data not yet seeded.{' '}
                <span className="font-medium">Run: npx tsx scripts/seed-nimcet.ts</span>
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
