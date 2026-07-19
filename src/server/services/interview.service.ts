import { diagramRepository } from '@/server/repositories/diagram.repository';
import { diagramVersionRepository } from '@/server/repositories/diagramVersion.repository';
import { diagramShareRepository } from '@/server/repositories/diagramShare.repository';
import { diagramCommentRepository } from '@/server/repositories/diagramComment.repository';
import type {
  DiagramClient,
  DiagramAccessLevel,
  DiagramVersionClient,
  DiagramShareClient,
  DiagramCommentClient,
} from '@/types/interview.types';
import type {
  CreateDiagramInput,
  UpdateDiagramInput,
  CreateDiagramVersionInput,
  CreateDiagramShareInput,
  CreateDiagramCommentInput,
} from '@/schemas/interview.schema';

/**
 * Stand-in owner/editor id for visitors with no session. This module has no
 * login flow wired up yet (see `openLive` and `update` below) — once one
 * exists, new diagrams get a real `ownerId` and this sentinel stops being
 * written, but old rows keep it, which is fine: `resolveAccess` only ever
 * compares it against a real session id, never treats it as one.
 */
const ANONYMOUS_OWNER_ID = 'anonymous';

function canEdit(access: DiagramAccessLevel): boolean {
  return access === 'OWNER' || access === 'EDITOR';
}

function canView(access: DiagramAccessLevel): boolean {
  return access !== 'NONE';
}

/**
 * Whether a visitor can currently edit — exported so `/interview/live/[id]`
 * can decide what to render (toolbar vs. read-only) using the exact same
 * rule `update` enforces server-side, instead of a second copy that could
 * drift. TODO(auth): once every visitor has a real session, drop the
 * `visibility === 'PUBLIC'` clause here and in `update` together — anyone
 * editing a public link is deliberate while this module has no login flow,
 * not a permanent rule for every diagram that happens to be public.
 */
export function resolveCanEdit(diagram: DiagramClient, access: DiagramAccessLevel): boolean {
  return canEdit(access) || diagram.visibility === 'PUBLIC';
}

/**
 * The one place "what can this user do with this diagram" gets decided —
 * owner > per-user share > public visibility > nothing. Every other method
 * below (and later, API routes and the realtime relay's auth check) goes
 * through this instead of re-deriving the rule.
 */
async function resolveAccess(diagram: DiagramClient, userId: string | null): Promise<DiagramAccessLevel> {
  if (userId && diagram.ownerId === userId) return 'OWNER';
  if (userId) {
    const share = await diagramShareRepository.findByDiagramAndUser(diagram.id, userId);
    if (share) return share.role;
  }
  if (diagram.visibility === 'PUBLIC') return 'VIEWER';
  return 'NONE';
}

