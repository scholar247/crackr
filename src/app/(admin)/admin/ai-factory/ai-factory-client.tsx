'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { ExamClient, SubjectClient, TopicClient, TopicTreeNode, BlogType, Difficulty } from '@/types';

const ARTICLE_TYPES: { value: BlogType; label: string }[] = [
  { value: 'THEORY', label: 'Theory' },
  { value: 'QUICK_LEARN', label: 'Quick Learn' },
  { value: 'SHORT_NOTE', label: 'Short Note' },
  { value: 'FORMULA_SHEET', label: 'Formula Sheet' },
  { value: 'REVISION_NOTE', label: 'Revision Note' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'TRICKS', label: 'Tricks' },
  { value: 'CHEAT_SHEET', label: 'Cheat Sheet' },
];

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

async function fetchExams(): Promise<ExamClient[]> {
  return (await (await fetch('/api/exams')).json()).data as ExamClient[];
}
async function fetchSubjects(): Promise<SubjectClient[]> {
  return (await (await fetch('/api/subjects')).json()).data as SubjectClient[];
}
function flattenTopicTree(nodes: TopicTreeNode[]): TopicClient[] {
  const result: TopicClient[] = [];
  function walk(node: TopicTreeNode) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, inSyllabus, ...topic } = node;
    result.push(topic as TopicClient);
    (children ?? []).forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}
async function fetchTopics(subjectId: string): Promise<TopicClient[]> {
  if (!subjectId) return [];
  const res = await fetch(`/api/subjects/${subjectId}/topics?tree=true`);
  const tree = (await res.json()).data as TopicTreeNode[];
  return flattenTopicTree(tree);
}

interface PlanResult {
  planRunId: string;
  topicsScanned: number;
  seedsCreated: number;
  seedsSkipped: number;
  breakdown: {
    topicId: string;
    topicName: string;
    blogSeedsCreated: number;
    mcqSeedsCreated: number;
    skipped: string[];
  }[];
}

export function AIFactoryClient() {
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [articleTypes, setArticleTypes] = useState<BlogType[]>(['THEORY']);
  const [minBlogSeeds, setMinBlogSeeds] = useState(1);
  const [maxBlogSeeds, setMaxBlogSeeds] = useState(3);
  const [minMcqSets, setMinMcqSets] = useState(1);
  const [maxMcqSets, setMaxMcqSets] = useState(3);
  const [mcqsPerSet, setMcqsPerSet] = useState(10);
  const [difficultyMix, setDifficultyMix] = useState<Record<Difficulty, number>>({
    EASY: 0.3,
    MEDIUM: 0.4,
    HARD: 0.2,
    EXPERT: 0.1,
  });
  const [includePYQ, setIncludePYQ] = useState(false);
  const [autoCreateSubtopics, setAutoCreateSubtopics] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);

  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: fetchExams });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });
  const { data: topics = [] } = useQuery({
    queryKey: ['ai-factory-topics', subjectId],
    queryFn: () => fetchTopics(subjectId),
    enabled: !!subjectId,
  });

  const availableSubjects = examId
    ? (subjects ?? []).filter((s) => exams?.find((e) => e.id === examId)?.subjectIds.includes(s.id))
    : (subjects ?? []);

  const planMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/ai-factory/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          subjectId,
          topicIds,
          articleTypes,
          minBlogSeeds,
          maxBlogSeeds,
          minMcqSets,
          maxMcqSets,
          mcqsPerSet,
          difficultyMix,
          includePYQ,
          autoCreateSubtopics,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to create seeds');
      return body.data as PlanResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`${data.seedsCreated} seed(s) created, ${data.seedsSkipped} skipped`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleTopic(id: string) {
    setTopicIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }
  function toggleArticleType(type: BlogType) {
    setArticleTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  const canSubmit =
    !!examId && !!subjectId && topicIds.length > 0 && articleTypes.length > 0 && !planMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Exam</Label>
                <Select
                  value={examId}
                  onValueChange={(v) => {
                    setExamId(v);
                    setSubjectId('');
                    setTopicIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select
                  value={subjectId}
                  onValueChange={(v) => {
                    setSubjectId(v);
                    setTopicIds([]);
                  }}
                  disabled={!examId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Topics {topicIds.length > 0 && <span className="text-muted-foreground">({topicIds.length} selected)</span>}
              </Label>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {!subjectId && <p className="text-sm text-muted-foreground p-2">Select a subject first</p>}
                {subjectId && topics.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">No topics found</p>
                )}
                {topics.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer text-sm"
                    style={{ paddingLeft: `${8 + t.depth * 16}px` }}
                  >
                    <Checkbox checked={topicIds.includes(t.id)} onCheckedChange={() => toggleTopic(t.id)} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Article types to generate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {ARTICLE_TYPES.map((t) => (
              <label
                key={t.value}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer"
              >
                <Checkbox checked={articleTypes.includes(t.value)} onCheckedChange={() => toggleArticleType(t.value)} />
                {t.label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Min blog seeds per topic/type</Label>
              <Input type="number" min={0} value={minBlogSeeds} onChange={(e) => setMinBlogSeeds(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Max blog seeds per topic/type</Label>
              <Input type="number" min={0} value={maxBlogSeeds} onChange={(e) => setMaxBlogSeeds(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Min MCQ sets per topic</Label>
              <Input type="number" min={0} value={minMcqSets} onChange={(e) => setMinMcqSets(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Max MCQ sets per topic</Label>
              <Input type="number" min={0} value={maxMcqSets} onChange={(e) => setMaxMcqSets(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>MCQs per set</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={mcqsPerSet}
                onChange={(e) => setMcqsPerSet(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MCQ difficulty mix</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            {DIFFICULTIES.map((d) => (
              <div key={d} className="space-y-1.5">
                <Label>{d}</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={difficultyMix[d]}
                  onChange={(e) => setDifficultyMix((prev) => ({ ...prev, [d]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Include PYQ-style questions</p>
                <p className="text-xs text-muted-foreground">Generated MCQs are flagged as previous-year-exam style</p>
              </div>
              <Switch checked={includePYQ} onCheckedChange={setIncludePYQ} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-create subtopics</p>
                <p className="text-xs text-muted-foreground">
                  If a selected topic has no subtopics yet, let AI propose and create them before generating MCQs
                </p>
              </div>
              <Switch checked={autoCreateSubtopics} onCheckedChange={setAutoCreateSubtopics} />
            </div>
          </CardContent>
        </Card>

        <Button size="lg" disabled={!canSubmit} onClick={() => planMutation.mutate()}>
          {planMutation.isPending ? 'Creating seeds…' : 'Create Seeds'}
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Run &quot;Create Seeds&quot; to see a summary here. This only queues pending work — nothing is
                generated yet.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="secondary">{result.seedsCreated} created</Badge>
                  <Badge variant="outline">{result.seedsSkipped} skipped</Badge>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {result.breakdown.map((b) => (
                    <div key={b.topicId} className="text-sm border-b border-border pb-2">
                      <p className="font-medium">{b.topicName}</p>
                      <p className="text-muted-foreground text-xs">
                        {b.blogSeedsCreated} blog seed(s), {b.mcqSeedsCreated} MCQ seed(s)
                        {b.skipped.length > 0 && ` — ${b.skipped.join('; ')}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
