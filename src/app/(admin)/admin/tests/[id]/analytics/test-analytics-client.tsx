'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, Users, Target, Award } from 'lucide-react';
import { toCSV } from '@/lib/utils';
import type { TestClient } from '@/types';

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTakenSeconds: number;
  rank: number;
  submittedAt?: string;
}

interface QuestionStat {
  mcqId: string;
  totalResponses: number;
  correctCount: number;
  pctCorrect: number;
}

interface Stats {
  avgScore: number;
  passRate: number;
  completionRate: number;
  totalAttempts: number;
  scoreDistribution: { range: string; count: number }[];
}

interface TestAnalyticsClientProps {
  test: TestClient;
  stats: Stats | null;
  leaderboard: LeaderboardEntry[];
  questionStats: QuestionStat[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export function TestAnalyticsClient({
  test,
  stats,
  leaderboard,
  questionStats,
}: TestAnalyticsClientProps) {
  const [tab, setTab] = useState('overview');

  const exportLeaderboard = () => {
    const csv = toCSV(
      leaderboard.map((e) => ({
        Rank: e.rank,
        Name: e.name,
        Email: e.email,
        Score: e.score,
        'Total Marks': e.totalMarks,
        'Percentage (%)': e.percentage.toFixed(1),
        'Time Taken': formatTime(e.timeTakenSeconds),
        'Submitted At': e.submittedAt ? new Date(e.submittedAt).toLocaleString() : '',
      })),
      ['Rank', 'Name', 'Email', 'Score', 'Total Marks', 'Percentage (%)', 'Time Taken', 'Submitted At'] as any
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.title.replace(/\s+/g, '_')}_leaderboard.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-4xl mb-3">📊</p>
        <p className="font-medium">No submissions yet</p>
        <p className="text-sm mt-1">Analytics will appear once students submit their attempts</p>
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        <TabsTrigger value="questions">Question Analysis</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Attempts" value={String(stats.totalAttempts)} />
          <StatCard icon={TrendingUp} label="Avg Score" value={`${stats.avgScore.toFixed(1)}%`} />
          <StatCard icon={Target} label="Pass Rate" value={`${stats.passRate.toFixed(1)}%`}
            sub={`Pass mark: ${test.passMark}`} />
          <StatCard icon={Award} label="Top Score" value={
            leaderboard.length > 0 ? `${leaderboard[0].percentage.toFixed(1)}%` : '—'
          } />
        </div>

        {/* Score Distribution */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.scoreDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="oklch(0.51 0.194 264.4)" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="leaderboard" className="mt-4 space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportLeaderboard}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                {['Rank', 'Student', 'Score', 'Percentage', 'Time'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((entry, i) => (
                <tr key={entry.userId} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3">
                    <span className={
                      entry.rank === 1 ? 'text-amber-500 font-bold' :
                      entry.rank === 2 ? 'text-zinc-400 font-bold' :
                      entry.rank === 3 ? 'text-amber-700 font-bold' :
                      'text-muted-foreground'
                    }>
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">{entry.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {entry.score} / {entry.totalMarks}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${entry.percentage >= (test.passMark / test.totalMarks * 100)
                        ? 'border-success text-success'
                        : 'border-destructive text-destructive'
                      }`}
                    >
                      {entry.percentage.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatTime(entry.timeTakenSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="questions" className="mt-4 space-y-4">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                {['Q#', 'Correct', 'Incorrect', '% Correct', 'Difficulty Index'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questionStats.map((qs, i) => (
                <tr key={qs.mcqId} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3 text-sm font-medium">Q{i + 1}</td>
                  <td className="px-4 py-3 text-sm text-success">{qs.correctCount}</td>
                  <td className="px-4 py-3 text-sm text-destructive">
                    {qs.totalResponses - qs.correctCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-24">
                        <div
                          className={`h-full rounded-full ${qs.pctCorrect >= 60 ? 'bg-success' : qs.pctCorrect >= 30 ? 'bg-amber-500' : 'bg-destructive'}`}
                          style={{ width: `${qs.pctCorrect}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12">
                        {qs.pctCorrect.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        qs.pctCorrect >= 70 ? 'border-success text-success' :
                        qs.pctCorrect >= 30 ? 'border-amber-500 text-amber-600' :
                        'border-destructive text-destructive'
                      }`}
                    >
                      {qs.pctCorrect >= 70 ? 'Easy' : qs.pctCorrect >= 30 ? 'Medium' : 'Hard'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
