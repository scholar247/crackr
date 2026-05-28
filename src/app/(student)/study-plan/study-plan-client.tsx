'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, addDays, startOfWeek, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import {
  CheckCircle2, Circle, Play, BookOpen, Target, Flame,
  ChevronLeft, ChevronRight, ArrowRight, Calculator, Cpu,
  Brain, Globe, Clock, Plus, RotateCcw, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudyTask {
  id: string;
  type: 'lesson' | 'practice' | 'mock' | 'revision';
  title: string;
  subtitle?: string;
  duration: number; // minutes
  href: string;
  subject?: string;
  subjectColor?: string;
  priority: 'high' | 'medium' | 'low';
}

interface DayPlan {
  date: string; // YYYY-MM-DD
  tasks: StudyTask[];
  totalMinutes: number;
  completedTaskIds: string[];
}

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  lastLessonId?: string;
}

interface SyllabusCoverage {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  attempted: number;
  total: number;
}

interface StudyPlanClientProps {
  examDate: string;
  enrolledCourses: EnrolledCourse[];
  coverage: SyllabusCoverage[];
  dailyGoal: number;
  examId?: string;
  userName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  Mathematics: Calculator,
  'Computer Applications': Cpu,
  'Analytical Ability & Logical Reasoning': Brain,
  'General English': BookOpen,
  'General Awareness': Globe,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STORAGE_KEY = 'nimcet-study-plan';

// ─── Plan generation ──────────────────────────────────────────────────────────

function generateDayPlan(
  date: Date,
  courses: EnrolledCourse[],
  coverage: SyllabusCoverage[],
  examId?: string
): StudyTask[] {
  const tasks: StudyTask[] = [];
  const dayOfWeek = date.getDay();

  // Rotate subjects based on day of week
  const weakSubjects = [...coverage]
    .sort((a, b) => (a.attempted / Math.max(a.total, 1)) - (b.attempted / Math.max(b.total, 1)));

  // Primary subject for the day
  const primarySubject = weakSubjects[dayOfWeek % Math.max(weakSubjects.length, 1)];
  const secondarySubject = weakSubjects[(dayOfWeek + 1) % Math.max(weakSubjects.length, 1)];

  // Add lesson task if enrolled in courses
  if (courses.length > 0) {
    const course = courses[0];
    tasks.push({
      id: `lesson-${date.toISOString().slice(0, 10)}`,
      type: 'lesson',
      title: 'Continue Course Lessons',
      subtitle: course.title,
      duration: 45,
      href: `/courses/${course.id}/learn`,
      priority: 'high',
    });
  }

  // Add practice tasks for weak subjects
  if (primarySubject) {
    tasks.push({
      id: `practice-${primarySubject.subjectId}-${date.toISOString().slice(0, 10)}`,
      type: 'practice',
      title: `Practice: ${primarySubject.subjectName}`,
      subtitle: `${primarySubject.total - primarySubject.attempted} topics not yet attempted`,
      duration: 30,
      href: examId
        ? `/practice?examId=${examId}`
        : '/practice',
      subject: primarySubject.subjectName,
      subjectColor: primarySubject.subjectColor,
      priority: 'high',
    });
  }

  if (secondarySubject && secondarySubject !== primarySubject) {
    tasks.push({
      id: `practice-${secondarySubject.subjectId}-${date.toISOString().slice(0, 10)}-2`,
      type: 'practice',
      title: `Practice: ${secondarySubject.subjectName}`,
      subtitle: '10 targeted MCQs',
      duration: 20,
      href: '/practice',
      subject: secondarySubject.subjectName,
      subjectColor: secondarySubject.subjectColor,
      priority: 'medium',
    });
  }

  // Add mock on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    tasks.push({
      id: `mock-${date.toISOString().slice(0, 10)}`,
      type: 'mock',
      title: 'Full-Length Mock Test',
      subtitle: '120 questions · 2 hours',
      duration: 120,
      href: '/mocks',
      priority: 'high',
    });
  }

  // Add revision on alternate days
  if (dayOfWeek % 2 === 1 && weakSubjects.length > 0) {
    tasks.push({
      id: `revision-${date.toISOString().slice(0, 10)}`,
      type: 'revision',
      title: 'Revision: Syllabus Review',
      subtitle: 'Review marked topics & notes',
      duration: 15,
      href: '/syllabus',
      priority: 'low',
    });
  }

  return tasks;
}

