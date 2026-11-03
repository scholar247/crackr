'use client';

import { Copy, Eraser, LoaderCircle, Play, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isRunning: boolean;
  lineCount: number;
  charCount: number;
  modKey: string;
  onRun: () => void;
  onFormat: () => void;
  onCopy: () => void;
  onClear: () => void;
}

export function EditorToolbar({ isRunning, lineCount, charCount, modKey, onRun, onFormat, onCopy, onClear }: Props) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-border bg-card px-3">
      <Button size="sm" onClick={onRun} disabled={isRunning} title={`Run (${modKey}+Enter) — runs only the selection if there is one`}>
        {isRunning ? <LoaderCircle className="!h-3.5 !w-3.5 animate-spin" /> : <Play className="!h-3.5 !w-3.5" fill="currentColor" />}
        {isRunning ? 'Running…' : 'Run'}
        <kbd className="ml-0.5 rounded bg-primary-foreground/15 px-1 font-mono text-[10px]">{modKey}↵</kbd>
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button variant="ghost" size="sm" onClick={onFormat} title="Format (Shift+Alt+F)">
        <WandSparkles className="!h-3.5 !w-3.5" /> Format
      </Button>
      <Button variant="ghost" size="sm" onClick={onCopy}>
        <Copy className="!h-3.5 !w-3.5" /> Copy
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        <Eraser className="!h-3.5 !w-3.5" /> Clear
      </Button>

      <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:inline">
        {lineCount} lines · {charCount.toLocaleString()} chars
      </span>
    </div>
  );
}
