'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { UserClient, UserRole } from '@/types';
import { ROLE_COLORS } from '@/lib/utils';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'STUDENT',    label: 'Student' },
  { value: 'REVIEWER',   label: 'Reviewer' },
  { value: 'EDITOR',     label: 'Editor' },
  { value: 'TEACHER',    label: 'Teacher' },
  { value: 'ADMIN',      label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

async function fetchUsers(params: URLSearchParams): Promise<{ items: UserClient[]; total: number }> {
  const res = await fetch(`/api/admin/users?${params}`);
  const json = await res.json();
  return { items: json.data ?? [], total: json.meta?.total ?? 0 };
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  user: UserClient;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { name?: string; role?: UserRole }) => Promise<void>;
  saving: boolean;
}

function EditDialog({ user, isSuperAdmin, onClose, onSave, saving }: EditDialogProps) {
  const [name, setName] = useState(user.name ?? '');
  const [role, setRole] = useState<UserRole>(user.role);

  const dirty = name.trim() !== (user.name ?? '') || role !== user.role;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar + email (read-only) */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL} />
              <AvatarFallback className="text-sm font-semibold">
                {user.name?.slice(0, 2).toUpperCase() ?? '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Display name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Role</Label>
            {isSuperAdmin ? (
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[r.value]}`}>
                          {r.label}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <Badge variant="outline" className={`text-xs ${ROLE_COLORS[role]}`}>{role}</Badge>
                <span className="text-xs text-muted-foreground ml-1">Only super admins can change roles</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => onSave(user.id, { name: name.trim() || undefined, role: isSuperAdmin ? role : undefined })}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function UsersClient() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserClient | null>(null);
  const pageSize = 20;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params.toString()],
    queryFn: () => fetchUsers(params),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, patch }: { userId: string; patch: { name?: string; role?: UserRole } }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
      setEditingUser(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';
  const isAdmin = session?.user.role === 'ADMIN' || isSuperAdmin;
  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden md:table-cell">Joined</th>
                {isAdmin && (
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-10">No users found</td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback className="text-xs">
                            {user.name?.slice(0, 2).toUpperCase() ?? '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">{user.email}</p>
                        </div>
                        {user.id === session?.user.id && (
                          <Badge variant="outline" className="text-xs ml-1">You</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role]}`}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={user.id === session?.user.id}
                          onClick={() => setEditingUser(user)}
                          title={user.id === session?.user.id ? 'Cannot edit your own account' : 'Edit user'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {editingUser && (
        <EditDialog
          user={editingUser}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditingUser(null)}
          saving={updateMutation.isPending}
          onSave={async (id, patch) => {
            // Strip undefined fields so we don't send empty patches
            const clean = Object.fromEntries(
              Object.entries(patch).filter(([, v]) => v !== undefined)
            ) as { name?: string; role?: UserRole };
            if (Object.keys(clean).length === 0) { setEditingUser(null); return; }
            updateMutation.mutate({ userId: id, patch: clean });
          }}
        />
      )}
    </div>
  );
}
