import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allowedMindMapActions,
  buildTree,
  diffMindMaps,
  flattenTree,
  generateFromCurriculum,
  mindMapSitemapPaths,
  mindMapsPath,
  missingCurriculumItems,
  nextMindMapStatus,
  subjectSegment,
  validateFlatTree,
  MIND_MAP_LIMITS,
  type CurriculumSource,
  type FlatMindMapNode,
  type MindMapTreeNode,
} from './mind-maps';
import { SaveMindMapSchema } from '@/schemas/mind-map.schema';

const chapter: CurriculumSource = {
  id: 'ch',
  name: 'Life Processes',
  nodeType: 'CHAPTER',
  children: [
    { id: 't1', name: 'Nutrition', nodeType: 'TOPIC', description: 'How organisms obtain food', children: [{ id: 's1', name: 'Autotrophic nutrition', nodeType: 'SUBTOPIC', children: [] }] },
    { id: 't2', name: 'Respiration', nodeType: 'TOPIC', children: [] },
  ],
};

let seq = 0;
const ids = () => `id-${++seq}`;

describe('generateFromCurriculum', () => {
  it('mirrors the chapter structure, keeping curriculum ids, order and descriptions', () => {
    seq = 0;
    const tree = generateFromCurriculum(chapter, ids);
    assert.deepEqual(
      tree.map((n) => [n.label, n.curriculumNodeId, n.description]),
      [
        ['Nutrition', 't1', 'How organisms obtain food'],
        ['Respiration', 't2', null],
      ],
    );
    assert.equal(tree[0].children[0].label, 'Autotrophic nutrition');
    assert.equal(tree[0].children[0].curriculumNodeId, 's1');
    assert.equal(tree[0].children[0].content, null, 'never invents content');
  });

  it('gives an empty map for a chapter with no mapped topics', () => {
    assert.deepEqual(generateFromCurriculum({ ...chapter, children: [] }), []);
  });
});

describe('buildTree / flattenTree', () => {
  it('round-trips and orders siblings by displayOrder', () => {
    const rows: FlatMindMapNode[] = [
      { id: 'b', parentId: null, curriculumNodeId: null, label: 'B', description: null, content: null, displayOrder: 1 },
      { id: 'a', parentId: null, curriculumNodeId: null, label: 'A', description: null, content: null, displayOrder: 0 },
      { id: 'a1', parentId: 'a', curriculumNodeId: null, label: 'A1', description: null, content: null, displayOrder: 0 },
    ];
    const tree = buildTree(rows);
    assert.deepEqual(
      tree.map((n) => n.id),
      ['a', 'b'],
    );
    assert.equal(tree[0].children[0].id, 'a1');
    const flat = flattenTree(tree);
    assert.deepEqual(
      flat.map((r) => [r.id, r.parentId, r.displayOrder]),
      [
        ['a', null, 0],
        ['a1', 'a', 0],
        ['b', null, 1],
      ],
    );
  });
});

describe('validateFlatTree', () => {
  const allowed = new Set(['t1', 't2', 's1']);
  const row = (id: string, parentId: string | null, extra: Partial<FlatMindMapNode> = {}): FlatMindMapNode => ({
    id,
    parentId,
    curriculumNodeId: null,
    label: id,
    description: null,
    content: null,
    displayOrder: 0,
    ...extra,
  });

  it('accepts a valid tree', () => assert.equal(validateFlatTree([row('a', null, { curriculumNodeId: 't1' }), row('b', 'a')], allowed), null));
  it('rejects duplicate ids', () => assert.match(validateFlatTree([row('a', null), row('a', null)], allowed)!, /Duplicate/));
  it('rejects a missing parent', () => assert.match(validateFlatTree([row('a', 'ghost')], allowed)!, /parent/));
  it('rejects cycles', () => assert.match(validateFlatTree([row('a', 'b'), row('b', 'a')], allowed)!, /ancestor/));
  it('rejects links to topics outside the chapter', () => assert.match(validateFlatTree([row('a', null, { curriculumNodeId: 'other-chapter-topic' })], allowed)!, /outside this chapter/));
  it('rejects empty labels', () => assert.match(validateFlatTree([row('a', null, { label: '  ' })], allowed)!, /label/));
  it('enforces the depth limit', () => {
    const chain = Array.from({ length: MIND_MAP_LIMITS.maxDepth + 1 }, (_, i) => row(`n${i}`, i === 0 ? null : `n${i - 1}`));
    assert.match(validateFlatTree(chain, allowed)!, /levels deep/);
  });
  it('enforces the node limit', () => {
    const many = Array.from({ length: MIND_MAP_LIMITS.maxNodes + 1 }, (_, i) => row(`n${i}`, null));
    assert.match(validateFlatTree(many, allowed)!, /at most/);
  });
});

