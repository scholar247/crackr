'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, RefreshCw, Hash, TreePine } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CreateSubjectSchema, type CreateSubjectInput } from '@/schemas';
import type { SubjectClient } from '@/types';
import { slugify } from '@/lib/utils';

async function fetchSubjects(): Promise<SubjectClient[]> {
  const res = await fetch('/api/admin/subjects');
  return (await res.json()).data;
}

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
];

export function SubjectsClient() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectClient | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const refreshCounts = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await fetch(`/api/admin/subjects/${id}/refresh-counts`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      await qc.invalidateQueries({ queryKey: ['admin-subjects'] });
      toast.success('Counts refreshed');
    } catch {
      toast.error('Failed to refresh counts');
    } finally {
      setRefreshingId(null);
    }
  };

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: fetchSubjects,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateSubjectInput>({
    resolver: zodResolver(CreateSubjectSchema) as any,
    defaultValues: { name: '', slug: '', iconName: 'BookOpen', color: '#6366f1', isActive: true },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateSubjectInput) => {
      const url = editing ? `/api/admin/subjects/${editing.id}` : '/api/admin/subjects';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subjects'] });
      toast.success(editing ? 'Subject updated' : 'Subject created');
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subjects'] });
      toast.success('Subject deleted');
    },
    onError: () => toast.error('Failed to delete subject'),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', slug: '', iconName: 'BookOpen', color: '#6366f1', isActive: true });
    setOpen(true);
  };

  const openEdit = (subject: SubjectClient) => {
    setEditing(subject);
    form.reset({
      name: subject.name,
      slug: subject.slug,
      description: subject.description,
      iconName: subject.iconName,
      color: subject.color,
      isActive: subject.isActive,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Subject
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Slug</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Topics</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">MCQs</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjects?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-10">No subjects yet</td>
                </tr>
              ) : (
                subjects?.map((subject, i) => (
                  <tr key={subject.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: subject.color }} />
                        <span className="font-medium text-sm">{subject.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{subject.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TreePine className="h-3.5 w-3.5" />
                        <span>{subject.topicCount ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span>{subject.mcqCount ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={subject.isActive ? 'success' : 'secondary'} className="text-xs">
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Refresh topic & MCQ counts"
                          disabled={refreshingId === subject.id}
                          onClick={() => refreshCounts(subject.id)}
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshingId === subject.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete subject?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will deactivate &ldquo;{subject.name}&rdquo; and hide it from the platform.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(subject.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Subject' : 'New Subject'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => saveMutation.mutate(data as CreateSubjectInput))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                {...form.register('name', {
                  onChange: (e) => {
                    if (!editing) form.setValue('slug', slugify(e.target.value));
                  },
                })}
                placeholder="e.g. Mathematics"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Slug <span className="text-destructive">*</span></Label>
              <Input {...form.register('slug')} placeholder="e.g. mathematics" />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...form.register('description')} placeholder="Optional description" />
            </div>

            <div className="space-y-1.5">
              <Label>Icon Name</Label>
              <Input {...form.register('iconName')} placeholder="e.g. BookOpen, FlaskConical" />
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => form.setValue('color', color)}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      background: color,
                      borderColor: form.watch('color') === color ? 'hsl(var(--foreground))' : 'transparent',
                    }}
                  />
                ))}
                <Input
                  type="color"
                  {...form.register('color')}
                  className="h-7 w-7 cursor-pointer rounded-full border-2 p-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(v) => form.setValue('isActive', v)}
              />
              <Label className="font-normal">Active</Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Subject'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
