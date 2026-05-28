import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  BarChart2,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Trophy,
  Flame,
  Star,
  Shield,
  Crown,
  Swords,
  GraduationCap,
  Video,
  CalendarDays,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { serverGet } from '@/lib/server-fetch';

export const metadata: Metadata = { title: 'Dashboard | crackr' };

const QUICK_LINKS = [
  { label: 'NIMCET Hub', href: '/nimcet', icon: Target, description: 'Exam overview & countdown' },
  { label: 'Study Plan', href: '/study-plan', icon: CalendarDays, description: 'Today\'s personalized tasks' },
  { label: 'Practice MCQs', href: '/practice', icon: BookOpen, description: 'Drill questions by subject' },
  { label: 'Mock Tests', href: '/mocks', icon: ClipboardList, description: 'Timed full-length mocks' },
  { label: 'Syllabus', href: '/syllabus', icon: Map, description: 'Track topic coverage' },
  { label: 'My Progress', href: '/progress', icon: BarChart2, description: 'Charts and analytics' },
];

// ─── Level system ─────────────────────────────────────────────────────────────

interface LevelInfo {
  level: number;
  title: string;
  icon: typeof Trophy;
  color: string;
  nextAt: number | null;
  xpFromPrev: number;
}

const LEVELS: { at: number; title: string; icon: typeof Trophy; color: string }[] = [
  { at: 0,    title: 'Rookie',    icon: Shield,        color: 'text-slate-400' },
  { at: 10,   title: 'Learner',   icon: BookOpen,      color: 'text-blue-400' },
  { at: 30,   title: 'Explorer',  icon: Zap,           color: 'text-cyan-500' },
  { at: 75,   title: 'Scholar',   icon: GraduationCap, color: 'text-violet-500' },
  { at: 150,  title: 'Expert',    icon: Swords,        color: 'text-amber-500' },
  { at: 300,  title: 'Master',    icon: Star,          color: 'text-orange-500' },
  { at: 600,  title: 'Champion',  icon: Trophy,        color: 'text-yellow-500' },
  { at: 1000, title: 'Legend',    icon: Crown,         color: 'text-gold' },
];

function getLevelInfo(totalAttempts: number): LevelInfo {
  let current = LEVELS[0];
  let currentIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalAttempts >= LEVELS[i].at) {
      current = LEVELS[i];
      currentIdx = i;
      break;
    }
  }
  const next = LEVELS[currentIdx + 1] ?? null;
  return {
    level: currentIdx + 1,
    title: current.title,
    icon: current.icon,
    color: current.color,
    nextAt: next?.at ?? null,
    xpFromPrev: current.at,
  };
}

// ─── Achievement badges ───────────────────────────────────────────────────────

interface Achievement {
  id: string;
  label: string;
  desc: string;
  icon: string;
  earned: boolean;
}

