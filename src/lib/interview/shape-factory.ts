import type { ConnectorShape, NodeShape, ShapeAnchor, ShapeKind } from '@/types/interview.types';

/** Shape kinds Phase 3's toolbar can create — the rest of `ShapeKind` (the
 *  system-design icon set) lands with the icon-library phase. */
export const BASIC_SHAPE_KINDS: ShapeKind[] = ['RECTANGLE', 'CIRCLE', 'DIAMOND', 'TRIANGLE'];

const DEFAULT_FILL: Partial<Record<ShapeKind, string>> = {
  RECTANGLE: '#dbeafe',
  CIRCLE: '#dcfce7',
  DIAMOND: '#fef3c7',
  TRIANGLE: '#fce7f3',
};

const DEFAULT_STROKE: Partial<Record<ShapeKind, string>> = {
  RECTANGLE: '#2563eb',
  CIRCLE: '#16a34a',
  DIAMOND: '#d97706',
  TRIANGLE: '#db2777',
};

export function createNodeShape(params: {
  kind: ShapeKind;
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}): NodeShape {
  const { kind, layerId, x, y, width, height } = params;
  return {
    category: 'NODE',
    id: crypto.randomUUID(),
    layerId,
    kind,
    x,
    y,
    width,
    height,
    rotation: 0,
    fill: DEFAULT_FILL[kind] ?? '#e5e7eb',
    stroke: DEFAULT_STROKE[kind] ?? '#6b7280',
    strokeWidth: 2,
    locked: false,
    hidden: false,
  };
}

const DEFAULT_CONNECTOR_STROKE = '#374151';

/** An arrow is a `ConnectorShape` — `sourceId`/`targetId` are only set when
 *  the draw gesture started/ended on top of a NodeShape (see `findNodeAt`),
 *  so the same factory covers a standalone arrow and a shape-to-shape one. */
export function createConnectorShape(params: {
  layerId: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  sourceId?: string;
  targetId?: string;
  sourceAnchor?: ShapeAnchor;
  targetAnchor?: ShapeAnchor;
}): ConnectorShape {
  const { layerId, start, end, sourceId, targetId, sourceAnchor, targetAnchor } = params;
  return {
    category: 'CONNECTOR',
    id: crypto.randomUUID(),
    layerId,
    points: [start, end],
    sourceId,
    targetId,
    sourceAnchor,
    targetAnchor,
    startArrow: false,
    endArrow: true,
    stroke: DEFAULT_CONNECTOR_STROKE,
    strokeWidth: 2,
    locked: false,
    hidden: false,
  };
}
