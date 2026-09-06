'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Check, X, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlogContent } from '@/components/blog/blog-content';
import { InlineMarkdown } from '@/components/questions/inline-markdown';
import { cn } from '@/lib/utils';
import type { SyllabusNode } from '@/server/repositories/taxonomy.repository';

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
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'difficulty_asc', label: 'Difficulty: Easy → Hard' },
  { value: 'difficulty_desc', label: 'Difficulty: Hard → Easy' },
] as const;

interface PracticeBrowserProps {
  examId: string;
  examName: string;
  examSlug: string;
  syllabus: SyllabusNode[];
  loggedIn: boolean;
}

export function PracticeBrowser({ examId, examName, examSlug, syllabus, loggedIn }: PracticeBrowserProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Deep-link entry point — e.g. the homepage's "jump to this subject" shortcuts link here
  // with ?subject=<nodeId>. Only read once on mount; this isn't meant to react to further
  // client-side URL changes, just to seed where the browser opens.
  const searchParams = useSearchParams();
  const [subjectId, setSubjectId] = useState(() => searchParams.get('subject') ?? '');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({}); // in-memory only, never persisted

  const subjects = syllabus;
  const chapters = useMemo(() => subjects.find((s) => s.id === subjectId)?.children ?? [], [subjects, subjectId]);
  const topics = useMemo(() => chapters.find((c) => c.id === chapterId)?.children ?? [], [chapters, chapterId]);
  const subtopics = useMemo(() => topics.find((t) => t.id === topicId)?.children ?? [], [topics, topicId]);
  const nodeId = subtopicId || topicId || chapterId || subjectId || undefined;

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('examId', examId);
    if (nodeId) params.set('nodeId', nodeId);
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    params.set('sort', sort);

    try {
      const res = await fetch(`/api/v1/public/questions?${params}`);
      const json = await res.json();
      setQuestions(json.data ?? []);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [examId, nodeId, difficulty, sort]);

  useEffect(() => {
    const timeout = setTimeout(loadQuestions, 0);
    return () => clearTimeout(timeout);
  }, [loadQuestions]);

  const current = questions[index];
  const selectedKey = current ? selections[current.id] : undefined;
  const answered = selectedKey !== undefined;

  return (
    <div className="bg-background">
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-body-sm font-medium text-foreground">{examName} Practice</span>
          <Link
            href={`/practice/exams/${examSlug}`}
            className="text-body-sm flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Exit practice
          </Link>
        </div>
      </div>

      {!loggedIn && (
        <div className="border-b border-border bg-secondary/5">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
            <Info className="h-4 w-4 shrink-0 text-secondary" />
            <p className="text-body-sm text-muted-foreground">
              Practicing as a guest — your answers won&apos;t be saved.{' '}
              <Link href="/sign-in" className="font-medium text-secondary hover:underline">
                Sign in
              </Link>{' '}
              to track your progress.
            </p>
          </div>
        </div>
      )}

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

              <PickerField label="Subject">
                <CascadeSelect
                  value={subjectId}
                  options={subjects}
                  disabled={false}
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

              <PickerField label="Sort">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
                <p className="text-body-sm mt-1 text-muted-foreground">Try a different subject, topic, or difficulty.</p>
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
                            <InlineMarkdown content={option.text} />
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
