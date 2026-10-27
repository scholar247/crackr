'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Globe, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMMUNITY_LIMITS } from '@/lib/community-limits';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

export function CommunityForm({ examOptions, isAdmin }: { examOptions: ExamOption[]; isAdmin: boolean }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [examId, setExamId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (name.trim().length < COMMUNITY_LIMITS.NAME_MIN) return toast.error(`Name needs at least ${COMMUNITY_LIMITS.NAME_MIN} characters.`);
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined, visibility, examId: examId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not create community');
      router.push(`/communities/${json.data.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create community');
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <Label htmlFor="community-name">Community Name</Label>
            <Input id="community-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NIMCET Warriors" maxLength={COMMUNITY_LIMITS.NAME_MAX} className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="community-description">Description (optional)</Label>
            <Textarea
              id="community-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this community for?"
              maxLength={COMMUNITY_LIMITS.DESCRIPTION_MAX}
              className="mt-1.5 resize-none"
            />
          </div>

          <div>
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'PUBLIC' | 'PRIVATE')}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public — anyone can find and join</SelectItem>
                <SelectItem value="PRIVATE">Private — hidden, members are added directly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Make this the official community for an exam
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Only one official community is allowed per exam. Leave unset for a regular community.</p>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger className="mt-3 w-full">
                  <SelectValue placeholder="No exam (regular community)" />
                </SelectTrigger>
                <SelectContent>
                  {examOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.programName} — {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleCreate} disabled={submitting || !name.trim()}>
            {submitting ? 'Creating…' : 'Create community'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-label-caps uppercase text-muted-foreground">Live preview</p>
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-md text-foreground">{name.trim() || 'Community name preview'}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {visibility === 'PUBLIC' ? 'Public' : 'Private'}
                </span>
                <span className="text-xs text-muted-foreground">1 member</span>
              </div>
            </div>
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-foreground">{description.trim() || "A brief description of your community will appear here. Tell people why they should join."}</p>
        </div>
      </div>
    </div>
  );
}
