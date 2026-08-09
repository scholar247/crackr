'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlogContent } from '@/components/blog/blog-content';
import { cn } from '@/lib/utils';

interface ExamOption {
  id: string;
  slug: string;
  name: string;
  programName: string;
}

interface SyllabusNode {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  children: SyllabusNode[];
}

interface QuestionOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  stem: string;
  optionsJson: QuestionOption[];
  explanation: string | null;
  difficulty: string;
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

export function PracticeBrowser({ exams }: { exams: ExamOption[] }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [examId, setExamId] = useState('');
  const [syllabusTree, setSyllabusTree] = useState<SyllabusNode[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [difficulty, setDifficulty] = useState<string>('all');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({}); // in-memory only, never persisted

  const selectedExam = exams.find((e) => e.id === examId);

  const loadSyllabus = useCallback(async () => {
    if (!selectedExam) {
      setSyllabusTree([]);
      return;
    }
    const res = await fetch(`/api/v1/public/exams/${selectedExam.slug}`);
    const json = await res.json();
    setSyllabusTree(json.data?.syllabus ?? []);
  }, [selectedExam]);

  useEffect(() => {
    const timeout = setTimeout(loadSyllabus, 0);
    return () => clearTimeout(timeout);
  }, [loadSyllabus]);

  const subjects = syllabusTree;
  const chapters = useMemo(() => subjects.find((s) => s.id === subjectId)?.children ?? [], [subjects, subjectId]);
  const topics = useMemo(() => chapters.find((c) => c.id === chapterId)?.children ?? [], [chapters, chapterId]);
  const subtopics = useMemo(() => topics.find((t) => t.id === topicId)?.children ?? [], [topics, topicId]);
  const nodeId = subtopicId || topicId || chapterId || subjectId || undefined;

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (examId) params.set('examId', examId);
    if (nodeId) params.set('nodeId', nodeId);
    if (difficulty !== 'all') params.set('difficulty', difficulty);

    try {
      const res = await fetch(`/api/v1/public/questions?${params}`);
      const json = await res.json();
      setQuestions(json.data ?? []);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [examId, nodeId, difficulty]);

  useEffect(() => {
    const timeout = setTimeout(loadQuestions, 0);
    return () => clearTimeout(timeout);
  }, [loadQuestions]);

  const current = questions[index];
  const selectedKey = current ? selections[current.id] : undefined;
  const answered = selectedKey !== undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NextImage src="/logo.svg" alt="scholar247" width={110} height={23} className="dark:invert" />
          <Link href="/dashboard" className="text-body-sm text-muted-foreground hover:text-foreground">
            ← Exit practice
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">
          <aside className={cn('shrink-0 transition-all duration-200', sidebarOpen ? 'w-72' : 'w-0 overflow-hidden')}>
            <div className="w-72 space-y-5 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-body-lg font-semibold text-foreground">Filters</h2>
                <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Collapse filters" className="text-muted-foreground hover:text-foreground">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              <PickerField label="Exam">
                <Select
                  value={examId}
                  onValueChange={(v) => {
                    setExamId(v);
                    setSubjectId('');
                    setChapterId('');
                    setTopicId('');
                    setSubtopicId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam…" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PickerField>

              <PickerField label="Subject">
                <CascadeSelect
                  value={subjectId}
                  options={subjects}
                  disabled={!examId}
                  onChange={(v) => {
                    setSubjectId(v);
                    setChapterId('');
                    setTopicId('');
                    setSubtopicId('');
                  }}
                />
              </PickerField>
              <PickerField label="Chapter">
                <CascadeSelect
                  value={chapterId}
                  options={chapters}
                  disabled={!subjectId}
                  onChange={(v) => {
                    setChapterId(v);
                    setTopicId('');
                    setSubtopicId('');
                  }}
                />
              </PickerField>
              <PickerField label="Topic">
                <CascadeSelect
                  value={topicId}
                  options={topics}
                  disabled={!chapterId}
                  onChange={(v) => {
                    setTopicId(v);
                    setSubtopicId('');
                  }}
                />
              </PickerField>
              <PickerField label="Subtopic">
                <CascadeSelect value={subtopicId} options={subtopics} disabled={!topicId} onChange={setSubtopicId} />
              </PickerField>

              <PickerField label="Difficulty">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d[0] + d.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PickerField>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Show filters"
                className="mb-4 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-body-sm text-muted-foreground hover:text-foreground"
              >
                <PanelLeftOpen className="h-4 w-4" /> Filters
              </button>
            )}

            {loading ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center text-body-sm text-muted-foreground">
                Loading questions…
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <p className="text-body-md text-foreground">No published questions match these filters yet.</p>
                <p className="text-body-sm mt-1 text-muted-foreground">Try a different exam, subject, or difficulty.</p>
              </div>
            ) : (
              current && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-label-caps uppercase text-muted-foreground">
                      Question {index + 1} of {questions.length}
                    </span>
                    <span className="text-label-caps rounded-full bg-muted px-2.5 py-1 uppercase text-muted-foreground">
                      {current.difficulty}
                    </span>
                  </div>

                  <div className="mt-4">
                    <BlogContent content={current.stem} />
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5">
                    {current.optionsJson.map((option) => {
                      const isSelected = selectedKey === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          disabled={answered}
                          onClick={() => setSelections((prev) => ({ ...prev, [current.id]: option.key }))}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg border p-3 text-left text-body-sm transition-all',
                            !answered && 'border-border bg-muted/50 text-foreground hover:bg-muted',
                            answered && !isSelected && 'border-border bg-muted/50 text-foreground opacity-50',
                            answered && isSelected && option.isCorrect && 'border-secondary/50 bg-secondary/10 text-foreground ring-1 ring-secondary/50',
                            answered && isSelected && !option.isCorrect && 'border-destructive/50 bg-destructive/10 text-foreground'
                          )}
                        >
                          <span>
                            <span className="mr-1.5 font-mono text-muted-foreground">{option.key})</span>
                            {option.text}
                          </span>
                          {isSelected && (option.isCorrect ? <Check className="h-4 w-4 text-secondary" /> : <X className="h-4 w-4 text-destructive" />)}
                        </button>
                      );
                    })}
                  </div>

                  {answered && current.explanation && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 mt-4 rounded-lg border border-primary/10 bg-primary/5 p-4 duration-300">
                      <p className="text-label-caps uppercase text-primary">Explanation</p>
                      <div className="mt-1">
                        <BlogContent content={current.explanation} />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <Button variant="outline" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button onClick={() => setIndex((i) => i + 1)} disabled={index === questions.length - 1}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-label-caps mb-1.5 uppercase text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function CascadeSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: SyllabusNode[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || options.length === 0}>
      <SelectTrigger>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {options.map((node) => (
          <SelectItem key={node.id} value={node.id}>
            {node.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
