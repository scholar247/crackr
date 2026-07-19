'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Rect, Ellipse, Line, Text, Circle, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { NodeShape } from '@/types/interview.types';
import { useCanvasStore } from '@/stores/canvas-store';
import { SHAPE_ANCHORS, shapeAnchorPoint, snapToGrid, strokeDashArray } from '@/lib/interview/geometry';

interface ShapeNodeProps {
  shape: NodeShape;
  /** Draft shapes (still being drawn) render read-only — no selection outline, no dragging. */
  isDraft?: boolean;
}

/** Below this, a resize would make the shape unusably small or invert it. */
const MIN_SHAPE_SIZE = 10;

/** Diamond/triangle aren't native Konva primitives — these compute a closed
 *  point path that exactly fills the shape's x/y/width/height box, so they
 *  behave like Rect/Ellipse for hit-testing and resize handles. */
function diamondPoints(width: number, height: number): number[] {
  return [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2];
}

function trianglePoints(width: number, height: number): number[] {
  return [width / 2, 0, width, height, 0, height];
}

export function ShapeNode({ shape, isDraft = false }: ShapeNodeProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const canEdit = useCanvasStore((s) => s.canEdit);
  const select = useCanvasStore((s) => s.select);
  const moveShape = useCanvasStore((s) => s.moveShape);
  const resizeShape = useCanvasStore((s) => s.resizeShape);

  // A plain ref, not one typed to a specific Konva class, since the same
  // node backs a Rect, an Ellipse, or a Line depending on `shape.kind` — the
  // Transformer only needs the common Konva.Node methods (x/y/scale) anyway.
  const shapeRef = useRef<Konva.Node | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  const isSelected = !isDraft && selectedId === shape.id;
  const draggable = !isDraft && !shape.locked && activeTool === 'SELECT' && canEdit;
  const showAnchors = !isDraft && canEdit && activeTool === 'ARROW';

  useEffect(() => {
    if (isSelected && draggable && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, draggable]);

  // Konva's Ellipse positions by center, everything else (Rect, Line) by
  // top-left — but `shape.x/y` is always top-left in our data model. Each
  // branch below converts on the way onto the canvas; `onDragMove` has to
  // convert back the same way, per kind, or a dragged circle would drift by
  // width/2,height/2 every time (stored top-left, moved as if it were center).
  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    const rawX = shape.kind === 'CIRCLE' ? node.x() - shape.width / 2 : node.x();
    const rawY = shape.kind === 'CIRCLE' ? node.y() - shape.height / 2 : node.y();
    const x = snapEnabled ? snapToGrid(rawX, gridSize) : rawX;
    const y = snapEnabled ? snapToGrid(rawY, gridSize) : rawY;
    node.position(shape.kind === 'CIRCLE' ? { x: x + shape.width / 2, y: y + shape.height / 2 } : { x, y });
    moveShape(shape.id, x, y);
  }

  // Konva resizes a Transformer's target by writing scaleX/scaleY (and,
  // since the opposite handle stays anchored, x/y) onto the node directly —
  // this folds that scale into width/height and resets it to 1 so the
  // stored shape never carries a lingering Konva-only scale factor.
  function handleTransformEnd() {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    let width = Math.max(MIN_SHAPE_SIZE, shape.width * scaleX);
    let height = Math.max(MIN_SHAPE_SIZE, shape.height * scaleY);
    if (snapEnabled) {
      width = Math.max(gridSize, snapToGrid(width, gridSize));
      height = Math.max(gridSize, snapToGrid(height, gridSize));
    }

    let x = shape.kind === 'CIRCLE' ? node.x() - width / 2 : node.x();
    let y = shape.kind === 'CIRCLE' ? node.y() - height / 2 : node.y();
    if (snapEnabled) {
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }

    resizeShape(shape.id, { x, y, width, height });
  }

  const commonProps = {
    fill: shape.fill,
    stroke: isSelected ? '#2563eb' : shape.stroke,
    strokeWidth: isSelected ? (shape.strokeWidth ?? 2) + 1 : shape.strokeWidth,
    dash: strokeDashArray(shape.strokeStyle, shape.strokeWidth ?? 2),
    opacity: isDraft ? 0.6 : 1,
    rotation: shape.rotation,
    draggable,
    onClick: () => !isDraft && select(shape.id),
    onTap: () => !isDraft && select(shape.id),
    onDragMove: handleDragMove,
    onTransformEnd: handleTransformEnd,
    ref: (node: Konva.Node | null) => {
      shapeRef.current = node;
    },
  };

  let shapeElement: ReactNode;
  switch (shape.kind) {
    case 'CIRCLE':
      shapeElement = (
        <Ellipse
          {...commonProps}
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          radiusX={shape.width / 2}
          radiusY={shape.height / 2}
        />
      );
      break;
    case 'DIAMOND':
      shapeElement = (
        <Line {...commonProps} x={shape.x} y={shape.y} points={diamondPoints(shape.width, shape.height)} closed />
      );
      break;
    case 'TRIANGLE':
      shapeElement = (
        <Line {...commonProps} x={shape.x} y={shape.y} points={trianglePoints(shape.width, shape.height)} closed />
      );
      break;
    case 'RECTANGLE':
    default:
      shapeElement = (
        <Rect
          {...commonProps}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          cornerRadius={shape.cornerRadius ?? 4}
        />
      );
      break;
  }

  return (
    <>
      {shapeElement}
      {shape.label && (
        <Text
          text={shape.label}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          align="center"
          verticalAlign="middle"
          fontSize={14}
          fill="#111827"
          rotation={shape.rotation}
          listening={false}
          opacity={isDraft ? 0.6 : 1}
        />
      )}
      {showAnchors &&
        SHAPE_ANCHORS.map((anchor) => {
          const point = shapeAnchorPoint(shape, anchor);
          return (
            <Circle
              key={anchor}
              x={point.x}
              y={point.y}
              radius={5}
              fill="#fff"
              stroke="#2563eb"
              strokeWidth={1.5}
              listening={false}
            />
          );
        })}
      {isSelected && draggable && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < MIN_SHAPE_SIZE || newBox.height < MIN_SHAPE_SIZE ? oldBox : newBox
          }
        />
      )}
    </>
  );
}
