#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — General template
===============================================
Fallback template for any topic that isn't coding, math, aptitude, or English
(e.g. GK, current affairs, exam-pattern/strategy topics). Always theory-only —
no code section (this template never emits one).

USAGE:
  python generate_blogs_general.py --subject-id <uuid> --exam-id <uuid>
  python generate_blogs_general.py --topic-name "Indian Constitution Basics" --count 6
"""

from blog_common import build_arg_parser, run

TEMPLATE_TYPE = "general"

BASE_TEMPLATE = """\
You are an expert Educational Content Writer and SEO Content Specialist.

Create a COMPLETE educational article suitable for competitive exam preparation.

Topic: {TOPIC}
Exam: {EXAM}
Subject: {SUBJECT}
Difficulty: {DIFFICULTY}
Language: English

Generate in Markdown, following this structure EXACTLY:

# {TOPIC}

## Introduction

(2-3 paragraphs: what this topic is, why it matters, what the article covers)

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
| Exam Importance | High / Medium / Low |
| Frequently Tested Aspects | ... |

---

## Core Concepts

Explain the topic from first principles. Use clear headings for each sub-concept.

---

## Detailed Explanation

Deep-dive into the topic. Use examples, analogies, and diagrams (ASCII) wherever helpful.

---

## Examples

### Example 1 — Basic

### Example 2 — Intermediate

### Example 3 — Advanced

---

## Key Points to Remember

(Bulleted list of the most important facts, rules, or patterns)

---

## Comparison with Related Topics

| Feature | {TOPIC} | Related Topic 1 | Related Topic 2 |
|---|---|---|---|
| ... | | | |

---

## Common Mistakes

4-6 mistakes with explanations.

---

## Multiple Choice Questions (MCQs)

10 MCQs with options, answer, and explanation.

---

## Exam-Style Questions

> *Original questions in the style of {EXAM} — not actual previous-year questions.*

5 questions with solutions.

---

## Cheat Sheet

(One-minute revision summary)

---

## Summary

(Under 120 words)

---

## FAQs

At least 8 FAQs with answers.

---

## Related Topics

8+ related topics with one-line descriptions.

## References

Standard references.

==========================
WRITING STYLE
==========================
- Simple English; define technical terms on first use
- Short paragraphs; use bullet points and tables
- Comprehensive yet exam-focused
- Do NOT include any code snippets — this is a theory article

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
    parser = build_arg_parser(TEMPLATE_TYPE, description="Scholar247 Blog Generator — General template")
    args = parser.parse_args()
    run(args, TEMPLATE_TYPE, build_prompt)


if __name__ == "__main__":
    main()
