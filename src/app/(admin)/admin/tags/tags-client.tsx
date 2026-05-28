'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Merge } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateTagSchema, type CreateTagInput } from '@/schemas';
import type { Tag } from '@/types';
import { slugify } from '@/lib/utils';
import { cn } from '@/lib/utils';

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch('/api/admin/tags');
  return (await res.json()).data;
}

export function TagsClient() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSourceIds, setMergeSourceIds] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  const { data: tags, isLoading } = useQuery({ queryKey: ['admin-tags'], queryFn: fetchTags });

  const form = useForm<CreateTagInput>({
    resolver: zodResolver(CreateTagSchema),
    defaultValues: { name: '', slug: '', color: '#6366f1' },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTagInput) => {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tags'] });
      toast.success('Tag created');
      setCreateOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!mergeTargetId || mergeSourceIds.length === 0) throw new Error('Select source and target tags');
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'merge', sourceTagIds: mergeSourceIds, targetTagId: mergeTargetId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Merge failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tags'] });
      toast.success('Tags merged successfully');
      setMergeOpen(false);
      setMergeSourceIds([]);
      setMergeTargetId('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMergeSource = (id: string) => {
    setMergeSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setMergeOpen(true)}>
          <Merge className="h-4 w-4" />
          Merge Tags
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Tag
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          {!tags?.length ? (
            <p className="text-center text-muted-foreground py-8">No tags yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5"
                  style={{ borderColor: tag.color + '40', background: tag.color + '15' }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: tag.color }} />
                  <span className="text-sm font-medium">{tag.name}</span>
                  <span className="text-xs text-muted-foreground">({tag.usageCount})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                {...form.register('name', {
                  onChange: (e) => form.setValue('slug', slugify(e.target.value)),
                })}
                placeholder="e.g. Thermodynamics"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Slug <span className="text-destructive">*</span></Label>
              <Input {...form.register('slug')} placeholder="e.g. thermodynamics" />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  {...form.register('color')}
                  className="h-9 w-16 cursor-pointer rounded-md border p-1"
                />
                <span className="text-sm text-muted-foreground font-mono">{form.watch('color')}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? 'Creating…' : 'Create Tag'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Tags Dialog */}
      <Dialog open={mergeOpen} onOpenChange={(v) => { setMergeOpen(v); if (!v) { setMergeSourceIds([]); setMergeTargetId(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Merge Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Source tags (will be removed)</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border p-3 min-h-[60px]">
                {tags?.map((tag) => {
                  const selected = mergeSourceIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleMergeSource(tag.id)}
                      disabled={tag.id === mergeTargetId}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        selected
                          ? 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-border text-muted-foreground hover:border-destructive hover:text-destructive',
                        tag.id === mergeTargetId && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Target tag (will keep)</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border p-3 min-h-[60px]">
                {tags?.map((tag) => {
                  const selected = mergeTargetId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setMergeTargetId(selected ? '' : tag.id)}
                      disabled={mergeSourceIds.includes(tag.id)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        selected
                          ? 'border-success bg-success/10 text-success'
                          : 'border-border text-muted-foreground hover:border-success hover:text-success',
                        mergeSourceIds.includes(tag.id) && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {mergeSourceIds.length > 0 && mergeTargetId && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                Merging <strong>{mergeSourceIds.length} tag(s)</strong> into &ldquo;{tags?.find((t) => t.id === mergeTargetId)?.name}&rdquo;. All MCQs tagged with source tags will be re-tagged to the target.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => mergeMutation.mutate()}
                disabled={mergeSourceIds.length === 0 || !mergeTargetId || mergeMutation.isPending}
                className="flex-1"
              >
                {mergeMutation.isPending ? 'Merging…' : 'Merge Tags'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
