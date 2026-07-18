#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — Mathematics template
===================================================
For calculus, algebra, geometry, statistics, probability, number theory, etc.
Always theory-only — no code section (this template never emits one).

USAGE:
  python generate_blogs_math.py --subject-id <uuid> --exam-id <uuid>
  python generate_blogs_math.py --topic-name "Quadratic Equations" --count 6
"""

from blog_common import build_arg_parser, run

TEMPLATE_TYPE = "math"

BASE_TEMPLATE = """\
You are an expert Mathematics Educator and SEO Content Specialist.

Create a COMPLETE mathematics educational article.

Topic: {TOPIC}
Exam: {EXAM}
Subject: {SUBJECT}
Difficulty: {DIFFICULTY}
Language: English

Generate in Markdown, following this structure EXACTLY:

# {TOPIC}

## Introduction

(2-3 paragraphs: what this concept is, why it matters for exams, what the article covers)

---

## Quick Summary

- Key point 1
- Key point 2
- Key point 3
- Key point 4
- Key point 5

---

## Key Highlights

| Category | Details |
|---|---|
| Difficulty | {DIFFICULTY} |
| Exam Weight | High / Medium / Low |
| Formula Count | ... |
| Typical Question Types | ... |
| Common Traps | ... |

---

## Prerequisites

List 3-5 concepts the student should know before this topic.

---

## Definition & Concept

**Simple definition:** (1-2 sentences, beginner-friendly)

**Formal definition:** (precise mathematical statement)

---

## Core Formula(s)

For EACH formula:
- State the formula clearly using standard notation
- Define every variable / symbol
- State the conditions / constraints where it applies

---

## Derivation / Proof

Walk through the derivation step-by-step (skip if elementary).
Use numbered steps. Highlight the key insight at each step.

---

## Worked Examples

### Example 1 — Basic
(Show full working, not just the answer)

### Example 2 — Intermediate
(One more step of difficulty)

### Example 3 — Advanced / Exam-Level
(Tricky variant that appears in competitive exams)

---

## Shortcuts & Tricks

List every useful shortcut, mental math trick, or pattern recognition technique.
Format: **Trick name**: explanation + mini-example.

---

## Common Mistakes

List 4-6 mistakes students make, with the correct approach for each.

---

## Special Cases & Edge Cases

- Edge case 1
- Edge case 2

---

## Comparison with Related Formulas / Concepts

| Feature | {TOPIC} | Related Concept 1 | Related Concept 2 |
|---|---|---|---|
| Formula | | | |
| When to use | | | |
| Complexity | | | |

---

## Multiple Choice Questions (MCQs)

Generate 10 MCQs, each with:
- Question
- (A) Option A
- (B) Option B
- (C) Option C
- (D) Option D
- **Answer:** (X)
- **Explanation:** Why this is correct and why others are wrong.

---

## Exam-Style Practice Problems

> *Original practice problems in the style of {EXAM} — not actual previous-year questions.*

5 problems with full step-by-step solutions.

---

## Cheat Sheet

(One-minute revision: all formulas, key identities, shortcut rules — bullet format)

---

## Summary

(Under 120 words)

---

## FAQs

Generate at least 8 FAQs with detailed answers.

---

## Related Topics

List 8+ related topics with one-line descriptions.

---

## References

Standard textbooks and official syllabus references.

==========================
WRITING STYLE
==========================
- Use LaTeX-style notation inside backticks for formulas (e.g., `a² + b² = c²`)
- Short paragraphs; use tables and bullet points generously
- Every worked example must show ALL intermediate steps
- Do NOT skip steps — this is for students who are learning
- Do NOT include any code snippets — this is a mathematics theory article

Now generate the COMPLETE article for: {TOPIC}
"""


def build_prompt(topic: str, exam: str, subject: str, difficulty: str, angle: str) -> str:
    prompt = BASE_TEMPLATE.format(
        TOPIC=topic, EXAM=exam or "competitive exams", SUBJECT=subject or topic, DIFFICULTY=difficulty,
    )
    if angle:
        prompt += f"\n\nIMPORTANT — This article's specific focus / angle:\n{angle}\nShape the content around this angle throughout."
    return prompt


def main() -> None:
    parser = build_arg_parser(TEMPLATE_TYPE, description="Scholar247 Blog Generator — Mathematics template")
    args = parser.parse_args()
    run(args, TEMPLATE_TYPE, build_prompt)


if __name__ == "__main__":
    main()