// ─── Task card ────────────────────────────────────────────────────────────────

const TASK_ICONS: Record<StudyTask['type'], React.ElementType> = {
  lesson: Play,
  practice: Target,
  mock: BookOpen,
  revision: RotateCcw,
};

const TASK_COLORS: Record<StudyTask['type'], string> = {
  lesson: 'text-primary bg-primary/10',
  practice: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  mock: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
  revision: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
};

function TaskCard({
  task,
  completed,
  onToggle,
}: {
  task: StudyTask;
  completed: boolean;
  onToggle: () => void;
}) {
  const Icon = TASK_ICONS[task.type];
  const colorClass = TASK_COLORS[task.type];

  return (
    <div className={cn(
      'group flex items-start gap-3 rounded-xl border p-3 transition-all',
      completed
        ? 'border-success/20 bg-success/5 opacity-70'
        : 'border-border bg-card hover:border-primary/40'
    )}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: completed ? 'var(--color-success)' : undefined,
          backgroundColor: completed ? 'var(--color-success)' : undefined,
        }}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed && <CheckCircle2 className="h-4 w-4 text-white" />}
      </button>

      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn('text-sm font-medium line-clamp-1', completed && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {task.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{task.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {task.subjectColor && (
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: task.subjectColor }}
            />
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {task.duration} min
          </span>
          {task.priority === 'high' && (
            <span className="text-xs text-rose-500 font-medium">High priority</span>
          )}
        </div>
      </div>

      {!completed && (
        <Button asChild size="sm" variant="ghost" className="h-7 shrink-0 text-xs">
          <Link href={task.href}>
            Start <ArrowRight className="h-3 w-3 ml-0.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}

// ─── Week calendar ────────────────────────────────────────────────────────────

function WeekCalendar({
  weekStart,
  completedByDay,
  totalByDay,
  selectedDate,
  onSelect,
}: {
  weekStart: Date;
  completedByDay: Record<string, number>;
  totalByDay: Record<string, number>;
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 7 }).map((_, i) => {
        const day = addDays(weekStart, i);
        const key = format(day, 'yyyy-MM-dd');
        const total = totalByDay[key] ?? 0;
        const done = completedByDay[key] ?? 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const isSelected = format(selectedDate, 'yyyy-MM-dd') === key;
        const isTodayDay = isToday(day);
        const isPastDay = isPast(day) && !isToday(day);

        return (
          <button
            key={key}
            onClick={() => onSelect(day)}
            className={cn(
              'flex flex-col items-center rounded-lg p-2 text-xs transition-colors',
              isSelected ? 'bg-primary text-primary-foreground' :
              isTodayDay ? 'bg-primary/10 text-primary border border-primary/30' :
              'hover:bg-accent text-muted-foreground'
            )}
          >
            <span className="text-[10px] uppercase">{DAY_NAMES[day.getDay()]}</span>
            <span className="font-bold text-sm mt-0.5">{format(day, 'd')}</span>
            {total > 0 && (
              <div className={cn(
                'mt-1 h-1 w-6 rounded-full overflow-hidden',
                isSelected ? 'bg-primary-foreground/30' : 'bg-muted'
              )}>
                <div
                  className={cn('h-full rounded-full', pct === 100 ? 'bg-success' : isSelected ? 'bg-primary-foreground' : 'bg-primary')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            {isTodayDay && !isSelected && (
              <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudyPlanClient({
  examDate,
  enrolledCourses,
  coverage,
  dailyGoal,
  examId,
  userName,
}: StudyPlanClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState<Record<string, DayPlan>>({});

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);

  const daysUntilExam = differenceInDays(new Date(examDate), new Date());

  // Load plans from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPlans(JSON.parse(stored));
    } catch { /* ok */ }
  }, []);

  const savePlans = useCallback((updated: Record<string, DayPlan>) => {
    setPlans(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ok */ }
  }, []);

  // Get or generate plan for selected date
  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const currentPlan = plans[selectedKey] ?? {
    date: selectedKey,
    tasks: generateDayPlan(selectedDate, enrolledCourses, coverage, examId),
    totalMinutes: 0,
    completedTaskIds: [],
  };
  const totalMinutes = currentPlan.tasks.reduce((s, t) => s + t.duration, 0);
  const completedCount = currentPlan.completedTaskIds.length;
  const totalCount = currentPlan.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleTask = (taskId: string) => {
    const plan = { ...currentPlan };
    const idx = plan.completedTaskIds.indexOf(taskId);
    if (idx >= 0) {
      plan.completedTaskIds = plan.completedTaskIds.filter((id) => id !== taskId);
    } else {
      plan.completedTaskIds = [...plan.completedTaskIds, taskId];
      if (plan.completedTaskIds.length === plan.tasks.length) {
        toast.success('Day complete! Great work 🎉');
      }
    }
    savePlans({ ...plans, [selectedKey]: plan });
  };

  // Build week stats
  const completedByDay: Record<string, number> = {};
  const totalByDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const key = format(d, 'yyyy-MM-dd');
    const p = plans[key];
    completedByDay[key] = p?.completedTaskIds.length ?? 0;
    const tasks = p?.tasks ?? generateDayPlan(d, enrolledCourses, coverage, examId);
    totalByDay[key] = tasks.length;
  }

  // Streak calculation
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const key = format(checkDate, 'yyyy-MM-dd');
    const p = plans[key];
    if (!p || p.completedTaskIds.length === 0) break;
    if (p.completedTaskIds.length < p.tasks.length && !isToday(checkDate)) break;
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  const dayLabel = isToday(selectedDate)
    ? "Today's Plan"
    : isTomorrow(selectedDate)
    ? "Tomorrow's Plan"
    : format(selectedDate, 'EEE, MMM d');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Study Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hey {userName.split(' ')[0]}! Stay consistent and crack NIMCET.
          </p>
        </div>

        {/* Exam countdown */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Exam in</p>
            <p className="text-lg font-bold">
              {daysUntilExam > 0 ? `${daysUntilExam} days` : 'Today!'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xl font-bold">{streak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Day streak</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
          <span className="text-xl font-bold">{completedCount}/{totalCount}</span>
          <p className="text-xs text-muted-foreground">Today's tasks</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
          <span className="text-xl font-bold">{totalMinutes}m</span>
          <p className="text-xs text-muted-foreground">Planned today</p>
        </div>
      </div>

      {/* Week calendar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Week of {format(weekStart, 'MMM d')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs"
              onClick={() => { setWeekOffset(0); setSelectedDate(new Date()); }}
            >
              Today
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <WeekCalendar
          weekStart={weekStart}
          completedByDay={completedByDay}
          totalByDay={totalByDay}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      </div>

      {/* Daily plan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dayLabel}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalMinutes} min planned</span>
            </div>
            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold">{progressPct}%</span>
          </div>
        </div>

        {currentPlan.tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
            <Circle className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium">No tasks planned</p>
            <p className="text-xs text-muted-foreground">
              Enroll in a NIMCET course to get a personalized study plan.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {currentPlan.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                completed={currentPlan.completedTaskIds.includes(task.id)}
                onToggle={() => toggleTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subject balance */}
      {coverage.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Subject Coverage
          </h2>
          <div className="space-y-2">
            {coverage.map((sub) => {
              const SubIcon = SUBJECT_ICONS[sub.subjectName] ?? Target;
              const pct = sub.total > 0 ? Math.round((sub.attempted / sub.total) * 100) : 0;
              const isStrong = pct >= 70;
              const isWeak = sub.attempted > 0 && pct < 40;

              return (
                <div key={sub.subjectId} className="flex items-center gap-3">
                  <SubIcon
                    className="h-4 w-4 shrink-0"
                    style={{ color: sub.subjectColor }}
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{sub.subjectName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isWeak && <span className="text-xs text-amber-500 font-medium">Weak</span>}
                        {isStrong && <span className="text-xs text-success font-medium">Strong</span>}
                        <span className="text-xs text-muted-foreground">{sub.attempted}/{sub.total}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isStrong ? 'var(--color-success)' : sub.subjectColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Daily goal reminder */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
        <Target className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Daily Goal: {dailyGoal} MCQs</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consistent daily practice is the key to NIMCET success.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/practice">
            Practice <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
