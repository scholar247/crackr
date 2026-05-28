'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  BarChart2,
  AlertTriangle,
  Calendar,
  CheckCircle,
  BookOpen,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SubjectClient, ProgressData } from '@/types';
import { cn } from '@/lib/utils';

interface ProgressClientProps {
  subjects: SubjectClient[];
}

type RangeOption = '7d' | '30d' | '90d' | 'all';
type TypeOption = 'all' | 'mocks' | 'tests';

const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const DIFFICULTY_COLORS = {
  EASY: '#10b981',
  MEDIUM: '#f59e0b',
  HARD: '#ef4444',
  EXPERT: '#8b5cf6',
};

async function fetchProgress(params: URLSearchParams): Promise<ProgressData> {
  const res = await fetch(`/api/progress?${params}`);
  const json = await res.json();
  return json.data as ProgressData;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <span
            className={cn(
              'mb-1 flex items-center gap-0.5 text-xs font-medium',
              trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold">{children}</h2>
  );
}

export function ProgressClient({ subjects }: ProgressClientProps) {
  const [range, setRange] = useState<RangeOption>('30d');
  const [type, setType] = useState<TypeOption>('all');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set('type', type);
    if (range !== 'all') {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      p.set('from', startOfDay(subDays(new Date(), days)).toISOString());
      p.set('to', new Date().toISOString());
    }
    if (selectedSubjectIds.length > 0) {
      p.set('subjectIds', selectedSubjectIds.join(','));
    }
    return p;
  }, [range, type, selectedSubjectIds]);

  const { data, isLoading } = useQuery({
    queryKey: ['progress', params.toString()],
    queryFn: () => fetchProgress(params),
  });

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Select value={range} onValueChange={(v) => setRange(v as RangeOption)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => setType(v as TypeOption)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="mocks">Mocks only</SelectItem>
            <SelectItem value="tests">Tests only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => {
            const selected = selectedSubjectIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {(selectedSubjectIds.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSubjectIds([])}
            className="text-xs text-muted-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <ProgressSkeleton />
      ) : !data ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No progress data yet</p>
          <p className="text-sm mt-1">Complete some tests or practice mocks to see your progress.</p>
        </div>
      ) : (
        <ProgressContent data={data} />
      )}
    </div>
  );
}

function ProgressContent({ data }: { data: ProgressData }) {
  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Attempts"
          value={data.summary.totalAttempts}
          icon={Target}
        />
        <StatCard
          label="Avg Score"
          value={`${Math.round(data.summary.avgScore)}%`}
          icon={BarChart2}
          trend={data.summary.improvementTrend}
        />
        <StatCard
          label="Best Streak"
          value={data.summary.bestStreak}
          icon={Zap}
          sub="consecutive correct"
        />
        <StatCard
          label="Trend"
          value={data.summary.improvementTrend === 'up' ? 'Improving' : data.summary.improvementTrend === 'down' ? 'Declining' : 'Stable'}
          icon={data.summary.improvementTrend === 'up' ? TrendingUp : data.summary.improvementTrend === 'down' ? TrendingDown : Minus}
          trend={data.summary.improvementTrend}
        />
      </div>

      {/* 2. Score Trend */}
      {data.scoreTrend.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <SectionTitle>Score Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.scoreTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => format(new Date(v), 'MMM d')}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, _: any, entry: any) => [
                  `${value}%`,
                  entry?.payload?.label ?? '',
                ]}
                labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dot={(props: any) => (
                  <circle
                    key={`dot-${props.cx}-${props.cy}`}
                    cx={props.cx ?? 0}
                    cy={props.cy ?? 0}
                    r={4}
                    fill={props.payload?.type === 'test' ? 'hsl(var(--primary))' : 'hsl(var(--success))'}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                )}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Test
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success" /> Mock
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Subject Radar */}
        {data.subjectProficiency.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <SectionTitle>Subject Proficiency</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={data.subjectProficiency} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subjectName"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Proficiency"
                  dataKey="proficiency"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${Math.round(v ?? 0)}%`, 'Proficiency']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. Difficulty Breakdown */}
        {data.difficultyBreakdown.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <SectionTitle>Difficulty Breakdown</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.difficultyBreakdown} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subjectName" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${Math.round(v ?? 0)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="EASY" name="Easy" stackId="a" fill={DIFFICULTY_COLORS.EASY} radius={[0, 0, 0, 0]} />
                <Bar dataKey="MEDIUM" name="Medium" stackId="a" fill={DIFFICULTY_COLORS.MEDIUM} />
                <Bar dataKey="HARD" name="Hard" stackId="a" fill={DIFFICULTY_COLORS.HARD} />
                <Bar dataKey="EXPERT" name="Expert" stackId="a" fill={DIFFICULTY_COLORS.EXPERT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. Topic Drilldown */}
      {data.topicStats.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <SectionTitle>Topic Performance</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Topic</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Subject</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Accuracy</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Attempted</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topicStats.map((topic, i) => (
                  <tr key={topic.topicId} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-4 py-3 text-sm font-medium">{topic.topicName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{topic.subjectName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${topic.accuracy}%`,
                              background:
                                topic.accuracy >= 70
                                  ? 'hsl(var(--success))'
                                  : topic.accuracy >= 40
                                  ? 'hsl(var(--warning))'
                                  : 'hsl(var(--destructive))',
                            }}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            topic.accuracy >= 70
                              ? 'text-success'
                              : topic.accuracy >= 40
                              ? 'text-warning'
                              : 'text-destructive'
                          )}
                        >
                          {Math.round(topic.accuracy)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{topic.attempted}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {topic.avgTimeSeconds < 60
                        ? `${Math.round(topic.avgTimeSeconds)}s`
                        : `${Math.floor(topic.avgTimeSeconds / 60)}m ${Math.round(topic.avgTimeSeconds % 60)}s`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Weak Areas */}
      {data.weakAreas.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <SectionTitle>Areas Needing Attention</SectionTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.weakAreas.map((area) => (
              <div
                key={area.topicId + (area.tagId ?? '')}
                className="rounded-lg border border-border bg-card p-3 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{area.topicName}</p>
                    {area.tagName && (
                      <p className="text-xs text-muted-foreground">{area.tagName}</p>
                    )}
                  </div>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {Math.round(area.accuracy)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{area.attempted} questions attempted</p>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive"
                    style={{ width: `${area.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Recent Activity Feed */}
      {data.recentActivity.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <SectionTitle>Recent Activity</SectionTitle>
          </div>
          <div className="divide-y divide-border">
            {data.recentActivity.map((activity) => {
              const scorePercent = activity.totalMarks > 0
                ? Math.round((activity.score / activity.totalMarks) * 100)
                : 0;
              return (
                <div key={activity.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      activity.type === 'test' ? 'bg-primary/10' : 'bg-success/10'
                    )}
                  >
                    {activity.type === 'test' ? (
                      <BookOpen className={cn('h-4 w-4', 'text-primary')} />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.completedAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant={scorePercent >= 60 ? 'success' : 'destructive'}
                      className="text-xs"
                    >
                      {activity.score}/{activity.totalMarks}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">{scorePercent}%</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {activity.type === 'test' ? 'Test' : 'Mock'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for charts */}
      {data.scoreTrend.length === 0 &&
        data.subjectProficiency.length === 0 &&
        data.topicStats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No data for the selected filters</p>
          <p className="text-sm mt-1">Try a wider date range or different subject filter.</p>
        </div>
      )}
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
