'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, UserPlus, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn, toCSV } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { EnrollmentClient } from '@/types/course.types';
import type { UserClient } from '@/types';

interface AdminStudentsClientProps {
  courseId: string;
  courseTitle: string;
  enrollments: (EnrollmentClient & { user?: UserClient })[];
}

export function AdminStudentsClient({ courseId, courseTitle, enrollments }: AdminStudentsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const filtered = enrollments.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.user?.name.toLowerCase().includes(s) || e.user?.email.toLowerCase().includes(s);
  });

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this course?`)) return;
    const res = await fetch(`/api/admin/courses/${courseId}/students/${userId}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Student removed'); router.refresh(); }
    else toast.error('Failed to remove');
  };

  const handleEnroll = async () => {
    if (!enrollEmail) return;
    setEnrolling(true);
    // Find user by email via API (simplified — use existing user endpoint)
    const userRes = await fetch(`/api/admin/users?search=${encodeURIComponent(enrollEmail)}`);
    const userData = await userRes.json();
    const user = userData.data?.items?.[0];
    if (!user) { toast.error('User not found'); setEnrolling(false); return; }

    const res = await fetch(`/api/admin/courses/${courseId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) {
      toast.success(`${user.name} enrolled`);
      setShowEnroll(false);
      setEnrollEmail('');
      router.refresh();
    } else toast.error('Failed to enroll');
    setEnrolling(false);
  };

  const handleExport = () => {
    const rows = filtered.map((e) => ({
      name: e.user?.name ?? e.userId,
      email: e.user?.email ?? '',
      enrolled: e.enrolledAt ? format(new Date(e.enrolledAt), 'yyyy-MM-dd') : '',
      progress: `${e.progress}%`,
      status: e.status,
      lastActive: e.lastAccessedAt ? format(new Date(e.lastAccessedAt), 'yyyy-MM-dd') : '',
    }));
    const csv = toCSV(rows, ['name', 'email', 'enrolled', 'progress', 'status', 'lastActive']);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${courseTitle.replace(/\s+/g, '-')}-students.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">{courseTitle}</h1>
          <p className="text-sm text-muted-foreground">{enrollments.length} enrolled students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button size="sm" onClick={() => setShowEnroll(!showEnroll)}>
            <UserPlus className="h-4 w-4 mr-2" />Enroll Student
          </Button>
        </div>
      </div>

      {showEnroll && (
        <div className="flex gap-2 items-end rounded-xl border border-border bg-card p-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">Student Email</label>
            <Input
              value={enrollEmail}
              onChange={(e) => setEnrollEmail(e.target.value)}
              placeholder="student@email.com"
              onKeyDown={(e) => e.key === 'Enter' && handleEnroll()}
              autoFocus
            />
          </div>
          <Button onClick={handleEnroll} disabled={enrolling || !enrollEmail}>
            {enrolling ? 'Enrolling...' : 'Enroll'}
          </Button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Enrolled</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Progress</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Last Active</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.userId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                      {(e.user?.name ?? e.userId).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{e.user?.name ?? e.userId}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {e.enrolledAt ? format(new Date(e.enrolledAt), 'd MMM yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={e.progress} className="h-1.5 w-20" />
                    <span className="text-xs font-medium w-8">{e.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                  {e.lastAccessedAt ? format(new Date(e.lastAccessedAt), 'd MMM') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(e.userId, e.user?.name ?? e.userId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
