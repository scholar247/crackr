'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Plus, Pencil, Trash2, BookOpen, FileText, Hash,
  X, Search, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ExamClient, PYPClient, MCQClient } from '@/types';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

async function fetchExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/admin/exams?activeOnly=false');
  return (await res.json()).data ?? [];
}

async function fetchPYPs(examId?: string): Promise<PYPClient[]> {
  const url = examId ? `/api/admin/pyp?examId=${examId}&activeOnly=false` : '/api/admin/pyp?activeOnly=false';
  const res = await fetch(url);
  return (await res.json()).data ?? [];
}

async function fetchMCQsForExam(examId: string, search: string): Promise<MCQClient[]> {
  const params = new URLSearchParams({ examIds: examId, pageSize: '50', isActive: 'true' });
  if (search) params.set('search', search);
  const res = await fetch(`/api/admin/mcq?${params}`);
  const json = await res.json();
  return json.data ?? [];
}

interface PYPFormData {
  examId: string;
  title: string;
  year: number;
  month: number;
  description?: string;
  isActive: boolean;
}

function PYPRow({ pyp, onEdit, onDelete, onManageMCQs }: {
  pyp: PYPClient;
  onEdit: (pyp: PYPClient) => void;
  onDelete: (pyp: PYPClient) => void;
  onManageMCQs: (pyp: PYPClient) => void;
}) {
  const month = MONTHS.find((m) => m.value === pyp.month)?.label ?? '';

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{pyp.title}</span>
          {!pyp.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <Badge variant="outline" className="text-xs h-4 px-1">{pyp.examName}</Badge>
          <span className="text-xs text-muted-foreground">{month} {pyp.year}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Hash className="h-3 w-3" />{pyp.mcqCount} MCQs
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="outline" size="sm" onClick={() => onManageMCQs(pyp)}>
          <BookOpen className="h-3.5 w-3.5" />
          MCQs
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(pyp)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &quot;{pyp.title}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate the PYP. MCQ mappings will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(pyp)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function PYPClient() {
  const qc = useQueryClient();
  const ALL_EXAMS = '__all__';
  const [filterExamId, setFilterExamId] = useState<string>(ALL_EXAMS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPYP, setEditingPYP] = useState<PYPClient | null>(null);

  // MCQ management state
  const [mcqPYP, setMcqPYP] = useState<PYPClient | null>(null);
  const [mcqSearch, setMcqSearch] = useState('');
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  const { data: exams } = useQuery({ queryKey: ['admin-exams'], queryFn: fetchExams });
  const { data: pyps, isLoading } = useQuery({
    queryKey: ['admin-pyps', filterExamId],
    queryFn: () => fetchPYPs(filterExamId === ALL_EXAMS ? undefined : filterExamId),
  });
  const { data: examMCQs = [], isLoading: mcqsLoading } = useQuery({
    queryKey: ['exam-mcqs', mcqPYP?.examId, mcqSearch],
    queryFn: () => fetchMCQsForExam(mcqPYP!.examId, mcqSearch),
    enabled: !!mcqPYP,
    staleTime: 30_000,
  });

  const form = useForm<PYPFormData>({
    defaultValues: { examId: '', title: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1, isActive: true },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PYPFormData) => {
      if (editingPYP) {
        const res = await fetch(`/api/admin/pyp/${editingPYP.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      } else {
        const res = await fetch('/api/admin/pyp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pyps'] });
      toast.success(editingPYP ? 'PYP updated' : 'PYP created');
      setDialogOpen(false);
      setEditingPYP(null);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/pyp/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pyps'] }); toast.success('PYP deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const addMCQMutation = useMutation({
    mutationFn: async (mcqId: string) => {
      setAddingIds((s) => new Set(s).add(mcqId));
      const res = await fetch(`/api/admin/pyp/${mcqPYP!.id}/mcqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcqIds: [mcqId] }),
      });
      if (!res.ok) throw new Error('Failed to add MCQ');
      return mcqId;
    },
    onSuccess: (mcqId) => {
      qc.invalidateQueries({ queryKey: ['admin-pyps'] });
      setMcqPYP((prev) => prev ? { ...prev, mcqIds: [...prev.mcqIds, mcqId], mcqCount: prev.mcqCount + 1 } : null);
      setAddingIds((s) => { const n = new Set(s); n.delete(mcqId); return n; });
    },
    onError: (err: Error) => { toast.error(err.message); setAddingIds(new Set()); },
  });

  const removeMCQMutation = useMutation({
    mutationFn: async (mcqId: string) => {
      const res = await fetch(`/api/admin/pyp/${mcqPYP!.id}/mcqs/${mcqId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove MCQ');
      return mcqId;
    },
    onSuccess: (mcqId) => {
      qc.invalidateQueries({ queryKey: ['admin-pyps'] });
      setMcqPYP((prev) =>
        prev ? { ...prev, mcqIds: prev.mcqIds.filter((id) => id !== mcqId), mcqCount: prev.mcqCount - 1 } : null
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditingPYP(null);
    form.reset({ examId: filterExamId === ALL_EXAMS ? '' : filterExamId, title: '', year: CURRENT_YEAR, month: new Date().getMonth() + 1, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (pyp: PYPClient) => {
    setEditingPYP(pyp);
    form.reset({ examId: pyp.examId, title: pyp.title, year: pyp.year, month: pyp.month, description: pyp.description, isActive: pyp.isActive });
    setDialogOpen(true);
  };

  // Refresh mcqPYP data when pyps changes
  useEffect(() => {
    if (mcqPYP && pyps) {
      const updated = pyps.find((p) => p.id === mcqPYP.id);
      if (updated) setMcqPYP(updated);
    }
  }, [pyps, mcqPYP]);

  const inPYP = (mcqId: string) => mcqPYP?.mcqIds.includes(mcqId) ?? false;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterExamId} onValueChange={setFilterExamId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_EXAMS}>All exams</SelectItem>
            {exams?.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground flex-1">{pyps?.length ?? 0} papers</span>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add PYP
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !pyps?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground rounded-xl border border-dashed border-border">
          <FileText className="h-10 w-10 opacity-30" />
          <p className="font-medium">No papers found</p>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />Add PYP</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {pyps.map((pyp) => (
            <PYPRow
              key={pyp.id}
              pyp={pyp}
              onEdit={openEdit}
              onDelete={(p) => deleteMutation.mutate(p.id)}
              onManageMCQs={(p) => { setMcqPYP(p); setMcqSearch(''); }}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingPYP(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPYP ? 'Edit PYP' : 'Add Previous Year Paper'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Exam <span className="text-destructive">*</span></Label>
              <Controller
                control={form.control}
                name="examId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                    <SelectContent>
                      {exams?.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                {...form.register('title', { required: true })}
                placeholder="e.g. NIMCET 2024 May"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Year <span className="text-destructive">*</span></Label>
                <Controller
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Month <span className="text-destructive">*</span></Label>
                <Controller
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...form.register('description')} rows={2} className="resize-none" placeholder="Optional description…" />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} id="pyp-active" />}
              />
              <Label htmlFor="pyp-active" className="font-normal cursor-pointer">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editingPYP ? 'Save Changes' : 'Create PYP'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage MCQs Dialog */}
      <Dialog open={!!mcqPYP} onOpenChange={(o) => { if (!o) { setMcqPYP(null); setMcqSearch(''); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>MCQs in &ldquo;{mcqPYP?.title}&rdquo;</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Hash className="h-4 w-4" />
            <span>{mcqPYP?.mcqCount ?? 0} MCQs mapped</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={`Search MCQs in ${mcqPYP?.examName ?? 'exam'}…`}
              value={mcqSearch}
              onChange={(e) => setMcqSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
            {mcqsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : examMCQs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No MCQs found.</p>
            ) : (
              examMCQs.map((mcq) => {
                const added = inPYP(mcq.id);
                return (
                  <div
                    key={mcq.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${added ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">{mcq.difficulty}</p>
                      <p className="text-sm line-clamp-2">
                        {mcq.question[0]?.content ?? 'Question'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={added ? 'secondary' : 'outline'}
                      className="shrink-0"
                      disabled={addingIds.has(mcq.id) || removeMCQMutation.isPending}
                      onClick={() => added ? removeMCQMutation.mutate(mcq.id) : addMCQMutation.mutate(mcq.id)}
                    >
                      {added ? (
                        <><X className="h-3.5 w-3.5" /> Remove</>
                      ) : (
                        <><Plus className="h-3.5 w-3.5" /> Add</>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
