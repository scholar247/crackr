'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Eye, Pencil, Plus, Save, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BlogContent } from '@/components/blog/blog-content';
import { AuthorByline } from '@/components/blog/author-byline';
import { cn } from '@/lib/utils';

interface ExamOption {
  id: string;
  name: string;
}

interface SyllabusNode {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  children: SyllabusNode[];
}

interface OptionRow {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionFormInitial {
  id: number;
  stem: string;
  optionsJson: OptionRow[];
  explanation: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags: string[] | null;
  status: string;
  primaryNode: { nodeId: string } | null;
  exams: { examId: string }[];
  author: { name: string | null; image: string | null } | null;
  updatedAt: string;
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;
const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyOptions(): OptionRow[] {
  return [
    { key: 'A', text: '', isCorrect: false },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
  ];
}

// Depth-first search for a node + rebuild the ancestor chain, so an existing question's
// saved leaf tag correctly pre-selects every level of the cascading picker on load.
function findPath(nodes: SyllabusNode[], targetId: string, path: SyllabusNode[] = []): SyllabusNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node];
    if (node.id === targetId) return nextPath;
    const found = findPath(node.children, targetId, nextPath);
    if (found) return found;
  }
  return null;
}

export function QuestionForm({
  mode,
  examOptions,
  canPublish,
  initial,
}: {
  mode: 'create' | 'edit';
  examOptions: ExamOption[];
  canPublish: boolean;
  initial?: QuestionFormInitial;
}) {
  const router = useRouter();

  const [categoryExamId, setCategoryExamId] = useState(initial?.exams[0]?.examId ?? '');
  const [additionalExamIds, setAdditionalExamIds] = useState<string[]>(
    initial ? initial.exams.map((e) => e.examId).filter((id) => id !== initial.exams[0]?.examId) : []
  );

  const [syllabusTree, setSyllabusTree] = useState<SyllabusNode[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [pendingNodeId, setPendingNodeId] = useState(initial?.primaryNode?.nodeId ?? null);

  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>(initial?.difficulty ?? 'MEDIUM');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [stem, setStem] = useState(initial?.stem ?? '');
  const [options, setOptions] = useState<OptionRow[]>(initial?.optionsJson ?? emptyOptions());
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [previewMode, setPreviewMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(initial?.status ?? 'DRAFT');

  // Fetch the selected exam's syllabus tree, then (once, on first load in edit mode)
  // resolve the saved node id into its full Subject/Chapter/Topic/Subtopic path.
  useEffect(() => {
    if (!categoryExamId) {
      setSyllabusTree([]);
      return;
    }
    fetch(`/api/v1/admin/curriculum/exams/${categoryExamId}/syllabus-tree`)
      .then((res) => res.json())
      .then((json) => {
        const tree: SyllabusNode[] = json.data ?? [];
        setSyllabusTree(tree);
        if (pendingNodeId) {
          const path = findPath(tree, pendingNodeId);
          if (path) {
            setSubjectId(path[0]?.id ?? '');
            setChapterId(path[1]?.id ?? '');
            setTopicId(path[2]?.id ?? '');
            setSubtopicId(path[3]?.id ?? '');
          }
          setPendingNodeId(null);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryExamId]);

  const subjects = syllabusTree;
  const chapters = useMemo(() => subjects.find((s) => s.id === subjectId)?.children ?? [], [subjects, subjectId]);
  const topics = useMemo(() => chapters.find((c) => c.id === chapterId)?.children ?? [], [chapters, chapterId]);
  const subtopics = useMemo(() => topics.find((t) => t.id === topicId)?.children ?? [], [topics, topicId]);

  const leafNodeId = subtopicId || topicId || chapterId || subjectId || undefined;

  function toggleCorrect(key: string) {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.key === key })));
  }

  function updateOptionText(key: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, text } : o)));
  }

  function addOption() {
    if (options.length >= OPTION_KEYS.length) return;
    setOptions((prev) => [...prev, { key: OPTION_KEYS[prev.length], text: '', isCorrect: false }]);
  }

  function removeOption(key: string) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.key !== key));
  }

  function addTag() {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function buildPayload() {
    const examIds = Array.from(new Set([categoryExamId, ...additionalExamIds].filter(Boolean)));
    return {
      stem,
      options,
      explanation: explanation || undefined,
      difficulty,
      tags: tags.length ? tags : undefined,
      nodeId: leafNodeId,
      examIds,
    };
  }

  async function handleSave() {
    if (!categoryExamId) return toast.error('Select an exam category first.');
    if (!stem.trim()) return toast.error('Question text is required.');
    if (options.some((o) => !o.text.trim())) return toast.error('All answer options need text.');
    if (!options.some((o) => o.isCorrect)) return toast.error('Mark one option as the correct answer.');

    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await fetch(mode === 'create' ? '/api/v1/admin/questions' : `/api/v1/admin/questions/${initial!.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to save question');
      }
      const { data } = await res.json();
      toast.success('Question saved as draft.');
      if (mode === 'create') {
        router.push(`/admin/questions/${data.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle() {
    if (!initial) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/admin/questions/${initial.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: status !== 'PUBLISHED' }),
      });
      if (!res.ok) throw new Error('Failed to update publish status');
      const { data } = await res.json();
      setStatus(data.status);
      toast.success(data.status === 'PUBLISHED' ? 'Question published.' : 'Question moved back to draft.');
    } catch {
      toast.error('Could not update publish status.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-headline-lg text-foreground">{mode === 'create' ? 'Add New MCQ' : 'Edit MCQ'}</h1>
          <Badge variant={status === 'PUBLISHED' ? 'success' : 'neutral'}>{status.replace('_', ' ')}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'edit' && canPublish && (
            <Button variant="outline" onClick={handlePublishToggle} disabled={publishing}>
              <Upload className="h-4 w-4" />
              {status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Question'}
          </Button>
        </div>
      </div>

      {mode === 'edit' && initial?.author?.name && (
        <div className="mt-3">
          <AuthorByline name={initial.author.name} imageUrl={initial.author.image ?? undefined} updatedAt={initial.updatedAt} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-body-lg font-semibold text-foreground">Categorization</h2>

            <div className="mt-4 space-y-3">
              <Field label="Exam Category">
                <Select
                  value={categoryExamId}
                  onValueChange={(v) => {
                    setCategoryExamId(v);
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
                    {examOptions.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <CascadeField
                label="Subject"
                value={subjectId}
                options={subjects}
                disabled={!categoryExamId}
                onChange={(v) => {
                  setSubjectId(v);
                  setChapterId('');
                  setTopicId('');
                  setSubtopicId('');
                }}
              />
              <CascadeField
                label="Chapter"
                value={chapterId}
                options={chapters}
                disabled={!subjectId}
                onChange={(v) => {
                  setChapterId(v);
                  setTopicId('');
                  setSubtopicId('');
                }}
              />
              <CascadeField
                label="Topic"
                value={topicId}
                options={topics}
                disabled={!chapterId}
                onChange={(v) => {
                  setTopicId(v);
                  setSubtopicId('');
                }}
              />
              <CascadeField label="Subtopic" value={subtopicId} options={subtopics} disabled={!topicId} onChange={setSubtopicId} />

              <p className="text-body-sm text-muted-foreground">
                Tagging the deepest level also tags every level above it automatically — this question will be findable
                under all of them.
              </p>

              <Field label="Also applies to (optional)">
                <div className="flex flex-wrap gap-1.5">
                  {examOptions
                    .filter((e) => e.id !== categoryExamId)
                    .map((exam) => {
                      const active = additionalExamIds.includes(exam.id);
                      return (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() =>
                            setAdditionalExamIds((prev) =>
                              active ? prev.filter((id) => id !== exam.id) : [...prev, exam.id]
                            )
                          }
                          className={cn(
                            'text-label-caps rounded-full border px-2.5 py-1 uppercase transition-colors',
                            active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {exam.name}
                        </button>
                      );
                    })}
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-body-lg font-semibold text-foreground">Attributes</h2>

            <div className="mt-4 space-y-3">
              <Field label="Difficulty Level">
                <div className="grid grid-cols-4 gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        'text-body-sm rounded-lg border px-2 py-2 text-center transition-colors',
                        difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-accent'
                      )}
                    >
                      {d[0] + d.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Tags">
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-label-caps inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 uppercase text-muted-foreground"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag…"
                    className="text-body-sm min-w-[100px] flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-label-caps uppercase text-muted-foreground">Question (Markdown/LaTeX)</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-body-sm', !previewMode ? 'bg-accent text-foreground' : 'text-muted-foreground')}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-body-sm', previewMode ? 'bg-accent text-foreground' : 'text-muted-foreground')}
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
            </div>
          </div>

          <div className="p-5">
            {previewMode ? (
              <div className="min-h-[140px] rounded-lg border border-border p-4">
                <BlogContent content={stem || '_Nothing to preview yet._'} />
              </div>
            ) : (
              <Textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="Evaluate the integral: $$ \int_0^{\pi/2} ... $$"
                className="min-h-[140px] font-mono"
              />
            )}

            <div className="mt-6 flex items-center justify-between">
              <span className="text-label-caps uppercase text-muted-foreground">Answer Options</span>
              <span className="text-label-caps uppercase text-muted-foreground">Select the correct answer</span>
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {options.map((option) => (
                <div
                  key={option.key}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                    option.isCorrect ? 'border-secondary bg-secondary/10' : 'border-border'
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-body-sm font-semibold text-foreground">
                    {option.key}
                  </span>
                  <input
                    value={option.text}
                    onChange={(e) => updateOptionText(option.key, e.target.value)}
                    placeholder={`Option ${option.key} text…`}
                    className="text-body-sm flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleCorrect(option.key)}
                    aria-label={`Mark option ${option.key} correct`}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      option.isCorrect ? 'border-secondary bg-secondary text-background' : 'border-input'
                    )}
                  >
                    {option.isCorrect && <Check className="h-3 w-3" />}
                  </button>
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(option.key)} aria-label={`Remove option ${option.key}`}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < OPTION_KEYS.length && (
              <button
                type="button"
                onClick={addOption}
                className="text-body-sm mt-2 flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
            )}

            <div className="mt-6">
              <span className="text-label-caps uppercase text-muted-foreground">Detailed Explanation (optional)</span>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Provide step-by-step reasoning…"
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-label-caps mb-1.5 uppercase text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function CascadeField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: SyllabusNode[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange} disabled={disabled || options.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder={disabled ? '—' : `Select ${label.toLowerCase()}…`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((node) => (
            <SelectItem key={node.id} value={node.id}>
              {node.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
