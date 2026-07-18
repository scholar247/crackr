#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — Coding / CS / GATE template
=========================================================
For programming, algorithms, data structures, OS, DBMS, networks, and any
other computer-science / GATE-CSE topic.

By default articles are THEORY-ONLY (no code). Pass --code to also generate
a "Code Implementation" section with Python/Java/C++/JavaScript/Go snippets.
This is the only template script with a --code flag — math/aptitude/english/
general topics never need one.

USAGE:
  python generate_blogs_coding.py --subject-id <uuid> --exam-id <uuid>
  python generate_blogs_coding.py --topic-name "Binary Search Trees" --code
  python generate_blogs_coding.py --demo                    # no Ollama needed
"""

import sys
from pathlib import Path

from blog_common import (
    build_arg_parser, run, ollama_generate, markdown_to_html, build_blog_payload,
    post_blog, print_step, print_ok, print_err,
)

TEMPLATE_TYPE = "coding"

CODE_SECTION = """\
## Code Implementation

### Python
```python
# Well-commented Python implementation
```

### Java
```java
// Well-commented Java implementation
```

### C++
```cpp
// Well-commented C++ implementation
```

### JavaScript
```javascript
// Well-commented JavaScript implementation
```

### Go
```go
// Well-commented Go implementation
```

---

## Code Explanation

Explain the key logic (not line by line, but the important parts).

---

"""

CODE_STYLE_NOTE_ON = "- Include real, working code — not pseudocode\n"
CODE_STYLE_NOTE_OFF = (
    "- Do NOT include any code snippets — this is a theory-only article; "
    "explain the logic, steps, and reasoning in plain English instead\n"
)

BASE_TEMPLATE = """\
You are an expert Educational Content Writer, Technical Trainer, Competitive Exam Mentor, and SEO Content Specialist.

Your task is to create a COMPLETE educational article about the given topic.

The article is intended for:
- Students preparing for competitive exams
- College placements and technical interviews
- Beginners learning the topic

==========================
INPUT
==========================

Topic: {TOPIC}
Exam: {EXAM}
Subject: {SUBJECT}
Category: {CATEGORY}
Difficulty: {DIFFICULTY}
Language: English

==========================
OUTPUT FORMAT
==========================

Generate the article using Markdown. Follow this structure EXACTLY:

# {TOPIC}

## Introduction

Write an engaging introduction (2-3 paragraphs).
First paragraph answers: "What is this topic?"
Second paragraph explains: "Why should students learn this?"
Third paragraph gives the scope of the article.

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
| Interview Frequency | High / Medium / Low |
| Exam Importance | High / Medium / Low |
| Common Uses | ... |
| Advantages | ... |
| Disadvantages | ... |

---

## Definition

**Simple definition:** (1-2 sentences for a beginner)

**Technical definition:** (precise, formal definition)

---

## Why Is It Needed?

Explain the problem it solves. What was the challenge before this concept existed?

---

## Real-Life Analogy

Give at least one relatable real-world analogy to build intuition.

---

## How It Works — Step by Step

Explain the concept step by step with numbered steps and sub-headings.
Include ASCII diagrams where helpful.

---

## Visual Representation (ASCII)

```
Provide an ASCII diagram illustrating the concept.
```

---

## Examples

### Beginner Example
(Simple, easy-to-follow example with explanation)

### Interview-Level Example
(More complex example, closer to what an interviewer would ask)

---

{CODE_SECTION}## Formula / Mathematical Notation

(If applicable — display formulas clearly, explain each variable, give example calculation.)

---

## Time Complexity

| Case | Complexity | Reason |
|---|---|---|
| Best Case | O(?) | ... |
| Average Case | O(?) | ... |
| Worst Case | O(?) | ... |

---

## Space Complexity

Explain space requirements with justification.

---

## Advantages

- Advantage 1
- Advantage 2
- Advantage 3

---

## Disadvantages

- Disadvantage 1
- Disadvantage 2

---

## Common Mistakes

List 3-5 mistakes that students commonly make, with explanations.

---

## Interview Questions

### Easy (5 questions with answers)

**Q1.** Question text?
**A:** Answer.

### Medium (5 questions with answers)

**Q1.** Question text?
**A:** Answer.

### Hard (5 questions with answers)

**Q1.** Question text?
**A:** Answer.

---

## Multiple Choice Questions (MCQs)

Generate 10 MCQs, each with:
- Question
- (A) Option A
- (B) Option B
- (C) Option C
- (D) Option D
- **Answer:** (X)
- **Explanation:** Why this is correct.

---

## Exam-Style Practice Questions

(5 questions in the style of {EXAM} exam — do NOT claim they are actual previous-year questions)

---

## Comparison with Similar Concepts

| Feature | {TOPIC} | Alternative 1 | Alternative 2 |
|---|---|---|---|
| Time complexity | | | |
| Space complexity | | | |
| Best use case | | | |

---

## Best Practices

- Practice tip 1
- Practice tip 2

---

## When to Use

Explain scenarios where this is the right choice.

---

## When NOT to Use

Explain scenarios where a different approach is better.

---

## Cheat Sheet

(One-minute revision: key points, formulas, complexity — all in bullet points)

---

## Summary

(Under 150 words — summarize the entire article)

---

## FAQs

**Q1.** ...?
**A:** ...

(Generate at least 8 FAQs)

---

## Related Topics

1. **Topic name** — one-line description
(List at least 8 related topics)

---

## Practice Exercises

### Easy
1. Exercise 1

### Medium
1. Exercise 1

