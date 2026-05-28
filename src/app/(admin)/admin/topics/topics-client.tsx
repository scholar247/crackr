'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, TreePine,
  GripVertical, FolderOpen, Folder,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CreateTopicSchema, type CreateTopicInput } from '@/schemas';
import type { SubjectClient, TopicTreeNode } from '@/types';
import { cn } from '@/lib/utils';

const DEPTH_LABELS = ['Chapter', 'Section', 'Subtopic'];

async function fetchSubjects(): Promise<SubjectClient[]> {
  const res = await fetch('/api/admin/subjects');
  return (await res.json()).data ?? [];
}

async function fetchTopicTree(subjectId: string): Promise<TopicTreeNode[]> {
  const res = await fetch(`/api/admin/topics?subjectId=${subjectId}&tree=true`);
  return (await res.json()).data ?? [];
}

interface TopicFormData {
  name: string;
  description?: string;
  order?: number;
}

function TopicNode({
  node,
  depth,
  subjectId,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: TopicTreeNode;
  depth: number;
  subjectId: string;
  onAddChild: (parentId: string, depth: number) => void;
  onEdit: (node: TopicTreeNode) => void;
  onDelete: (node: TopicTreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const canAddChild = depth < 2; // max depth 2 (0-indexed = subtopic level)

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors',
          depth === 0 && 'font-medium'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground"
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Icon */}
        {hasChildren && expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary/70" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Name */}
        <span className="flex-1 text-sm truncate">{node.name}</span>

        {/* MCQ count badge */}
        {node.mcqCount > 0 && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">{node.mcqCount}</Badge>
        )}

        {/* Depth label */}
        <Badge variant="outline" className="text-xs h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {DEPTH_LABELS[depth] ?? `L${depth}`}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAddChild && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onAddChild(node.id, depth + 1)}
              title={`Add ${DEPTH_LABELS[depth + 1]}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(node)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                disabled={node.mcqCount > 0}
                title={node.mcqCount > 0 ? 'Cannot delete: has MCQs' : 'Delete topic'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{node.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate this topic. Topics with MCQs cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(node)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TopicNode
              key={child.id}
              node={child}
              depth={depth + 1}
              subjectId={subjectId}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TopicsClient() {
  const qc = useQueryClient();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicTreeNode | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [addingDepth, setAddingDepth] = useState(0);

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  });

  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['topic-tree', selectedSubjectId],
    queryFn: () => fetchTopicTree(selectedSubjectId),
    enabled: !!selectedSubjectId,
  });

  const form = useForm<TopicFormData>({
    defaultValues: { name: '', description: '', order: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TopicFormData) => {
      if (editingTopic) {
        const res = await fetch(`/api/admin/topics/${editingTopic.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      } else {
        const payload: CreateTopicInput = {
          name: data.name,
          subjectId: selectedSubjectId,
          parentId: addingParentId,
          description: data.description,
          order: data.order ?? 0,
        };
        const parsed = CreateTopicSchema.safeParse(payload);
        if (!parsed.success) throw new Error('Invalid topic data');
        const res = await fetch('/api/admin/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topic-tree', selectedSubjectId] });
      toast.success(editingTopic ? 'Topic updated' : 'Topic created');
      setDialogOpen(false);
      form.reset();
      setEditingTopic(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const res = await fetch(`/api/admin/topics/${topicId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topic-tree', selectedSubjectId] });
      toast.success('Topic deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAdd = (parentId: string | null, depth: number) => {
    setEditingTopic(null);
    setAddingParentId(parentId);
    setAddingDepth(depth);
    form.reset({ name: '', description: '', order: 0 });
    setDialogOpen(true);
  };

  const openEdit = (node: TopicTreeNode) => {
    setEditingTopic(node);
    setAddingParentId(node.parentId);
    setAddingDepth(node.depth);
    form.reset({ name: node.name, description: node.description ?? '', order: node.order });
    setDialogOpen(true);
  };

  const handleDelete = (node: TopicTreeNode) => {
    deleteMutation.mutate(node.id);
  };

  const dialogTitle = editingTopic
    ? `Edit "${editingTopic.name}"`
    : `Add ${DEPTH_LABELS[addingDepth] ?? 'Topic'}${addingParentId ? ' (child)' : ''}`;

  return (
    <div className="space-y-4">
      {/* Subject selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {subjectsLoading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedSubjectId && (
          <Button size="sm" onClick={() => openAdd(null, 0)}>
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        )}
      </div>

      {/* Tree */}
      {!selectedSubjectId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
          <TreePine className="h-10 w-10 opacity-30" />
          <p className="font-medium">Select a subject to view its topic tree</p>
        </div>
      ) : treeLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : !tree || tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground rounded-xl border border-dashed border-border">
          <TreePine className="h-10 w-10 opacity-30" />
          <p className="font-medium">No topics yet</p>
          <p className="text-sm">Add a chapter to get started.</p>
          <Button size="sm" onClick={() => openAdd(null, 0)}>
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-3">
          {tree.map((node) => (
            <TopicNode
              key={node.id}
              node={node}
              depth={0}
              subjectId={selectedSubjectId}
              onAddChild={(parentId, depth) => openAdd(parentId, depth)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTopic(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                {...form.register('name', { required: true })}
                placeholder={`${DEPTH_LABELS[addingDepth] ?? 'Topic'} name`}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                {...form.register('description')}
                placeholder="Brief description…"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={0}
                {...form.register('order', { valueAsNumber: true })}
                placeholder="0"
                className="w-24"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editingTopic ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
