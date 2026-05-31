'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Download, BookOpen, Users, ClipboardList, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toCSV } from '@/lib/utils';

interface ReportsData {
  overview: {
    totalMCQs: number;
    totalUsers: number;
    activeTests: number;
    totalAttempts: number;
    avgScore: number;
  };
  scoreDistribution: { range: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  topTests: { id: string; title: string; attempts: number; avgScore: number }[];
}

async function fetchReports(days: string): Promise<ReportsData> {
  const res = await fetch(`/api/admin/reports?days=${days}`);
  return (await res.json()).data;
}

const OVERVIEW_CARDS = [
  { key: 'totalMCQs' as const, label: 'Total MCQs', icon: BookOpen, color: 'text-primary bg-primary/10' },
  { key: 'totalUsers' as const, label: 'Registered Users', icon: Users, color: 'text-success bg-success/10' },
  { key: 'activeTests' as const, label: 'Active Tests', icon: ClipboardList, color: 'text-warning bg-warning/10' },
  { key: 'totalAttempts' as const, label: 'Attempts (period)', icon: Activity, color: 'text-destructive bg-destructive/10' },
];

export function AdminReportsClient() {
  const [days, setDays] = useState('30');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', days],
    queryFn: () => fetchReports(days),
  });

  const exportTopTests = () => {
    if (!data?.topTests) return;
    const csv = toCSV(data.topTests, ['title', 'attempts', 'avgScore']);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholar247-top-tests-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDailyTrend = () => {
    if (!data?.dailyTrend) return;
    const csv = toCSV(data.dailyTrend, ['date', 'count']);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholar247-daily-attempts-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportDailyTrend} disabled={!data?.dailyTrend.length}>
            <Download className="h-3.5 w-3.5" />
            Export trend
          </Button>
          <Button variant="outline" size="sm" onClick={exportTopTests} disabled={!data?.topTests.length}>
            <Download className="h-3.5 w-3.5" />
            Export tests
          </Button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {OVERVIEW_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className={`rounded-lg p-1.5 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{data?.overview[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Avg score highlight */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-primary text-primary font-bold text-lg">
          {data?.overview.avgScore ?? 0}%
        </div>
        <div>
          <p className="font-semibold">Average score across all attempts</p>
          <p className="text-sm text-muted-foreground">Based on {data?.overview.totalAttempts ?? 0} submissions in the selected period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily attempts trend */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Daily Attempts</h2>
          {!data?.dailyTrend.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attempts in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.dailyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => format(new Date(v), 'MMM d')}
                />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')}
                />
                <Line type="monotone" dataKey="count" name="Attempts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score distribution */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Score Distribution</h2>
          {!data?.scoreDistribution.some((d) => d.count > 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attempts in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.scoreDistribution} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top tests table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Top Tests by Attempts</h2>
        </div>
        {!data?.topTests.length ? (
          <p className="text-sm text-muted-foreground text-center py-10">No test data in this period</p>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Test</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Attempts</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Avg Score</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Score bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.topTests.map((test, i) => (
                <tr key={test.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">{test.title}</td>
                  <td className="px-4 py-3 text-sm">{test.attempts}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{test.avgScore}%</td>
                  <td className="px-4 py-3">
                    <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${test.avgScore}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
