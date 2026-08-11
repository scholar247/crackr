'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ROLE_COLORS } from '@/lib/utils';
import { USER_ROLES, type UserRole } from '@/lib/roles';
import { PREP_LEVELS, PREP_LEVEL_LABELS, type PrepLevel } from '@/lib/prep-level';
import { USER_STATUS_VALUES } from '@/schemas/user.schema';

type UserStatus = (typeof USER_STATUS_VALUES)[number];

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  targetYear: number | null;
  level: PrepLevel | null;
  createdAt: string;
}

const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  DISABLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
};

async function fetchUsers(): Promise<UserRow[]> {
  const res = await fetch('/api/v1/admin/users');
  if (!res.ok) throw new Error('Failed to load users');
  return (await res.json()).data;
}

async function patchJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error as string) ?? 'Request failed');
  }
  return (await res.json()).data;
}

function EditUserDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name ?? '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [targetYear, setTargetYear] = useState(user.targetYear?.toString() ?? '');
  const [level, setLevel] = useState<PrepLevel | 'NONE'>(user.level ?? 'NONE');

  const save = useMutation({
    mutationFn: () =>
      patchJson(`/api/v1/admin/users/${user.id}`, {
        name,
        role,
        status,
        targetYear: targetYear ? Number(targetYear) : undefined,
        level: level === 'NONE' ? undefined : level,
      }),
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_STATUS_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Target year</Label>
            <Input
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              placeholder="e.g. 2027"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as PrepLevel | 'NONE')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">—</SelectItem>
                {PREP_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {PREP_LEVEL_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5">
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsersListClient() {
  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers });
  const [editing, setEditing] = useState<UserRow | null>(null);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">User management</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Latest 10 users. Click edit to change role and other details.</p>
      </div>

      <div className="mt-6 divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && users?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No users yet.</p>}
        {users?.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{user.name || 'Unnamed'}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={ROLE_COLORS[user.role]}>{user.role.replace('_', ' ')}</Badge>
              <Badge className={STATUS_COLORS[user.status]}>{user.status}</Badge>
              <Button size="sm" variant="outline" onClick={() => setEditing(user)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
