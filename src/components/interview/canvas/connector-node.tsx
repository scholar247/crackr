'use client';

import { useRef } from 'react';
import { Arrow, Circle } from 'react-konva';
import type Konva from 'konva';
import type { ConnectorShape } from '@/types/interview.types';
import { useCanvasStore } from '@/stores/canvas-store';
import { findNodeAt, nearestAnchor, shapeAnchorPoint, strokeDashArray } from '@/lib/interview/geometry';

interface ConnectorNodeProps {
  shape: ConnectorShape;
  /** Draft connectors (still being drawn) render read-only — no selection, no handles. */
  isDraft?: boolean;
}

const SELECTED_COLOR = '#2563eb';

export function ConnectorNode({ shape, isDraft = false }: ConnectorNodeProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const canEdit = useCanvasStore((s) => s.canEdit);
  const shapes = useCanvasStore((s) => s.shapes);
  const select = useCanvasStore((s) => s.select);
  const setConnectorPoints = useCanvasStore((s) => s.setConnectorPoints);
  const updateConnectorEndpoint = useCanvasStore((s) => s.updateConnectorEndpoint);

  // Konva drags a shape by moving its own x/y transform on top of its
  // points, rather than rewriting the points — this ref tracks the points
  // the current drag gesture started from so each dragmove can compute an
  // absolute next position instead of compounding the transform into the
  // stored points every frame.
  const dragOrigin = useRef(shape.points);

  const isSelected = !isDraft && selectedId === shape.id;
  const isStandalone = !shape.sourceId && !shape.targetId;
  const bodyDraggable = !isDraft && !shape.locked && activeTool === 'SELECT' && canEdit && isStandalone;
  const showHandles = isSelected && canEdit && activeTool === 'SELECT' && !isDraft;

  const start = shape.points[0];
  const end = shape.points[shape.points.length - 1];
  const strokeColor = isSelected ? SELECTED_COLOR : (shape.stroke ?? '#374151');
  const strokeWidth = isSelected ? (shape.strokeWidth ?? 2) + 1 : (shape.strokeWidth ?? 2);

  function handleBodyDragStart() {
    dragOrigin.current = shape.points;
  }

  function handleBodyDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const next = dragOrigin.current.map((p) => ({ x: p.x + node.x(), y: p.y + node.y() }));
    dragOrigin.current = next;
    node.position({ x: 0, y: 0 });
    setConnectorPoints(shape.id, next);
  }

  function handleEndpointDragMove(e: Konva.KonvaEventObject<DragEvent>, which: 'start' | 'end') {
    const node = e.target;
    const points = [...shape.points];
    const idx = which === 'start' ? 0 : points.length - 1;
    points[idx] = { x: node.x(), y: node.y() };
    setConnectorPoints(shape.id, points);
  }

  function handleEndpointDragEnd(e: Konva.KonvaEventObject<DragEvent>, which: 'start' | 'end') {
    const node = e.target;
    const pos = { x: node.x(), y: node.y() };
    const hitNode = findNodeAt(shapes, pos);
    const anchor = hitNode ? nearestAnchor(hitNode, pos) : undefined;
    updateConnectorEndpoint(shape.id, which, hitNode ? shapeAnchorPoint(hitNode, anchor) : pos, hitNode?.id, anchor);
  }

  return (
    <>
      <Arrow
        points={[start.x, start.y, end.x, end.y]}
        stroke={strokeColor}
        fill={strokeColor}
        strokeWidth={strokeWidth}
        dash={strokeDashArray(shape.strokeStyle, shape.strokeWidth ?? 2)}
        pointerAtBeginning={shape.startArrow}
        pointerAtEnding={shape.endArrow}
        pointerLength={8 + strokeWidth}
        pointerWidth={8 + strokeWidth}
        opacity={isDraft ? 0.6 : 1}
        hitStrokeWidth={16}
        draggable={bodyDraggable}
        onDragStart={handleBodyDragStart}
        onDragMove={handleBodyDragMove}
        onClick={() => !isDraft && select(shape.id)}
        onTap={() => !isDraft && select(shape.id)}
      />
      {showHandles && (
        <>
          <Circle
            x={start.x}
            y={start.y}
            radius={6}
            fill="#fff"
            stroke={SELECTED_COLOR}
            strokeWidth={2}
            draggable
            onDragMove={(e) => handleEndpointDragMove(e, 'start')}
            onDragEnd={(e) => handleEndpointDragEnd(e, 'start')}
          />
          <Circle
            x={end.x}
            y={end.y}
            radius={6}
            fill="#fff"
            stroke={SELECTED_COLOR}
            strokeWidth={2}
            draggable
            onDragMove={(e) => handleEndpointDragMove(e, 'end')}
            onDragEnd={(e) => handleEndpointDragEnd(e, 'end')}
          />
        </>
      )}
    </>
  );
}
