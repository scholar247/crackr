'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge, type BadgeProps } from '@/components/ui/badge';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

interface QuestionRow {
  id: string;
  stem: string;
  difficulty: string;
  status: string;
}

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  ARCHIVED: 'neutral',
};

export function QuestionBankBrowser({ exams }: { exams: ExamOption[] }) {
  const [examId, setExamId] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (examId !== 'all') params.set('examId', examId);
    if (status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    const res = await fetch(`/api/v1/admin/questions?${params}`);
    const json = await res.json();
    setQuestions(json.data ?? []);
    setLoading(false);
  }, [examId, status, search]);

  useEffect(() => {
    const timeout = setTimeout(load, 200); // debounce search keystrokes
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <p className="text-body-sm p-6 text-muted-foreground">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="text-body-sm p-6 text-muted-foreground">No questions match your filters.</p>
        ) : (
          <div className="divide-y divide-border">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`/admin/questions/${q.id}/edit`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent"
              >
                <p className="text-body-sm line-clamp-1 text-foreground">{q.stem}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="neutral">{q.difficulty}</Badge>
                  <Badge variant={STATUS_VARIANT[q.status] ?? 'neutral'}>{q.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
