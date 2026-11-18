import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assignSides, branchBounds, chooseColumns, expandableIds, fitView, layoutMindMap, layoutVertical, measureNode, quizTargets, searchTree, subtreeIds, subtreeProgress, textWidth, topicOf, wrapText, SIZES, TYPE } from './layout';
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

describe('text-sized boxes', () => {
  it('wraps long facts onto more lines instead of widening forever', () => {
    const short = measureNode({ label: 'Citizen of India' }, 2);
    const long = measureNode({ label: 'The Vice-President shall be elected by the members of both Houses of Parliament (All MPs)' }, 2);
    assert.ok(long.w <= TYPE.sub.maxW && long.w > short.w);
    assert.ok(long.h > short.h, 'a long sentence takes more lines');
    assert.equal(short.h, TYPE.sub.minH);
  });

  it('measures Devanagari, headings and tag rows', () => {
    assert.ok(textWidth('उपराष्ट्रपति', 13) > 0);
    assert.ok(textWidth('उपराष्ट्रपति', 13) < textWidth('उ प र ष ट र प त', 13), 'vowel signs add little width');
    const plain = measureNode({ label: 'Election of Vice-President' }, 2);
    const heading = measureNode({ label: 'Election of Vice-President', style: { heading: true } }, 2);
    assert.ok(heading.h < plain.h, 'headings have a tighter box');
    const label = 'Article 67: Term of office of Vice-President and removal';
    assert.equal(measureNode({ label, tags: ['PYQ 2023'] }, 1).h - measureNode({ label }, 1).h, TYPE.tagRow);
  });

  it('breaks a single over-long word across lines', () => {
    assert.ok(wrapText('x'.repeat(200), 100, 13).lines > 1);
  });
});

describe('large maps', () => {
  // A Parliament-sized map: 45 articles with 2–5 sentence-long facts each.
  const fact = (a: number, i: number) => `Article ${a} fact ${i}: ${'a fairly long sentence of the kind found in polity notes '.slice(0, 30 + ((a * 7 + i * 13) % 70))}`;
  const big = Array.from({ length: 45 }, (_, k) => n(`Article ${79 + k}`, Array.from({ length: 2 + (k % 4) }, (_, i) => n(fact(79 + k, i)))));
  const overlaps = (boxes: { x: number; y: number; w: number; h: number }[]) => {
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return true;
      }
    return false;
  };

  it('lays out ~200 nodes with no two boxes overlapping, centre included', () => {
    const l = layoutMindMap(big, expandableIds(big));
    assert.ok(l.nodes.length >= 200);
    const centre = { x: -SIZES.center.w / 2, y: -SIZES.center.h / 2, w: SIZES.center.w, h: SIZES.center.h };
    assert.equal(overlaps([centre, ...l.nodes]), false);
  });

  it('balances the two sides', () => {
    const l = layoutMindMap(big, expandableIds(big));
    const right = l.nodes.filter((x) => x.side === 1).length;
    assert.ok(Math.abs(right * 2 - l.nodes.length) < l.nodes.length * 0.1);
  });

  it('fits a fully expanded big map on a landscape page', () => {
    const l = layoutMindMap(big, expandableIds(big));
    const v = fitView(l.bounds, { w: 1123, h: 794 }, { padding: 24, min: 0.05, max: 1 });
    assert.ok(v.k > 0.1, `scale ${v.k.toFixed(3)}`);
  });

  it('never overlaps in the vertical tree either', () => {
    assert.equal(overlaps(layoutVertical(big, expandableIds(big), 360).nodes), false);
  });
});

describe('two-column sides for big maps', () => {
  const big = Array.from({ length: 45 }, (_, k) => n(`Article ${79 + k}`, Array.from({ length: 2 + (k % 4) }, (_, i) => n(`Article ${79 + k} fact ${i} with a reasonably long sentence to wrap`))));
  const fit = (l: ReturnType<typeof layoutMindMap>) => fitView(l.bounds, { w: 1123, h: 794 }, { padding: 0, min: 0, max: 10 }).k;

  it('uses extra columns for many topics and one for small maps', () => {
    assert.ok(chooseColumns(big) >= 2);
    assert.equal(chooseColumns(tree), 1);
  });

  it('fits a landscape page much better than a single tall column', () => {
    const all = expandableIds(big);
    assert.ok(fit(layoutMindMap(big, all)) > fit(layoutMindMap(big, all, { columns: 1 })) * 1.4);
  });

  it('keeps the bus corridor at y = 0 free of inner-column boxes', () => {
    const l = layoutMindMap(big, expandableIds(big));
    const busTopics = new Set(l.links.filter((x) => x.depth === 1 && x.d.includes(' V ')).map((x) => x.id));
    assert.ok(busTopics.size > 0);
    const innerIds = new Set(l.nodes.filter((x) => x.depth === 1 && !busTopics.has(x.id)).map((x) => x.id));
    // Every box belonging to an inner-column subtree stays clear of y = 0.
    const topicOfNode = new Map<string, string>();
    for (const x of l.nodes) topicOfNode.set(x.id, x.depth === 1 ? x.id : topicOfNode.get(x.parentId!)!);
    for (const x of l.nodes) if (innerIds.has(topicOfNode.get(x.id)!)) assert.ok(x.y + x.h <= 0 || x.y >= 0, `${x.id} crosses the corridor`);
  });
});
