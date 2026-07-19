'use client';

import { Shape as KonvaShape } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores/canvas-store';

interface CanvasGridProps {
  /** Container (screen) size — used only to work out which world-space
   *  region is currently visible; the dots themselves are drawn in world
   *  coordinates so they live inside the same transformed Layer as shapes
   *  and pan/zoom with them, staying aligned with the snap positions. */
  width: number;
  height: number;
}

const DOT_RADIUS_PX = 1.5;
const DOT_COLOR = '#d4d4d8';
/** Below this on-screen spacing, dots become visual noise rather than a grid. */
const MIN_SCREEN_SPACING = 6;

/** Dots drawn as one custom Shape instead of one Konva node per dot — at
 *  typical zoom levels that's thousands of nodes, which tanks pan/zoom
 *  frame rate. A single sceneFunc draws them all in one canvas pass. */
export function CanvasGrid({ width, height }: CanvasGridProps) {
  const viewport = useCanvasStore((s) => s.viewport);
  const gridSize = useCanvasStore((s) => s.gridSize);

  const screenSpacing = gridSize * viewport.zoom;
  if (screenSpacing < MIN_SCREEN_SPACING) return null;

  // Visible world-space rectangle, from inverse-transforming the screen viewport.
  const worldMinX = -viewport.x / viewport.zoom;
  const worldMinY = -viewport.y / viewport.zoom;
  const worldMaxX = (width - viewport.x) / viewport.zoom;
  const worldMaxY = (height - viewport.y) / viewport.zoom;

  const startX = Math.floor(worldMinX / gridSize) * gridSize;
  const startY = Math.floor(worldMinY / gridSize) * gridSize;
  // World-space radius chosen so it renders at a constant on-screen size
  // regardless of zoom, once the ambient Stage transform scales it back up.
  const dotRadius = DOT_RADIUS_PX / viewport.zoom;

  return (
    <KonvaShape
      listening={false}
      fill={DOT_COLOR}
      sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
        context.beginPath();
        for (let x = startX; x < worldMaxX; x += gridSize) {
          for (let y = startY; y < worldMaxY; y += gridSize) {
            context.moveTo(x + dotRadius, y);
            context.arc(x, y, dotRadius, 0, Math.PI * 2, false);
          }
        }
        context.fillStrokeShape(shape);
      }}
    />
  );
}
