'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@/stores/canvas-store';
import { createNodeShape, createConnectorShape } from '@/lib/interview/shape-factory';
import { clampZoom, findNodeAt, nearestAnchor, shapeAnchorPoint, snapToGrid } from '@/lib/interview/geometry';
import type { NodeShape, ShapeAnchor } from '@/types/interview.types';

interface DraftConnector {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

const WHEEL_ZOOM_SPEED = 0.001;
/** Below this world-space size, treat a mousedown+mouseup as an accidental
 *  click rather than an intentional drag-to-create. */
const MIN_DRAFT_SIZE = 4;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/**
 * All pointer/wheel/keyboard interaction logic for the canvas, kept out of
 * the rendering component. `InterviewCanvas` just spreads `stageProps` onto
 * the Stage and renders `draftShape` if present — every branch of "what does
 * a click/drag/scroll mean right now" lives here instead.
 */
export function useCanvasInteractions() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeShapeKind = useCanvasStore((s) => s.activeShapeKind);
  const viewport = useCanvasStore((s) => s.viewport);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const layers = useCanvasStore((s) => s.layers);
  const shapes = useCanvasStore((s) => s.shapes);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const zoomAt = useCanvasStore((s) => s.zoomAt);
  const addShape = useCanvasStore((s) => s.addShape);
  const select = useCanvasStore((s) => s.select);
  const removeSelected = useCanvasStore((s) => s.removeSelected);
  const setTool = useCanvasStore((s) => s.setTool);

  const [spacePressed, setSpacePressed] = useState(false);
  const [draftShape, setDraftShape] = useState<NodeShape | null>(null);
  const [draftConnector, setDraftConnector] = useState<DraftConnector | null>(null);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const connectorStart = useRef<{
    point: { x: number; y: number };
    sourceId?: string;
    sourceAnchor?: ShapeAnchor;
  } | null>(null);

  const isPanMode = activeTool === 'PAN' || spacePressed;

  // ── Keyboard: space-to-pan, delete-selected, escape-to-select ──────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSelected();
      }
      if (e.key === 'Escape') {
        select(null);
        setTool('SELECT');
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') setSpacePressed(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [removeSelected, select, setTool]);

  // ── Wheel: plain scroll pans, ctrl/cmd+scroll zooms toward the cursor ──────
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;

      if (e.evt.ctrlKey || e.evt.metaKey) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const nextZoom = clampZoom(viewport.zoom * (1 - e.evt.deltaY * WHEEL_ZOOM_SPEED));
        zoomAt(pointer, nextZoom);
      } else {
        setViewport({ ...viewport, x: viewport.x - e.evt.deltaX, y: viewport.y - e.evt.deltaY });
      }
    },
    [viewport, zoomAt, setViewport]
  );

  // ── Stage drag: only active while `isPanMode`, via the Stage's `draggable` prop ──
  const handleStageDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = e.target.getStage();
      if (e.target !== stage) return;
      setViewport({ ...viewport, x: e.target.x(), y: e.target.y() });
    },
    [viewport, setViewport]
  );

  // ── Draw-to-create (SHAPE tool) + click-empty-to-deselect (SELECT tool) ────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanMode) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const clickedEmptyStage = e.target === stage;

      if (activeTool === 'SELECT') {
        if (clickedEmptyStage) select(null);
        return;
      }

      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      if (activeTool === 'ARROW') {
        const hitNode = findNodeAt(shapes, pos);
        const anchor = hitNode ? nearestAnchor(hitNode, pos) : undefined;
        const start = hitNode ? shapeAnchorPoint(hitNode, anchor) : pos;
        connectorStart.current = { point: start, sourceId: hitNode?.id, sourceAnchor: anchor };
        setDraftConnector({ start, end: pos });
        return;
      }
      if (activeTool !== 'SHAPE') return;

      drawStart.current = pos;
      setDraftShape(
        createNodeShape({
          kind: activeShapeKind,
          layerId: layers[0]?.id ?? 'default',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        })
      );
    },
    [activeTool, isPanMode, activeShapeKind, layers, shapes, select]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (connectorStart.current) {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;
        // Snap the in-progress preview to a hovered shape's nearest boundary
        // anchor so it's obvious which side the drop will bind to.
        const hoverNode = findNodeAt(shapes, pos);
        const end = hoverNode ? shapeAnchorPoint(hoverNode, nearestAnchor(hoverNode, pos)) : pos;
        setDraftConnector((prev) => (prev ? { ...prev, end } : prev));
        return;
      }
      if (!drawStart.current) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      const start = drawStart.current;
      setDraftShape((prev) =>
        prev
          ? {
              ...prev,
              x: Math.min(start.x, pos.x),
              y: Math.min(start.y, pos.y),
              width: Math.abs(pos.x - start.x),
              height: Math.abs(pos.y - start.y),
            }
          : prev
      );
    },
    [shapes]
  );

  const handleMouseUp = useCallback(() => {
    if (connectorStart.current) {
      const start = connectorStart.current;
      connectorStart.current = null;
      setDraftConnector((prev) => {
        if (prev) {
          const dist = Math.hypot(prev.end.x - start.point.x, prev.end.y - start.point.y);
          if (dist > MIN_DRAFT_SIZE) {
            const targetNode = findNodeAt(shapes, prev.end);
            const targetAnchor = targetNode ? nearestAnchor(targetNode, prev.end) : undefined;
            addShape(
              createConnectorShape({
                layerId: layers[0]?.id ?? 'default',
                start: start.point,
                end: targetNode ? shapeAnchorPoint(targetNode, targetAnchor) : prev.end,
                sourceId: start.sourceId,
                targetId: targetNode?.id,
                sourceAnchor: start.sourceAnchor,
                targetAnchor,
              })
            );
            setTool('SELECT');
          }
        }
        return null;
      });
      return;
    }
    if (!drawStart.current) return;
    drawStart.current = null;
    setDraftShape((prev) => {
      if (prev && prev.width > MIN_DRAFT_SIZE && prev.height > MIN_DRAFT_SIZE) {
        const x = snapEnabled ? snapToGrid(prev.x, gridSize) : prev.x;
        const y = snapEnabled ? snapToGrid(prev.y, gridSize) : prev.y;
        const width = snapEnabled ? Math.max(gridSize, snapToGrid(prev.width, gridSize)) : prev.width;
        const height = snapEnabled ? Math.max(gridSize, snapToGrid(prev.height, gridSize)) : prev.height;
        addShape({ ...prev, x, y, width, height });
        setTool('SELECT');
      }
      return null;
    });
  }, [snapEnabled, gridSize, addShape, setTool, shapes, layers]);

  return {
    isPanMode,
    draftShape,
    draftConnector,
    stageProps: {
      draggable: isPanMode,
      onDragMove: handleStageDragMove,
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  };
}
