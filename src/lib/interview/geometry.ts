import type { NodeShape, Shape, ShapeAnchor, StrokeStyle } from '@/types/interview.types';

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const DEFAULT_GRID_SIZE = 20;

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function shapeCenter(shape: Pick<NodeShape, 'x' | 'y' | 'width' | 'height'>): { x: number; y: number } {
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
}

/** The four boundary points a connector can bind to, besides the center. */
export const SHAPE_ANCHORS: ShapeAnchor[] = ['top', 'right', 'bottom', 'left'];

export function shapeAnchorPoint(
  shape: Pick<NodeShape, 'x' | 'y' | 'width' | 'height'>,
  anchor: ShapeAnchor | undefined
): { x: number; y: number } {
  switch (anchor) {
    case 'top':
      return { x: shape.x + shape.width / 2, y: shape.y };
    case 'bottom':
      return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
    case 'left':
      return { x: shape.x, y: shape.y + shape.height / 2 };
    case 'right':
      return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
    case 'center':
    default:
      return shapeCenter(shape);
  }
}

/** Which of a node's four side-anchors is closest to `point` — used to snap
 *  an arrow endpoint onto the nearest boundary dot instead of the center. */
export function nearestAnchor(shape: NodeShape, point: { x: number; y: number }): ShapeAnchor {
  let best: ShapeAnchor = SHAPE_ANCHORS[0];
  let bestDist = Infinity;
  for (const anchor of SHAPE_ANCHORS) {
    const anchorPoint = shapeAnchorPoint(shape, anchor);
    const dist = Math.hypot(anchorPoint.x - point.x, anchorPoint.y - point.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = anchor;
    }
  }
  return best;
}

function containsPoint(shape: NodeShape, point: { x: number; y: number }): boolean {
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.width &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.height
  );
}

/** Topmost visible NODE shape under `point`, used both to attach an arrow's
 *  endpoint to a shape while drawing and to hit-test where a dragged
 *  connector handle was dropped. Bounding-box test — good enough for
 *  attach/detach, doesn't need to match the exact rendered silhouette. */
export function findNodeAt(shapes: Shape[], point: { x: number; y: number }): NodeShape | undefined {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (shape.category === 'NODE' && !shape.hidden && !shape.locked && containsPoint(shape, point)) {
      return shape;
    }
  }
  return undefined;
}

/** Konva `dash` array for a given line style — undefined (solid) renders as
 *  a plain stroke since Konva treats a missing `dash` prop as solid. */
export function strokeDashArray(style: StrokeStyle | undefined, strokeWidth = 2): number[] | undefined {
  if (style === 'dashed') return [strokeWidth * 3, strokeWidth * 2];
  if (style === 'dotted') return [strokeWidth, strokeWidth * 1.5];
  return undefined;
}
