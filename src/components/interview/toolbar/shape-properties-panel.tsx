'use client';

import { ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCanvasStore } from '@/stores/canvas-store';
import type { StrokeStyle } from '@/types/interview.types';
import { cn } from '@/lib/utils';

const FILL_SWATCHES = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e5e7eb', '#ffffff'];
const STROKE_SWATCHES = ['#2563eb', '#16a34a', '#d97706', '#db2777', '#6b7280', '#111827'];
const STROKE_WEIGHTS: { label: string; value: number }[] = [
  { label: 'Thin', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Thick', value: 4 },
];
const STROKE_STYLES: { label: string; value: StrokeStyle }[] = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
];

function ColorRow({
  label,
  value,
  swatches,
  onChange,
}: {
  label: string;
  value: string;
  swatches: string[];
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-normal">{label}</Label>
      <div className="flex items-center gap-1.5">
        {swatches.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label}: ${color}`}
            className={cn(
              'h-6 w-6 rounded-full border transition-transform hover:scale-110',
              value === color ? 'border-foreground ring-2 ring-offset-1 ring-foreground/40' : 'border-border'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
        <label className="relative h-6 w-6 rounded-full border border-border overflow-hidden cursor-pointer shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-1 cursor-pointer"
            aria-label={`${label}: custom color`}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Floating inspector for the currently selected shape's visual style. Reads
 * the selection out of the store directly (rather than being passed the
 * shape as a prop) so it can live at the canvas root without every parent
 * having to thread selection state through.
 */
export function ShapePropertiesPanel() {
  const canEdit = useCanvasStore((s) => s.canEdit);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const shape = useCanvasStore((s) => (selectedId ? s.shapes.find((sh) => sh.id === selectedId) : undefined));
  const updateShape = useCanvasStore((s) => s.updateShape);

  if (!canEdit || !shape) return null;
  if (shape.category !== 'NODE' && shape.category !== 'CONNECTOR') return null;

  const isNode = shape.category === 'NODE';
  const strokeWidth = shape.strokeWidth ?? 2;
  const strokeStyle = shape.strokeStyle ?? 'solid';

  return (
    <div className="absolute top-3 right-3 z-10 w-56 rounded-lg border border-border bg-card p-3 shadow-lg space-y-3">
      <p className="text-xs font-semibold text-foreground">
        {isNode ? shape.kind.replace(/_/g, ' ').toLowerCase() : 'Arrow'}
      </p>

      {isNode && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-normal">Label</Label>
          <Input
            value={shape.label ?? ''}
            onChange={(e) => updateShape(shape.id, { label: e.target.value })}
            placeholder="Add text…"
            maxLength={200}
            className="h-7 text-xs"
          />
        </div>
      )}

      {isNode && (
        <ColorRow
          label="Fill"
          value={shape.fill ?? '#e5e7eb'}
          swatches={FILL_SWATCHES}
          onChange={(fill) => updateShape(shape.id, { fill })}
        />
      )}

      <ColorRow
        label="Border color"
        value={shape.stroke ?? '#6b7280'}
        swatches={STROKE_SWATCHES}
        onChange={(stroke) => updateShape(shape.id, { stroke })}
      />

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-normal">Border weight</Label>
        <div className="flex items-center gap-1">
          {STROKE_WEIGHTS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => updateShape(shape.id, { strokeWidth: value })}
              className={cn(
                'flex-1 h-7 rounded-md border text-xs flex items-center justify-center transition-colors',
                strokeWidth === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <span className="rounded-full bg-current" style={{ width: 14, height: Math.min(value, 5) }} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-normal">Line style</Label>
        <div className="flex items-center gap-1">
          {STROKE_STYLES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => updateShape(shape.id, { strokeStyle: value })}
              className={cn(
                'flex-1 h-7 rounded-md border text-xs flex items-center justify-center transition-colors',
                strokeStyle === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <span
                className="w-4 border-t-2 border-current"
                style={{
                  borderStyle: value === 'dashed' ? 'dashed' : value === 'dotted' ? 'dotted' : 'solid',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {!isNode && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-normal flex items-center gap-1">
                <ArrowRight className="h-3 w-3 rotate-180" /> Start arrow
              </Label>
              <Switch
                checked={shape.startArrow}
                onCheckedChange={(checked) => updateShape(shape.id, { startArrow: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-normal flex items-center gap-1">
                <ArrowRight className="h-3 w-3" /> End arrow
              </Label>
              <Switch
                checked={shape.endArrow}
                onCheckedChange={(checked) => updateShape(shape.id, { endArrow: checked })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