describe('status workflow', () => {
  it('follows draft → review → published → archived → draft', () => {
    assert.equal(nextMindMapStatus('DRAFT', 'submit'), 'IN_REVIEW');
    assert.equal(nextMindMapStatus('IN_REVIEW', 'publish'), 'PUBLISHED');
    assert.equal(nextMindMapStatus('PUBLISHED', 'publish'), 'PUBLISHED', 'republish pushes pending changes');
    assert.equal(nextMindMapStatus('PUBLISHED', 'unpublish'), 'DRAFT');
    assert.equal(nextMindMapStatus('PUBLISHED', 'archive'), 'ARCHIVED');
    assert.equal(nextMindMapStatus('ARCHIVED', 'restore'), 'DRAFT');
  });
  it('rejects invalid transitions', () => {
    assert.equal(nextMindMapStatus('DRAFT', 'unpublish'), null);
    assert.equal(nextMindMapStatus('ARCHIVED', 'publish'), null);
    assert.equal(nextMindMapStatus('IN_REVIEW', 'submit'), null);
  });
  it('lists allowed actions', () => assert.deepEqual(allowedMindMapActions('ARCHIVED'), ['restore']));
});

describe('diffMindMaps', () => {
  const n = (id: string, label: string, children: MindMapTreeNode[] = [], description: string | null = null): MindMapTreeNode => ({ id, label, description, content: null, curriculumNodeId: null, children });
  it('reports added, removed, renamed, moved and description changes', () => {
    const before = [n('a', 'Nutrition', [n('a1', 'Autotrophic')]), n('b', 'Respiration')];
    const after = [n('b', 'Respiration', [], 'Releasing energy'), n('a', 'Nutrition in plants'), n('c', 'Excretion')];
    const d = diffMindMaps(before, after);
    assert.deepEqual(d.added, ['Excretion']);
    assert.deepEqual(d.removed, ['Autotrophic']);
    assert.deepEqual(d.renamed, [{ from: 'Nutrition', to: 'Nutrition in plants' }]);
    assert.ok(d.moved.includes('Respiration'));
    assert.deepEqual(d.descriptionsChanged, ['Respiration']);
    assert.equal(d.hasChanges, true);
  });
  it('reports no changes for identical trees', () => assert.equal(diffMindMaps([n('a', 'A')], [n('a', 'A')]).hasChanges, false));
  it('reports only the node that moved, not the siblings that shifted', () => {
    const before = [n('a', 'A'), n('b', 'B'), n('c', 'C'), n('d', 'D')];
    const after = [n('a', 'A', [n('b', 'B')]), n('c', 'C'), n('d', 'D')];
    assert.deepEqual(diffMindMaps(before, after).moved, ['B']);
    // A real reorder changes relative positions, so it is reported.
    assert.deepEqual(diffMindMaps([n('a', 'A'), n('b', 'B'), n('c', 'C')], [n('c', 'C'), n('a', 'A'), n('b', 'B')]).moved.sort(), ['A', 'B', 'C']);
  });
});

