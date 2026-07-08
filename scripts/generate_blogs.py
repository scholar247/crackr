#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator
==========================
Generates educational blog articles for competitive exams using a local LLM via Ollama,
then saves them as DRAFT blogs via the Scholar247 seed API.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED MODEL (install via Ollama):

  ollama pull qwen2.5:14b          ← Best for most machines (8 GB VRAM / 16 GB RAM)
  ollama pull qwen2.5:32b          ← Higher quality        (18 GB VRAM / 32 GB RAM)
  ollama pull qwen2.5:72b          ← Best quality          (40 GB VRAM — needs server)
  ollama pull qwen2.5-coder:14b    ← Better for code-heavy CS topics

  Why qwen2.5:14b?
  - Long-context (32 k tokens) — handles the full article template in one pass
  - Strong English writing and structured output
  - Excellent code generation in Python / Java / C++ / JS / Go
  - Fast enough locally (≈5-10 min per article on a modern laptop)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREREQUISITES:

  pip install requests markdown2

  Ensure Ollama is running:  ollama serve

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USAGE:

  # Generate for all topics in a subject (up to --count):
  python generate_blogs.py --subject-id <uuid> --exam-id <uuid>

  # Generate for one specific topic:
  python generate_blogs.py --subject-id <uuid> --topic-id <uuid> --exam-id <uuid>

  # Save markdown files locally too:
  python generate_blogs.py --subject-id <uuid> --output-dir ./generated_blogs

  # Dry run (generate only, don't POST to API):
  python generate_blogs.py --subject-id <uuid> --dry-run

  # Save the pre-written demo article (no Ollama needed):
  python generate_blogs.py --demo

  # Use local dev server:
  python generate_blogs.py --subject-id <uuid> --base-url http://localhost:3000
"""

import argparse
import json
import os
import re
import sys
import time
import textwrap
from pathlib import Path

import requests

try:
    import markdown2
except ImportError:
    print("ERROR: markdown2 not installed.  Run: pip install markdown2")
    sys.exit(1)

# ─── Configuration ─────────────────────────────────────────────────────────────

DEFAULT_BASE_URL   = "https://scholar247.org"
DEFAULT_LOCAL_URL  = "http://localhost:3000"
OLLAMA_BASE        = "http://localhost:11434"
DEFAULT_MODEL      = "qwen2.5:14b"
DEFAULT_COUNT      = 10
REQUEST_TIMEOUT    = 600   # seconds — long-form generation can take several minutes
SLEEP_BETWEEN      = 5     # seconds between API calls to avoid hammering local GPU

PROD_SEED_KEY = "d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f"
LOCAL_SEED_KEY = "f1348450339addd08b0b8fd141ee8890e77f65f256d0c06884f673a4463cbded"

# ─── Article templates ─────────────────────────────────────────────────────────
# Pick with --template coding|math|aptitude|english|general|auto (default: auto)

TEMPLATE_CODING = """\
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

## Formula / Mathematical Notation

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
- Include real, working code — not pseudocode
- Do NOT invent facts; if uncertain, explicitly state assumptions
- Focus on interview and exam preparation
- Make the article comprehensive, accurate, and SEO-friendly

Now generate the COMPLETE article for: {TOPIC}
"""

# ─────────────────────────────────────────────────────────────────────────────

TEMPLATE_MATH = """\
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

Now generate the COMPLETE article for: {TOPIC}
"""

# ─────────────────────────────────────────────────────────────────────────────

TEMPLATE_APTITUDE = """\
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

Now generate the COMPLETE article for: {TOPIC}
"""

# ─────────────────────────────────────────────────────────────────────────────

TEMPLATE_ENGLISH = """\
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

Now generate the COMPLETE article for: {TOPIC}
"""

# ─────────────────────────────────────────────────────────────────────────────

TEMPLATE_GENERAL = """\
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

Now generate the COMPLETE article for: {TOPIC}
"""

# ─── Template registry & auto-detection ────────────────────────────────────────

TEMPLATES: dict[str, str] = {
    "coding":   TEMPLATE_CODING,
    "math":     TEMPLATE_MATH,
    "aptitude": TEMPLATE_APTITUDE,
    "english":  TEMPLATE_ENGLISH,
    "general":  TEMPLATE_GENERAL,
}

_CODING_KW   = {"algorithm", "data structure", "programming", "coding", "computer",
                "software", "operating system", "network", "database", "compiler",
                "graph", "tree", "sorting", "searching", "dynamic programming",
                "system design", "object oriented", "oop"}
_MATH_KW     = {"math", "calculus", "algebra", "geometry", "arithmetic", "statistics",
                "trigonometry", "number theory", "linear algebra", "probability",
                "permutation", "combination", "sequence", "series", "differential",
                "integral", "matrix", "vector"}
_APTITUDE_KW = {"aptitude", "reasoning", "logical", "quantitative", "puzzle",
                "data interpretation", "blood relation", "seating arrangement",
                "direction", "clock", "calendar", "profit", "loss", "percentage",
                "ratio", "proportion", "time", "speed", "distance", "work"}
_ENGLISH_KW  = {"english", "verbal", "comprehension", "grammar", "vocabulary",
                "reading", "writing", "para jumble", "fill in the blank",
                "synonym", "antonym", "idiom", "phrase", "sentence correction"}


def detect_template(subject_name: str, topic_name: str) -> str:
    text = (subject_name + " " + topic_name).lower()
    tokens = set(re.findall(r"[a-z]+", text))
    if tokens & _CODING_KW:   return "coding"
    if tokens & _MATH_KW:     return "math"
    if tokens & _APTITUDE_KW: return "aptitude"
    if tokens & _ENGLISH_KW:  return "english"
    return "general"


METADATA_PROMPT = """\
You are an SEO expert. Generate metadata for an educational blog article.

