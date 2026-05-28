'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toCSV } from '@/lib/utils';
import type { EnrollmentClient } from '@/types/course.types';
import type { UserClient } from '@/types';

interface TeacherStudentsClientProps {
  courseTitle: string;
  enrollments: (EnrollmentClient & { user?: UserClient })[];
}

export function TeacherStudentsClient({ courseTitle, enrollments }: TeacherStudentsClientProps) {
  const [search, setSearch] = useState('');

  const filtered = enrollments.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.user?.name.toLowerCase().includes(s) || e.user?.email.toLowerCase().includes(s);
  });

  const handleExport = () => {
    const rows = filtered.map((e) => ({
      Name: e.user?.name ?? '',
      Email: e.user?.email ?? '',
      Progress: `${e.progress}%`,
      Status: e.status,
      Enrolled: format(new Date(e.enrolledAt), 'd MMM yyyy'),
    }));
    const csv = toCSV(rows, ['Name', 'Email', 'Progress', 'Status', 'Enrolled']);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${courseTitle.replace(/\s+/g, '_')}_students.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{courseTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{enrollments.length} enrolled students</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Progress</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Enrolled</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Last Active</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-sm">
                      {e.user?.name.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{e.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{e.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2 min-w-0 max-w-32">
                    <Progress value={e.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">{e.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {format(new Date(e.enrolledAt), 'd MMM yyyy')}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {e.lastAccessedAt ? format(new Date(e.lastAccessedAt), 'd MMM yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    e.status === 'COMPLETED'
                      ? 'bg-green-500/10 text-green-600'
                      : e.status === 'CANCELLED'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-sky-500/10 text-sky-600'
                  }`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? 'No students match your search.' : 'No students enrolled yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
