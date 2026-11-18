import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignSides, branchBounds, expandableIds, fitView, layoutMindMap, layoutVertical, quizTargets, searchTree, subtreeIds, subtreeProgress, topicOf, SIZES } from './layout';
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

describe('focus mode helpers', () => {
  it('collects a whole branch, so one click can open every level of a topic', () => {
    const nutrition = tree[0];
    assert.deepEqual([...subtreeIds(nutrition)].sort(), ['Autotrophic', 'Heterotrophic', 'Holozoic', 'Nutrition']);
    assert.deepEqual([...expandableIds([nutrition])].sort(), ['Heterotrophic', 'Nutrition'], 'the topic and its nested parent open together');
  });

  it('frames only the open branch plus the central node', () => {
    const open = expandableIds([tree[0]]);
    const l = layoutMindMap(tree, open);
    const b = branchBounds(l, subtreeIds(tree[0]));
    const nutritionBoxes = l.nodes.filter((x) => subtreeIds(tree[0]).has(x.id));
    for (const x of nutritionBoxes) assert.ok(x.x >= b.minX && x.x + x.w <= b.maxX && x.y >= b.minY && x.y + x.h <= b.maxY);
    assert.ok(b.minX <= -SIZES.center.w / 2 && b.maxX >= SIZES.center.w / 2, 'includes the chapter node');
  });
});

describe('quizTargets', () => {
  it('hides every subtopic and keeps main topics as cues', () => {
    assert.deepEqual(quizTargets(tree).sort(), ['Aerobic', 'Anaerobic', 'Autotrophic', 'Heterotrophic', 'Holozoic', 'Kidney']);
  });
  it('hides main topics when a chapter has no subtopics', () => {
    assert.deepEqual(quizTargets([n('A'), n('B')]), ['A', 'B']);
  });
  it('has nothing to hide in an empty map', () => assert.deepEqual(quizTargets([]), []));
});

describe('layoutVertical', () => {
  const l = layoutVertical(tree, expandableIds(tree), 360);

  it('stacks every visible node in its own row, in reading order', () => {
    assert.equal(l.nodes.length, 10);
    assert.deepEqual(
      l.nodes.map((x) => x.id),
      ['Nutrition', 'Autotrophic', 'Heterotrophic', 'Holozoic', 'Respiration', 'Aerobic', 'Anaerobic', 'Transportation', 'Excretion', 'Kidney'],
    );
    for (let i = 1; i < l.nodes.length; i++) assert.ok(l.nodes[i].y >= l.nodes[i - 1].y + l.nodes[i - 1].h, 'rows never overlap');
    assert.ok(l.nodes[0].y >= l.centre!.h, 'below the chapter card');
  });

  it('indents by depth and fills the width', () => {
    const byId = new Map(l.nodes.map((x) => [x.id, x]));
    assert.ok(byId.get('Autotrophic')!.x > byId.get('Nutrition')!.x);
    assert.ok(byId.get('Holozoic')!.x > byId.get('Heterotrophic')!.x);
    for (const x of l.nodes) assert.equal(x.x + x.w, 360);
    assert.equal(l.bounds.maxY, l.nodes.at(-1)!.y + l.nodes.at(-1)!.h);
  });

  it('shows only topics when collapsed, and keeps branch colours', () => {
    const c = layoutVertical(tree, new Set(), 360);
    assert.equal(c.nodes.length, 4);
    assert.deepEqual(
      c.nodes.map((x) => x.branch),
      [0, 1, 2, 3],
    );
    assert.equal(l.nodes.find((x) => x.id === 'Holozoic')!.branch, 0);
  });

  it('has one connector per node and a minimum width', () => {
    assert.equal(l.links.length, l.nodes.length);
    assert.equal(layoutVertical(tree, new Set(), 100).centre!.w, 240);
  });
});

describe('progress helpers', () => {
  it('counts done nodes within a branch', () => {
    assert.deepEqual(subtreeProgress(tree[0], new Set(['Nutrition', 'Holozoic', 'Kidney'])), { done: 2, total: 4 });
  });
  it('finds the topic a node belongs to', () => {
    assert.equal(topicOf(tree, 'Holozoic')?.id, 'Nutrition');
    assert.equal(topicOf(tree, 'missing'), null);
  });
});