Topic: {TOPIC}
Exam: {EXAM}
Subject: {SUBJECT}

Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
{{
  "title": "Full article title (60-80 chars)",
  "seoTitle": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Compelling meta description (140-160 chars)",
  "slug": "url-friendly-slug-with-hyphens",
  "primaryKeyword": "main keyword phrase",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3"]
}}
"""

# ─── Demo article (pre-written, no Ollama needed) ──────────────────────────────

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

Every computer science student, GATE aspirant, and software engineer must master Binary Search. It is one of the most frequently asked algorithms in technical interviews at companies like Google, Amazon, and Microsoft. The algorithm appears repeatedly in GATE CSE papers and forms the foundation for more advanced techniques like Binary Search on Answer and Ternary Search.

This guide covers everything: the algorithm's intuition, step-by-step working, code in 5 languages, time/space complexity, GATE-style MCQs, and interview questions from Easy to Hard.

---

## Quick Summary

- Binary Search works **only on sorted arrays**
- It achieves **O(log n)** time complexity by halving the search space each step
- Two variants exist: **iterative** (O(1) space) and **recursive** (O(log n) stack space)
- GATE frequently tests off-by-one errors and boundary conditions
- It is the basis for problems like "Find first/last occurrence", "Search in rotated array", and "Peak element"

---

## Key Highlights

| Category | Details |
|---|---|
| **Difficulty** | Beginner → Intermediate |
| **Interview Frequency** | Very High (top 10 algorithm) |
| **GATE Importance** | High (appears almost every year) |
| **Common Uses** | Dictionary lookup, database indexing, OS page replacement |
| **Advantage** | O(log n) — handles 1 billion elements in ≈30 steps |
| **Disadvantage** | Requires sorted data; not suitable for dynamic datasets |

---

## Definition

**Simple definition:** Binary Search is a way to find a number in a sorted list by always checking the middle element and discarding half the list until the number is found.

**Technical definition:** Binary Search is a search algorithm that operates on a sorted sequence of n elements. It maintains a search interval [low, high] and at each step computes mid = ⌊(low + high) / 2⌋. If A[mid] equals the target, the search terminates. If the target is less than A[mid], the right half is discarded (high = mid − 1); otherwise the left half is discarded (low = mid + 1). The algorithm runs in O(log n) time.

---

## Why Is It Needed?

**The problem with Linear Search:** Scanning a sorted array of 1,000,000,000 (1 billion) elements one by one takes up to 1 billion comparisons in the worst case. At 10⁹ operations per second, that is ~1 second — but this is just for one query.

**Binary Search's solution:** With n = 10⁹ elements, Binary Search needs at most log₂(10⁹) ≈ **30 comparisons**. This is the power of logarithmic algorithms. Every database index (B-tree), dictionary lookup, and IP routing table relies on this principle.

---

## Real-Life Analogy

**Dictionary analogy:** Imagine searching for the word "quantum" in a physical dictionary. You open it at the middle — say the letter "M". Since "q" comes after "m", you discard the first half and open the middle of the second half. You repeat this until you land on "quantum". You would never start from "A" and flip pages one by one — that would be Linear Search.

**Number guessing game:** I think of a number between 1 and 100. You guess 50. I say "too high." You guess 25. I say "too low." You guess 37... This is Binary Search in action.

---

## How It Works — Step by Step

Given: sorted array `A = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]`, target = **23**

**Step 1 — Initialize pointers**
```
low = 0,  high = 10  (indices)
```

**Step 2 — Compute mid and compare**
```
mid = (0 + 10) / 2 = 5
A[5] = 23  →  FOUND! Return index 5.
```

Another example, target = **45**:

| Iteration | low | high | mid | A[mid] | Decision |
|---|---|---|---|---|---|
| 1 | 0 | 10 | 5 | 23 | 45 > 23 → search right |
| 2 | 6 | 10 | 8 | 56 | 45 < 56 → search left |
| 3 | 6 | 7 | 6 | 38 | 45 > 38 → search right |
| 4 | 7 | 7 | 7 | 45 | FOUND at index 7 |

**Key rule:** At each step, either we find the target or we eliminate **at least half** of the remaining elements.

---

## Visual Representation (ASCII)

```
Array: [ 2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91 ]
Index:   0  1  2   3   4   5   6   7   8   9  10

Target = 45

Iteration 1:
  low=0          mid=5          high=10
  |————————————————|————————————————|
  A[5]=23 < 45  →  search right half

Iteration 2:
                  low=6   mid=8  high=10
                    |———————|———————|
                  A[8]=56 > 45  →  search left half

Iteration 3:
                  low=6 mid=6 high=7
                    |——|——|
                  A[6]=38 < 45  →  search right half

Iteration 4:
                         low=7=mid=high
                              |
                          A[7]=45  ✓  FOUND
```

---

## Examples

### Beginner Example

**Problem:** Find whether 7 exists in `[1, 3, 5, 7, 9, 11]`.

```
low=0, high=5
mid=2 → A[2]=5 < 7 → low=3
mid=4 → A[4]=9 > 7 → high=3
mid=3 → A[3]=7 = 7 → FOUND at index 3 ✓
```

### Interview-Level Example

**Problem:** Find the **first occurrence** of 5 in `[1, 3, 5, 5, 5, 8, 10]`.

This requires a modified Binary Search: when `A[mid] == target`, record `mid` as a candidate but continue searching left (`high = mid - 1`) to find earlier occurrences.

```
low=0, high=6
mid=3 → A[3]=5 → candidate=3, high=2
mid=1 → A[1]=3 < 5 → low=2
mid=2 → A[2]=5 → candidate=2, high=1
low > high → STOP. Answer = 2
```

---

## Code Implementation

### Python
```python
def binary_search(arr: list, target: int) -> int:
    \"\"\"Iterative Binary Search. Returns index or -1 if not found.\"\"\"
    low, high = 0, len(arr) - 1

    while low <= high:
        mid = low + (high - low) // 2   # avoids integer overflow

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1               # discard left half
        else:
            high = mid - 1              # discard right half

    return -1  # not found


def binary_search_recursive(arr: list, target: int, low: int, high: int) -> int:
    \"\"\"Recursive Binary Search.\"\"\"
    if low > high:
        return -1

    mid = low + (high - low) // 2

    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search_recursive(arr, target, mid + 1, high)
    else:
        return binary_search_recursive(arr, target, low, mid - 1)


# Example usage
if __name__ == "__main__":
    arr = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]
    print(binary_search(arr, 23))   # Output: 5
    print(binary_search(arr, 100))  # Output: -1
```

### Java
```java
public class BinarySearch {

    // Iterative approach — O(1) space
    public static int binarySearch(int[] arr, int target) {
        int low = 0, high = arr.length - 1;

        while (low <= high) {
            int mid = low + (high - low) / 2;  // prevents overflow

            if (arr[mid] == target)   return mid;
            else if (arr[mid] < target) low = mid + 1;
            else                        high = mid - 1;
        }
        return -1;
    }

    // Recursive approach — O(log n) stack space
    public static int binarySearchRecursive(int[] arr, int target, int low, int high) {
        if (low > high) return -1;
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) return mid;
        if (arr[mid] < target)  return binarySearchRecursive(arr, target, mid + 1, high);
        return binarySearchRecursive(arr, target, low, mid - 1);
    }

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91};
        System.out.println(binarySearch(arr, 23));   // 5
        System.out.println(binarySearch(arr, 100));  // -1
    }
}
```

### C++
```cpp
#include <iostream>
#include <vector>
using namespace std;

// Iterative Binary Search
int binarySearch(vector<int>& arr, int target) {
    int low = 0, high = (int)arr.size() - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;  // safe mid calculation

        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91};
    cout << binarySearch(arr, 23) << endl;   // 5
    cout << binarySearch(arr, 100) << endl;  // -1
    return 0;
}
```

### JavaScript
```javascript
/**
 * Iterative Binary Search
 * @param {number[]} arr - Sorted array
 * @param {number} target - Value to find
 * @returns {number} Index or -1
 */
function binarySearch(arr, target) {
    let low = 0, high = arr.length - 1;

    while (low <= high) {
        const mid = low + Math.floor((high - low) / 2);

        if (arr[mid] === target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

// Example
const arr = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];
console.log(binarySearch(arr, 23));   // 5
console.log(binarySearch(arr, 100));  // -1
```

### Go
```go
package main

import "fmt"

// BinarySearch performs iterative binary search on a sorted slice.
func BinarySearch(arr []int, target int) int {
    low, high := 0, len(arr)-1

    for low <= high {
        mid := low + (high-low)/2  // avoids overflow

        switch {
        case arr[mid] == target:
            return mid
        case arr[mid] < target:
            low = mid + 1
        default:
            high = mid - 1
        }
    }
    return -1
}

func main() {
    arr := []int{2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91}
    fmt.Println(BinarySearch(arr, 23))   // 5
    fmt.Println(BinarySearch(arr, 100))  // -1
}
```

---

## Code Explanation

**Safe mid calculation:** `mid = low + (high - low) / 2` is used instead of `(low + high) / 2` to prevent integer overflow when `low + high` exceeds INT_MAX (important in C++ and Java with large arrays).

**Loop invariant:** The target, if present, always lies within [low, high]. When `low > high`, the interval is empty and the target does not exist.

**Recursive vs Iterative:** Both are O(log n) in time. The recursive version uses O(log n) stack space due to function calls. The iterative version uses O(1) space — prefer it in production code.

---

## Formula / Mathematical Notation

**Number of iterations:** T(n) = T(n/2) + O(1)

Solving by Master Theorem (Case 2): **T(n) = O(log₂ n)**

**Maximum comparisons for n elements:**

```
k = ⌈log₂(n + 1)⌉

Example: n = 1,000,000 → k = ⌈log₂(1,000,001)⌉ = ⌈19.93⌉ = 20 comparisons
```

---

## Time Complexity

| Case | Complexity | Reason |
|---|---|---|
| **Best Case** | O(1) | Target is at the middle on the first check |
| **Average Case** | O(log n) | Target found after roughly log n steps |
| **Worst Case** | O(log n) | Target is at either end or not present |

---

## Space Complexity

| Variant | Space | Reason |
|---|---|---|
| Iterative | **O(1)** | Only three variables: low, high, mid |
| Recursive | **O(log n)** | Call stack grows log n levels deep |

> **GATE tip:** Always use the iterative version when asked for O(1) auxiliary space.

---

## Advantages

- **Extremely fast** — O(log n) handles a billion elements in ~30 steps
- **Simple implementation** — few lines of code, easy to understand
- **Memory efficient** (iterative variant) — O(1) extra space
- **Foundation for advanced algorithms** — Binary Search on Answer, Ternary Search, exponential search

---

## Disadvantages

- **Requires sorted data** — preprocessing cost if data is unsorted
- **Not efficient for small arrays** — overhead vs Linear Search for n < 10
- **Not suitable for linked lists** — O(n) to find mid without random access
- **Off-by-one errors are common** — boundary conditions require careful handling

---

## Common Mistakes

1. **Using `(low + high) / 2`** — can overflow. Always use `low + (high - low) / 2`.
2. **Wrong loop condition** — using `low < high` instead of `low <= high` misses the last element.
3. **Forgetting to update pointers** — writing `high = mid` instead of `high = mid - 1` creates an infinite loop.
4. **Applying to unsorted arrays** — Binary Search gives wrong results on unsorted data.
5. **Off-by-one in boundary** — `low = 0, high = arr.length` (should be `arr.length - 1`).

---

## Interview Questions

### Easy

**Q1.** What is the time complexity of Binary Search?
**A:** O(log n) time, O(1) space (iterative).

**Q2.** When can you NOT use Binary Search?
**A:** When the array is not sorted, or when the data structure doesn't support random access (e.g., linked list).

**Q3.** What happens if Binary Search is applied to an unsorted array?
**A:** The result is undefined — it may return wrong answers or -1 even if the element exists.

**Q4.** Why do we use `mid = low + (high - low) / 2` instead of `(low + high) / 2`?
**A:** To prevent integer overflow when `low + high` exceeds the maximum integer value.

**Q5.** How many comparisons does Binary Search make on an array of 1024 elements in the worst case?
**A:** log₂(1024) = 10 comparisons.

### Medium

**Q1.** Find the first and last occurrence of a target in a sorted array with duplicates.
**A:** Run two modified Binary Searches — one that continues left when `A[mid] == target` (first occurrence), and one that continues right (last occurrence). Time: O(log n).

**Q2.** How would you find a "peak element" (an element greater than its neighbours) efficiently?
**A:** Apply Binary Search: if `A[mid] < A[mid+1]`, a peak lies in the right half; else in the left. O(log n).

**Q3.** Search in a rotated sorted array (e.g., `[4, 5, 6, 7, 0, 1, 2]`).
**A:** Identify which half is sorted by comparing `A[low]` with `A[mid]`. Search the sorted half normally, recurse into the other half. O(log n).

**Q4.** Given a sorted matrix (each row and column sorted), find a target element efficiently.
**A:** Binary Search on each row (O(n log n)) or start from top-right corner (O(n + m)).

**Q5.** Find the square root of a number using Binary Search.
**A:** Binary search on the answer space [1, n]. Check if `mid * mid <= n` and narrow accordingly. O(log n).

### Hard

**Q1.** Find the minimum number in a rotated sorted array without duplicates.
**A:** Binary Search: if `A[mid] > A[high]`, minimum is in right half; else in left half. O(log n).

**Q2.** Given a sorted array of n integers in range [0, n], find the missing number using Binary Search.
**A:** `A[mid] == mid` means no missing element in [0, mid]; else the missing number is in [0, mid]. O(log n).

**Q3.** Find the k-th smallest element in two sorted arrays of sizes m and n.
**A:** Binary search on the smaller array, partitioning both arrays such that the left parts together contain k elements. O(log(min(m, n))).

**Q4.** A function f(x) is monotonically increasing. Find the smallest x such that f(x) ≥ target.
**A:** Binary Search on Answer in range [lo, hi]: if f(mid) >= target, store mid and search left; else search right. O(log(range) × cost_of_f).

**Q5.** Given n jobs and n workers with costs C[i][j], find the minimum cost assignment.
**A:** This is the Assignment Problem (Hungarian algorithm) — Binary Search is not directly applicable, but Binary Search on Answer + min-cost matching works for some variants.

---

## Multiple Choice Questions (MCQs)

**Q1.** What is the worst-case time complexity of Binary Search on an array of n elements?

(A) O(n)
(B) O(n log n)
(C) O(log n)
(D) O(1)

**Answer:** (C)
**Explanation:** Binary Search halves the search space each step, giving T(n) = T(n/2) + O(1), which solves to O(log n).

---

**Q2.** Binary Search can be applied to which of the following?

(A) Unsorted linked list
(B) Sorted array
(C) Unsorted array
(D) Binary tree

**Answer:** (B)
**Explanation:** Binary Search requires random access and sorted order. Only sorted arrays satisfy both conditions.

---

**Q3.** What is the minimum number of comparisons needed to search in a sorted array of 64 elements?

(A) 64
(B) 8
(C) 6
(D) 1

**Answer:** (D)
**Explanation:** The best case is O(1) — if the target is the middle element on the first check.

---

**Q4.** For an array of 1000 elements, what is the maximum number of comparisons Binary Search makes?

(A) 1000
(B) 500
(C) 10
(D) 100

**Answer:** (C)
**Explanation:** ⌈log₂(1000)⌉ = ⌈9.96⌉ = 10 comparisons in the worst case.

---

**Q5.** Which recurrence relation represents Binary Search?

(A) T(n) = T(n-1) + O(1)
(B) T(n) = 2T(n/2) + O(n)
(C) T(n) = T(n/2) + O(1)
(D) T(n) = T(n-1) + O(n)

**Answer:** (C)
**Explanation:** Binary Search reduces the problem to half its size with a constant amount of work per level.

---

**Q6.** The recursive Binary Search uses how much additional space?

(A) O(1)
(B) O(log n)
(C) O(n)
(D) O(n log n)

**Answer:** (B)
**Explanation:** Each recursive call adds a frame to the call stack. The maximum depth is log n, so space is O(log n).

---

**Q7.** Which statement about Binary Search is FALSE?

(A) It requires the array to be sorted
(B) It can be implemented iteratively with O(1) space
(C) It works efficiently on linked lists
(D) Its worst-case complexity is O(log n)

**Answer:** (C)
**Explanation:** Linked lists don't support O(1) random access, making it impossible to find the midpoint efficiently.

---

**Q8.** If `low = 5` and `high = 15`, what is the correct mid calculation to avoid overflow?

(A) (5 + 15) / 2
(B) 5 + (15 - 5) / 2
(C) (15 - 5) / 2
(D) 15 / 2

**Answer:** (B)
**Explanation:** `5 + (15 - 5) / 2 = 5 + 5 = 10`. This avoids overflow that could occur with `(5 + 15)` when low and high are very large.

---

**Q9.** Binary Search on a sorted array of n elements makes at most ______ comparisons.

(A) n/2
(B) n − 1
(C) ⌈log₂(n + 1)⌉
(D) n

**Answer:** (C)
**Explanation:** The maximum depth of the search is ⌈log₂(n + 1)⌉, which equals the height of the decision tree.

---

**Q10.** Which of these problems CANNOT be solved directly using Binary Search?

(A) Finding the square root of a number
(B) Finding a duplicate in an unsorted array
(C) Finding the kth smallest element in two sorted arrays
(D) Finding the rotation point in a rotated sorted array

**Answer:** (B)
**Explanation:** Binary Search requires a monotonic or sorted structure. An unsorted array with duplicates has no such property.

---

## Exam-Style Practice Questions

> *These are original practice questions in the style of GATE CSE — not actual previous-year questions.*

**P1.** An array contains n = 2^20 = 1,048,576 elements. What is the maximum number of element comparisons needed by Binary Search in the worst case?
**(A)** 20 **(B)** 21 **(C)** 1,048,576 **(D)** 524,288
**Answer:** (A) — log₂(2^20) = 20

**P2.** Consider a sorted array A[0..n-1]. Binary Search is used to find x. Which of the following loop invariants is ALWAYS maintained?
**(A)** A[low] ≤ x ≤ A[high]  **(B)** If x exists, it is in A[low..high]  **(C)** A[mid] = x  **(D)** low = 0
**Answer:** (B)

**P3.** The recurrence T(n) = T(n/2) + 1, T(1) = 1, using the Master Theorem gives:
**(A)** Θ(n)  **(B)** Θ(log n)  **(C)** Θ(n log n)  **(D)** Θ(1)
**Answer:** (B)

**P4.** Modified Binary Search is used to find the first occurrence of key k in a sorted array. What change is made to the standard algorithm?
**(A)** Return immediately when A[mid] = k  **(B)** When A[mid] = k, set high = mid − 1 and record mid  **(C)** Search both halves always  **(D)** Use linear scan after finding k
**Answer:** (B)

**P5.** Binary Search is applied to an array of size n where elements are sorted in descending order. Which adjustment is needed?
**(A)** No adjustment needed  **(B)** Reverse the array before searching  **(C)** Swap the update conditions: search left when target > A[mid]  **(D)** Use Linear Search instead
**Answer:** (C)

---

## Comparison with Similar Concepts

| Feature | Binary Search | Linear Search | Jump Search | Interpolation Search |
|---|---|---|---|---|
| **Time (best)** | O(1) | O(1) | O(1) | O(1) |
| **Time (worst)** | O(log n) | O(n) | O(√n) | O(n) |
| **Requires sorted?** | Yes | No | Yes | Yes |
| **Random access needed?** | Yes | No | Yes | Yes |
| **Best for** | Large sorted arrays | Small / unsorted data | Large sorted arrays | Uniformly distributed data |
| **Implementation** | Simple | Trivial | Moderate | Complex |

---

## Best Practices

- Always verify the array is sorted before applying Binary Search
- Use the iterative version in production — avoids stack overflow for very large arrays
- Handle the empty array edge case (`if len(arr) == 0: return -1`)
- For problems involving "find smallest/largest x such that condition(x) holds", think **Binary Search on Answer**
- Use Python's `bisect` module or Java's `Arrays.binarySearch()` for production code to avoid bugs

---

## When to Use

- The data is **sorted** and stored in a **random-access** structure (array, vector)
- You need **fast lookup** (O(log n)) and data doesn't change frequently
- The search space has a **monotonic property** (Binary Search on Answer)
- Database indexes, autocomplete, range queries

---

## When NOT to Use

- The array is **unsorted** (sort first, then decide if O(n log n) preprocessing is worth it)
- The data is in a **linked list** (O(n) to find midpoint defeats the purpose)
- The dataset is **small** (n < 20): Linear Search has lower constant overhead
- The data changes **frequently** (consider balanced BST or segment tree instead)

---

## Cheat Sheet

```
Binary Search — One-Minute Revision

• Prerequisite: sorted array, random access
• Time: O(log n) — best O(1), worst O(log n)
• Space: O(1) iterative, O(log n) recursive

Iterative template:
  low, high = 0, n-1
  while low <= high:
      mid = low + (high - low) // 2
      if A[mid] == target: return mid
      elif A[mid] < target: low = mid + 1
      else: high = mid - 1
  return -1

Key variants:
  • First occurrence: when match, high = mid-1, save mid
  • Last occurrence:  when match, low  = mid+1, save mid
  • Rotated array:    check which half is sorted first
  • BS on Answer:     define check(x), binary search in [lo, hi]

Overflow-safe mid: low + (high - low) // 2
Max comparisons for n: ⌈log₂(n+1)⌉
```

---

## Summary

Binary Search is a divide-and-conquer algorithm that finds a target in a sorted array in O(log n) time by repeatedly halving the search space. It outperforms Linear Search for large datasets — handling 1 billion elements in just 30 comparisons. The iterative variant uses O(1) space; the recursive variant uses O(log n) stack space. Binary Search is a cornerstone of GATE CSE and technical interviews, forming the basis for advanced problems like finding the first/last occurrence, searching rotated arrays, and Binary Search on Answer. Always ensure the data is sorted and use the overflow-safe mid formula: `low + (high - low) / 2`.

---

## FAQs

**Q1.** Does Binary Search work on strings?
**A:** Yes, as long as the strings are sorted lexicographically and comparisons are defined.

**Q2.** Can Binary Search be used on a 2D sorted matrix?
**A:** Yes. Treat the matrix as a virtual 1D sorted array using index mapping: `row = mid / cols`, `col = mid % cols`.

**Q3.** What is Binary Search on Answer?
**A:** A technique where you binary-search on the possible answer values (not array indices). Used when you need the minimum or maximum value satisfying a monotonic condition. Example: "Minimize the maximum distance between two points."

**Q4.** Is Python's `bisect.bisect_left` an implementation of Binary Search?
**A:** Yes. `bisect.bisect_left(a, x)` returns the leftmost position where x can be inserted to keep a sorted — equivalent to finding the first occurrence.

**Q5.** How does Binary Search relate to BST (Binary Search Tree)?
**A:** A BST performs Binary Search during lookup but on a tree structure. An array-based Binary Search is essentially searching a BST stored implicitly in an array (like a heap).

**Q6.** What is the difference between Binary Search and Ternary Search?
**A:** Ternary Search divides into three parts and is used for finding the maximum/minimum of unimodal functions. For finding a specific element in a sorted array, Binary Search is faster (fewer comparisons).

**Q7.** Can Binary Search handle duplicates?
**A:** Standard Binary Search finds any occurrence. Modified variants find the first or last occurrence using the same O(log n) time.

**Q8.** What is exponential search?
**A:** An algorithm that first finds a range [2^k, 2^(k+1)] where the target lies (using repeated doubling), then applies Binary Search within that range. Useful for unbounded/infinite sorted arrays.

---

## Related Topics

1. **Linear Search** — O(n) sequential scan; baseline for comparison
2. **Jump Search** — O(√n) search by jumping fixed steps; middle ground
3. **Interpolation Search** — O(log log n) average for uniformly distributed data
4. **Ternary Search** — Finds max/min of unimodal functions using divide-by-3
5. **Binary Search Tree (BST)** — Tree-based structure supporting O(log n) search
6. **Merge Sort** — Divide-and-conquer sorting; produces the sorted array required by Binary Search
7. **B-Tree / B+ Tree** — Database index structures that generalize Binary Search to disk-based storage
8. **Segment Tree** — Range query structure using Binary Search principles
9. **Lower Bound / Upper Bound** — STL functions based on Binary Search for finding boundaries
10. **Binary Search on Answer** — Advanced technique: search over the answer space, not the array

---

## Practice Exercises

### Easy
1. Implement iterative Binary Search and test on `[1, 3, 5, 7, 9]` with targets 3, 6, 9.
2. Count the number of comparisons made for each search in Exercise 1.
3. Write Binary Search that returns the insertion position (like `bisect_left`) when the element is not found.

### Medium
1. Find the first and last occurrence of a target in a sorted array with duplicates.
2. Find the number of times a sorted array is rotated (e.g., `[4,5,6,7,0,1,2]` → 4 rotations).
3. Given a sorted array of distinct integers, find the index `i` such that `A[i] == i` (fixed point). Return -1 if no such index exists.

### Hard
1. Find the median of two sorted arrays of sizes m and n in O(log(min(m,n))) time.
2. Implement "Search in Rotated Sorted Array II" where the array may contain duplicates.
3. A mountain array increases then decreases. Find the peak element and then search for a target value in O(log n) total time.

---

## References

- **CLRS** — Introduction to Algorithms (Cormen et al.), Chapter 2.3 — Designing Algorithms
- **Knuth, D.E.** — The Art of Computer Programming, Volume 3: Searching and Sorting
- **GATE CSE Syllabus** — Algorithms: Searching, Sorting, Time Complexity
- **Python docs** — `bisect` module: https://docs.python.org/3/library/bisect.html
- **Java docs** — `Arrays.binarySearch()`: https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html
- **CP-Algorithms** — Binary Search: https://cp-algorithms.com/num_methods/binary_search.html
"""

