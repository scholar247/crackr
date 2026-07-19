'use client';

import dynamic from 'next/dynamic';
import type { DiagramContent } from '@/types/interview.types';

// Konva touches `window`/canvas APIs at import time, so it can't be
// server-rendered. `ssr: false` is only valid from a Client Component (see
// AGENTS.md's Next.js docs note) — the page itself is a Server Component,
// so this loader is the client boundary that makes the dynamic import legal.
const InterviewCanvas = dynamic(
  () => import('./interview-canvas').then((mod) => mod.InterviewCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading canvas…
      </div>
    ),
  }
);

interface InterviewCanvasLoaderProps {
  diagramId: string;
  initialContent: DiagramContent;
  canEdit: boolean;
}

export function InterviewCanvasLoader(props: InterviewCanvasLoaderProps) {
  return <InterviewCanvas {...props} />;
}