function getAchievements(totalAttempts: number, bestStreak: number, avgScore: number): Achievement[] {
  return [
    {
      id: 'first-attempt',
      label: 'First Step',
      desc: 'Complete your first attempt',
      icon: '🎯',
      earned: totalAttempts >= 1,
    },
    {
      id: 'hot-streak',
      label: 'On Fire',
      desc: '5+ answer streak in one session',
      icon: '🔥',
      earned: bestStreak >= 5,
    },
    {
      id: 'ten-attempts',
      label: 'Committed',
      desc: 'Complete 10 attempts',
      icon: '📚',
      earned: totalAttempts >= 10,
    },
    {
      id: 'fifty-attempts',
      label: 'Grinder',
      desc: 'Complete 50 attempts',
      icon: '⚡',
      earned: totalAttempts >= 50,
    },
    {
      id: 'century',
      label: 'Century',
      desc: 'Complete 100 attempts',
      icon: '💯',
      earned: totalAttempts >= 100,
    },
    {
      id: 'high-scorer',
      label: 'High Scorer',
      desc: 'Avg score above 80%',
      icon: '🏆',
      earned: avgScore >= 80,
    },
    {
      id: 'blazing-streak',
      label: 'Blazing',
      desc: '10+ answer streak in one session',
      icon: '🌟',
      earned: bestStreak >= 10,
    },
    {
      id: 'legend',
      label: 'Legend',
      desc: 'Complete 1000 attempts',
      icon: '👑',
      earned: totalAttempts >= 1000,
    },
  ];
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  let progress = null;
  try {
    progress = await serverGet<any>('/api/progress?type=all');
  } catch {
    // Silently fail — new users have no data
  }

  // Courses data
  let myCourses: Array<{ id: string; title: string; thumbnailUrl?: string; progress: number; lastLessonId?: string }> = [];
  let upcomingLiveSessions: Array<{ id: string; title: string; courseTitle: string; scheduledAt: string; joinUrl?: string | null; status: string; courseId: string }> = [];
  let nimcetExamId: string | null = null;
  try {
    const dashData = await serverGet<{ myCourses: typeof myCourses; upcomingLiveSessions: typeof upcomingLiveSessions; nimcetExamId: string | null }>('/api/student/dashboard');
    myCourses = dashData.myCourses;
    upcomingLiveSessions = dashData.upcomingLiveSessions;
    nimcetExamId = dashData.nimcetExamId;
  } catch { /* Silently fail */ }

  const NIMCET_DATE = new Date('2025-06-01T09:00:00+05:30');
  const daysToNimcet = Math.max(0, Math.ceil((NIMCET_DATE.getTime() - Date.now()) / 86400000));

  const trend = progress?.summary.improvementTrend ?? 'stable';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const totalAttempts = progress?.summary.totalAttempts ?? 0;
  const avgScore = progress?.summary.avgScore ?? 0;
  const bestStreak = progress?.summary.bestStreak ?? 0;
  const levelInfo = getLevelInfo(totalAttempts);
  const LevelIcon = levelInfo.icon;
  const achievements = getAchievements(totalAttempts, bestStreak, avgScore);
  const earnedCount = achievements.filter(a => a.earned).length;

  // XP progress within current level
  const xpInLevel = totalAttempts - levelInfo.xpFromPrev;
  const xpNeeded = levelInfo.nextAt !== null ? levelInfo.nextAt - levelInfo.xpFromPrev : 1;
  const levelPct = levelInfo.nextAt !== null ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  const stats = [
    {
      label: 'Total Attempts',
      value: progress?.summary.totalAttempts ?? 0,
      icon: Target,
    },
    {
      label: 'Avg Score',
      value: progress?.summary.avgScore ? `${Math.round(progress.summary.avgScore)}%` : '—',
      icon: BarChart2,
    },
    {
      label: 'Best Streak',
      value: progress?.summary.bestStreak ?? 0,
      icon: Flame,
    },
    {
      label: 'Trend',
      value: trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable',
      icon: TrendIcon,
      trend,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with level badge */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session.user.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ready to practice? Pick up where you left off.
          </p>
        </div>

        {/* Level badge */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2', levelInfo.color, 'border-current bg-current/10')}>
            <LevelIcon className={cn('h-5 w-5', levelInfo.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Lv.{levelInfo.level} {levelInfo.title}</span>
            </div>
            {levelInfo.nextAt !== null ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${levelPct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{xpInLevel}/{xpNeeded}</span>
              </div>
            ) : (
              <span className="text-xs text-gold font-medium" style={{ color: 'var(--color-gold)' }}>MAX LEVEL</span>
            )}
          </div>
        </div>
      </div>

      {/* NIMCET Exam Countdown Banner */}
      {nimcetExamId && daysToNimcet <= 180 && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">NIMCET 2025</p>
              <p className="text-xs text-muted-foreground">
                {daysToNimcet > 0 ? (
                  <><span className="font-bold text-foreground">{daysToNimcet} days</span> until the exam · June 1, 2025</>
                ) : 'Exam day is here!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link href="/study-plan">
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Study Plan
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 text-xs">
              <Link href="/nimcet">
                NIMCET Hub
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, trend: t }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
              <Icon
                className={cn(
                  'h-4 w-4',
                  t === 'up' ? 'text-success' : t === 'down' ? 'text-destructive' : 'text-muted-foreground'
                )}
              />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jump in</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ label, href, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Achievements
          </h2>
          <span className="text-xs text-muted-foreground">{earnedCount}/{achievements.length} earned</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={cn(
                'rounded-xl border p-3 text-center space-y-1.5 transition-all',
                ach.earned
                  ? 'border-gold/30 bg-gold/5'
                  : 'border-border bg-card opacity-40 grayscale'
              )}
              style={ach.earned ? {
                borderColor: 'color-mix(in oklch, var(--color-gold) 30%, transparent)',
                backgroundColor: 'color-mix(in oklch, var(--color-gold) 5%, transparent)',
              } : undefined}
              title={ach.desc}
            >
              <div className={cn('text-2xl', !ach.earned && 'blur-[1px]')}>{ach.icon}</div>
              <p className="text-xs font-semibold leading-tight">{ach.label}</p>
              <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{ach.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Courses */}
      {myCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Courses</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/courses">Browse All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {myCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}/learn`}
                className="flex-shrink-0 w-44 rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
              >
                <div className="h-24 bg-muted flex items-center justify-center">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-2.5 space-y-1.5">
                  <p className="text-xs font-semibold line-clamp-2 leading-snug">{course.title}</p>
                  <Progress value={course.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground">{course.progress}% complete</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Live Sessions */}
      {upcomingLiveSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Live</h2>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {upcomingLiveSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  s.status === 'LIVE' ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'
                )}>
                  <Video className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.courseTitle} · {new Date(s.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} IST
                  </p>
                </div>
                {s.status === 'LIVE' && s.joinUrl ? (
                  <a
                    href={s.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Join
                  </a>
                ) : (
                  <Button variant="outline" size="sm" className="shrink-0 text-xs h-7">Remind</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {progress?.recentActivity && progress.recentActivity.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/progress">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {progress.recentActivity.slice(0, 5).map((activity: any) => {
              const scorePercent = activity.totalMarks > 0
                ? Math.round((activity.score / activity.totalMarks) * 100)
                : 0;
              return (
                <div key={activity.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    scorePercent >= 60 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}>
                    {scorePercent}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.completedAt).toLocaleDateString()} · {activity.type === 'test' ? 'Test' : 'Mock'}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {activity.score}/{activity.totalMarks}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