# ─── Ideation prompt (generates N distinct article ideas for a topic) ──────────

IDEATION_PROMPT = """\
You are an educational content strategist for competitive exam preparation.

Generate exactly {COUNT} DISTINCT article ideas about the broad topic "{TOPIC}".

Rules:
- Each article MUST cover a different angle, subtopic, or aspect — no duplicates
- Together they should give COMPREHENSIVE coverage of "{TOPIC}" from beginner to advanced
- Titles must be SPECIFIC (e.g., not "Introduction to X" but "X: How It Works Step by Step")
- Include a mix of: foundational concepts, advanced techniques, exam-specific patterns,
  common mistakes, comparison articles, problem-solving strategies, shortcut methods
- Each slug must be unique and URL-safe

Exam context: {EXAM}
Subject context: {SUBJECT}
Content type: {TEMPLATE}

Return ONLY a JSON array with EXACTLY {COUNT} objects (no markdown fences, no commentary):
[
  {{
    "title": "Specific article title (50-75 chars)",
    "slug": "specific-url-friendly-slug",
    "difficulty": "Beginner",
    "angle": "One sentence describing what makes this article unique"
  }},
  ...
]
"""

# ─── Helpers ───────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    import unicodedata
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")[:200]


def markdown_to_html(md_text: str) -> str:
    """Convert markdown to Tiptap-compatible HTML."""
    html = markdown2.markdown(
        md_text,
        extras=[
            "fenced-code-blocks",
            "tables",
            "strike",
            "header-ids",
            "break-on-newline",
        ],
    )
    return html


