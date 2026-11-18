import type { CurriculumSource, MindMapTreeNode } from './mind-maps';
import { missingCurriculumItems } from './mind-maps';

// Immutable edits to a mind-map tree for the admin editor. Every function returns a new
// tree and leaves the input untouched; unknown ids are a no-op.

type Tree = MindMapTreeNode[];

export function newNode(label: string, curriculumNodeId: string | null = null, description: string | null = null): MindMapTreeNode {
  return { id: crypto.randomUUID(), label, description, content: null, curriculumNodeId, children: [] };
}

/** Siblings list containing `id` and its index there, or null. */
function locate(tree: Tree, id: string): { siblings: Tree; index: number; parent: MindMapTreeNode | null } | null {
  const search = (list: Tree, parent: MindMapTreeNode | null): ReturnType<typeof locate> => {
    const index = list.findIndex((n) => n.id === id);
    if (index >= 0) return { siblings: list, index, parent };
    for (const n of list) {
      const found = search(n.children, n);
      if (found) return found;
    }
    return null;
  };
  return search(tree, null);
}

/** Deep copy so mutations below never touch the caller's tree. */
const clone = (tree: Tree): Tree => tree.map((n) => ({ ...n, children: clone(n.children) }));

export function updateNode(tree: Tree, id: string, patch: Partial<Omit<MindMapTreeNode, 'id' | 'children'>>): Tree {
  return tree.map((n) => (n.id === id ? { ...n, ...patch } : { ...n, children: updateNode(n.children, id, patch) }));
}

export function removeNode(tree: Tree, id: string): Tree {
  return tree.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

/** Appends `node` under `parentId` (or as a main topic when null). */
export function addChild(tree: Tree, parentId: string | null, node: MindMapTreeNode): Tree {
  if (parentId === null) return [...tree, node];
  return tree.map((n) => (n.id === parentId ? { ...n, children: [...n.children, node] } : { ...n, children: addChild(n.children, parentId, node) }));
}

/** Moves a node one place up (-1) or down (+1) among its siblings. */
export function moveNode(tree: Tree, id: string, direction: -1 | 1): Tree {
  const next = clone(tree);
  const at = locate(next, id);
  if (!at) return tree;
  const target = at.index + direction;
  if (target < 0 || target >= at.siblings.length) return tree;
  [at.siblings[at.index], at.siblings[target]] = [at.siblings[target], at.siblings[at.index]];
  return next;
}

/** Makes a node the last child of its previous sibling (one level deeper). */
export function indentNode(tree: Tree, id: string): Tree {
  const next = clone(tree);
  const at = locate(next, id);
  if (!at || at.index === 0) return tree;
  const [node] = at.siblings.splice(at.index, 1);
  at.siblings[at.index - 1].children.push(node);
  return next;
}

/** Moves a node out of its parent, placing it right after the parent (one level up). */
export function outdentNode(tree: Tree, id: string): Tree {
  const next = clone(tree);
  const at = locate(next, id);
  if (!at || !at.parent) return tree;
  const parentAt = locate(next, at.parent.id);
  if (!parentAt) return tree;
  const [node] = at.siblings.splice(at.index, 1);
  parentAt.siblings.splice(parentAt.index + 1, 0, node);
  return next;
}

/**
 * Adds curriculum topics/subtopics the map doesn't reference yet, each under the node that
 * already represents its curriculum parent (or as a main topic). Existing nodes are kept.
 */
export function addMissingCurriculum(tree: Tree, chapter: CurriculumSource): { tree: Tree; added: number } {
  let next = clone(tree);
  const missing = missingCurriculumItems(chapter, next);
  // Parents come before children in `missing`, so a just-added parent is found for its children.
  const byCurriculum = new Map<string, string>();
  const index = (list: Tree) => {
    for (const n of list) {
      if (n.curriculumNodeId) byCurriculum.set(n.curriculumNodeId, n.id);
      index(n.children);
    }
  };
  index(next);
  for (const { item, parentCurriculumId } of missing) {
    const node = newNode(item.name, item.id, item.description ?? null);
    const parentId = parentCurriculumId ? (byCurriculum.get(parentCurriculumId) ?? null) : null;
    next = addChild(next, parentId, node);
    byCurriculum.set(item.id, node.id);
  }
  return { tree: next, added: missing.length };
}

/** True if `id` is `ancestorId` or somewhere inside its branch. */
export function isInBranch(tree: Tree, ancestorId: string, id: string): boolean {
  const at = locate(tree, ancestorId);
  if (!at) return false;
  const walk = (n: MindMapTreeNode): boolean => n.id === id || n.children.some(walk);
  return walk(at.siblings[at.index]);
}

/**
 * Drag & drop: moves `id` (with its branch) before/after `targetId`, or makes it the last
 * child of `targetId` ('inside'). Dropping a node onto itself or into its own branch is a
 * no-op (it would detach the branch).
 */
export function moveNodeTo(tree: Tree, id: string, targetId: string, position: 'before' | 'after' | 'inside'): Tree {
  if (id === targetId || isInBranch(tree, id, targetId)) return tree;
  const next = clone(tree);
  const from = locate(next, id);
  if (!from) return tree;
  const [node] = from.siblings.splice(from.index, 1);
  const to = locate(next, targetId);
  if (!to) return tree;
  if (position === 'inside') to.siblings[to.index].children.push(node);
  else to.siblings.splice(position === 'before' ? to.index : to.index + 1, 0, node);
  return next;
}

/** Inserts `node` right after `afterId` among its siblings (Enter in the outline editor). */
export function insertSiblingAfter(tree: Tree, afterId: string, node: MindMapTreeNode): Tree {
  const next = clone(tree);
  const at = locate(next, afterId);
  if (!at) return tree;
  at.siblings.splice(at.index + 1, 0, node);
  return next;
}

/** Ids in visible outline order (depth-first) — for moving focus with ↑/↓. */
export function outlineOrder(tree: Tree): string[] {
  const out: string[] = [];
  const walk = (list: Tree) => {
    for (const n of list) {
      out.push(n.id);
      walk(n.children);
    }
  };
  walk(tree);
  return out;
}
