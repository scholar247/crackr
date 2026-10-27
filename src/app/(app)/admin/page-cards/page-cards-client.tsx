'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CTA_TYPES = ['TEXT', 'BUTTON'] as const;
const ACCENTS = ['PRIMARY', 'SECONDARY', 'TERTIARY'] as const;

interface PageCard {
  id: string;
  page: string;
  section: string;
  sequence: number;
  title: string;
  badge: string | null;
  description: string | null;
  listItems: string[] | null;
  ctaLabel: string | null;
  ctaLink: string | null;
  ctaType: (typeof CTA_TYPES)[number];
  accent: (typeof ACCENTS)[number];
  isActive: boolean;
}

interface FormState {
  page: string;
  section: string;
  sequence: string;
  title: string;
  badge: string;
  description: string;
  listItems: string; // one per line
  ctaLabel: string;
  ctaLink: string;
  ctaType: (typeof CTA_TYPES)[number];
  accent: (typeof ACCENTS)[number];
  isActive: boolean;
}

const EMPTY: FormState = {
  page: 'home',
  section: 'learning-loop',
  sequence: '1',
  title: '',
  badge: '',
  description: '',
  listItems: '',
  ctaLabel: '',
  ctaLink: '',
  ctaType: 'TEXT',
  accent: 'PRIMARY',
  isActive: true,
};

function toForm(card: PageCard): FormState {
  return {
    page: card.page,
    section: card.section,
    sequence: String(card.sequence),
    title: card.title,
    badge: card.badge ?? '',
    description: card.description ?? '',
    listItems: (card.listItems ?? []).join('\n'),
    ctaLabel: card.ctaLabel ?? '',
    ctaLink: card.ctaLink ?? '',
    ctaType: card.ctaType,
    accent: card.accent,
    isActive: card.isActive,
  };
}

function toPayload(f: FormState) {
  return {
    page: f.page.trim(),
    section: f.section.trim(),
    sequence: Number(f.sequence) || 0,
    title: f.title.trim(),
    badge: f.badge.trim() || null,
    description: f.description.trim() || null,
    listItems: f.listItems
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
    ctaLabel: f.ctaLabel.trim() || null,
    ctaLink: f.ctaLink.trim() || null,
    ctaType: f.ctaType,
    accent: f.accent,
    isActive: f.isActive,
  };
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json.data;
}

export function PageCardsClient() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PageCard | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data: cards = [], isLoading } = useQuery<PageCard[]>({
    queryKey: ['admin-page-cards'],
    queryFn: () => api('/api/v1/admin/page-cards', 'GET'),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = toPayload(form);
      return editing === 'new' || editing === null
        ? api('/api/v1/admin/page-cards', 'POST', payload)
        : api(`/api/v1/admin/page-cards/${editing.id}`, 'PATCH', payload);
    },
    onSuccess: () => {
      toast.success('Card saved');
      qc.invalidateQueries({ queryKey: ['admin-page-cards'] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (card: PageCard) => api(`/api/v1/admin/page-cards/${card.id}`, 'PATCH', toPayload({ ...toForm(card), isActive: !card.isActive })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-page-cards'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (card: PageCard) => api(`/api/v1/admin/page-cards/${card.id}`, 'DELETE'),
    onSuccess: () => {
      toast.success('Card deleted');
      qc.invalidateQueries({ queryKey: ['admin-page-cards'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };
  const openEdit = (card: PageCard) => {
    setForm(toForm(card));
    setEditing(card);
  };
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Page cards</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Cards shown on public pages. Only active cards render, ordered by sequence within their page and section. The
            homepage&apos;s three-card section is <code>home</code> / <code>learning-loop</code>.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> New card
        </Button>
      </div>

      <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && cards.length === 0 && <p className="p-4 text-sm text-muted-foreground">No cards yet.</p>}
        {cards.map((card) => (
          <div key={card.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="w-8 text-center font-mono text-sm text-muted-foreground">{card.sequence}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{card.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {card.page} / {card.section}
                {card.ctaLabel ? ` · ${card.ctaLabel} (${card.ctaType.toLowerCase()})` : ''}
              </p>
            </div>
            <Badge variant={card.isActive ? 'success' : 'outline'}>{card.isActive ? 'Active' : 'Hidden'}</Badge>
            <Switch checked={card.isActive} onCheckedChange={() => toggle.mutate(card)} aria-label="Toggle active" />
            <Button variant="ghost" size="icon" onClick={() => openEdit(card)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => {
                if (confirm(`Delete "${card.title}"?`)) remove.mutate(card);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New card' : 'Edit card'}</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Page</Label>
                <Input value={form.page} onChange={(e) => set('page', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input value={form.section} onChange={(e) => set('section', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Sequence</Label>
                <Input type="number" min={0} value={form.sequence} onChange={(e) => set('sequence', e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={160} required />
            </div>
            <div className="space-y-1.5">
              <Label>Badge (optional)</Label>
              <Input value={form.badge} onChange={(e) => set('badge', e.target.value)} maxLength={60} placeholder="Concept foundation" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} maxLength={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>List info (one item per line)</Label>
              <Textarea value={form.listItems} onChange={(e) => set('listItems', e.target.value)} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CTA label</Label>
                <Input value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label>CTA link</Label>
                <Input value={form.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} placeholder="/exams" />
              </div>
              <div className="space-y-1.5">
                <Label>CTA type</Label>
                <Select value={form.ctaType} onValueChange={(v) => set('ctaType', v as FormState['ctaType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CTA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === 'BUTTON' ? 'Button' : 'Text link'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Accent</Label>
                <Select value={form.accent} onValueChange={(v) => set('accent', v as FormState['accent'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCENTS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a.charAt(0) + a.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} id="card-active" />
              <Label htmlFor="card-active">Active (visible on the site)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