def print_step(icon: str, msg: str) -> None:
    print(f"{icon}  {msg}", flush=True)


def print_ok(msg: str) -> None:
    print(f"  ✓  {msg}", flush=True)


def print_err(msg: str) -> None:
    print(f"  ✗  {msg}", file=sys.stderr, flush=True)


# ─── API helpers ───────────────────────────────────────────────────────────────

def get_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def fetch_entity(base_url: str, api_key: str, entity_type: str, entity_id: str | None = None,
                  subject_id: str | None = None) -> list | dict | None:
    """Fetch from /api/seed/lookup or /api/public/* endpoints."""
    headers = get_headers(api_key)
    params = {"type": entity_type}
    if subject_id:
        params["subjectId"] = subject_id
    if entity_id:
        params["id"] = entity_id

    url = f"{base_url}/api/seed/lookup"
    try:
        r = requests.get(url, params=params, headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json().get("data", [])
        if entity_id and isinstance(data, list):
            matches = [x for x in data if x.get("id") == entity_id]
            return matches[0] if matches else None
        return data
    except Exception as e:
        print_err(f"fetch_entity({entity_type}): {e}")
        return None


def fetch_topics_flat(base_url: str, api_key: str, subject_id: str, topic_id: str | None = None) -> list:
    """Fetch all topics for a subject (flat list via public API)."""

    def flatten(nodes: list, out: list) -> None:
        for node in nodes:
            children = node.pop("children", [])
            node.pop("inSyllabus", None)
            out.append(node)
            flatten(children, out)

    url = f"{base_url}/api/public/subjects/{subject_id}/topics?tree=true"
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        tree = r.json().get("data", [])
        topics = []
        flatten(tree, topics)
        if topic_id:
            return [t for t in topics if t["id"] == topic_id]
        return topics
    except Exception as e:
        # fall back to seed API
        print_err(f"fetch_topics: {e} — trying seed lookup")
        result = fetch_entity(base_url, api_key, "topics", subject_id=subject_id)
        if isinstance(result, list):
            if topic_id:
                return [t for t in result if t.get("id") == topic_id]
            return result
        return []


def post_blog(base_url: str, api_key: str, payload: dict) -> dict | None:
    """POST blog to /api/seed/blogs. Returns {id, slug} or None."""
    url = f"{base_url}/api/seed/blogs"
    try:
        r = requests.post(url, headers=get_headers(api_key), json=payload, timeout=30)
        r.raise_for_status()
        return r.json().get("data")
    except requests.HTTPError as e:
        body = {}
        try:
            body = e.response.json()
        except Exception:
            pass
        print_err(f"POST /seed/blogs → {e.response.status_code}: {body.get('error', str(e))}")
        return None
    except Exception as e:
        print_err(f"POST /seed/blogs: {e}")
        return None


# ─── Ideation ──────────────────────────────────────────────────────────────────

def ideate_articles(topic: str, exam: str, subject: str, count: int,
                    template_type: str, model: str, ollama_base: str) -> list:
    """Ask the LLM to brainstorm `count` distinct article ideas for a broad topic.

    Returns a list of dicts: {title, slug, difficulty, angle}
    Falls back to a single generic entry on parse failure.
    """
    prompt = IDEATION_PROMPT.format(
        TOPIC=topic,
        EXAM=exam or "competitive exams",
        SUBJECT=subject or topic,
        COUNT=count,
        TEMPLATE=template_type,
    )
    try:
        raw = ollama_generate(prompt, model, ollama_base, temperature=0.75)
        # Strip markdown fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
        ideas = json.loads(raw)
        if not isinstance(ideas, list):
            raise ValueError("Response is not a JSON array")
        # Deduplicate slugs in case the model repeats
        seen_slugs: set = set()
        clean: list = []
        for idea in ideas:
            slug = idea.get("slug") or slugify(idea.get("title", topic))
            if slug in seen_slugs:
                slug = slug + f"-{len(clean)+1}"
            seen_slugs.add(slug)
            idea["slug"] = slug
            clean.append(idea)
        if len(clean) < count:
            print_err(f"Model returned only {len(clean)}/{count} ideas — proceeding with what we have")
        print_ok(f"Planned {len(clean)} article(s)")
        for i, idea in enumerate(clean, 1):
            print(f"     {i:2}. {idea['title'][:70]}")
        return clean
    except Exception as e:
        print_err(f"Ideation failed ({e}) — falling back to single article on '{topic}'")
        return [{"title": topic, "slug": slugify(topic),
                 "difficulty": "Intermediate", "angle": ""}]


# ─── Ollama helpers ────────────────────────────────────────────────────────────

def check_ollama(ollama_base: str, model: str) -> bool:
    """Verify Ollama is running and the model is available."""
    try:
        r = requests.get(f"{ollama_base}/api/tags", timeout=5)
        r.raise_for_status()
        models = [m["name"] for m in r.json().get("models", [])]
        if not any(model in m for m in models):
            print_err(f"Model '{model}' not found in Ollama. Available: {models}")
            print_err(f"Install it with:  ollama pull {model}")
            return False
        return True
    except Exception as e:
        print_err(f"Cannot reach Ollama at {ollama_base}: {e}")
        print_err("Start Ollama with:  ollama serve")
        return False


def ollama_generate(prompt: str, model: str, ollama_base: str, temperature: float = 0.65) -> str:
    """Generate text using Ollama chat API."""
    url = f"{ollama_base}/api/chat"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {
            "num_ctx": 32768,
            "temperature": temperature,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
        },
    }
    r = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    return r.json()["message"]["content"].strip()


