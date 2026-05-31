'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Target,
  BarChart2,
  Trophy,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Users,
  Star,
  ChevronRight,
  Sparkles,
  Brain,
  Clock,
  TrendingUp,
  GraduationCap,
  FlaskConical,
  Calculator,
  Globe,
  Layers,
  Video,
  Radio,
  FileText,
} from 'lucide-react';

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ end, suffix = '', duration = 1500 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  badge?: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {badge && (
        <Badge className="absolute top-4 right-4 text-xs" variant="secondary">{badge}</Badge>
      )}
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl mb-4', color)}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ─── Hero illustration ─────────────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Physics — Wave Optics</span>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">Medium</Badge>
        </div>

        <p className="text-sm font-medium">
          Young&apos;s double slit experiment is performed with light of wavelength 600 nm. The fringe width is observed to be 0.6 mm. What is the distance between the slits if the screen is placed 1.2 m away?
        </p>

        <div className="space-y-2">
          {[
            { label: 'A', text: '1.2 mm', correct: true },
            { label: 'B', text: '0.6 mm', correct: false, selected: true },
            { label: 'C', text: '2.4 mm', correct: false },
            { label: 'D', text: '0.3 mm', correct: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                opt.correct
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : opt.selected
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                  : 'border-border'
              )}
            >
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                opt.correct ? 'bg-emerald-500 text-white' : opt.selected ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'
              )}>{opt.label}</span>
              <span>{opt.text}</span>
              {opt.correct && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
            </div>
          ))}
        </div>
      </div>

      {/* Floating score card */}
      <div className="absolute -top-4 -right-4 rounded-xl border border-border bg-card shadow-lg p-3 space-y-0.5 min-w-[110px]">
        <p className="text-xs text-muted-foreground">Session</p>
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-semibold">8 correct</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold">5 streak</span>
        </div>
      </div>

      {/* Floating timer */}
      <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card shadow-lg p-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-mono font-semibold">23:41</span>
      </div>
    </div>
  );
}

// ─── Main landing page ─────────────────────────────────────────────────────────

interface LandingPageProps {
  session?: { user?: { role?: string; name?: string | null; email?: string | null; image?: string | null } } | null;
  enrolledCourseId?: string | null;
}

