import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  CheckCircle,
  Video,
  Calendar,
  Trophy,
  BarChart3,
  Users,
  Star,
  Zap,
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  GraduationCap,
  Cpu,
  Calculator,
  Brain,
  MessageSquare,
  Medal,
  TrendingUp,
  Radio,
  Play,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'NIMCET 2025 Live Course | scholar247',
  description:
    'Crack NIMCET 2025 with live daily classes, weekend marathons, IIT/NIT expert faculty, personalised counselling, full mock tests series and detailed rank analytics.',
};

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Radio,
    title: 'Daily Live Classes',
    desc: 'Monday–Friday, 7–10 PM IST. Cover the entire NIMCET syllabus topic-by-topic with live interactions, polls and instant doubt resolution.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Zap,
    title: 'Weekend Marathon Sessions',
    desc: 'Saturday & Sunday full-day intensive sessions — deep dives, revision sprints and strategy workshops to accelerate your prep 3×.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Industry Engineers & NIT/IIT Faculty',
    desc: 'Learn from engineers working at top tech companies and professors from premier NITs. Real-world relevance meets exam expertise.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Personal Counselling',
    desc: '1-on-1 sessions with NIMCET toppers and mentors — NIT college & branch selection, rank prediction, and admission strategy.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Trophy,
    title: 'Full Mock Test Series',
    desc: '20+ full-length NIMCET pattern mocks (+4/−1). Timed under exam conditions with instant scoring and detailed topic analysis.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: BarChart3,
    title: 'Progress Reports & Rankings',
    desc: 'Weekly performance snapshots, percentile rankings among enrolled peers, accuracy trends and personalised weak-area alerts.',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  {
    icon: BookOpen,
    title: 'Structured Recorded Library',
    desc: 'Every live session is archived. Rewatch at 1.5× or 2×, search by topic, and never fall behind even if you miss a class.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Target,
    title: 'Chapter-wise MCQ Practice',
    desc: '5 000+ curated NIMCET-level MCQs with detailed solutions — practice by subject, topic or difficulty directly after each class.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
];

