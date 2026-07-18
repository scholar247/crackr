export const BLOG_POLISH_PROMPT_VERSION = 'v1';
export const QA_MIN_SCORE_DEFAULT = 70;
export const QA_SCORE_KEYS = [
  'seo',
  'readability',
  'factual_consistency',
  'grammar',
  'heading_engagement',
  'human_voice',
] as const;

export interface BlogPolishParams {
  topic: string;
  primaryKeyword: string;
  draftMarkdown: string;
}

/**
 * Editorial QA rewrite pass — ported from the proven scripts/blog_common.py::POLISH_PROMPT.
 * Same marker-based response format so parseBlogPolishResponse can extract both halves reliably.
 */
export function buildBlogPolishPrompt(p: BlogPolishParams): string {
  return `You are a senior human editor and SEO strategist reviewing a draft article before it goes live on an educational blog for competitive-exam students. The draft below was AI-generated and reads like it — your job is to turn it into something a sharp human subject-matter expert would actually publish.

Topic: ${p.topic}
Primary keyword: ${p.primaryKeyword}

===DRAFT_START===
${p.draftMarkdown}
===DRAFT_END===

Rewrite the article to production quality against these checks:

1. HUMAN VOICE — Strip AI tells: no "In today's fast-paced world", "Furthermore", "In conclusion", "It is important to note", repetitive sentence openers, or robotic transitions. Vary sentence length and rhythm the way an expert writing from experience would. Use "you" to talk to the reader where natural.
2. SEO — The primary keyword must appear naturally in the H1, within the first 100 words, and in at least one H2. Keep a clean heading hierarchy (one H1, logical H2/H3 nesting). Never keyword-stuff.
3. ENGAGING HEADINGS — Sharpen generic section headings into specific, inviting ones while keeping their meaning intact (functional headings like "FAQs" or "Summary" can stay as-is).
4. READABILITY — Short paragraphs (2-4 sentences), plain words, active voice, jargon explained on first use.
5. FACTUAL CONSISTENCY — Verify every technical claim (formulas, definitions, worked examples). Fix anything wrong, outdated, or self-contradictory. If unsure, soften to an accurate general statement rather than inventing specifics.
6. GRAMMAR — Fix every grammar, spelling, and punctuation error.
7. Preserve the article's overall Markdown structure — keep all sections, tables, and the internal-links comment intact; only rewrite prose and headings, don't drop required sections.

Respond with EXACTLY this format (no extra commentary outside the markers):

===REVISED_ARTICLE_START===
(the full rewritten article in Markdown)
===REVISED_ARTICLE_END===
===QA_REPORT_START===
{
  "seo": 0-100,
  "readability": 0-100,
  "factual_consistency": 0-100,
  "grammar": 0-100,
  "heading_engagement": 0-100,
  "human_voice": 0-100,
  "issues_found": ["short bullet per notable issue fixed"],
  "notes": "one short paragraph summarizing what changed"
}
===QA_REPORT_END===`;
}

export function parseBlogPolishResponse(
  raw: string,
  fallbackMarkdown: string
): { markdown: string; qaReport: Record<string, unknown> } {
  const articleMatch = raw.match(/===REVISED_ARTICLE_START===\s*([\s\S]*?)\s*===REVISED_ARTICLE_END===/);
  const reportMatch = raw.match(/===QA_REPORT_START===\s*([\s\S]*?)\s*===QA_REPORT_END===/);

  const markdown = articleMatch ? articleMatch[1].trim() : fallbackMarkdown;

  let qaReport: Record<string, unknown> = {};
  if (reportMatch) {
    const cleaned = reportMatch[1].trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    try {
      qaReport = JSON.parse(cleaned);
    } catch {
      qaReport = {};
    }
  }

  return { markdown, qaReport };
}