def generate_metadata(topic: str, exam: str, subject: str, model: str, ollama_base: str) -> dict:
    """Generate JSON metadata for the blog post."""
    prompt = METADATA_PROMPT.format(TOPIC=topic, EXAM=exam or "General", SUBJECT=subject or "General")
    try:
        raw = ollama_generate(prompt, model, ollama_base, temperature=0.3)
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
        return json.loads(raw)
    except Exception as e:
        print_err(f"Metadata generation failed: {e} — using fallback")
        sl = slugify(topic)
        suffix = f" for {exam}" if exam else ""
        return {
            "title": f"{topic}: Complete Guide{suffix}",
            "seoTitle": f"{topic}{(' — ' + exam) if exam else ''} Guide"[:60],
            "metaDescription": f"Learn {topic} with examples, detailed explanation and practice questions{(' for ' + exam) if exam else ''}.",
            "slug": sl,
            "primaryKeyword": topic.lower(),
            "keywords": list(filter(None, [topic.lower(), exam.lower() if exam else None,
                                           subject.lower() if subject else None, "study guide"])),
            "tags": list(filter(None, [slugify(topic), slugify(exam) if exam else None,
                                       slugify(subject) if subject else None])),
        }


def infer_difficulty(topic: dict) -> str:
    if "_difficulty" in topic:
        return topic["_difficulty"]
    depth = topic.get("depth", 0)
    return ["Beginner", "Intermediate", "Advanced"][min(depth, 2)]


