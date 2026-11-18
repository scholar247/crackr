import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { importOutline, toMarkdownOutline } from './mind-map-import';
import { insertSiblingAfter, isInBranch, moveNodeTo, outlineOrder } from './mind-map-tree-ops';
import type { MindMapTreeNode } from './mind-maps';

let seq = 0;
const ids = () => `n${++seq}`;
const labels = (nodes: MindMapTreeNode[]): unknown => nodes.map((n) => (n.children.length ? { [n.label]: labels(n.children) } : n.label));

describe('importOutline', () => {
  it('reads Markdown bullets, dropping a single wrapping title', () => {
    const r = importOutline('# Vice-President\n- Article 63\n  - There shall be a Vice-President\n- Article 66\n  - Election\n    - Citizen of India\n', ids);
    assert.equal(r.format, 'markdown');
    assert.deepEqual(labels(r.nodes), [{ 'Article 63': ['There shall be a Vice-President'] }, { 'Article 66': [{ Election: ['Citizen of India'] }] }]);
    assert.equal(r.count, 5);
  });

  it('nests bullets under headings and accepts numbered/checkbox items', () => {
    const r = importOutline('## Nutrition\n1. Autotrophic\n2. Heterotrophic\n## Respiration\n- [ ] Aerobic\n', ids);
    assert.deepEqual(labels(r.nodes), [{ Nutrition: ['Autotrophic', 'Heterotrophic'] }, { Respiration: ['Aerobic'] }]);
  });

  it('reads plain indented text with tabs or any space width', () => {
    const r = importOutline('Nutrition\n\tAutotrophic\n\tHeterotrophic\n\t\tHolozoic\nRespiration\n   Aerobic\n', ids);
    assert.equal(r.format, 'text');
    assert.deepEqual(labels(r.nodes), [{ Nutrition: ['Autotrophic', { Heterotrophic: ['Holozoic'] }] }, { Respiration: ['Aerobic'] }]);
  });

  it('reads OPML with entities', () => {
    const r = importOutline('<?xml version="1.0"?><opml><body><outline text="A &amp; B"><outline text="Child"/></outline><outline text="C"/></body></opml>', ids);
    assert.equal(r.format, 'opml');
    assert.deepEqual(labels(r.nodes), [{ 'A & B': ['Child'] }, 'C']);
  });

  it('truncates long labels and caps depth', () => {
    const long = 'x'.repeat(400);
    const r = importOutline(`- ${long}\n- a\n  - b\n    - c\n      - d\n        - e\n          - f\n            - g\n`, ids);
    assert.equal(r.truncated, 1);
    assert.ok(r.nodes[0].label.length <= 300);
    let depth = 0;
    for (let n: MindMapTreeNode | undefined = r.nodes[1]; n; n = n.children[0]) depth++;
    assert.equal(depth, 6);
  });

  it('round-trips through the Markdown export', () => {
    const r = importOutline('- A\n  - B\n- C\n', ids);
    assert.deepEqual(labels(importOutline(toMarkdownOutline('Title', r.nodes), ids).nodes), labels(r.nodes));
  });
});

describe('drag & drop tree ops', () => {
  const n = (id: string, children: MindMapTreeNode[] = []): MindMapTreeNode => ({ id, label: id, description: null, content: null, curriculumNodeId: null, children });
  const tree = [n('A', [n('A1'), n('A2')]), n('B', [n('B1')]), n('C')];

  it('moves a branch before, after or inside another node', () => {
    assert.deepEqual(labels(moveNodeTo(tree, 'C', 'A', 'before')), ['C', { A: ['A1', 'A2'] }, { B: ['B1'] }]);
    assert.deepEqual(labels(moveNodeTo(tree, 'A1', 'B1', 'after')), [{ A: ['A2'] }, { B: ['B1', 'A1'] }, 'C']);
    assert.deepEqual(labels(moveNodeTo(tree, 'A', 'C', 'inside')), [{ B: ['B1'] }, { C: [{ A: ['A1', 'A2'] }] }]);
  });

  it('refuses to drop a node into its own branch, and leaves the input untouched', () => {
    assert.equal(moveNodeTo(tree, 'A', 'A1', 'inside'), tree);
    assert.equal(moveNodeTo(tree, 'A', 'A', 'after'), tree);
    assert.ok(isInBranch(tree, 'A', 'A2') && !isInBranch(tree, 'B', 'A2'));
    assert.deepEqual(labels(tree), [{ A: ['A1', 'A2'] }, { B: ['B1'] }, 'C']);
  });

  it('inserts a sibling after a node and lists the outline order', () => {
    assert.deepEqual(outlineOrder(insertSiblingAfter(tree, 'A1', n('X'))), ['A', 'A1', 'X', 'A2', 'B', 'B1', 'C']);
  });
});
