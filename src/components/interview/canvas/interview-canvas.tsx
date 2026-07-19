'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasStore } from '@/stores/canvas-store';
import { useCanvasInteractions } from '@/hooks/use-canvas-interactions';
import { useDiagramAutosave } from '@/hooks/use-diagram-autosave';
import type { DiagramContent } from '@/types/interview.types';
import { CanvasGrid } from './canvas-grid';
import { ShapeNode } from './shape-node';
import { ConnectorNode } from './connector-node';
import { InterviewToolbar } from '../toolbar/interview-toolbar';
import { ShapePropertiesPanel } from '../toolbar/shape-properties-panel';

interface InterviewCanvasProps {
  diagramId: string;
  initialContent: DiagramContent;
  /** Whether this visitor is currently allowed to edit — see the
   *  TODO(auth) notes in interview.service.ts for how this is decided
   *  while the module has no login flow yet. Viewers get pan/zoom only. */
  canEdit: boolean;
}

export function InterviewCanvas({ diagramId, initialContent, canEdit }: InterviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hydrated, setHydrated] = useState(false);

  const shapes = useCanvasStore((s) => s.shapes);
  const viewport = useCanvasStore((s) => s.viewport);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const hydrate = useCanvasStore((s) => s.hydrate);
  const setCanEdit = useCanvasStore((s) => s.setCanEdit);

  const { isPanMode, draftShape, draftConnector, stageProps } = useCanvasInteractions();
  useDiagramAutosave(diagramId, canEdit && hydrated);

  // Load the diagram fetched on the server into the store exactly once —
  // intentionally ignores `initialContent`/`hydrate` identity: this must run
  // only on mount, not whenever the parent re-renders with a new object.
  useEffect(() => {
    hydrate(initialContent);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the store's permission flag (which gates shape dragging — see
  // ShapeNode) in sync with what the server resolved for this visitor.
  useEffect(() => {
    setCanEdit(canEdit);
  }, [canEdit, setCanEdit]);

  // A read-only visitor can still look around, just never in a tool that edits.
  useEffect(() => {
    if (!canEdit && (activeTool === 'SHAPE' || activeTool === 'ARROW')) setTool('SELECT');
  }, [canEdit, activeTool, setTool]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cursor = isPanMode ? 'grab' : activeTool === 'SHAPE' || activeTool === 'ARROW' ? 'crosshair' : 'default';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {canEdit && <InterviewToolbar />}
      <div ref={containerRef} className="relative flex-1 min-h-0 bg-background" style={{ cursor }}>
        {size.width > 0 && size.height > 0 && (
          <Stage
            width={size.width}
            height={size.height}
            x={viewport.x}
            y={viewport.y}
            scaleX={viewport.zoom}
            scaleY={viewport.zoom}
            {...stageProps}
          >
            <Layer>
              <CanvasGrid width={size.width} height={size.height} />
              {shapes.map((shape) => {
                if (shape.category === 'NODE') return <ShapeNode key={shape.id} shape={shape} />;
                if (shape.category === 'CONNECTOR') return <ConnectorNode key={shape.id} shape={shape} />;
                return null;
              })}
              {draftShape && <ShapeNode shape={draftShape} isDraft />}
              {draftConnector && (
                <ConnectorNode
                  shape={{
                    category: 'CONNECTOR',
                    id: 'draft-connector',
                    layerId: 'default',
                    points: [draftConnector.start, draftConnector.end],
                    startArrow: false,
                    endArrow: true,
                    stroke: '#374151',
                    strokeWidth: 2,
                    locked: false,
                    hidden: false,
                  }}
                  isDraft
                />
              )}
            </Layer>
          </Stage>
        )}
        <ShapePropertiesPanel />
      </div>
    </div>
  );
}