describe('missingCurriculumItems', () => {
  it('finds curriculum nodes the map does not reference, with their parent', () => {
    const tree: MindMapTreeNode[] = [{ id: 'x', label: 'Nutrition', description: null, content: null, curriculumNodeId: 't1', children: [] }];
    assert.deepEqual(
      missingCurriculumItems(chapter, tree).map((m) => [m.item.id, m.parentCurriculumId]),
      [
        ['s1', 't1'],
        ['t2', null],
      ],
    );
  });
});

describe('URLs', () => {
  it('drops the class suffix from subject slugs', () => {
    assert.equal(subjectSegment('science-class-10'), 'science');
    assert.equal(subjectSegment('physics'), 'physics');
    assert.equal(mindMapsPath('cbse-class-10-board', 'science-class-10', 'life-processes'), '/exams/cbse-class-10-board/mind-maps/science/life-processes');
  });
});

describe('mindMapSitemapPaths', () => {
  const syllabus = new Map([
    [
      'cbse-class-10-board',
      [
        { slug: 'science-class-10', children: [{ id: 'c1', slug: 'life-processes', nodeType: 'CHAPTER' }, { id: 'c2', slug: 'light', nodeType: 'CHAPTER' }] },
        { slug: 'mathematics-class-10', children: [{ id: 'c3', slug: 'real-numbers', nodeType: 'CHAPTER' }] },
      ],
    ],
  ]);
  const d1 = new Date('2026-11-01'), d2 = new Date('2026-11-10');

  it('lists chapter, subject and hub pages once, dated by the newest chapter', () => {
    const paths = mindMapSitemapPaths(
      [
        { examSlug: 'cbse-class-10-board', chapterNodeId: 'c1', publishedAt: d1 },
        { examSlug: 'cbse-class-10-board', chapterNodeId: 'c2', publishedAt: d2 },
      ],
      syllabus,
    );
    const byPath = new Map(paths.map((p) => [p.path, p]));
    assert.equal(paths.length, 4, 'hub + 1 subject + 2 chapters, no duplicates');
    assert.equal(byPath.get('/exams/cbse-class-10-board/mind-maps')?.lastModified, d2);
    assert.equal(byPath.get('/exams/cbse-class-10-board/mind-maps/science')?.lastModified, d2);
    assert.ok(byPath.has('/exams/cbse-class-10-board/mind-maps/science/life-processes'));
    assert.ok(!byPath.has('/exams/cbse-class-10-board/mind-maps/mathematics'), 'subjects without published maps are excluded');
  });

  it('skips maps whose chapter is no longer in the syllabus', () => {
    assert.deepEqual(mindMapSitemapPaths([{ examSlug: 'cbse-class-10-board', chapterNodeId: 'removed', publishedAt: d1 }], syllabus), []);
  });

  it('lists nothing when nothing is published', () => assert.deepEqual(mindMapSitemapPaths([], syllabus), []));
});

describe('SaveMindMapSchema', () => {
  const base = { seoTitle: null, seoDescription: null, intro: null, revisionNotes: null, faqs: [], nodes: [] };
  const node = { id: '3f9c1f5e-8b1a-4c2d-9e3f-1a2b3c4d5e6f', parentId: null, curriculumNodeId: null, label: 'Nutrition', description: null, content: null, displayOrder: 0 };
  it('accepts a valid draft', () => assert.equal(SaveMindMapSchema.safeParse({ ...base, nodes: [node] }).success, true));
  it('rejects unsafe Markdown', () => assert.equal(SaveMindMapSchema.safeParse({ ...base, revisionNotes: '<script>alert(1)</script>' }).success, false));
  it('rejects non-UUID node ids', () => assert.equal(SaveMindMapSchema.safeParse({ ...base, nodes: [{ ...node, id: 'x' }] }).success, false));
  it('rejects unknown fields', () => assert.equal(SaveMindMapSchema.safeParse({ ...base, status: 'PUBLISHED' }).success, false));
});
