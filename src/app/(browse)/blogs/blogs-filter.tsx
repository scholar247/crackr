'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExamClient, SubjectClient, TopicClient, TopicTreeNode } from '@/types';

interface Props {
  exams: ExamClient[];
  subjects: SubjectClient[];
  examId: string;
  subjectId: string;
  topicId: string;
}

function flattenTree(nodes: TopicTreeNode[]): TopicClient[] {
  const out: TopicClient[] = [];
  function walk(n: TopicTreeNode) {
    const { children, ...topic } = n;
    out.push(topic as TopicClient);
    (children ?? []).forEach(walk);
  }
  nodes.forEach(walk);
  return out;
}

export function BlogsFilter({ exams, subjects, examId, subjectId, topicId }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const [localExam, setLocalExam] = useState(examId);
  const [localSubject, setLocalSubject] = useState(subjectId);
  const [localTopic, setLocalTopic] = useState(topicId);
  const [topics, setTopics] = useState<TopicClient[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Subjects visible for selected exam
  const selectedExamObj = exams.find((e) => e.id === localExam);
  const filteredSubjects = localExam && selectedExamObj
    ? subjects.filter((s) => selectedExamObj.subjectIds.includes(s.id))
    : subjects;

  // Load topics when subject changes
  useEffect(() => {
    if (!localSubject) { setTopics([]); return; }
    setLoadingTopics(true);
    fetch(`/api/public/subjects/${localSubject}/topics?tree=true`)
      .then((r) => r.json())
      .then((json) => setTopics(flattenTree(json.data as TopicTreeNode[])))
      .catch(() => setTopics([]))
      .finally(() => setLoadingTopics(false));
  }, [localSubject]);

  const push = (next: { examId?: string; subjectId?: string; topicId?: string }) => {
    const params = new URLSearchParams(sp.toString());
    params.set('page', '1');
    if (next.examId !== undefined) next.examId ? params.set('examId', next.examId) : params.delete('examId');
    if (next.subjectId !== undefined) next.subjectId ? params.set('subjectId', next.subjectId) : params.delete('subjectId');
    if (next.topicId !== undefined) next.topicId ? params.set('topicId', next.topicId) : params.delete('topicId');
    startTransition(() => router.push(`/blogs?${params.toString()}`));
  };

  const handleExam = (val: string) => {
    const v = val === '__all__' ? '' : val;
    setLocalExam(v);
    setLocalSubject('');
    setLocalTopic('');
    setTopics([]);
    push({ examId: v, subjectId: '', topicId: '' });
  };

  const handleSubject = (val: string) => {
    const v = val === '__all__' ? '' : val;
    setLocalSubject(v);
    setLocalTopic('');
    push({ subjectId: v, topicId: '' });
  };

  const handleTopic = (val: string) => {
    const v = val === '__all__' ? '' : val;
    setLocalTopic(v);
    push({ topicId: v });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Exam */}
      <div className="w-52">
        <Select value={localExam || '__all__'} onValueChange={handleExam}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Exams</SelectItem>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <div className="w-52">
        <Select value={localSubject || '__all__'} onValueChange={handleSubject}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Subjects</SelectItem>
            {filteredSubjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Topic — only shown when subject is selected */}
      {localSubject && (
        <div className="w-52">
          <Select
            value={localTopic || '__all__'}
            onValueChange={handleTopic}
            disabled={loadingTopics}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={loadingTopics ? 'Loading…' : 'All Topics'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.depth > 0 ? `${'  '.repeat(t.depth)}› ` : ''}{t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
