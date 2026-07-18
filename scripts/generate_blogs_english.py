#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — English / Verbal Ability template
=================================================================
For grammar, vocabulary, comprehension, sentence correction, para jumbles, etc.
Always theory-only — no code section (this template never emits one).

USAGE:
  python generate_blogs_english.py --subject-id <uuid> --exam-id <uuid>
  python generate_blogs_english.py --topic-name "Reading Comprehension" --count 6
"""

from blog_common import build_arg_parser, run

TEMPLATE_TYPE = "english"

BASE_TEMPLATE = """\
You are an expert English Language Educator and SEO Content Specialist.

Create a COMPLETE English / Verbal Ability educational article.

Topic: {TOPIC}
Exam: {EXAM}
Subject: {SUBJECT}
Difficulty: {DIFFICULTY}
Language: English

Generate in Markdown, following this structure EXACTLY:

# {TOPIC}

## Introduction

(2-3 paragraphs: what this concept is, why it matters for competitive exams, scope of this article)

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
| Exam Frequency | Very High / High / Medium |
| Questions per Paper (typical) | ... |
| Key Skill | ... |

---

## Definition & Overview

Clear, precise definition. Include etymology if helpful.

---

## Types / Classifications

Explain every sub-type with examples:

### Type 1 — Name
Definition + 2-3 illustrative examples.

### Type 2 — Name
(Continue)

---

## Rules & Guidelines

Numbered rules students must memorise:

1. Rule 1 — Explanation + correct example + incorrect example
2. Rule 2
...

---

## Examples in Context

### Basic
(Simple sentence or passage example with explanation)

### Intermediate
(More complex example)

### Advanced / Exam-Level
(Example close to what appears in {EXAM})

---

## Common Errors & How to Avoid Them

| Common Error | Why It's Wrong | Correct Form |
|---|---|---|
| ... | ... | ... |

(At least 6 rows)

---

## Usage Tips for Exam

5-8 practical tips for the exam context.

---

## Fill in the Blanks Practice

10 fill-in-the-blank exercises with answers.

---

## Multiple Choice Questions (MCQs)

10 MCQs with options, answer, and explanation.

---

## Exam-Style Questions

> *Original questions in the style of {EXAM} — not actual previous-year questions.*

5 questions with answers.

---

## Cheat Sheet

(Quick-reference: key rules, common word lists, patterns)

---

## Summary

(Under 120 words)

---

## FAQs

At least 8 FAQs with detailed answers.

---

## Related Topics

8+ related English/verbal topics with one-line descriptions.

## References

Standard grammar books, official exam guides.

==========================
WRITING STYLE
==========================
- Simple, jargon-free explanations
- Every rule must be illustrated with both a CORRECT and INCORRECT example
- Realistic exam-level examples
- Tables for error comparison
- Do NOT include any code snippets — this is an English/verbal theory article

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
    parser = build_arg_parser(TEMPLATE_TYPE, description="Scholar247 Blog Generator — English / Verbal Ability template")
    args = parser.parse_args()
    run(args, TEMPLATE_TYPE, build_prompt)


if __name__ == "__main__":
    main()
