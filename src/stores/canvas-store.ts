import { create } from 'zustand';
import type {
  Shape,
  NodeShape,
  ConnectorShape,
  ShapeAnchor,
  DiagramLayer,
  DiagramViewport,
  DiagramContent,
  CommentAnchor,
} from '@/types/interview.types';
import { clampZoom, shapeAnchorPoint, DEFAULT_GRID_SIZE } from '@/lib/interview/geometry';

/** Recomputes the endpoints of every connector bound to `nodeId`, using each
 *  connector's own stored anchor side — called after that node's geometry
 *  changes (move or resize) so arrows stay pinned to the side they were
 *  attached to instead of snapping back to center. */
function followConnectors(shapes: Shape[], nodeId: string): Shape[] {
  const node = shapes.find((s) => s.id === nodeId);
  if (!node || node.category !== 'NODE') return shapes;
  return shapes.map((s) => {
    if (s.category !== 'CONNECTOR' || (s.sourceId !== nodeId && s.targetId !== nodeId)) return s;
    const points = [...s.points];
    if (s.sourceId === nodeId) points[0] = shapeAnchorPoint(node, s.sourceAnchor);
    if (s.targetId === nodeId) points[points.length - 1] = shapeAnchorPoint(node, s.targetAnchor);
    return { ...s, points };
  });
}

/** Tools Phase 3 supports. The system-design icon palette (Phase 4) adds
 *  more NODE kinds, not more tools — a "shape" tool always places a NODE,
 *  `activeShapeKind` decides which one. ARROW always places a CONNECTOR,
 *  standalone or bound to whichever NodeShape(s) the draw gesture started/
 *  ended on top of. */
export type CanvasTool = 'SELECT' | 'PAN' | 'SHAPE' | 'ARROW';

/** Style fields the properties panel edits — a subset of NodeShape's and
 *  ConnectorShape's own fields, since one panel edits either category. */
export type ShapeStylePatch = Partial<Pick<NodeShape, 'fill' | 'stroke' | 'strokeWidth' | 'strokeStyle' | 'label'>> &
  Partial<Pick<ConnectorShape, 'startArrow' | 'endArrow'>>;

interface CanvasState {
  shapes: Shape[];
  layers: DiagramLayer[];
  viewport: DiagramViewport;
  comments: CommentAnchor[];
  schemaVersion: number;

  selectedId: string | null;
  activeTool: CanvasTool;
  activeShapeKind: NodeShape['kind'];
  snapEnabled: boolean;
  gridSize: number;
  /** Server-resolved permission for the current visitor — read by ShapeNode
   *  to gate dragging, so that check lives in one place instead of being
   *  threaded through props on every shape. Pan/zoom stay allowed either
   *  way; this only affects mutating the diagram. */
  canEdit: boolean;

  /** Load a diagram fetched from the server into the store. */
  hydrate: (content: DiagramContent) => void;
  /** Serialize current state back into the shape the API/DB expects. */
  getContent: () => DiagramContent;
  setCanEdit: (canEdit: boolean) => void;

  setTool: (tool: CanvasTool) => void;
  setActiveShapeKind: (kind: NodeShape['kind']) => void;
  toggleSnap: () => void;

  setViewport: (viewport: DiagramViewport) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (pointer: { x: number; y: number }, nextZoom: number) => void;

  addShape: (shape: Shape) => void;
  moveShape: (id: string, x: number, y: number) => void;
  /** Resize (and/or reposition) a NodeShape after the fact — the Transformer
   *  handles on a selected shape call this, as opposed to the width/height
   *  set once at draw-to-create time. */
  resizeShape: (id: string, patch: Partial<Pick<NodeShape, 'x' | 'y' | 'width' | 'height'>>) => void;
  /** Absolute replace of a connector's points — used for whole-body drag of a
   *  standalone arrow and after an endpoint handle is dropped. */
  setConnectorPoints: (id: string, points: { x: number; y: number }[]) => void;
  /** Moves one end of a connector, optionally (re)binding it to a NodeShape
   *  side — pass `attachedId: undefined` to detach and leave it floating at
   *  `point` (`anchor` is then meaningless and should be omitted). */
  updateConnectorEndpoint: (
    id: string,
    end: 'start' | 'end',
    point: { x: number; y: number },
    attachedId: string | undefined,
    anchor: ShapeAnchor | undefined
  ) => void;
  updateShape: (id: string, patch: ShapeStylePatch) => void;
  removeSelected: () => void;
  select: (id: string | null) => void;
}

