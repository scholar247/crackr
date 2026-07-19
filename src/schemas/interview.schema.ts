import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DiagramVisibilitySchema = z.enum(['PRIVATE', 'PUBLIC']);
export const DiagramRoleSchema = z.enum(['EDITOR', 'VIEWER']);

export const ShapeKindSchema = z.enum([
  'RECTANGLE', 'CIRCLE', 'DIAMOND', 'TRIANGLE',
  'DATABASE', 'SERVER', 'QUEUE', 'CACHE', 'API',
  'LOAD_BALANCER', 'CDN', 'LAMBDA', 'KUBERNETES', 'DOCKER',
  'STICKY_NOTE',
]);

export const StrokeStyleSchema = z.enum(['solid', 'dashed', 'dotted']);
export const ShapeAnchorSchema = z.enum(['center', 'top', 'right', 'bottom', 'left']);

// ─── Shapes ───────────────────────────────────────────────────────────────────
// Mirrors the `Shape` union in `@/types/interview.types` — see that file for why
// these are 5 structural categories rather than one variant per shape kind.

const BaseShapeSchema = z.object({
  id: z.string().min(1),
  layerId: z.string().min(1),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

export const NodeShapeSchema = BaseShapeSchema.extend({
  category: z.literal('NODE'),
  kind: ShapeKindSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
  rotation: z.number().default(0),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  strokeStyle: StrokeStyleSchema.optional(),
  cornerRadius: z.number().min(0).optional(),
  label: z.string().max(200).optional(),
  iconPack: z.string().optional(),
  iconId: z.string().optional(),
});

export const ConnectorShapeSchema = BaseShapeSchema.extend({
  category: z.literal('CONNECTOR'),
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  sourceAnchor: ShapeAnchorSchema.optional(),
  targetAnchor: ShapeAnchorSchema.optional(),
  startArrow: z.boolean().default(false),
  endArrow: z.boolean().default(true),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  strokeStyle: StrokeStyleSchema.optional(),
  label: z.string().max(200).optional(),
});

export const FreeDrawShapeSchema = BaseShapeSchema.extend({
  category: z.literal('FREEDRAW'),
  points: z.array(z.number()).min(4),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
});

export const TextShapeSchema = BaseShapeSchema.extend({
  category: z.literal('TEXT'),
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  text: z.string(),
  fontSize: z.number().min(1).default(16),
  fontFamily: z.string().optional(),
  fill: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).default('left'),
  rotation: z.number().default(0),
});

export const ImageShapeSchema = BaseShapeSchema.extend({
  category: z.literal('IMAGE'),
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
  rotation: z.number().default(0),
  src: z.string().url(),
});

export const ShapeSchema = z.discriminatedUnion('category', [
  NodeShapeSchema,
  ConnectorShapeSchema,
  FreeDrawShapeSchema,
  TextShapeSchema,
  ImageShapeSchema,
]);

// ─── Diagram content ────────────────────────────────────────────────────────────

export const DiagramLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
});

export const DiagramViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.1).max(4),
});

export const CommentAnchorSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  shapeId: z.string().optional(),
});

export const DiagramContentSchema = z.object({
  metadata: z.object({ schemaVersion: z.number().int().min(1) }),
  viewport: DiagramViewportSchema,
  layers: z.array(DiagramLayerSchema),
  shapes: z.array(ShapeSchema),
  comments: z.array(CommentAnchorSchema),
});

// ─── Diagram ──────────────────────────────────────────────────────────────────

export const CreateDiagramSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  visibility: DiagramVisibilitySchema.default('PRIVATE'),
});

export const UpdateDiagramSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  visibility: DiagramVisibilitySchema.optional(),
  content: DiagramContentSchema.optional(),
});

// ─── DiagramVersion ─────────────────────────────────────────────────────────────

export const CreateDiagramVersionSchema = z.object({
  content: DiagramContentSchema,
  label: z.string().max(200).optional(),
});

// ─── DiagramShare ───────────────────────────────────────────────────────────────

export const CreateDiagramShareSchema = z.object({
  userId: z.string().min(1),
  role: DiagramRoleSchema,
});

// ─── DiagramComment ─────────────────────────────────────────────────────────────

export const CreateDiagramCommentSchema = z.object({
  text: z.string().min(1).max(2000),
  anchor: z.object({
    x: z.number(),
    y: z.number(),
    shapeId: z.string().optional(),
  }).optional(),
});

export const AddDiagramCommentReplySchema = z.object({
  text: z.string().min(1).max(2000),
});

export const ResolveDiagramCommentSchema = z.object({
  resolved: z.boolean(),
});

// ─── Inferred types ─────────────────────────────────────────────────────────────

export type CreateDiagramInput = z.infer<typeof CreateDiagramSchema>;
export type UpdateDiagramInput = z.infer<typeof UpdateDiagramSchema>;
export type DiagramContentInput = z.infer<typeof DiagramContentSchema>;
export type CreateDiagramVersionInput = z.infer<typeof CreateDiagramVersionSchema>;
export type CreateDiagramShareInput = z.infer<typeof CreateDiagramShareSchema>;
export type CreateDiagramCommentInput = z.infer<typeof CreateDiagramCommentSchema>;
export type AddDiagramCommentReplyInput = z.infer<typeof AddDiagramCommentReplySchema>;
export type ResolveDiagramCommentInput = z.infer<typeof ResolveDiagramCommentSchema>;
