'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';

/** Comma-separated tag entry with pill display, matching the create-assessment design. */
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');

  function commit(raw: string) {
    const parts = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...tags, ...parts])).slice(0, ASSESSMENT_LIMITS.MAX_TAGS);
    onChange(next);
    setDraft('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <Label htmlFor="assessment-tags">Tags</Label>
      <Input
        id="assessment-tags"
        className="mt-1.5"
        value={draft}
        onChange={(e) => {
          const value = e.target.value;
          if (value.includes(',')) {
            commit(value);
          } else {
            setDraft(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          }
        }}
        onBlur={() => commit(draft)}
        placeholder="e.g., Arrays, OOPS, Midterm (comma separated)"
        disabled={tags.length >= ASSESSMENT_LIMITS.MAX_TAGS}
      />
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-label-caps uppercase text-foreground">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
