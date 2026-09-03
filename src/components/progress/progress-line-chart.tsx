'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProgressGroup } from '@/server/repositories/assessment.repository';
import { progressColorFor, clampPercentage } from './progress-chart-colors';

interface TooltipEntry {
  color?: string;
  name?: string;
  value?: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Mock #{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold">{Math.round(entry.value ?? 0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One line per exam/subject/chapter, x-axis = "which mock was this" (not a calendar
 * timeline) — each `<Line>` carries its own `data`, since different subjects can have a
 * different number of mocks behind them. */
export function ProgressLineChart({ groups }: { groups: ProgressGroup[] }) {
  const maxAttempts = Math.max(1, ...groups.map((g) => g.series.length));
  const ticks = Array.from({ length: maxAttempts }, (_, i) => i + 1);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart margin={{ top: 10, right: 24, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="attemptNumber"
          type="number"
          domain={[1, maxAttempts]}
          ticks={ticks}
          allowDecimals={false}
          stroke="var(--muted-foreground)"
          fontSize={12}
          label={{ value: 'Mock #', position: 'insideBottom', offset: -2, fontSize: 12, fill: 'var(--muted-foreground)' }}
        />
        {/* allowDataOverflow clips at the domain edge instead of silently expanding past
            it — without it, a domain prop is only a hint, and one negative-marking-heavy
            subject score would stretch the whole axis to fit it. Combined with clamping
            the plotted value below, a below-zero score visually bottoms out at 0% instead
            of distorting the shared scale every other line is read against. */}
        <YAxis domain={[0, 100]} allowDataOverflow tickFormatter={(v) => `${v}%`} stroke="var(--muted-foreground)" fontSize={12} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {groups.map((group, i) => (
          <Line
            key={group.id ?? group.name}
            data={group.series.map((p) => ({ ...p, percentage: clampPercentage(p.percentage) }))}
            dataKey="percentage"
            name={group.name}
            stroke={progressColorFor(i)}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            animationDuration={600}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
