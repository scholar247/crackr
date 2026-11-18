// Study material derived from a mind map: flashcards, practice questions and the order of
// a step-by-step presentation. Everything comes from the map's own text — nothing is
// invented — and generation is deterministic (seeded) so it is testable.

import type { MindMapTreeNode } from './mind-maps';

export interface Flashcard {
  /** The node the card reviews (progress is stored per node). */
  id: string;
  kind: 'branch' | 'note' | 'blank';
  /** Breadcrumb above the prompt, e.g. "Article 67". */
  context: string[];
  front: string;
  /** Lines shown on the back. */
  back: string[];
}

export interface StudyQuestion {
  id: string;
  /** Node the answer is about (its progress is updated). */
  nodeId: string;
  kind: 'belongs' | 'blank';
  prompt: string;
  options: string[];
  answer: number;
  /** Shown after answering. */
  explanation: string;
}

// ── Fill-in-the-blank ──────────────────────────────────────────────────────────

const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/**
 * A blankable token in a fact: the first number (digits or a number word). Facts such as
 * "hold office for a term of five years" or "election held within 60 days" become cloze
 * prompts. Returns null when the text has nothing suitable.
 */
export function findBlank(text: string): { before: string; answer: string; after: string } | null {
  const re = new RegExp(`\\b(\\d+(?:\\.\\d+)?|${NUMBER_WORDS.join('|')})\\b`, 'i');
  const m = re.exec(text);
  if (!m || m.index === undefined) return null;
  // Skip numbers that are part of a name like "Article 67" — that's a label, not a fact.
  if (/\b(article|section|schedule|part|chapter|class)\s*$/i.test(text.slice(0, m.index))) {
    const rest = findBlank(text.slice(m.index + m[0].length));
    if (!rest) return null;
    return { before: text.slice(0, m.index + m[0].length) + rest.before, answer: rest.answer, after: rest.after };
  }
  return { before: text.slice(0, m.index), answer: m[0], after: text.slice(m.index + m[0].length) };
}

export const BLANK = '_____';

// ── Flashcards ─────────────────────────────────────────────────────────────────

/**
 * One card per node that has something to recall:
 * • a node with children → "Recall the N points under X" (back: the children);
 * • a node with a description → its label (back: the description);
 * • a fact containing a number → the fact with the number blanked.
 * Leaves with none of these are covered by their parent's card.
 */
export function buildFlashcards(roots: MindMapTreeNode[]): Flashcard[] {
  const cards: Flashcard[] = [];
  const visit = (nodes: MindMapTreeNode[], path: string[]) => {
    for (const n of nodes) {
      if (n.children.length > 0) {
        const count = n.children.length;
        cards.push({ id: n.id, kind: 'branch', context: path, front: `Recall the ${count} point${count === 1 ? '' : 's'} under “${n.label}”`, back: n.children.map((c) => c.label) });
      } else if (n.description) {
        cards.push({ id: n.id, kind: 'note', context: path, front: n.label, back: [n.description] });
      } else {
        const blank = findBlank(n.label);
        if (blank) cards.push({ id: n.id, kind: 'blank', context: path, front: `${blank.before}${BLANK}${blank.after}`, back: [blank.answer, n.label] });
      }
      visit(n.children, [...path, n.label]);
    }
  };
  visit(roots, []);
  return cards;
}

// ── Practice questions ─────────────────────────────────────────────────────────

/** Small seeded PRNG (mulberry32) so a given seed always yields the same test. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const short = (s: string, max = 90) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** Plausible wrong numbers for a blank: other numbers in the map first, then neighbours. */
function numberDistractors(answer: string, pool: string[], rand: () => number): string[] {
  const lower = answer.toLowerCase();
  const word = NUMBER_WORDS.indexOf(lower);
  const out = new Set<string>();
  if (word >= 0) {
    for (const d of [-1, 1, -2, 2, 3]) if (NUMBER_WORDS[word + d]) out.add(NUMBER_WORDS[word + d]);
  } else {
    const n = Number(answer);
    for (const p of shuffle(pool, rand)) if (/^\d+$/.test(p) && p !== answer) out.add(p);
    for (const v of [n * 2, n + 5, n - 5, n + 10, Math.round(n / 2)]) if (v > 0 && String(v) !== answer) out.add(String(v));
  }
  out.delete(lower);
  out.delete(answer);
  return shuffle([...out], rand).slice(0, 3);
}

