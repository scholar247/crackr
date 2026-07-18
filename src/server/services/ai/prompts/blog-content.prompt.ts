import type { BlogType } from '@/types';

export const BLOG_CONTENT_PROMPT_VERSION = 'v1';

export interface BlogContentParams {
  title: string;
  topic: string;
  examName: string;
  subjectName: string;
  articleType: BlogType;
  primaryKeyword: string;
  angleHint?: string;
}

/** Length/structure guidance per article type — keeps e.g. Cheat Sheet tight and Theory comprehensive. */
const ARTICLE_TYPE_GUIDANCE: Record<BlogType, string> = {
  THEORY: 'A comprehensive theory article (1200-1800 words) covering concepts, derivations/examples, and worked problems.',
  QUICK_LEARN: 'A concise quick-reference article (400-700 words) hitting only the essential points.',
  SHORT_NOTE: 'A short revision note (300-600 words) — crisp, bullet-driven summary, no fluff.',
  FORMULA_SHEET: 'A formula sheet (400-900 words) — every relevant formula with a one-line usage note, grouped logically. Use tables where helpful.',
  REVISION_NOTE: 'A last-minute revision note (500-900 words) — high-density recap of everything a student must remember before the exam.',
  FAQ: 'A FAQ-style article (600-1000 words) structured as question/answer pairs covering the most commonly asked doubts on this topic.',
  TRICKS: 'A "tricks and shortcuts" article (500-900 words) — exam-specific shortcuts, elimination techniques, and time-saving methods, each with a worked example.',
  CHEAT_SHEET: 'A cheat sheet (400-800 words) — the tightest possible reference: key formulas, definitions, and gotchas, formatted for fast scanning.',
};

/** Blog Generator stage — full markdown body + FAQ + internal-link hints. */
export function buildBlogContentPrompt(p: BlogContentParams): string {
  const guidance = ARTICLE_TYPE_GUIDANCE[p.articleType] ?? ARTICLE_TYPE_GUIDANCE.THEORY;
  return `You are a subject-matter expert writing educational content for Indian competitive-exam students.

Title: ${p.title}
Topic: ${p.topic}
Exam: ${p.examName || 'General'}
Subject: ${p.subjectName || 'General'}
Primary keyword: ${p.primaryKeyword}
${p.angleHint ? `Angle to focus on: ${p.angleHint}\n` : ''}
Article type: ${guidance}

Write the article in Markdown with:
- Exactly one H1 (matching or close to the title)
- Logical H2/H3 heading structure (no level-skipping)
- The primary keyword used naturally in the H1 and within the first 100 words
- A "Frequently Asked Questions" H2 section at the end with 3-5 Q&A pairs relevant to this exact topic
- Suggested internal links: end the article with an HTML comment listing 2-4 related topics a link could point to, e.g. <!-- internal-links: Quadratic Equations, Permutations and Combinations -->

Do not include any commentary outside the article itself — respond with the Markdown only.`;
}
