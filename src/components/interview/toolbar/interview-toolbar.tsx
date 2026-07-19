'use client';

import { MousePointer2, Hand, Square, Circle, Diamond, Triangle, Magnet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCanvasStore } from '@/stores/canvas-store';
import type { NodeShape } from '@/types/interview.types';
import { cn } from '@/lib/utils';

const SHAPE_TOOLS: { kind: NodeShape['kind']; icon: typeof Square; label: string }[] = [
  { kind: 'RECTANGLE', icon: Square, label: 'Rectangle' },
  { kind: 'CIRCLE', icon: Circle, label: 'Circle' },
  { kind: 'DIAMOND', icon: Diamond, label: 'Diamond' },
  { kind: 'TRIANGLE', icon: Triangle, label: 'Triangle' },
];

function ToolButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="icon"
      className={cn('h-9 w-9', active && 'shadow-sm')}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function InterviewToolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeShapeKind = useCanvasStore((s) => s.activeShapeKind);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const zoom = useCanvasStore((s) => s.viewport.zoom);
  const setTool = useCanvasStore((s) => s.setTool);
  const setActiveShapeKind = useCanvasStore((s) => s.setActiveShapeKind);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);

  function selectShapeTool(kind: NodeShape['kind']) {
    setActiveShapeKind(kind);
    setTool('SHAPE');
  }

  return (
    <div className="flex items-center gap-1 border-b border-border px-3 py-2 bg-card">
      <ToolButton active={activeTool === 'SELECT'} label="Select (V)" onClick={() => setTool('SELECT')}>
        <MousePointer2 className="h-4 w-4" />
      </ToolButton>
      <ToolButton active={activeTool === 'PAN'} label="Pan — or hold Space (H)" onClick={() => setTool('PAN')}>
        <Hand className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {SHAPE_TOOLS.map(({ kind, icon: Icon, label }) => (
        <ToolButton
          key={kind}
          active={activeTool === 'SHAPE' && activeShapeKind === kind}
          label={label}
          onClick={() => selectShapeTool(kind)}
        >
          <Icon className="h-4 w-4" />
        </ToolButton>
      ))}

      <ToolButton active={activeTool === 'ARROW'} label="Arrow (A)" onClick={() => setTool('ARROW')}>
        <ArrowRight className="h-4 w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolButton active={snapEnabled} label="Snap to grid" onClick={toggleSnap}>
        <Magnet className="h-4 w-4" />
      </ToolButton>

      <div className="ml-auto text-xs text-muted-foreground tabular-nums px-2">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
