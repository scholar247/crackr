import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exportFilename, renderMindMapSvg } from './export-image';
import { wrapLines, textWidth } from './layout';
import type { MindMapTreeNode } from '@/lib/mind-maps';

const n = (label: string, children: MindMapTreeNode[] = []): MindMapTreeNode => ({ id: label, label, description: null, content: null, curriculumNodeId: null, children });
const nodes = [n('Article 66', [n('Election of <Vice-President> & more'), n('Completed the age of 35 years')]), n('Article 67', [n('Term of five years')])];
const base = { title: { eyebrow: 'Sample', subject: 'Polity', chapter: 'Vice-President' }, nodes, link: 'syllabuzai.com/x', siteName: 'syllabuzAI' };

describe('renderMindMapSvg', () => {
  it('draws every node fully expanded, with escaped text and a branded footer', () => {
    const { svg, width, height } = renderMindMapSvg({ ...base, theme: 'COLOUR' });
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    for (const label of ['Article 66', 'Term of five years', 'Completed the age of 35 years']) assert.ok(svg.includes(label), label);
    assert.ok(svg.includes('&lt;Vice-President&gt;') && svg.includes(' &amp;') && !svg.includes('<Vice'), 'text is XML-escaped');
    assert.ok(svg.includes('syllabuzai.com/x') && svg.includes('Vice-President — Mind Map'));
    assert.ok(width > 400 && height > 200);
  });
  it('uses monochrome for the classic theme', () => {
    const { svg } = renderMindMapSvg({ ...base, theme: 'CLASSIC' });
    assert.ok(!svg.includes('#3b82f6') && svg.includes('url(#centre)'));
  });
});

describe('wrapLines', () => {
  it('matches the width limit and keeps every word', () => {
    const text = 'The Vice-President shall be elected by the members of both Houses of Parliament';
    const lines = wrapLines(text, 180, 13);
    assert.ok(lines.length > 1);
    assert.equal(lines.join(' '), text);
    for (const l of lines) assert.ok(textWidth(l, 13) <= 180);
  });
});

describe('exportFilename', () => {
  it('slugs the chapter name', () => assert.equal(exportFilename('Life Processes', 'png'), 'life-processes-mind-map.png'));
});
