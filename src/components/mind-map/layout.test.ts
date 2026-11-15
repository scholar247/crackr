import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignSides, expandableIds, fitView, layoutMindMap, searchTree, SIZES } from './layout';
import type { MindMapTreeNode } from '@/lib/mind-maps';

const n = (id: string, children: MindMapTreeNode[] = [], description: string | null = null): MindMapTreeNode => ({ id, label: id, description, content: null, curriculumNodeId: null, children });

const tree = [n('Nutrition', [n('Autotrophic'), n('Heterotrophic', [n('Holozoic')])]), n('Respiration', [n('Aerobic'), n('Anaerobic')]), n('Transportation'), n('Excretion', [n('Kidney')])];

/** True if no two boxes on the same side and depth overlap vertically. */
function noOverlaps(nodes: ReturnType<typeof layoutMindMap>['nodes']) {
  const groups = new Map<string, typeof nodes>();
  for (const x of nodes) groups.set(`${x.side}:${x.depth}`, [...(groups.get(`${x.side}:${x.depth}`) ?? []), x]);
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].y < sorted[i - 1].y + sorted[i - 1].h) return false;
  }
  return true;
}

describe('layoutMindMap', () => {
  it('shows only main topics when everything is collapsed', () => {
    const l = layoutMindMap(tree, new Set());
    assert.deepEqual(l.nodes.map((x) => x.id).sort(), ['Excretion', 'Nutrition', 'Respiration', 'Transportation']);
    assert.equal(l.links.length, l.nodes.length, 'one link per visible node');
    assert.ok(l.nodes.every((x) => !x.expanded));
  });

  it('reveals exactly the children of expanded nodes', () => {
    const l = layoutMindMap(tree, new Set(['Nutrition']));
    const ids = l.nodes.map((x) => x.id);
    assert.ok(ids.includes('Autotrophic') && ids.includes('Heterotrophic'));
    assert.ok(!ids.includes('Holozoic'), 'grandchildren stay hidden until their parent opens');
  });

  it('never overlaps nodes, even fully expanded', () => {
    const l = layoutMindMap(tree, expandableIds(tree));
    assert.equal(l.nodes.length, 10);
    assert.ok(noOverlaps(l.nodes));
  });

  it('places branches on both sides of the centre, children further out', () => {
    const l = layoutMindMap(tree, expandableIds(tree));
    assert.ok(l.nodes.some((x) => x.side === 1) && l.nodes.some((x) => x.side === -1));
    for (const x of l.nodes) {
      if (x.side === 1) assert.ok(x.x >= SIZES.center.w / 2);
      else assert.ok(x.x + x.w <= -SIZES.center.w / 2);
    }
    const parent = l.nodes.find((x) => x.id === 'Nutrition')!;
    const child = l.nodes.find((x) => x.id === 'Autotrophic')!;
    assert.ok(parent.side === 1 ? child.x > parent.x : child.x < parent.x);
    assert.equal(child.branch, parent.branch, 'children keep their branch colour');
  });

  it('keeps sides stable when branches expand', () => {
    const before = layoutMindMap(tree, new Set());
    const after = layoutMindMap(tree, expandableIds(tree));
    for (const id of ['Nutrition', 'Respiration', 'Transportation', 'Excretion']) {
      assert.equal(before.nodes.find((x) => x.id === id)!.side, after.nodes.find((x) => x.id === id)!.side);
    }
  });

  it('balances sides by subtree size', () => {
    // Leaf weights: Nutrition 2, Respiration 2, Transportation 1, Excretion 1 → 3 vs 3.
    assert.deepEqual(assignSides(tree), [1, -1, 1, -1]);
  });

  it('handles an empty map', () => {
    const l = layoutMindMap([], new Set());
    assert.equal(l.nodes.length, 0);
    assert.equal(l.bounds.maxX - l.bounds.minX, SIZES.center.w);
  });
});

describe('fitView', () => {
  it('fits bounds into the viewport within zoom limits and centres them', () => {
    const v = fitView({ minX: -500, minY: -100, maxX: 500, maxY: 100 }, { w: 548, h: 600 });
    assert.equal(v.k, 0.5);
    assert.ok(Math.abs(v.tx) < 1e-9 && Math.abs(v.ty) < 1e-9, 'centred');
    assert.equal(fitView({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, { w: 2000, h: 2000 }).k, 1.2, 'capped at max zoom');
  });
});

describe('searchTree', () => {
  it('matches labels and descriptions case-insensitively and reveals ancestors', () => {
    const r = searchTree(tree, 'holo');
    assert.deepEqual(r.matches, ['Holozoic']);
    assert.deepEqual([...r.reveal].sort(), ['Heterotrophic', 'Nutrition']);
    assert.deepEqual(searchTree([n('A', [], 'Releases ENERGY')], 'energy').matches, ['A']);
  });
  it('ignores queries shorter than two characters', () => assert.deepEqual(searchTree(tree, 'a').matches, []));
});