def generate_article_content(topic: str, exam: str, subject: str,
                              difficulty: str, model: str, ollama_base: str,
                              template_type: str = "auto", angle: str = "") -> str:
    """Generate the full article markdown using the appropriate template."""
    if template_type == "auto":
        template_type = detect_template(subject or "", topic)
    template = TEMPLATES.get(template_type, TEMPLATE_GENERAL)
    prompt = template.format(
        TOPIC=topic,
        EXAM=exam or "competitive exams",
        SUBJECT=subject or topic,
        CATEGORY=subject or topic,
        DIFFICULTY=difficulty,
    )
    if angle:
        prompt += f"\n\nIMPORTANT — This article's specific focus / angle:\n{angle}\nShape the content around this angle throughout."
    return ollama_generate(prompt, model, ollama_base)


# ─── Main pipeline ─────────────────────────────────────────────────────────────

def build_blog_payload(metadata: dict, html_content: str, exam_id: str | None,
                        subject_id: str | None, topic_id: str | None) -> dict:
    return {
        "type": "THEORY",
        "title": metadata["title"],
        "slug": metadata.get("slug") or slugify(metadata["title"]),
        "summary": metadata["metaDescription"],
        "content": html_content,
        "examIds": [exam_id] if exam_id else [],
        "subjectIds": [subject_id] if subject_id else [],
        "topicIds": [topic_id] if topic_id else [],
        "tagIds": [],
        "relatedBlogIds": [],
        "status": "DRAFT",
        "seo": {
            "metaTitle": metadata.get("seoTitle") or metadata["title"][:60],
            "metaDescription": metadata["metaDescription"],
            "keywords": metadata.get("keywords", []),
            "schemaType": "Article",
            "robots": "index,follow",
        },
        "authorEmail": "seed@scholar247.org",
        "authorId": "system-seed",
    }


