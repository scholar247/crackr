import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { serverGet } from '@/lib/server-fetch';
import { Button } from '@/components/ui/button';
import {
  Video, Users, Zap, CheckCircle2, ArrowRight, Radio, BookOpen, BarChart3,
  GraduationCap, Star, Clock, Layers, Trophy, Calendar,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Courses — Expert-led prep for competitive exams | crackr',
  description: 'Live and recorded courses by industry engineers and IIT-NIT faculty. Mock tests, rankings, counselling — everything you need to crack your exam.',
};

const PERKS = [
  { icon: Radio, title: 'Daily Live Classes', desc: 'Interactive sessions every day, not pre-recorded fluff' },
  { icon: Calendar, title: 'Weekend Marathons', desc: 'Intensive revision sessions to lock in concepts' },
  { icon: GraduationCap, title: 'IIT/NIT + Industry Faculty', desc: 'Taught by engineers who cracked the exams themselves' },
  { icon: Trophy, title: 'Mock Test Series', desc: 'Full-length mocks with real-exam pattern and analysis' },
  { icon: BarChart3, title: 'Progress & Rankings', desc: 'Detailed reports, percentile and subject-wise breakdown' },
  { icon: BookOpen, title: 'Complete Counselling', desc: 'College preference lists, cutoff trends, seat matrix' },
];

const TYPE_LABEL: Record<string, string> = {
  LIVE: 'Live',
  RECORDED: 'Recorded',
  HYBRID: 'Live + Recorded',
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default async function CoursesPage() {
  const [session, { courses, exams }] = await Promise.all([
    auth(),
    serverGet<{ courses: any[]; exams: any[] }>('/api/public/courses'),
  ]);

  const isLoggedIn = !!session?.user;
  const examMap = new Map(exams.map((e) => [e.id, e]));

  const nimcetCourse = courses.find(
    (c) => examMap.get(c.examId)?.slug === 'nimcet' || examMap.get(c.examId)?.name?.toLowerCase().includes('nimcet')
  );
  const otherCourses = courses.filter((c) => c.id !== nimcetCourse?.id);

  const totalEnrolled = courses.reduce((s, c) => s + c.enrolledCount, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)]">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Radio className="h-3.5 w-3.5" />
            Live classes now available
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Expert-led courses to<br className="hidden sm:block" /> <span className="text-primary">crack competitive exams</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground">
            Learn from IIT/NIT alumni and industry engineers. Daily live sessions, marathon weekends, mocks with rankings — everything structured to get you results.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="#courses">
                Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {isLoggedIn ? (
              <Button size="lg" variant="outline" asChild>
                <Link href="/my-courses">My Courses</Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign in free</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-3 divide-x divide-border text-center">
          {[
            { label: 'Courses', value: courses.length || '—' },
            { label: 'Students enrolled', value: totalEnrolled > 0 ? totalEnrolled.toLocaleString() : '—' },
            { label: 'Live daily', value: 'Yes' },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 space-y-0.5">
              <p className="text-2xl font-extrabold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Everything you need to crack your exam</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 space-y-2 hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <h2 className="text-2xl font-bold text-center">Available Courses</h2>

          {/* NIMCET featured card */}
          {nimcetCourse ? (
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-background p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="rounded-full bg-primary/15 text-primary text-xs font-bold px-3 py-1">⭐ Featured</span>
                  <span className="rounded-full bg-muted text-muted-foreground text-xs px-2.5 py-0.5">
                    {TYPE_LABEL[nimcetCourse.type] ?? nimcetCourse.type}
                  </span>
                  <span className={`rounded-full text-xs px-2.5 py-0.5 font-medium ${LEVEL_COLOR[nimcetCourse.level] ?? ''}`}>
                    {nimcetCourse.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{nimcetCourse.title}</h3>
                {nimcetCourse.shortDescription && (
                  <p className="text-sm text-muted-foreground">{nimcetCourse.shortDescription}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {nimcetCourse.enrolledCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> {nimcetCourse.enrolledCount.toLocaleString()} enrolled
                    </span>
                  )}
                  {nimcetCourse.totalLessons > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4" /> {nimcetCourse.totalLessons} lessons
                    </span>
                  )}
                  {nimcetCourse.totalHours > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {nimcetCourse.totalHours}h of content
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/courses/nimcet">
                    View NIMCET Course <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {isLoggedIn && (
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={`/courses/${nimcetCourse.id}`}>Go to Dashboard</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-background p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2 items-center">
                  <span className="rounded-full bg-primary/15 text-primary text-xs font-bold px-3 py-1">⭐ Featured</span>
                  <span className="rounded-full bg-muted text-muted-foreground text-xs px-2.5 py-0.5">Live</span>
                </div>
                <h3 className="text-xl font-bold">NIMCET Complete Prep</h3>
                <p className="text-sm text-muted-foreground">Daily live classes, marathon weekends, full mocks, IIT/NIT faculty. Everything to crack NIMCET.</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {['Daily live classes', 'Weekend marathons', 'Mock series', 'Counselling'].map((f) => (
                    <span key={f} className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {f}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild size="lg" className="shrink-0 w-full sm:w-auto">
                <Link href="/courses/nimcet">
                  View NIMCET Course <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {/* Other courses */}
          {otherCourses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherCourses.map((course) => {
                const exam = examMap.get(course.examId);
                const href = isLoggedIn ? `/courses/${course.id}` : '/sign-in';
                return (
                  <Link
                    key={course.id}
                    href={href}
                    className="group rounded-xl border border-border bg-card p-5 space-y-3 hover:shadow-md hover:border-primary/30 transition-all"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {exam && (
                        <span className="rounded-full bg-muted text-muted-foreground text-xs px-2.5 py-0.5 font-medium">
                          {exam.name}
                        </span>
                      )}
                      <span className="rounded-full bg-muted text-muted-foreground text-xs px-2.5 py-0.5">
                        {TYPE_LABEL[course.type] ?? course.type}
                      </span>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{course.title}</h3>
                    {course.shortDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      {course.enrolledCount > 0 ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {course.enrolledCount.toLocaleString()}
                        </span>
                      ) : <span />}
                      <span className="flex items-center gap-1 text-primary font-medium">
                        Learn more <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {courses.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
              <Video className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">More courses coming soon</p>
              <p className="text-sm text-muted-foreground">We&apos;re building them now. Check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mx-auto">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Start your prep today — it&apos;s free</h2>
          <p className="text-muted-foreground">
            Practice MCQs, attempt mocks, and track your progress. Upgrade to a course when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/sign-in">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/courses/nimcet">
                    <Star className="mr-2 h-4 w-4" /> Explore NIMCET Course
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
