#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — Aptitude & Reasoning template
============================================================
For quantitative aptitude, logical reasoning, data interpretation, puzzles, etc.
Always theory-only — no code section (this template never emits one).

USAGE:
  python generate_blogs_aptitude.py --subject-id <uuid> --exam-id <uuid>
  python generate_blogs_aptitude.py --topic-name "Blood Relations" --count 6
"""

from blog_common import build_arg_parser, run

TEMPLATE_TYPE = "aptitude"

BASE_TEMPLATE = """\
You are an expert Aptitude & Reasoning Trainer and SEO Content Specialist.

Create a COMPLETE aptitude / logical reasoning educational article.

Topic: {TOPIC}
Exam: {EXAM}
Subject: {SUBJECT}
Difficulty: {DIFFICULTY}
Language: English

Generate in Markdown, following this structure EXACTLY:

# {TOPIC}

## Introduction

(2-3 paragraphs: what this type of problem is, why it appears in exams, what the article covers)

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
| Exam Frequency | Very High / High / Medium / Low |
| Time per Question (target) | ... seconds |
| Marks Weightage | ... |
| Key Skill Required | ... |

---

## Concept Explanation

Explain the concept clearly for a first-time learner. Avoid jargon; use everyday language.

---

## Types / Categories

If this topic has sub-types, explain each with a brief example:

### Type 1 — Name
Brief description + mini example.

### Type 2 — Name
(Continue for all types)

---

## Key Formulas & Shortcuts

List every formula and shortcut:

**Formula / Rule name:** `formula here`
- Variables: explain each
- Example: quick numerical illustration

---

## Step-by-Step Approach

Provide a universal approach (checklist) for solving any problem of this type:

1. Step 1
2. Step 2
3. Step 3
...

---

## Solved Examples

### Basic Level
Problem statement.

**Solution:**
(Step-by-step with each operation shown)

**Answer:** X

### Intermediate Level
Problem statement.

**Solution:**
(Step-by-step)

### Advanced / Exam-Level
Problem statement.

**Solution:**
(Step-by-step, showing shortcut where applicable)

---

## Speed Tricks

List 4-6 tricks that let students solve problems 2-3× faster.
Each trick: **Trick name** → description → example.

---

## Common Mistakes

List 4-6 mistakes with "Wrong approach → Correct approach" format.

---

## Practice Problems — Unsolved

### Easy (5 problems)
(Just the question; student solves independently)

### Medium (5 problems)

### Hard (3 problems)

---

## Multiple Choice Questions (MCQs)

10 MCQs with options, answer, and explanation.

---

## Exam-Style Questions

> *Original questions in the style of {EXAM} — not actual previous-year questions.*

5 questions with full solutions.

---

## Cheat Sheet

(Everything needed for 1-minute revision before exam)

---

## Summary

(Under 120 words)

---

## FAQs

At least 8 FAQs with answers.

---

## Related Topics

8+ related aptitude/reasoning topics with one-line descriptions.

==========================
WRITING STYLE
==========================
- Extremely clear, simple English
- Always show the short method AND the long method for each example
- Tables for comparisons, formulas
- Emphasis on speed and accuracy
- Do NOT include any code snippets — this is an aptitude theory/practice article

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
    parser = build_arg_parser(TEMPLATE_TYPE, description="Scholar247 Blog Generator — Aptitude & Reasoning template")
    args = parser.parse_args()
    run(args, TEMPLATE_TYPE, build_prompt)


if __name__ == "__main__":
    main()
