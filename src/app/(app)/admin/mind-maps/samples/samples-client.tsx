'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MindMap } from '@/components/mind-map/mind-map';
import { MIND_MAP_SAMPLES } from '@/components/mind-map/samples';
import { countNodes, type MindMapTheme } from '@/lib/mind-maps';
import { cn } from '@/lib/utils';

// Admin-only preview of sample maps: checks the classic print style, Hindi labels, node
// styles and large-map layout without creating anything in the database.
export function SamplesClient() {
  const [sampleId, setSampleId] = useState<string>(MIND_MAP_SAMPLES[0].id);
  const [theme, setTheme] = useState<MindMapTheme>('COLOUR');
  const sample = MIND_MAP_SAMPLES.find((s) => s.id === sampleId) ?? MIND_MAP_SAMPLES[0];

  return (
    <div>
      <Link href="/admin/mind-maps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All mind maps
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Mind map samples</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Preview only — nothing here is saved or published. Use it to check styles (classic print, headings, dashed sub-lists, highlights, tags, Hindi labels) and how large maps lay out. Try
        “Expand all”, the EN/हिं switch and Download PDF.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {MIND_MAP_SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSampleId(s.id)}
            aria-pressed={s.id === sampleId}
            className={cn('rounded-full border px-3 py-1.5 text-sm font-medium', s.id === sampleId ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-primary/40')}
          >
            {s.name} · {countNodes(s.nodes)} nodes
          </button>
        ))}
        <select value={theme} onChange={(e) => setTheme(e.target.value as MindMapTheme)} className="ml-auto h-9 rounded-md border border-input bg-background px-2 text-sm" aria-label="Default style">
          <option value="COLOUR">Colour branches</option>
          <option value="CLASSIC">Classic print</option>
        </select>
      </div>

      <MindMap key={`${sample.id}:${theme}`} title={{ eyebrow: 'Sample', subject: sample.subject, chapter: sample.chapter }} nodes={[...sample.nodes]} theme={theme} className="mt-4" />
    </div>
  );
}
