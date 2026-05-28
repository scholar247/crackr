'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, ClipboardList, Users, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsData {
  totalMCQs: number;
  activeTests: number;
  registeredUsers: number;
  attemptsToday: number;
}

const STAT_CONFIG = [
  { key: 'totalMCQs' as const, label: 'Total MCQs', icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'activeTests' as const, label: 'Active Tests', icon: ClipboardList, color: 'text-success', bg: 'bg-success/10' },
  { key: 'registeredUsers' as const, label: 'Registered Users', icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
  { key: 'attemptsToday' as const, label: 'Attempts Today', icon: Activity, color: 'text-destructive', bg: 'bg-destructive/10' },
];

async function fetchStats(): Promise<StatsData> {
  const res = await fetch('/api/admin/stats');
  const json = await res.json();
  return json.data;
}

export function AdminDashboardStats() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchStats });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
        <div key={key} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className={`${bg} rounded-lg p-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold">{data?.[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
