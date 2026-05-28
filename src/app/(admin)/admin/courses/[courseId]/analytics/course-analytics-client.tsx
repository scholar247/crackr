'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CourseAnalytics } from '@/types/course.types';

interface CourseAnalyticsClientProps {
  courseTitle: string;
  analytics: CourseAnalytics;
}

export function CourseAnalyticsClient({ courseTitle, analytics }: CourseAnalyticsClientProps) {
  const {
    totalEnrolled, activeStudents, avgProgress, completionRate, liveAttendanceRate,
    enrollmentTrend, progressDistribution, subjectCompletion, sessionAttendance, lessonEngagement,
  } = analytics;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">{courseTitle}</h1>
        <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Enrolled', value: totalEnrolled },
          { label: 'Active (7d)', value: activeStudents },
          { label: 'Avg Progress', value: `${avgProgress}%` },
          { label: 'Completion Rate', value: `${completionRate}%` },
          { label: 'Live Attendance', value: `${liveAttendanceRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Enrollment trend */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Enrollment Trend (30 days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={enrollmentTrend}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Progress distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Progress Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={progressDistribution}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject completion */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Subject Completion Rates</h2>
          <div className="space-y-3">
            {subjectCompletion.map((s) => (
              <div key={s.subjectTitle} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{s.subjectTitle}</span>
                  <span className="font-medium ml-2 shrink-0">{s.completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.completionRate}%` }} />
                </div>
              </div>
            ))}
            {subjectCompletion.length === 0 && (
              <p className="text-sm text-muted-foreground">No subjects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Session attendance */}
      {sessionAttendance.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Live Session Attendance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Session</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Attended</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">% of Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionAttendance.map((s, i) => (
                  <tr key={i}>
                    <td className="py-2">{s.title}</td>
                    <td className="py-2 text-muted-foreground">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-2 text-right">{s.attended}</td>
                    <td className="py-2 text-right font-medium">{s.percentOfEnrolled}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lesson engagement */}
      {lessonEngagement.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Lesson Engagement</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Lesson</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Completions</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lessonEngagement.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2 truncate max-w-xs">{l.title}</td>
                    <td className="py-2 text-muted-foreground">{l.type}</td>
                    <td className="py-2 text-right">{l.views}</td>
                    <td className="py-2 text-right font-medium">{l.avgCompletionPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
