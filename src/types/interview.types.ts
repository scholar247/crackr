/** ISO 8601 date string — all timestamps stored as strings in MongoDB */
type Timestamp = string;

// ─── Diagram-level enums ───────────────────────────────────────────────────────

export type DiagramVisibility = 'PRIVATE' | 'PUBLIC';
export type DiagramRole = 'EDITOR' | 'VIEWER';

/** Computed at read time (never stored) — the caller's effective permission. */
export type DiagramAccessLevel = 'OWNER' | 'EDITOR' | 'VIEWER' | 'NONE';

// ─── Shapes ─────────────────────────────────────────────────────────────────
//
// Every shape carries `category`, which is a structural discriminator (how it's
// drawn), not a visual one (what it looks like). All bounding-box icons —
// rectangle through Docker through a sticky note — share the same geometry
// (x/y/width/height/rotation) and render as `NODE`; `kind` (plus the optional
// `iconPack`/`iconId` pair for icon-library shapes added in a later phase)
// carries which one. This keeps the union at 5 variants instead of 20+, so
// canvas code (Phase 3+) branches on how a shape behaves, not on every kind
// PM ever invents for the shape palette.

export type ShapeKind =
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'DIAMOND'
  | 'TRIANGLE'
  | 'DATABASE'
  | 'SERVER'
  | 'QUEUE'
  | 'CACHE'
  | 'API'
  | 'LOAD_BALANCER'
  | 'CDN'
  | 'LAMBDA'
  | 'KUBERNETES'
  | 'DOCKER'
  | 'STICKY_NOTE';

interface BaseShape {
  id: string;
  layerId: string;
  locked: boolean;
  hidden: boolean;
}

/** Border/line rendering — solid is the default (undefined == 'solid'). */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/** A connector endpoint's attach point on a NodeShape's bounding box —
 *  undefined == 'center', kept for shapes created before per-side anchors
 *  existed. */
export type ShapeAnchor = 'center' | 'top' | 'right' | 'bottom' | 'left';

export interface NodeShape extends BaseShape {
  category: 'NODE';
  kind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  cornerRadius?: number;
  label?: string;
  /** Set together when this node renders a specific library icon (e.g. AWS EC2)
   *  instead of `kind`'s generic shape — the icon manifest itself is Phase 4. */
  iconPack?: string;
  iconId?: string;
}

export interface ConnectorShape extends BaseShape {
  category: 'CONNECTOR';
  points: { x: number; y: number }[];
  /** NodeShape ids this connector is attached to, if any — lets the canvas
   *  keep edges following their endpoints when a node moves. */
  sourceId?: string;
  targetId?: string;
  /** Which side of the attached node each end is pinned to; ignored when
   *  the corresponding *Id is unset (that end is just a floating point). */
  sourceAnchor?: ShapeAnchor;
  targetAnchor?: ShapeAnchor;
  startArrow: boolean;
  endArrow: boolean;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  label?: string;
}

export interface FreeDrawShape extends BaseShape {
  category: 'FREEDRAW';
  /** Flat [x0,y0,x1,y1,...] — Konva.Line's native point format. */
  points: number[];
  stroke?: string;
  strokeWidth?: number;
}

export interface TextShape extends BaseShape {
  category: 'TEXT';
  x: number;
  y: number;
  width: number;
  text: string;
  fontSize: number;
  fontFamily?: string;
  fill?: string;
  align: 'left' | 'center' | 'right';
  rotation: number;
}

export interface ImageShape extends BaseShape {
  category: 'IMAGE';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** S3 URL — raw image bytes are never stored in the diagram JSON. */
  src: string;
}

export type Shape = NodeShape | ConnectorShape | FreeDrawShape | TextShape | ImageShape;

// ─── Diagram content (the serializable canvas document) ───────────────────────

export interface DiagramLayer {
  id: string;
  name: string;
  order: number;
  visible: boolean;
  locked: boolean;
}

export interface DiagramViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * A comment *pin* on the canvas — position only. The thread's actual content
 * (author, text, replies, resolved state) lives in the `diagramComments`
 * collection (see `DiagramComment` below), keyed by this anchor's `id`. Kept
 * separate so resolved state has one source of truth instead of drifting
 * between the embedded JSON and the queryable collection.
 */
export interface CommentAnchor {
  id: string;
  x: number;
  y: number;
  shapeId?: string;
}

export interface DiagramContent {
  metadata: {
    /** Bumped when this content shape changes, so old documents can be migrated. */
    schemaVersion: number;
  };
  viewport: DiagramViewport;
  layers: DiagramLayer[];
  shapes: Shape[];
  comments: CommentAnchor[];
}

// ─── Diagram ────────────────────────────────────────────────────────────────────

export interface Diagram {
  id: string;
  title: string;
  ownerId: string;
  visibility: DiagramVisibility;
  content: DiagramContent;
  lastEditedBy?: string;
  lastEditedAt?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DiagramClient = Omit<Diagram, 'createdAt' | 'updatedAt' | 'lastEditedAt'> & {
  createdAt: string;
  updatedAt: string;
  lastEditedAt?: string;
};

// ─── DiagramVersion (point-in-time snapshot) ───────────────────────────────────

export interface DiagramVersion {
  id: string;
  diagramId: string;
  content: DiagramContent;
  /** Optional user-given label, e.g. "Before round 2". */
  label?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export type DiagramVersionClient = Omit<DiagramVersion, 'createdAt'> & { createdAt: string };

// ─── DiagramShare (per-user ACL entry) ─────────────────────────────────────────

export interface DiagramShare {
  id: string;
  diagramId: string;
  userId: string;
  role: DiagramRole;
  invitedBy: string;
  createdAt: Timestamp;
}

export type DiagramShareClient = Omit<DiagramShare, 'createdAt'> & { createdAt: string };

// ─── DiagramComment (thread content) ───────────────────────────────────────────

export interface DiagramCommentReply {
  id: string;
  authorId: string;
  text: string;
  createdAt: Timestamp;
}

export interface DiagramComment {
  id: string;
  diagramId: string;
  authorId: string;
  text: string;
  resolved: boolean;
  replies: DiagramCommentReply[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DiagramCommentClient = Omit<DiagramComment, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
