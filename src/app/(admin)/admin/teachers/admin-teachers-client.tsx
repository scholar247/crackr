'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { UserClient } from '@/types';

type TeacherWithStats = UserClient & { courseCount: number; studentCount: number };

export function AdminTeachersClient({ teachers }: { teachers: TeacherWithStats[] }) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teachers</h1>
        <p className="text-sm text-muted-foreground mt-1">{teachers.length} teachers</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Teacher</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Courses</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Joined</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 flex items-center justify-center font-semibold shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.courseCount}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.studentCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {format(new Date(t.createdAt), 'd MMM yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/users/${t.id}`}>View</a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No teachers yet. Assign TEACHER role to users from the Users page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