export const interviewService = {
  async create(data: CreateDiagramInput, ownerId: string | null): Promise<DiagramClient> {
    // Same TODO(auth) as `update`: an anonymous creator can only ever produce
    // a PUBLIC diagram — there's no session to make PRIVATE meaningful yet.
    const input = ownerId ? data : { ...data, visibility: 'PUBLIC' as const };
    return diagramRepository.create(input, ownerId ?? ANONYMOUS_OWNER_ID);
  },

  async getWithAccess(
    diagramId: string,
    userId: string | null
  ): Promise<{ diagram: DiagramClient; access: DiagramAccessLevel } | null> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) return null;
    const access = await resolveAccess(diagram, userId);
    if (!canView(access)) return null;
    return { diagram, access };
  },

  /**
   * What `/interview/live/[id]` calls. Unlike `getWithAccess`, this never
   * 404s — visiting a fresh id creates a public diagram on the spot, so a
   * shared link works with no separate "create" step and no login. Once a
   * real "new diagram" flow with authenticated ownership exists, this stays
   * the entry point for the live page; it just won't be the only way a
   * diagram comes into existence anymore.
   */
  async openLive(
    diagramId: string,
    userId: string | null
  ): Promise<{ diagram: DiagramClient; access: DiagramAccessLevel }> {
    const diagram = await diagramRepository.getOrCreate(diagramId, userId ?? ANONYMOUS_OWNER_ID);
    const access = await resolveAccess(diagram, userId);
    return { diagram, access };
  },

  async listOwnedBy(userId: string): Promise<DiagramClient[]> {
    return diagramRepository.findByOwner(userId);
  },

  async listSharedWith(userId: string): Promise<DiagramClient[]> {
    const shares = await diagramShareRepository.findByUser(userId);
    return diagramRepository.findByIds(shares.map((s) => s.diagramId));
  },

  async update(diagramId: string, data: UpdateDiagramInput, userId: string | null): Promise<DiagramClient> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, userId);
    if (!resolveCanEdit(diagram, access)) throw new Error('Forbidden');
    const updated = await diagramRepository.update(diagramId, data, userId ?? ANONYMOUS_OWNER_ID);
    if (!updated) throw new Error('Diagram not found');
    return updated;
  },

  async delete(diagramId: string, userId: string): Promise<void> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    if (diagram.ownerId !== userId) throw new Error('Forbidden');
    await diagramRepository.delete(diagramId);
  },

  // ─── Versions ─────────────────────────────────────────────────────────────

  async saveVersion(diagramId: string, data: CreateDiagramVersionInput, userId: string): Promise<DiagramVersionClient> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, userId);
    if (!canEdit(access)) throw new Error('Forbidden');
    return diagramVersionRepository.create(diagramId, data, userId);
  },

  async listVersions(diagramId: string, userId: string): Promise<DiagramVersionClient[]> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, userId);
    if (!canView(access)) throw new Error('Forbidden');
    return diagramVersionRepository.findByDiagram(diagramId);
  },

  // ─── Sharing ──────────────────────────────────────────────────────────────
  // Share management is owner-only — editors can edit the diagram, not decide
  // who else gets to.

  async listShares(diagramId: string, userId: string): Promise<DiagramShareClient[]> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    if (diagram.ownerId !== userId) throw new Error('Forbidden');
    return diagramShareRepository.findByDiagram(diagramId);
  },

  async share(diagramId: string, data: CreateDiagramShareInput, invitedBy: string): Promise<DiagramShareClient> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    if (diagram.ownerId !== invitedBy) throw new Error('Forbidden');
    if (data.userId === diagram.ownerId) throw new Error('Owner already has full access');
    return diagramShareRepository.upsert(diagramId, data, invitedBy);
  },

  async unshare(diagramId: string, targetUserId: string, requestedBy: string): Promise<void> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    if (diagram.ownerId !== requestedBy) throw new Error('Forbidden');
    await diagramShareRepository.remove(diagramId, targetUserId);
  },

  // ─── Comments ─────────────────────────────────────────────────────────────
  // Anyone who can view a diagram can comment on it; resolving a thread
  // requires edit access, same as any other change to the diagram's state.

  async listComments(diagramId: string, userId: string | null): Promise<DiagramCommentClient[]> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, userId);
    if (!canView(access)) throw new Error('Forbidden');
    return diagramCommentRepository.findByDiagram(diagramId);
  },

  async addComment(diagramId: string, data: CreateDiagramCommentInput, authorId: string): Promise<DiagramCommentClient> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, authorId);
    if (!canView(access)) throw new Error('Forbidden');
    return diagramCommentRepository.create(diagramId, data, authorId);
  },

  async replyToComment(
    diagramId: string,
    commentId: string,
    text: string,
    authorId: string
  ): Promise<DiagramCommentClient> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, authorId);
    if (!canView(access)) throw new Error('Forbidden');
    const comment = await diagramCommentRepository.addReply(commentId, text, authorId);
    if (!comment) throw new Error('Comment not found');
    return comment;
  },

  async resolveComment(
    diagramId: string,
    commentId: string,
    resolved: boolean,
    userId: string
  ): Promise<DiagramCommentClient> {
    const diagram = await diagramRepository.findById(diagramId);
    if (!diagram) throw new Error('Diagram not found');
    const access = await resolveAccess(diagram, userId);
    if (!canEdit(access)) throw new Error('Forbidden');
    const comment = await diagramCommentRepository.setResolved(commentId, resolved);
    if (!comment) throw new Error('Comment not found');
    return comment;
  },
};