export function LandingPage({ session, enrolledCourseId }: LandingPageProps = {}) {
  const isLoggedIn = !!session?.user;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(session?.user?.role ?? '');
  const dashboardHref = isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-20 pt-16 md:pt-24">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Trusted by 50,000+ students
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl leading-[1.1]">
                Learn smarter.{' '}
                <span className="text-primary">Crack</span>{' '}
                your exam.
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Practice thousands of MCQs curated by experts, take timed mock tests, and track your progress with deep analytics. Built for JEE, NEET, UPSC, and more.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={isLoggedIn ? dashboardHref : '/sign-in'}>
                    {isLoggedIn ? 'Go to Dashboard' : 'Start practising free'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">
                    <Play className="h-4 w-4" />
                    See how it works
                  </a>
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Free to start</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Instant access</span>
              </div>
            </div>

            {/* Illustration */}
            <div className="relative hidden lg:block">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { end: 50000, suffix: '+', label: 'Students enrolled' },
              { end: 12000, suffix: '+', label: 'MCQs in library' },
              { end: 500, suffix: '+', label: 'Mock tests' },
              { end: 92, suffix: '%', label: 'Improvement rate' },
            ].map(({ end, suffix, label }) => (
              <div key={label} className="text-center space-y-1">
                <p className="text-3xl font-extrabold text-primary">
                  <AnimatedCounter end={end} suffix={suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need to succeed</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From daily practice to full-length tests, scholar247 has every tool a serious aspirant needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon={BookOpen}
              title="Smart Practice"
              description="Drill MCQs filtered by subject, topic, difficulty, and tags. Instant explanations powered by rich content blocks."
              color="bg-primary/10 text-primary"
            />
            <FeatureCard
              icon={Target}
              title="Mock Tests"
              description="Full-length timed tests with negative marking, auto-submit, and rank/percentile among all test-takers."
              color="bg-success/10 text-success"
            />
            <FeatureCard
              icon={BarChart2}
              title="Deep Analytics"
              description="Score trends, subject radar charts, difficulty breakdowns, and weak-area detection to guide your preparation."
              color="bg-warning/10 text-warning"
            />
            <FeatureCard
              icon={Trophy}
              title="Leaderboards"
              description="Compete on every test. See your rank, percentile, and compare against other aspirants in real time."
              color="bg-destructive/10 text-destructive"
            />
            <FeatureCard
              icon={Brain}
              title="Rich Content"
              description="Questions with LaTeX math, chemistry notation, images, audio, and video — for every exam format."
              color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
            />
            <FeatureCard
              icon={Clock}
              title="Time Tracking"
              description="See how long you spend per question. Identify where you're slow and optimise your exam strategy."
              color="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400"
            />
            <FeatureCard
              icon={Users}
              title="Group Tests"
              description="Teachers can assign tests to specific batches or individual students with custom schedules and deadlines."
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Progress Reports"
              description="Category-wise accuracy, streak tracking, improvement trend, and personalised weak-area suggestions."
              color="bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
              badge="Popular"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">From zero to top rank in 4 steps</h2>
                <p className="text-muted-foreground">A proven system that thousands of toppers use every day.</p>
              </div>

              <div className="space-y-6">
                <StepCard number="01" title="Sign in with Google" description="One click and you're in. Your progress, streaks, and test history are saved automatically." />
                <StepCard number="02" title="Practice daily MCQs" description="Filter by subject and difficulty. Answer questions, get instant explanations, and build your streak." />
                <StepCard number="03" title="Take full mock tests" description="Simulate real exam conditions with timers, negative marking, and the same UX as the actual exam." />
                <StepCard number="04" title="Analyse and improve" description="Study your score trends, find weak categories, and let the analytics guide your next study session." />
              </div>

              <Button asChild>
                <Link href="/sign-in">
                  Start your journey
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Progress mockup */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Weekly Progress</span>
                  <Badge variant="success" className="text-xs">+12% this week</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { subject: 'Physics', pct: 78, color: 'bg-primary' },
                    { subject: 'Chemistry', pct: 65, color: 'bg-success' },
                    { subject: 'Mathematics', pct: 82, color: 'bg-warning' },
                    { subject: 'Biology', pct: 55, color: 'bg-destructive' },
                  ].map(({ subject, pct, color }) => (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{subject}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Questions', value: '1,240', icon: BookOpen },
                  { label: 'Streak', value: '14 days', icon: Zap },
                  { label: 'Accuracy', value: '73%', icon: Target },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-base font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subjects ──────────────────────────────────────────────────────── */}
      <section id="subjects" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Covers every major exam</h2>
            <p className="text-muted-foreground">Thousands of questions across all subjects — updated regularly by experts.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: Calculator, label: 'Mathematics', color: 'text-primary bg-primary/10', slug: 'mathematics' },
              { icon: FlaskConical, label: 'Chemistry', color: 'text-success bg-success/10', slug: 'chemistry' },
              { icon: Zap, label: 'Physics', color: 'text-warning bg-warning/10', slug: 'physics' },
              { icon: Brain, label: 'Biology', color: 'text-destructive bg-destructive/10', slug: 'biology' },
              { icon: Globe, label: 'History', color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20', slug: 'history' },
              { icon: Layers, label: 'More…', color: 'text-muted-foreground bg-muted', slug: null },
            ].map(({ icon: Icon, label, color, slug }) => (
              <Link key={label} href={slug ? `/subjects/${slug}` : '/subjects'} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'JEE Main', slug: 'jee-main' },
              { label: 'JEE Advanced', slug: 'jee-advanced' },
              { label: 'NEET', slug: 'neet' },
              { label: 'UPSC', slug: 'upsc-prelims' },
              { label: 'CAT', slug: 'cat' },
              { label: 'GATE', slug: 'gate' },
              { label: 'SSC CGL', slug: 'ssc-cgl' },
              { label: 'Banking', slug: 'ibps-po' },
            ].map(({ label, slug }) => (
              <Link key={label} href={`/exams/${slug}`}>
                <Badge variant="secondary" className="text-xs rounded-full px-3 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                  {label}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/subjects">Browse all subjects <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Loved by toppers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Arjun Mehta',
                exam: 'JEE Advanced — AIR 247',
                quote: 'scholar247\'s analytics showed me exactly which chapters were dragging my score down. Fixed them in 2 weeks.',
              },
              {
                name: 'Priya Sharma',
                exam: 'NEET — 680/720',
                quote: 'The daily practice streaks kept me consistent. Best decision I made in my NEET prep.',
              },
              {
                name: 'Rohan Das',
                exam: 'UPSC Prelims — cleared',
                quote: 'Subject-wise radar charts are a game changer. You can see your preparation at a glance.',
              },
            ].map(({ name, exam, quote }) => (
              <div key={name} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex text-amber-400 gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-xs text-success">{exam}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Courses ──────────────────────────────────────────────────── */}
      <section id="courses" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <Badge className="bg-success/10 text-success border-success/20 text-xs">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success inline-block animate-pulse" />
                Now live
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Structured courses for <span className="text-primary">NIMCET 2025</span>
              </h2>
              <p className="text-muted-foreground max-w-xl leading-relaxed">
                Complete video + live courses built around the NIMCET syllabus — structured subjects, chapter-wise lessons, doubt sessions, and integrated mock tests. Everything in one place.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/courses">
                Browse all courses
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Course feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Video,
                title: 'Recorded Lectures',
                desc: 'Watch expert-taught video lessons at your own pace — rewind, replay, take notes.',
                color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
              },
              {
                icon: Radio,
                title: 'Live Sessions',
                desc: 'Weekly live doubt-clearing sessions with instructors. Ask questions in real time.',
                color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
              },
              {
                icon: FileText,
                title: 'Chapter Notes & PDFs',
                desc: 'Downloadable notes and summary sheets for every lesson — perfect for quick revision.',
                color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
              },
              {
                icon: Target,
                title: 'Topic-Linked Quizzes',
                desc: 'Practice MCQs linked directly to each lesson. Test your understanding immediately.',
                color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA block */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-primary/5 p-7 md:p-10">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/8 blur-3xl" aria-hidden />
            <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {['Mathematics', 'Computer Applications', 'Logical Reasoning', 'English', 'GK'].map((s) => (
                    <span key={s} className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium border border-border">
                      {s}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold">
                  {isLoggedIn && enrolledCourseId
                    ? "Pick up where you left off"
                    : "Start your NIMCET preparation today"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  {isLoggedIn && enrolledCourseId
                    ? "Your course is waiting. Continue lessons, check today's study plan, and keep your streak going."
                    : "Enroll in our NIMCET Complete Course — structured lessons, live sessions, and full-length mock tests all in one place. Free to start."}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> 5 subjects covered</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> Live + recorded</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> Free to enroll</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {isLoggedIn ? (
                  <>
                    <Button asChild size="lg" className="gap-2">
                      <Link href={enrolledCourseId ? `/courses/${enrolledCourseId}/learn` : '/courses'}>
                        <Video className="h-4 w-4" />
                        {enrolledCourseId ? 'Continue Learning' : 'Browse NIMCET Courses'}
                      </Link>
                    </Button>
                    {!enrolledCourseId && (
                      <Button asChild size="sm" variant="ghost" className="text-xs">
                        <Link href="/nimcet">
                          View NIMCET Hub
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/sign-in">
                        <GraduationCap className="h-4 w-4" />
                        Enroll for free
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="text-xs">
                      <Link href="/courses">
                        Browse courses first
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-primary-foreground tracking-tight md:text-4xl">
            Ready to crack your exam?
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Join 50,000+ students. Start with free practice, no credit card needed.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/sign-in">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold">scholar247</span>
              <span className="text-muted-foreground text-sm">— Learn, Practice, Progress, Crack</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <span>© {new Date().getFullYear()} scholar247</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