const DEFAULT_LAYER_ID = 'default';

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  layers: [{ id: DEFAULT_LAYER_ID, name: 'Layer 1', order: 0, visible: true, locked: false }],
  viewport: { x: 0, y: 0, zoom: 1 },
  comments: [],
  schemaVersion: 1,

  selectedId: null,
  activeTool: 'SELECT',
  activeShapeKind: 'RECTANGLE',
  snapEnabled: true,
  gridSize: DEFAULT_GRID_SIZE,
  canEdit: false,

  hydrate: (content) =>
    set({
      shapes: content.shapes,
      layers: content.layers.length > 0 ? content.layers : get().layers,
      viewport: content.viewport,
      comments: content.comments,
      schemaVersion: content.metadata.schemaVersion,
      selectedId: null,
    }),

  getContent: () => {
    const state = get();
    return {
      metadata: { schemaVersion: state.schemaVersion },
      viewport: state.viewport,
      layers: state.layers,
      shapes: state.shapes,
      comments: state.comments,
    };
  },

  setCanEdit: (canEdit) => set({ canEdit }),

  setTool: (tool) => set({ activeTool: tool, selectedId: tool === 'SELECT' ? get().selectedId : null }),
  setActiveShapeKind: (kind) => set({ activeShapeKind: kind }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

  setViewport: (viewport) => set({ viewport }),
  panBy: (dx, dy) =>
    set((state) => ({ viewport: { ...state.viewport, x: state.viewport.x - dx, y: state.viewport.y - dy } })),

  zoomAt: (pointer, nextZoom) =>
    set((state) => {
      const zoom = clampZoom(nextZoom);
      const oldZoom = state.viewport.zoom;
      // Keep the point under the cursor fixed on screen while the zoom changes.
      const worldPoint = {
        x: (pointer.x - state.viewport.x) / oldZoom,
        y: (pointer.y - state.viewport.y) / oldZoom,
      };
      return {
        viewport: {
          zoom,
          x: pointer.x - worldPoint.x * zoom,
          y: pointer.y - worldPoint.y * zoom,
        },
      };
    }),

  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape], selectedId: shape.id })),

  moveShape: (id, x, y) =>
    set((state) => {
      const shapes = state.shapes.map((s) => (s.id === id && s.category === 'NODE' ? { ...s, x, y } : s));
      return { shapes: followConnectors(shapes, id) };
    }),

  resizeShape: (id, patch) =>
    set((state) => {
      const shapes = state.shapes.map((s) => (s.id === id && s.category === 'NODE' ? { ...s, ...patch } : s));
      return { shapes: followConnectors(shapes, id) };
    }),

  setConnectorPoints: (id, points) =>
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id && s.category === 'CONNECTOR' ? { ...s, points } : s)),
    })),

  updateConnectorEndpoint: (id, end, point, attachedId, anchor) =>
    set((state) => ({
      shapes: state.shapes.map((s) => {
        if (s.id !== id || s.category !== 'CONNECTOR') return s;
        const points = [...s.points];
        if (end === 'start') points[0] = point;
        else points[points.length - 1] = point;
        return {
          ...s,
          points,
          sourceId: end === 'start' ? attachedId : s.sourceId,
          targetId: end === 'end' ? attachedId : s.targetId,
          sourceAnchor: end === 'start' ? anchor : s.sourceAnchor,
          targetAnchor: end === 'end' ? anchor : s.targetAnchor,
        };
      }),
    })),

  updateShape: (id, patch) =>
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? ({ ...s, ...patch } as Shape) : s)),
    })),

  removeSelected: () =>
    set((state) => ({
      shapes: state.selectedId ? state.shapes.filter((s) => s.id !== state.selectedId) : state.shapes,
      selectedId: null,
    })),

  select: (id) => set({ selectedId: id }),
}));
