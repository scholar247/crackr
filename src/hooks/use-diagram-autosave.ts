'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';

const SAVE_DEBOUNCE_MS = 800;

/**
 * Debounced PATCH of canvas state back to the diagram whenever shapes,
 * viewport, or layers change. `enabled` should stay false until hydration
 * (loading the fetched diagram into the store) has completed — otherwise
 * the store's default empty state would autosave over real content the
 * instant this mounts. Full React Query + optimistic-update persistence is
 * Phase 6; this is intentionally the simplest thing that works for now.
 */
export function useDiagramAutosave(diagramId: string, enabled: boolean) {
  const shapes = useCanvasStore((s) => s.shapes);
  const viewport = useCanvasStore((s) => s.viewport);
  const layers = useCanvasStore((s) => s.layers);
  const getContent = useCanvasStore((s) => s.getContent);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Starts (and stays, while disabled) true so the render where `enabled`
  // first flips to true — which is hydration landing in the store, not a
  // user edit — gets skipped instead of immediately saving itself back.
  const skipNextRef = useRef(true);

  useEffect(() => {
    if (!enabled) {
      skipNextRef.current = true;
      return;
    }
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetch(`/api/interview/diagrams/${diagramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: getContent() }),
      }).catch(() => {
        // Best-effort for now — a visible saved/error indicator lands with
        // Phase 6's proper persistence UX.
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [shapes, viewport, layers, enabled, diagramId, getContent]);
}