### Hard
1. Exercise 1

---

## References

- Reference 1 (book / standard / official doc)
- Reference 2

==========================
WRITING STYLE
==========================

- Use simple English; explain technical terms on first use
- Keep paragraphs short (3-4 sentences max)
- Use tables wherever comparisons exist
{CODE_STYLE_NOTE}- Do NOT invent facts; if uncertain, explicitly state assumptions
- Focus on interview and exam preparation
- Make the article comprehensive, accurate, and SEO-friendly

Now generate the COMPLETE article for: {TOPIC}
"""


def build_prompt(topic: str, exam: str, subject: str, difficulty: str, angle: str, args) -> str:
    prompt = BASE_TEMPLATE.format(
        TOPIC=topic, EXAM=exam or "competitive exams", SUBJECT=subject or topic, CATEGORY=subject or topic,
        DIFFICULTY=difficulty,
        CODE_SECTION=CODE_SECTION if args.code else "",
        CODE_STYLE_NOTE=CODE_STYLE_NOTE_ON if args.code else CODE_STYLE_NOTE_OFF,
    )
    if angle:
        prompt += f"\n\nIMPORTANT — This article's specific focus / angle:\n{angle}\nShape the content around this angle throughout."
    return prompt


# ─── Demo article (pre-written, no Ollama needed) ──────────────────────────

DEMO_ARTICLE_METADATA = {
    "title": "Binary Search Algorithm: Complete Guide for GATE, Interviews & Placements",
    "seoTitle": "Binary Search Algorithm: GATE Guide & Interview Prep",
    "metaDescription": "Master Binary Search with step-by-step explanation, code in 5 languages, GATE MCQs, time complexity O(log n), and interview questions with answers.",
    "slug": "binary-search-algorithm-complete-guide",
    "primaryKeyword": "binary search algorithm",
    "keywords": ["binary search", "search algorithm", "GATE algorithms", "O(log n)", "divide and conquer"],
    "tags": ["algorithms", "searching", "GATE", "interview-prep", "data-structures"],
}

DEMO_ARTICLE_CONTENT = """\
# Binary Search Algorithm

## Introduction

Binary Search is a fundamental search algorithm that finds a target value within a **sorted array** by repeatedly dividing the search space in half. Instead of checking every element one by one, it eliminates half of the remaining candidates with each comparison — making it dramatically faster than Linear Search for large datasets.

Every computer science student, GATE aspirant, and software engineer must master Binary Search. It is one of the most frequently asked algorithms in technical interviews at companies like Google, Amazon, and Microsoft.

This guide covers the algorithm's intuition, step-by-step working, code, time/space complexity, and GATE-style MCQs.

---

## Quick Summary

- Binary Search works **only on sorted arrays**
- It achieves **O(log n)** time complexity by halving the search space each step
- Two variants exist: **iterative** (O(1) space) and **recursive** (O(log n) stack space)
- GATE frequently tests off-by-one errors and boundary conditions

---

## Code Implementation

### Python
```python
def binary_search(arr: list, target: int) -> int:
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

---

## Time Complexity

| Case | Complexity | Reason |
|---|---|---|
| Best Case | O(1) | Target is at the middle on the first check |
| Average Case | O(log n) | Target found after roughly log n steps |
| Worst Case | O(log n) | Target is at either end or not present |

---

## Summary

Binary Search is a divide-and-conquer algorithm that finds a target in a sorted array in O(log n) time by repeatedly halving the search space.
"""


def run_demo(args) -> None:
    print_step("📖", "Saving pre-written demo article: Binary Search")
    html_content = markdown_to_html(DEMO_ARTICLE_CONTENT)

    if args.output_dir:
        out_path = Path(args.output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / "binary-search-algorithm.md").write_text(DEMO_ARTICLE_CONTENT, encoding="utf-8")
        print_ok(f"Saved markdown → {out_path}/binary-search-algorithm.md")

    if args.dry_run:
        print_ok("Dry run — skipping API POST")
        return

    payload = build_blog_payload(
        DEMO_ARTICLE_METADATA, html_content,
        args.exam_id or None, args.subject_id or None, args.topic_id or None,
    )
    print_step("🚀", "Posting demo article to API…")
    result = post_blog(args.base_url, args.api_key, payload)
    if result:
        print_ok(f"Demo blog created: id={result.get('id')}  slug={result.get('slug')}")
    else:
        print_err("Failed to save demo article")


def main() -> None:
    parser = build_arg_parser(
        TEMPLATE_TYPE,
        description="Scholar247 Blog Generator — Coding / CS / GATE template",
        extra_epilog=(
            "        ─── Code section ──────────────────────────────────────────────────────────\n"
            "          --code          Include a multi-language Code Implementation section\n"
            "                          (default: off — theory-only article, no code)\n"
        ),
    )
    parser.add_argument("--code", action="store_true",
                         help="Include the Code Implementation section (default: theory-only, no code)")
    parser.add_argument("--demo", action="store_true",
                         help="Save pre-written Binary Search demo article (no Ollama needed)")
    args = parser.parse_args()

    if not args.api_key:
        from blog_common import LOCAL_SEED_KEY, PROD_SEED_KEY
        args.api_key = LOCAL_SEED_KEY if "localhost" in args.base_url else PROD_SEED_KEY

    if args.demo:
        run_demo(args)
        return

    run(args, TEMPLATE_TYPE, lambda t, e, s, d, a: build_prompt(t, e, s, d, a, args))


if __name__ == "__main__":
    main()
