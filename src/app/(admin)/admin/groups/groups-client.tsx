'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { CreateGroupSchema, type CreateGroupInput } from '@/schemas';
import type { Group, UserClient } from '@/types';
import { cn } from '@/lib/utils';

async function fetchGroups(): Promise<Group[]> {
  const res = await fetch('/api/admin/groups');
  return (await res.json()).data;
}

async function fetchUsers(): Promise<UserClient[]> {
  const res = await fetch('/api/admin/users?pageSize=200');
  return (await res.json()).data;
}

export function GroupsClient() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const { data: groups, isLoading } = useQuery({ queryKey: ['admin-groups'], queryFn: fetchGroups });
  const { data: users } = useQuery({ queryKey: ['admin-users-all'], queryFn: fetchUsers });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(CreateGroupSchema) as any,
    defaultValues: { name: '', description: '', memberIds: [] },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateGroupInput) => {
      const url = editing ? `/api/admin/groups/${editing.id}` : '/api/admin/groups';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, memberIds: selectedMemberIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-groups'] });
      toast.success(editing ? 'Group updated' : 'Group created');
      setOpen(false);
      setEditing(null);
      form.reset();
      setSelectedMemberIds([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-groups'] });
      toast.success('Group deleted');
    },
    onError: () => toast.error('Failed to delete group'),
  });

  const openCreate = () => {
    setEditing(null);
    setSelectedMemberIds([]);
    form.reset({ name: '', description: '', memberIds: [] });
    setOpen(true);
  };

  const openEdit = (group: Group) => {
    setEditing(group);
    setSelectedMemberIds(group.memberIds);
    form.reset({ name: group.name, description: group.description, memberIds: group.memberIds });
    setOpen(true);
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Group
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !groups?.length ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No groups yet</p>
          <p className="text-sm mt-1">Create groups to assign tests to specific students</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                  >
                    {expandedId === group.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(group)}>
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
                        <AlertDialogTitle>Delete group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{group.name}&rdquo; will be permanently deleted. Tests assigned to this group will lose group access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(group.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {expandedId === group.id && (
                <div className="border-t border-border px-4 py-3 bg-muted/20">
                  {group.memberIds.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No members</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {group.memberIds.map((memberId) => {
                        const user = userMap.get(memberId);
                        return (
                          <Badge key={memberId} variant="secondary" className="text-xs">
                            {user?.name ?? memberId}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setSelectedMemberIds([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Group' : 'New Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data as CreateGroupInput))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input {...form.register('name')} placeholder="e.g. Batch 2025-A" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...form.register('description')} placeholder="Optional description" rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Members ({selectedMemberIds.length} selected)</Label>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {users?.map((user) => {
                  const selected = selectedMemberIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors',
                        selected ? 'bg-primary/10' : 'hover:bg-muted'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMember(user.id)}
                        className="rounded"
                      />
                      <span className="text-sm flex-1">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Group'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