def process_topic(topic: dict, exam: dict | None, subject: dict | None,
                  args: argparse.Namespace) -> bool:
    """Generate and optionally save a blog for one topic. Returns True on success."""

    topic_name = topic.get("name", "Unknown Topic")
    exam_name = exam.get("name", "General") if exam else "General"
    subject_name = subject.get("name", "General") if subject else "General"
    difficulty = infer_difficulty(topic)

    angle = topic.get("_angle", "")
    path_label = " › ".join(topic.get("pathNames", [])) + (" › " if topic.get("pathNames") else "") + topic_name

    print()
    print_step("📝", f"Topic: {path_label}  [{difficulty}]")
    if angle:
        print_step("🎯", f"Angle: {angle}")

    # For ideated topics the title is already the specific article title — use it directly
    # as metadata.title instead of asking Ollama again (saves one LLM call + guarantees uniqueness)
    prebuilt_slug = topic.get("_slug", "")
    if prebuilt_slug:
        metadata = {
            "title": topic_name,
            "seoTitle": topic_name[:60],
            "metaDescription": f"Learn {topic_name} — complete guide with examples, practice problems, and exam tips.",
            "slug": prebuilt_slug,
            "primaryKeyword": topic_name.lower(),
            "keywords": list(filter(None, [topic_name.lower(),
                                           exam_name.lower() if exam_name != "General" else None,
                                           subject_name.lower() if subject_name != "General" else None])),
            "tags": list(filter(None, [slugify(topic_name),
                                       slugify(exam_name) if exam_name != "General" else None])),
        }
        print_ok(f"Title: {metadata['title'][:70]}  (pre-built)")
    else:
        print_step("🔍", "Generating metadata…")
        metadata = generate_metadata(topic_name, exam_name, subject_name, args.model, args.ollama)
        print_ok(f"Title: {metadata['title'][:70]}")

    # Generate article
    tpl = getattr(args, "template", "auto") or "auto"
    print_step("🤖", f"Generating article [{tpl}] with {args.model}…")
    t0 = time.time()
    md_content = generate_article_content(topic_name, exam_name, subject_name, difficulty,
                                          args.model, args.ollama, template_type=tpl, angle=angle)
    elapsed = time.time() - t0
    words = len(md_content.split())
    print_ok(f"Generated {words:,} words in {elapsed:.0f}s")

    # Convert to HTML
    html_content = markdown_to_html(md_content)

    # Save markdown locally if requested
    if args.output_dir:
        out_path = Path(args.output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        fname = slugify(topic_name) + ".md"
        (out_path / fname).write_text(md_content, encoding="utf-8")
        print_ok(f"Saved markdown → {out_path / fname}")

    # POST to API
    if args.dry_run:
        print_ok("Dry run — skipping API POST")
        return True

    payload = build_blog_payload(
        metadata, html_content,
        topic.get("id") and args.exam_id,
        args.subject_id,
        topic.get("id"),
    )
    print_step("🚀", "Posting to API…")
    result = post_blog(args.base_url, args.api_key, payload)
    if result:
        print_ok(f"Created blog: id={result.get('id')}  slug={result.get('slug')}")
        return True
    else:
        return False


def run_demo(args: argparse.Namespace) -> None:
    """Save the pre-written demo article."""
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
        DEMO_ARTICLE_METADATA,
        html_content,
        args.exam_id or None,
        args.subject_id or None,
        args.topic_id or None,
    )
    print_step("🚀", "Posting demo article to API…")
    result = post_blog(args.base_url, args.api_key, payload)
    if result:
        print_ok(f"Demo blog created: id={result.get('id')}  slug={result.get('slug')}")
        print()
        print(f"  Preview: {args.base_url}/admin/blogs/{result.get('id')}/preview")
    else:
        print_err("Failed to save demo article")