/**
 * A practice test from the map's structure and facts:
 * • "Under which topic does “X” come?" — the right parent among others at the same level;
 * • fill in the blank — numbers in facts, with nearby/other numbers as wrong options.
 * `count` questions at most, mixed, in seeded random order.
 */
export function generateQuestions(roots: MindMapTreeNode[], opts: { seed: number; count: number }): StudyQuestion[] {
  const rand = seededRandom(opts.seed);
  const parentsByDepth = new Map<number, MindMapTreeNode[]>();
  const items: { node: MindMapTreeNode; parent: MindMapTreeNode | null; depth: number; ancestors: Set<string> }[] = [];
  const visit = (nodes: MindMapTreeNode[], parent: MindMapTreeNode | null, depth: number, ancestors: Set<string>) => {
    for (const n of nodes) {
      items.push({ node: n, parent, depth, ancestors });
      if (n.children.length > 0) parentsByDepth.set(depth, [...(parentsByDepth.get(depth) ?? []), n]);
      visit(n.children, n, depth + 1, new Set([...ancestors, n.id]));
    }
  };
  visit(roots, null, 1, new Set());
  const numbersInMap = items.map((i) => findBlank(i.node.label)?.answer).filter((x): x is string => !!x);

  const questions: StudyQuestion[] = [];
  for (const { node, parent, depth, ancestors } of items) {
    // Belongs-to: needs at least two other parents at the parent's level, and is skipped when
    // the point's own text gives the answer away ("Heterotrophic Nutrition" → Nutrition).
    if (parent && !node.label.toLowerCase().includes(parent.label.toLowerCase())) {
      const others = (parentsByDepth.get(depth - 1) ?? []).filter((p) => p.id !== parent.id && !ancestors.has(p.id) && p.label !== parent.label);
      if (others.length >= 2) {
        const options = shuffle([parent.label, ...shuffle(others, rand).slice(0, 3).map((o) => o.label)], rand);
        // "Which Article deals with …?" when every option is an Article (polity maps).
        const kindWord = options.every((o) => /^article\s/i.test(o)) ? 'Article' : null;
        questions.push({
          id: `belongs:${node.id}`,
          nodeId: node.id,
          kind: 'belongs',
          prompt: kindWord ? `Which ${kindWord} deals with “${short(node.label, 140)}”?` : `Under which topic does “${short(node.label, 140)}” come?`,
          options: options.map((o) => short(o)),
          answer: options.indexOf(parent.label),
          explanation: `“${short(node.label, 120)}” is under ${parent.label}.`,
        });
      }
    }
    // Fill in the blank (leaf facts only, so the label is a statement).
    const blank = node.children.length === 0 ? findBlank(node.label) : null;
    if (blank) {
      const wrong = numberDistractors(blank.answer, numbersInMap, rand);
      if (wrong.length >= 2) {
        const options = shuffle([blank.answer, ...wrong], rand);
        questions.push({
          id: `blank:${node.id}`,
          nodeId: node.id,
          kind: 'blank',
          prompt: `${blank.before}${BLANK}${blank.after}`,
          options,
          answer: options.indexOf(blank.answer),
          explanation: node.label,
        });
      }
    }
  }
  return shuffle(questions, rand).slice(0, opts.count);
}

// ── Presentation ───────────────────────────────────────────────────────────────

/**
 * Step order for "present step by step": each main topic, then its branch revealed one node
 * at a time (depth-first, the order you'd explain it).
 */
export function presentationOrder(roots: MindMapTreeNode[]): { id: string; topicId: string }[] {
  const out: { id: string; topicId: string }[] = [];
  const visit = (n: MindMapTreeNode, topicId: string) => {
    out.push({ id: n.id, topicId });
    for (const c of n.children) visit(c, topicId);
  };
  for (const r of roots) visit(r, r.id);
  return out;
}
