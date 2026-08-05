'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Program {
  id: string;
  name: string;
  slug: string;
}
interface Exam {
  id: string;
  name: string;
  slug: string;
  programId: string;
  programName: string;
}
interface Node {
  id: string;
  name: string;
  slug: string;
  nodeType: string;
}

const NODE_TYPES = ['SUBJECT', 'CHAPTER', 'TOPIC', 'SUBTOPIC'] as const;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load');
  return (await res.json()).data;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error as string) ?? 'Request failed');
  }
  return (await res.json()).data;
}

function ProgramsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const { data: programs, isLoading } = useQuery({ queryKey: ['admin-programs'], queryFn: () => fetchJson<Program[]>('/api/v1/admin/curriculum/programs') });

  const create = useMutation({
    mutationFn: () => postJson('/api/v1/admin/curriculum/programs', { name }),
    onSuccess: () => {
      toast.success('Program created');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex max-w-md items-end gap-2"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="program-name">New program</Label>
          <Input id="program-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering Entrance" />
        </div>
        <Button type="submit" disabled={create.isPending || name.trim().length < 2} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {programs?.map((p) => (
          <div key={p.id} className="p-3 text-sm">
            <span className="font-medium text-foreground">{p.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">/{p.slug}</span>
          </div>
        ))}
        {programs?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No programs yet.</p>}
      </div>
    </div>
  );
}

function ExamsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [programId, setProgramId] = useState('');
  const { data: programs } = useQuery({ queryKey: ['admin-programs'], queryFn: () => fetchJson<Program[]>('/api/v1/admin/curriculum/programs') });
  const { data: examList, isLoading } = useQuery({ queryKey: ['admin-exams'], queryFn: () => fetchJson<Exam[]>('/api/v1/admin/curriculum/exams') });

  const create = useMutation({
    mutationFn: () => postJson('/api/v1/admin/curriculum/exams', { name, programId }),
    onSuccess: () => {
      toast.success('Exam created');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex max-w-lg items-end gap-2"
      >
        <div className="w-40 space-y-1.5">
          <Label>Program</Label>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {programs?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="exam-name">New exam</Label>
          <Input id="exam-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="JEE Advanced" />
        </div>
        <Button type="submit" disabled={create.isPending || !programId || name.trim().length < 2} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {examList?.map((e) => (
          <div key={e.id} className="p-3 text-sm">
            <span className="font-medium text-foreground">{e.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              /{e.slug} · {e.programName}
            </span>
          </div>
        ))}
        {examList?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No exams yet.</p>}
      </div>
    </div>
  );
}

function NodesTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [nodeType, setNodeType] = useState<(typeof NODE_TYPES)[number]>('SUBJECT');
  const [parentNodeId, setParentNodeId] = useState<string>('');
  const [examId, setExamId] = useState<string>('');
  const { data: nodes, isLoading } = useQuery({ queryKey: ['admin-nodes'], queryFn: () => fetchJson<Node[]>('/api/v1/admin/curriculum/nodes') });
  const { data: examList } = useQuery({ queryKey: ['admin-exams'], queryFn: () => fetchJson<Exam[]>('/api/v1/admin/curriculum/exams') });

  const create = useMutation({
    mutationFn: () =>
      postJson('/api/v1/admin/curriculum/nodes', {
        name,
        nodeType,
        parentNodeId: parentNodeId || undefined,
        examId: examId || undefined,
      }),
    onSuccess: () => {
      toast.success('Node created');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="col-span-2 space-y-1.5 sm:col-span-1">
          <Label>Type</Label>
          <Select value={nodeType} onValueChange={(v) => setNodeType(v as typeof nodeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NODE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Algebra" />
        </div>
        <div className="col-span-2 space-y-1.5 sm:col-span-1">
          <Label>Parent node</Label>
          <Select value={parentNodeId} onValueChange={setParentNodeId}>
            <SelectTrigger>
              <SelectValue placeholder="None (root)" />
            </SelectTrigger>
            <SelectContent>
              {nodes?.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5 sm:col-span-1">
          <Label>Attach to exam</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {examList?.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" disabled={create.isPending || name.trim().length < 2} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add node
          </Button>
        </div>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {nodes?.map((n) => (
          <div key={n.id} className="flex items-center gap-2 p-3 text-sm">
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{n.nodeType}</span>
            <span className="font-medium text-foreground">{n.name}</span>
          </div>
        ))}
        {nodes?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No nodes yet.</p>}
      </div>
    </div>
  );
}

export function CurriculumClient() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Curriculum</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Programs group exams; exams map to curriculum nodes (subjects/chapters/topics/subtopics), shared across exams.
      </p>

      <Tabs defaultValue="programs" className="mt-6">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
        </TabsList>
        <TabsContent value="programs" className="mt-4">
          <ProgramsTab />
        </TabsContent>
        <TabsContent value="exams" className="mt-4">
          <ExamsTab />
        </TabsContent>
        <TabsContent value="nodes" className="mt-4">
          <NodesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
