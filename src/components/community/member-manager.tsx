'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Crown, UserMinus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MemberView {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data;
}

export function MemberManager({ communityId, initialMembers, myRole }: { communityId: string; initialMembers: MemberView[]; myRole: 'OWNER' | 'MODERATOR' }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  async function addMember() {
    if (!email.trim()) return;
    setInviting(true);
    try {
      await fetchJson(`/api/v1/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      toast.success('Member added');
      setEmail('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setInviting(false);
    }
  }

  async function setRole(userId: string, role: 'MODERATOR' | 'MEMBER') {
    try {
      await fetchJson(`/api/v1/communities/${communityId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update role');
    }
  }

  async function removeMember(userId: string) {
    try {
      await fetchJson(`/api/v1/communities/${communityId}/members/${userId}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove member');
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-foreground">Add a member by email</p>
        <p className="mt-1 text-xs text-muted-foreground">They need an existing account — this is also the only way into a private community.</p>
        <div className="mt-3 flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" type="email" />
          <Button onClick={addMember} disabled={inviting || !email.trim()}>
            <Mail className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                {m.image && <AvatarImage src={m.image} alt="" />}
                <AvatarFallback>{(m.name ?? m.email).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{m.name ?? m.email}</p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {m.role === 'OWNER' && (
                <Badge variant="secondary">
                  <Crown className="h-3 w-3" /> Owner
                </Badge>
              )}
              {m.role === 'MODERATOR' && (
                <Badge variant="secondary">
                  <ShieldCheck className="h-3 w-3" /> Moderator
                </Badge>
              )}

              {myRole === 'OWNER' && m.role === 'MEMBER' && (
                <Button size="sm" variant="outline" onClick={() => setRole(m.userId, 'MODERATOR')}>
                  Make moderator
                </Button>
              )}
              {myRole === 'OWNER' && m.role === 'MODERATOR' && (
                <Button size="sm" variant="outline" onClick={() => setRole(m.userId, 'MEMBER')}>
                  Remove moderator
                </Button>
              )}
              {m.role !== 'OWNER' && (m.role === 'MEMBER' || myRole === 'OWNER') && (
                <Button size="sm" variant="ghost" onClick={() => removeMember(m.userId)}>
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