const SYLLABUS = [
  { name: 'Mathematics', questions: 50, marks: 200, weight: '41.7%', icon: Calculator, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { name: 'Analytical & Logical Reasoning', questions: 40, marks: 160, weight: '33.3%', icon: Brain, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Computer Applications', questions: 10, marks: 40, weight: '8.3%', icon: Cpu, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { name: 'General English', questions: 10, marks: 40, weight: '8.3%', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'General Awareness', questions: 10, marks: 40, weight: '8.3%', icon: GraduationCap, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

const SCHEDULE = [
  { day: 'Monday', slots: ['7:00–8:30 PM  Mathematics (Theory)', '8:30–9:00 PM  Doubt Session'], color: 'border-indigo-500/40' },
  { day: 'Tuesday', slots: ['7:00–8:30 PM  Analytical Reasoning', '8:30–9:00 PM  Doubt Session'], color: 'border-amber-500/40' },
  { day: 'Wednesday', slots: ['7:00–8:30 PM  Mathematics (PYQ)', '8:30–9:00 PM  Strategy Workshop'], color: 'border-indigo-500/40' },
  { day: 'Thursday', slots: ['7:00–8:30 PM  Computer Applications + English', '8:30–9:00 PM  Doubt Session'], color: 'border-sky-500/40' },
  { day: 'Friday', slots: ['7:00–8:30 PM  General Awareness + Revision', '8:30–9:00 PM  Weekly Quiz'], color: 'border-emerald-500/40' },
  { day: 'Saturday', slots: ['9:00 AM–1:00 PM  Marathon — Deep Dive', '2:00–6:00 PM  Mock Test + Analysis'], color: 'border-rose-500/40' },
  { day: 'Sunday', slots: ['10:00 AM–1:00 PM  Full Mock Test', '2:00–5:00 PM  Review + Counselling'], color: 'border-violet-500/40' },
];

const FACULTY = [
  { name: 'Anuj Sharma', title: 'Mathematics', org: 'Ex-Google, NIT Trichy alumni', initials: 'AS', color: 'bg-indigo-500' },
  { name: 'Priya Mehta', title: 'Reasoning & CS', org: 'Software Engineer, NIMCET AIR-3 (2021)', initials: 'PM', color: 'bg-amber-500' },
  { name: 'Rohit Kumar', title: 'Mathematics', org: 'PhD IIT Delhi, 6 yrs NIMCET coaching', initials: 'RK', color: 'bg-emerald-500' },
  { name: 'Shruti Verma', title: 'English & GK', org: 'NIT Warangal, Communication Expert', initials: 'SV', color: 'bg-rose-500' },
];

const STATS = [
  { value: '30+', label: 'NITs Covered', icon: GraduationCap, color: 'text-primary' },
  { value: '1200+', label: 'Students Enrolled', icon: Users, color: 'text-emerald-500' },
  { value: '94%', label: 'Qualify Rate', icon: Trophy, color: 'text-amber-500' },
  { value: '20+', label: 'Full Mock Tests', icon: FileText, color: 'text-violet-500' },
];

const COUNSELLING_POINTS = [
  'Rank-based NIT college shortlisting across 30+ campuses',
  'Branch selection guidance (MCA, M.Sc. CS, etc.)',
  'Cutoff analysis from last 5 years for every NIT',
  'Document & admission process walkthroughs',
  'Post-result career roadmap sessions',
];

const MOCK_FEATURES = [
  { icon: Clock, text: '120-minute timed tests — exact NIMCET pattern' },
  { icon: BarChart3, text: 'Section-wise accuracy, speed and attempt rate analysis' },
  { icon: TrendingUp, text: 'Percentile & rank estimate among enrolled cohort' },
  { icon: Medal, text: 'National leaderboard updated after every mock' },
  { icon: Target, text: 'Weak-topic heatmap and personalised revision plan' },
  { icon: Star, text: 'All-India rank prediction with seat availability map' },
];

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NimcetCourseLandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const enrollHref = isLoggedIn ? '/courses' : '/sign-in';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 -right-60 h-[700px] w-[700px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 -left-40 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 gap-1.5 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                  Live Now
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Video className="h-3 w-3" />
                  NIMCET 2025 Batch
                </Badge>
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  Crack{' '}
                  <span className="text-primary">NIMCET 2025</span>
                  <br />with scholar247
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-lg leading-relaxed">
                  India's most comprehensive NIMCET prep platform — live daily classes, weekend marathons, IIT/NIT faculty, personalised counselling and an AI-powered mock test series with real-time rankings.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={enrollHref}>
                    {isLoggedIn ? 'Go to My Courses' : 'Enroll Now — Free'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#schedule">
                    <Calendar className="h-4 w-4" />
                    View Schedule
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Free trial available</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Instant access</span>
              </div>
            </div>

            {/* Right — feature preview card */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                {/* Live class mock header */}
                <div className="bg-muted/60 px-5 py-3 flex items-center gap-3 border-b border-border">
                  <div className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                  <span className="text-sm font-medium">Wave Optics — Mathematics</span>
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> 342 watching
                  </span>
                </div>

                {/* Fake video placeholder */}
                <div className="relative bg-gradient-to-br from-primary/10 to-indigo-500/5 aspect-video flex items-center justify-center">
                  <div className="rounded-full bg-primary/20 p-6 backdrop-blur">
                    <Play className="h-10 w-10 text-primary fill-primary" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/5 rounded-full" />
                    </div>
                    <span className="text-xs text-muted-foreground">42:18 / 1:45:00</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                  {[
                    { label: 'Questions Solved', value: '18', color: 'text-primary' },
                    { label: 'Streak', value: '🔥 7', color: 'text-amber-500' },
                    { label: 'Accuracy', value: '83%', color: 'text-success' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="px-4 py-3 text-center">
                      <p className={cn('text-xl font-bold', color)}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating counselling badge */}
              <div className="absolute -bottom-4 -left-6 rounded-xl border border-border bg-card shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold">1-on-1 Counselling</p>
                  <p className="text-xs text-muted-foreground">NIT seat selection support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core features ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to crack NIMCET</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            A complete ecosystem — not just video lessons. Live, interactive, personalised.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl mb-4', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Schedule ────────────────────────────────────────────────────────── */}
      <section id="schedule" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Weekly Class Schedule</h2>
              <p className="text-muted-foreground mb-8">
                Structured week-by-week with live classes every evening and intensive weekend marathons.
              </p>

              <div className="space-y-3">
                {SCHEDULE.map(({ day, slots, color }) => (
                  <div key={day} className={cn('rounded-xl border-l-4 bg-card border border-border pl-0 overflow-hidden', color)}>
                    <div className="flex items-start gap-4 p-4">
                      <div className="w-20 shrink-0">
                        <p className="text-sm font-bold">{day}</p>
                      </div>
                      <div className="space-y-1">
                        {slots.map((slot) => (
                          <p key={slot} className="text-sm text-muted-foreground">{slot}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam pattern */}
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold text-lg mb-1">NIMCET 2025 Pattern</h3>
                <p className="text-sm text-muted-foreground mb-5">120 Q · 480 marks · 120 min · +4/−1</p>
                <div className="space-y-3">
                  {SYLLABUS.map(({ name, questions, marks, weight, icon: Icon, color, bg }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', bg)}>
                        <Icon className={cn('h-4 w-4', color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{weight}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{questions} Q · {marks} marks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link href={enrollHref}>
                  Start Learning Today
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Faculty ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Learn from the best</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Industry engineers and NIT/IIT faculty who&apos;ve been where you want to go.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FACULTY.map(({ name, title, org, initials, color }) => (
            <div
              key={name}
              className="rounded-2xl border border-border bg-card p-5 text-center hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className={cn('h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4', color)}>
                {initials}
              </div>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-primary font-medium mt-0.5">{title}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{org}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          + 6 more domain-expert guest instructors throughout the batch
        </p>
      </section>

      {/* ── Mock tests & Rankings ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <Badge className="mb-3 bg-violet-500/10 text-violet-500 border-violet-500/20">Mock Test Series</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Train like it&apos;s exam day. Every time.</h2>
                <p className="mt-3 text-muted-foreground">
                  20+ full-length NIMCET pattern mocks built on real past-year question banks — timed, evaluated, ranked.
                </p>
              </div>

              <ul className="space-y-3">
                {MOCK_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-violet-500" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rank card mock */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
              <div className="bg-gradient-to-br from-violet-500/10 to-primary/5 px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-sm">Mock Test #12 — Full NIMCET</p>
                  <Badge variant="outline" className="text-xs">Completed</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Score', value: '364 / 480', color: 'text-primary' },
                    { label: 'Accuracy', value: '82.6%', color: 'text-success' },
                    { label: 'Rank', value: '#47 / 1,284', color: 'text-amber-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className={cn('text-xl font-bold', color)}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject Breakdown</p>
                {[
                  { name: 'Mathematics', score: 168, max: 200, pct: 84 },
                  { name: 'Reasoning', score: 128, max: 160, pct: 80 },
                  { name: 'CS + English + GK', score: 68, max: 120, pct: 57 },
                ].map(({ name, score, max, pct }) => (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium">{score}/{max}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Estimated NIT rank at this score: <span className="font-semibold text-foreground">~300</span></p>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Counselling ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 to-primary/5 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 md:p-10 space-y-6">
              <div>
                <Badge className="mb-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  1-on-1 Counselling
                </Badge>
                <h2 className="text-3xl font-bold">Getting into the right NIT matters as much as cracking the exam.</h2>
                <p className="mt-3 text-muted-foreground">
                  Our NIMCET toppers and admissions experts guide you from rank prediction to final seat allotment — so you never make a wrong choice.
                </p>
              </div>

              <ul className="space-y-3">
                {COUNSELLING_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{point}</p>
                  </li>
                ))}
              </ul>

              <Button variant="outline" asChild>
                <Link href={enrollHref}>
                  Book a Free Session
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 p-8 md:p-10 flex flex-col justify-center space-y-5 border-t lg:border-t-0 lg:border-l border-border/50">
              {[
                { label: 'NITs with MCA seats', value: '30+', icon: GraduationCap },
                { label: 'Avg cutoff improvement per year', value: '↓8 marks', icon: TrendingUp },
                { label: 'Students counselled (2024 batch)', value: '600+', icon: Users },
                { label: 'Seats secured in NITs', value: '480+', icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-4 rounded-xl bg-card/60 border border-border/50 px-4 py-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mx-auto">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Your NIMCET 2025 journey starts today.
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join 1 200+ students already preparing with scholar247. Seats in the live batch are limited.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href={enrollHref}>
                {isLoggedIn ? 'Go to My Courses' : 'Enroll for Free'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/practice?exam=nimcet">
                <BookOpen className="h-4 w-4" />
                Try Free Practice
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Free plan available · No credit card required · Upgrade anytime
          </p>
        </div>
      </section>

    </div>
  );
}