# ─── CLI ───────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Scholar247 Blog Generator — generates educational articles via local LLM",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        ─── Entity IDs (all optional — any combination works) ─────────────────────
          --exam-id       Associate blog with an exam (context only; can be omitted)
          --subject-id    Associate + fetch topics from this subject
          --topic-id      Filter to one specific topic (requires --subject-id to
                          fetch topic list; ignored when --topic-name is set)
          --topic-name    Freeform topic name — skip DB lookup entirely

        ─── Template selection ─────────────────────────────────────────────────────
          --template auto       Detect from subject/topic name (default)
          --template coding     CS algorithms, data structures, programming
          --template math       Mathematics, formulas, derivations
          --template aptitude   Quantitative aptitude, logical reasoning
          --template english    English, verbal ability, grammar
          --template general    Any other topic

        ─── Examples ───────────────────────────────────────────────────────────────
          # Pre-written demo (no Ollama needed):
          python generate_blogs.py --demo --base-url http://localhost:3000

          # Subject + exam (generates for all topics in subject):
          python generate_blogs.py --subject-id <uuid> --exam-id <uuid> \\
              --base-url http://localhost:3000

          # Subject only (no exam):
          python generate_blogs.py --subject-id <uuid>

          # Single topic from DB:
          python generate_blogs.py --subject-id <uuid> --topic-id <uuid>

          # Freeform topic — no DB lookup, no exam:
          python generate_blogs.py --topic-name "Quadratic Equations" --template math

          # Freeform topic + associate IDs:
          python generate_blogs.py --topic-name "Reading Comprehension" \\
              --subject-id <uuid> --template english

          # Dry run + save markdown:
          python generate_blogs.py --subject-id <uuid> --dry-run --output-dir ./out
        """),
    )
    # Entity IDs — all fully optional
    p.add_argument("--exam-id",     dest="exam_id",    help="Exam UUID (optional context / association)")
    p.add_argument("--subject-id",  dest="subject_id", help="Subject UUID (optional — needed to fetch topic list)")
    p.add_argument("--topic-id",    dest="topic_id",   help="Topic UUID filter (requires --subject-id)")
    p.add_argument("--topic-name",  dest="topic_name", help="Freeform topic name — skips DB topic lookup")

    # Template
    p.add_argument("--template",    default="auto",
                   choices=["auto", "coding", "math", "aptitude", "english", "general"],
                   help="Article template type (default: auto-detect from subject/topic name)")

    # Generation options
    p.add_argument("--count",       type=int, default=DEFAULT_COUNT,
                   help=f"Max topics to generate when using --subject-id (default: {DEFAULT_COUNT})")
    p.add_argument("--model",       default=DEFAULT_MODEL,
                   help=f"Ollama model name (default: {DEFAULT_MODEL})")
    p.add_argument("--ollama",      default=OLLAMA_BASE,
                   help=f"Ollama base URL (default: {OLLAMA_BASE})")

    # API options
    p.add_argument("--base-url",    default=DEFAULT_BASE_URL, dest="base_url",
                   help=f"Scholar247 API base URL (default: {DEFAULT_BASE_URL})")
    p.add_argument("--api-key",     dest="api_key",
                   help="Seed API key (auto-detected from base URL if not set)")
    p.add_argument("--output-dir",  dest="output_dir",
                   help="Also save generated markdown to this local directory")
    p.add_argument("--dry-run",     action="store_true",
                   help="Generate content but skip API POST")
    p.add_argument("--demo",        action="store_true",
                   help="Save pre-written Binary Search demo article (no Ollama needed)")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    # Auto-select API key
    if not args.api_key:
        args.api_key = LOCAL_SEED_KEY if "localhost" in args.base_url else PROD_SEED_KEY

    tpl_label = args.template if args.template != "auto" else "auto-detect"
    print("═" * 60)
    print("  Scholar247 Blog Generator")
    print(f"  API:      {args.base_url}")
    print(f"  Model:    {args.model}  (Ollama: {args.ollama})")
    print(f"  Template: {tpl_label}")
    print("═" * 60)

    # ── Demo mode ────────────────────────────────────────────────────────────
    if args.demo:
        run_demo(args)
        return

    # ── Validate: need at least topic-name OR subject-id ─────────────────────
    if not args.topic_name and not args.subject_id:
        print_err("Provide at least one of: --topic-name, --subject-id  (or use --demo)")
        print_err("Run with --help to see all examples.")
        sys.exit(1)

    # ── Verify Ollama ─────────────────────────────────────────────────────────
    if not check_ollama(args.ollama, args.model):
        sys.exit(1)

    # ── Fetch exam details (optional) ─────────────────────────────────────────
    exam = None
    if args.exam_id:
        print_step("🏫", "Fetching exam details…")
        all_exams = fetch_entity(args.base_url, args.api_key, "exams") or []
        exam = next((e for e in all_exams if e.get("id") == args.exam_id), None)
        if exam:
            print_ok(f"Exam: {exam['name']}")
        else:
            print_err(f"Exam {args.exam_id} not found — continuing without exam context")

    # ── Fetch subject details (optional) ──────────────────────────────────────
    subject = None
    if args.subject_id:
        print_step("📚", "Fetching subject details…")
        all_subjects = fetch_entity(args.base_url, args.api_key, "subjects") or []
        subject = next((s for s in all_subjects if s.get("id") == args.subject_id), None)
        if subject:
            print_ok(f"Subject: {subject['name']}")
        else:
            print_err(f"Subject {args.subject_id} not found — will proceed without subject name")

    # ── Build topic list ──────────────────────────────────────────────────────
    exam_name   = exam["name"]    if exam    else ""
    subject_name = subject["name"] if subject else ""

    if args.topic_name:
        if args.count == 1:
            # Single freeform article — skip ideation
            topics = [{
                "id": args.topic_id or "", "name": args.topic_name,
                "depth": 0, "pathNames": [],
            }]
            print_ok(f"Freeform topic: {args.topic_name}")
        else:
            # Multi-article mode — ask model to plan N distinct angles first
            tpl_for_ideation = args.template if args.template != "auto" \
                               else detect_template(subject_name, args.topic_name)
            print_step("💡", f"Planning {args.count} distinct articles on '{args.topic_name}'"
                             f"  [template: {tpl_for_ideation}]…")
            ideas = ideate_articles(
                args.topic_name, exam_name, subject_name,
                args.count, tpl_for_ideation, args.model, args.ollama,
            )
            topics = [
                {
                    "id":          args.topic_id or "",
                    "name":        idea["title"],
                    "_slug":       idea.get("slug") or slugify(idea["title"]),
                    "_difficulty": idea.get("difficulty", "Intermediate"),
                    "_angle":      idea.get("angle", ""),
                    "depth":       0,
                    "pathNames":   [],
                }
                for idea in ideas
            ]
    else:
        print_step("🗂️", "Fetching topics…")
        topics = fetch_topics_flat(args.base_url, args.api_key, args.subject_id, args.topic_id)
        if not topics:
            print_err("No topics found. Check --subject-id / --topic-id values.")
            sys.exit(1)
        topics = topics[: args.count]
        print_ok(f"Found {len(topics)} topic(s) to process")

    # ── Process each topic ────────────────────────────────────────────────────
    success, failed = 0, 0
    for i, topic in enumerate(topics, 1):
        print()
        print(f"─── [{i}/{len(topics)}] ────────────────────────────────────")
        try:
            ok = process_topic(topic, exam, subject, args)
            if ok:
                success += 1
            else:
                failed += 1
        except KeyboardInterrupt:
            print("\nInterrupted by user")
            break
        except Exception as e:
            print_err(f"Unexpected error: {e}")
            failed += 1

        if i < len(topics):
            print_step("⏳", f"Waiting {SLEEP_BETWEEN}s before next generation…")
            time.sleep(SLEEP_BETWEEN)

    print()
    print("═" * 60)
    print(f"  Done — {success} created, {failed} failed")
    print("═" * 60)


if __name__ == "__main__":
    main()
