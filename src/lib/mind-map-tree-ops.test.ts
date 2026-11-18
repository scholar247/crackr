import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addChild, addMissingCurriculum, indentNode, moveNode, outdentNode, removeNode, updateNode } from './mind-map-tree-ops';
import type { CurriculumSource, MindMapTreeNode } from './mind-maps';

const n = (id: string, children: MindMapTreeNode[] = [], curriculumNodeId: string | null = null): MindMapTreeNode => ({ id, label: id, description: null, content: null, curriculumNodeId, children });
const shape = (tree: MindMapTreeNode[]): unknown => tree.map((x) => (x.children.length ? { [x.id]: shape(x.children) } : x.id));

describe('tree ops', () => {
  const tree = [n('a', [n('a1'), n('a2')]), n('b')];

  it('updates a nested node without touching the input', () => {
    const next = updateNode(tree, 'a2', { label: 'Renamed' });
    assert.equal(next[0].children[1].label, 'Renamed');
    assert.equal(tree[0].children[1].label, 'a2');
  });

  it('removes a node with its subtree', () => assert.deepEqual(shape(removeNode(tree, 'a')), ['b']));

  it('adds a main topic or a child', () => {
    assert.deepEqual(shape(addChild(tree, null, n('c'))), [{ a: ['a1', 'a2'] }, 'b', 'c']);
    assert.deepEqual(shape(addChild(tree, 'b', n('b1'))), [{ a: ['a1', 'a2'] }, { b: ['b1'] }]);
  });

  it('reorders within siblings and ignores moves past the ends', () => {
    assert.deepEqual(shape(moveNode(tree, 'a2', -1)), [{ a: ['a2', 'a1'] }, 'b']);
    assert.equal(moveNode(tree, 'a1', -1), tree);
    assert.equal(moveNode(tree, 'b', 1), tree);
  });

  it('indents under the previous sibling and outdents after the parent', () => {
    assert.deepEqual(shape(indentNode(tree, 'b')), [{ a: ['a1', 'a2', 'b'] }]);
    assert.deepEqual(shape(outdentNode(tree, 'a1')), [{ a: ['a2'] }, 'a1', 'b']);
    assert.equal(indentNode(tree, 'a'), tree, 'first sibling cannot indent');
    assert.equal(outdentNode(tree, 'b'), tree, 'main topics cannot outdent');
  });

  it('adds missing curriculum items under the node linked to their parent', () => {
    const chapter: CurriculumSource = {
      id: 'ch',
      name: 'Chapter',
      nodeType: 'CHAPTER',
      children: [
        { id: 't1', name: 'Topic 1', nodeType: 'TOPIC', children: [{ id: 's1', name: 'Sub 1', nodeType: 'SUBTOPIC', children: [] }] },
        { id: 't2', name: 'Topic 2', nodeType: 'TOPIC', children: [{ id: 's2', name: 'Sub 2', nodeType: 'SUBTOPIC', children: [] }] },
      ],
    };
    const { tree: next, added } = addMissingCurriculum([n('x', [], 't1')], chapter);
    assert.equal(added, 3);
    assert.equal(next[0].children[0].curriculumNodeId, 's1', 'subtopic placed under its linked topic');
    const t2 = next.find((x) => x.curriculumNodeId === 't2')!;
    assert.equal(t2.children[0].curriculumNodeId, 's2', 'a newly added topic receives its own subtopics');
  });
});
