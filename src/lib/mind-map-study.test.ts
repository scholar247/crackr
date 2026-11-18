import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BLANK, buildFlashcards, findBlank, generateQuestions, presentationOrder, seededRandom } from './mind-map-study';
import { dayNumber, isDue, masteryLevel, masteryScore, review } from './spaced-repetition';
import type { MindMapTreeNode } from './mind-maps';

const n = (label: string, children: MindMapTreeNode[] = [], description: string | null = null): MindMapTreeNode => ({ id: label, label, description, content: null, curriculumNodeId: null, children });

const map = [
  n('Article 66', [n('Elected by members of both Houses'), n('Eligible', [n('Citizen of India'), n('Completed the age of 35 years')])]),
  n('Article 67', [n('Term of five years'), n('Resignation to the President')]),
  n('Article 68', [n('Election held within 60 days')]),
  n('Article 69', [n('Oath before the President')], 'Oath or affirmation'),
];

describe('SM-2 review', () => {
  it('grows intervals 1 → 6 → ×ease on good answers', () => {
    const a = review(undefined, 4, 100);
    assert.deepEqual([a.reps, a.interval, a.due], [1, 1, 101]);
    const b = review(a, 4, 101);
    assert.equal(b.interval, 6);
    const c = review(b, 4, 107);
    assert.equal(c.interval, Math.round(6 * b.ease));
  });

  it('resets on a lapse and lowers ease, never below 1.3', () => {
    let card = review(review(undefined, 4, 0), 4, 1);
    card = review(card, 1, 7);
    assert.deepEqual([card.reps, card.interval, card.lapses], [0, 1, 1]);
    for (let i = 0; i < 20; i++) card = review(card, 1, 8 + i);
    assert.equal(card.ease, 1.3);
  });

  it('gives Easy a head start on a new card', () => assert.equal(review(undefined, 5, 0).interval, 4));

  it('treats hard/easy as shorter/longer than good', () => {
    const base = review(review(undefined, 4, 0), 4, 1);
    assert.ok(review(base, 3, 7).interval < review(base, 4, 7).interval);
    assert.ok(review(base, 5, 7).interval > review(base, 4, 7).interval);
  });

  it('knows what is due and how well a card is known', () => {
    const card = review(undefined, 4, 10);
    assert.equal(isDue(undefined, 10), true);
    assert.equal(isDue(card, 10), false);
    assert.equal(isDue(card, 11), true);
    assert.equal(masteryLevel(masteryScore(undefined)), 'new');
    assert.equal(masteryLevel(masteryScore(review(undefined, 1, 0))), 'weak');
    assert.equal(masteryLevel(masteryScore(review(undefined, 4, 0))), 'learning', 'one good answer is not "weak"');
    let strong = review(undefined, 5, 0);
    for (let d = 1; d < 5; d++) strong = review(strong, 5, strong.due);
    assert.equal(masteryLevel(masteryScore(strong)), 'strong');
  });

  it('counts local calendar days', () => {
    assert.equal(dayNumber(new Date(2026, 0, 2)) - dayNumber(new Date(2026, 0, 1)), 1);
  });
});

describe('findBlank', () => {
  it('blanks the first number or number word', () => {
    assert.deepEqual(findBlank('Term of five years'), { before: 'Term of ', answer: 'five', after: ' years' });
    assert.equal(findBlank('Election held within 60 days')?.answer, '60');
    assert.equal(findBlank('Citizen of India'), null);
  });
  it('skips article numbers', () => {
    assert.equal(findBlank('Article 67'), null);
    assert.equal(findBlank('Under Article 67 the term is five years')?.answer, 'five');
  });
});

describe('buildFlashcards', () => {
  const cards = buildFlashcards(map);
  it('makes branch, note and blank cards from the map text only', () => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    assert.deepEqual(byId.get('Article 67')!.back, ['Term of five years', 'Resignation to the President']);
    assert.match(byId.get('Article 67')!.front, /2 points under “Article 67”/);
    assert.equal(byId.get('Term of five years')!.kind, 'blank');
    assert.equal(byId.get('Term of five years')!.front, `Term of ${BLANK} years`);
    assert.deepEqual(byId.get('Eligible')!.context, ['Article 66']);
    assert.equal(byId.has('Citizen of India'), false, 'plain leaves are covered by their parent card');
  });
});

describe('generateQuestions', () => {
  const qs = generateQuestions(map, { seed: 7, count: 50 });
  it('asks which topic a point belongs to, with the right answer among the options', () => {
    const q = qs.find((x) => x.id === 'belongs:Term of five years')!;
    assert.equal(q.options[q.answer], 'Article 67');
    assert.ok(q.options.length >= 3 && new Set(q.options).size === q.options.length);
  });
  it('makes number blanks with distinct wrong options', () => {
    const q = qs.find((x) => x.id === 'blank:Election held within 60 days')!;
    assert.equal(q.options[q.answer], '60');
    assert.equal(new Set(q.options).size, q.options.length);
    assert.ok(q.prompt.includes(BLANK));
  });
  it('asks "Which Article deals with …?" when the options are Articles', () => {
    assert.match(qs.find((x) => x.id === 'belongs:Term of five years')!.prompt, /^Which Article deals with “Term of five years”\?$/);
  });
  it('skips questions whose text contains the answer', () => {
    const giveaway = [n('Nutrition', [n('Autotrophic Nutrition'), n('Heterotrophic Nutrition')]), n('Respiration', [n('Aerobic')]), n('Excretion', [n('Kidney')])];
    const ids = generateQuestions(giveaway, { seed: 1, count: 50 }).map((q) => q.id);
    assert.ok(!ids.includes('belongs:Autotrophic Nutrition'));
    assert.ok(ids.includes('belongs:Aerobic'));
  });
  it('is deterministic for a seed and respects the count', () => {
    assert.deepEqual(generateQuestions(map, { seed: 7, count: 50 }), qs);
    assert.equal(generateQuestions(map, { seed: 1, count: 3 }).length, 3);
    assert.notDeepEqual(generateQuestions(map, { seed: 2, count: 50 }).map((q) => q.id), qs.map((q) => q.id));
  });
  it('never offers a node’s own ancestor as a wrong option', () => {
    const q = qs.find((x) => x.id === 'belongs:Citizen of India');
    if (q) assert.ok(!q.options.some((o, i) => i !== q.answer && o === 'Article 66'));
  });
  it('produces numbers in [0, 1) from the seeded generator', () => {
    const r = seededRandom(3);
    for (let i = 0; i < 100; i++) {
      const v = r();
      assert.ok(v >= 0 && v < 1);
    }
  });
});

describe('presentationOrder', () => {
  it('walks each topic depth-first', () => {
    assert.deepEqual(
      presentationOrder(map).slice(0, 6).map((s) => s.id),
      ['Article 66', 'Elected by members of both Houses', 'Eligible', 'Citizen of India', 'Completed the age of 35 years', 'Article 67'],
    );
    assert.equal(presentationOrder(map).find((s) => s.id === 'Citizen of India')!.topicId, 'Article 66');
  });
});
