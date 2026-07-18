#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — shared library
=============================================
Common helpers used by every `generate_blogs_<template>.py` script:
  coding | math | aptitude | english | general

Why split by template instead of one script with --template/auto-detect?
Each subject type gets its own file so a math/aptitude/english run can never
accidentally pull in the coding template (with its multi-language code
blocks) — only `generate_blogs_coding.py` exposes a --code flag, and only
when it's passed does the article include a "Code Implementation" section.
Every other script always produces theory-only articles.

PREREQUISITES:  pip install requests markdown2
                 Ensure Ollama is running:  ollama serve
"""

import argparse
import json
import os
import re
import sys
import textwrap
import time
from pathlib import Path

import requests

try:
    import markdown2
except ImportError:
    print("ERROR: markdown2 not installed.  Run: pip install markdown2")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass  # dotenv is optional — GEMINI_API_KEY can still be set in the real environment

# ─── Configuration ──────────────────────────────────────────────────────────

DEFAULT_BASE_URL  = "https://scholar247.org"
DEFAULT_LOCAL_URL = "http://localhost:3000"
OLLAMA_BASE       = "http://localhost:11434"
DEFAULT_MODEL     = "qwen2.5:14b"
DEFAULT_COUNT     = 8      # aim for ~5-10 blogs per subject
REQUEST_TIMEOUT   = 600    # seconds — long-form generation can take several minutes
SLEEP_BETWEEN     = 5      # seconds between API calls to avoid hammering local GPU

GEMINI_API_BASE     = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_TIMEOUT       = 300  # seconds

PROD_SEED_KEY  = "d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f"
LOCAL_SEED_KEY = "f1348450339addd08b0b8fd141ee8890e77f65f256d0c06884f673a4463cbded"

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

# ─── Small helpers ──────────────────────────────────────────────────────────

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
    return markdown2.markdown(
        md_text,
        extras=["fenced-code-blocks", "tables", "strike", "header-ids", "break-on-newline"],
    )


def print_step(icon: str, msg: str) -> None:
    print(f"{icon}  {msg}", flush=True)


def print_ok(msg: str) -> None:
    print(f"  ✓  {msg}", flush=True)


def print_err(msg: str) -> None:
    print(f"  ✗  {msg}", file=sys.stderr, flush=True)


# ─── API helpers ────────────────────────────────────────────────────────────

def get_headers(api_key: str) -> dict:
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def fetch_entity(base_url: str, api_key: str, entity_type: str, entity_id: str | None = None,
                  subject_id: str | None = None) -> list | dict | None:
    """Fetch from /api/seed/lookup."""
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
        topics: list = []
        flatten(tree, topics)
        if topic_id:
            return [t for t in topics if t["id"] == topic_id]
        return topics
    except Exception as e:
        print_err(f"fetch_topics: {e} — trying seed lookup")
        result = fetch_entity(base_url, api_key, "topics", subject_id=subject_id)
        if isinstance(result, list):
            if topic_id:
                return [t for t in result if t.get("id") == topic_id]
            return result
        return []


def fetch_existing_blogs(base_url: str, api_key: str, subject_id: str, topic_id: str | None = None) -> list:
    """Fetch already-created blogs (any status) for a subject/topic via /api/seed/lookup?type=blogs.

    Returns a list of {id, title, slug, topicIds, status, tagIds} so callers can
    steer ideation away from angles that already have an article.
    """
    headers = get_headers(api_key)
    params = {"type": "blogs", "subjectId": subject_id}
    if topic_id:
        params["topicId"] = topic_id
    try:
        r = requests.get(f"{base_url}/api/seed/lookup", params=params, headers=headers, timeout=30)
        r.raise_for_status()
        return r.json().get("data", [])
    except Exception as e:
        print_err(f"fetch_existing_blogs: {e}")
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


# ─── Ollama helpers ─────────────────────────────────────────────────────────

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
        "options": {"num_ctx": 32768, "temperature": temperature, "top_p": 0.9, "repeat_penalty": 1.1},
    }
    r = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    return r.json()["message"]["content"].strip()


# ─── Gemini helpers ─────────────────────────────────────────────────────────

def get_gemini_api_key(cli_value: str | None = None) -> str:
    """Resolve the Gemini API key: --gemini-api-key flag > GEMINI_API_KEY env (incl. scripts/.env)."""
    return cli_value or os.environ.get("GEMINI_API_KEY", "")


def gemini_generate(prompt: str, model: str, api_key: str, temperature: float = 0.65,
                     max_output_tokens: int = 8192) -> str:
    """Generate text using the Gemini API (generateContent)."""
    if not api_key:
        raise RuntimeError("Missing Gemini API key — set GEMINI_API_KEY (scripts/.env) or pass --gemini-api-key")

    url = f"{GEMINI_API_BASE}/models/{model}:generateContent"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "topP": 0.9,
            "maxOutputTokens": max_output_tokens,
        },
    }
    r = requests.post(url, params={"key": api_key}, json=payload, timeout=GEMINI_TIMEOUT)
    if r.status_code != 200:
        try:
            detail = r.json().get("error", {}).get("message", "")
        except Exception:
            detail = r.text[:300]
        raise RuntimeError(f"Gemini API {r.status_code}: {detail}")

    data = r.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"Gemini returned no candidates (promptFeedback={data.get('promptFeedback')})")

    candidate = candidates[0]
    finish_reason = candidate.get("finishReason")
    parts = candidate.get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise RuntimeError(f"Gemini returned empty text (finishReason={finish_reason})")
    if finish_reason == "MAX_TOKENS":
        print_err("Gemini hit max_output_tokens — response may have been truncated")
    return text


def check_gemini(api_key: str, model: str) -> bool:
    """Verify the Gemini API key + model work with a minimal call."""
    if not api_key:
        print_err("No Gemini API key. Set GEMINI_API_KEY in scripts/.env or pass --gemini-api-key")
        return False
    try:
        text = gemini_generate("Reply with exactly one word: ok", model, api_key,
                                temperature=0.0, max_output_tokens=16)
        return bool(text)
    except Exception as e:
        print_err(f"Cannot reach Gemini API with model '{model}': {e}")
        return False


def generate_text(prompt: str, args: argparse.Namespace, temperature: float = 0.65,
                   max_output_tokens: int = 8192) -> str:
    """Engine-agnostic text generation — dispatches to Gemini or Ollama based on args.engine."""
    engine = getattr(args, "engine", "ollama")
    if engine == "gemini":
        return gemini_generate(prompt, args.gemini_model, args.gemini_api_key,
                                temperature=temperature, max_output_tokens=max_output_tokens)
    return ollama_generate(prompt, args.model, args.ollama, temperature=temperature)


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


def ideate_articles(topic: str, exam: str, subject: str, count: int,
                     template_type: str, model: str, ollama_base: str) -> list:
    """Ask the LLM to brainstorm `count` distinct article ideas for a broad topic.

    Returns a list of dicts: {title, slug, difficulty, angle}
    Falls back to a single generic entry on parse failure.
    """
    prompt = IDEATION_PROMPT.format(
        TOPIC=topic, EXAM=exam or "competitive exams", SUBJECT=subject or topic,
        COUNT=count, TEMPLATE=template_type,
    )
    try:
        raw = ollama_generate(prompt, model, ollama_base, temperature=0.75)
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
        ideas = json.loads(raw)
        if not isinstance(ideas, list):
            raise ValueError("Response is not a JSON array")
        seen_slugs: set = set()
        clean: list = []
        for idea in ideas:
            slug = idea.get("slug") or slugify(idea.get("title", topic))
            if slug in seen_slugs:
                slug = slug + f"-{len(clean) + 1}"
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
        return [{"title": topic, "slug": slugify(topic), "difficulty": "Intermediate", "angle": ""}]


def infer_difficulty(topic: dict) -> str:
    if "_difficulty" in topic:
        return topic["_difficulty"]
    depth = topic.get("depth", 0)
    return ["Beginner", "Intermediate", "Advanced"][min(depth, 2)]


# ─── Editorial polish pass (SEO / readability / factual / grammar / headings) ──

POLISH_PROMPT = """\
You are a senior human editor and SEO strategist reviewing a draft article before it \
goes live on an educational blog for competitive-exam students (GATE / NIMCET / \
placements). The draft below was AI-generated and reads like it — your job is to turn \
it into something a sharp human subject-matter expert would actually publish.

Topic: {TOPIC}
Primary keyword: {KEYWORD}

===DRAFT_START===
{DRAFT}
===DRAFT_END===

Rewrite the article to production quality against these checks:

1. HUMAN VOICE — Strip AI tells: no "In today's fast-paced world", "Furthermore", \
"In conclusion", "It is important to note", repetitive sentence openers, or robotic \
transitions. Vary sentence length and rhythm the way an expert writing from experience \
would. Use "you" to talk to the reader where natural.
2. SEO — The primary keyword must appear naturally in the H1, within the first 100 \
words, and in at least one H2. Keep a clean heading hierarchy (one H1, logical H2/H3 \
nesting). Never keyword-stuff.
3. ENGAGING HEADINGS — Sharpen generic section headings into specific, inviting ones \
while keeping their meaning intact (functional headings like "FAQs" or "Summary" can \
stay as-is).
4. READABILITY — Short paragraphs (2-4 sentences), plain words, active voice, jargon \
explained on first use.
5. FACTUAL CONSISTENCY — Verify every technical claim (complexity, definitions, code \
behavior, formulas). Fix anything wrong, outdated, or self-contradictory. If unsure, \
soften to an accurate general statement rather than inventing specifics.
6. GRAMMAR — Fix every grammar, spelling, and punctuation error.
7. Preserve the article's overall Markdown structure — keep all sections, tables, and \
code blocks intact; only rewrite prose and headings, don't drop required sections.

Respond with EXACTLY this format (no extra commentary outside the markers):

===REVISED_ARTICLE_START===
(the full rewritten article in Markdown)
===REVISED_ARTICLE_END===
===QA_REPORT_START===
{{
  "seo": 0-100,
  "readability": 0-100,
  "factual_consistency": 0-100,
  "grammar": 0-100,
  "heading_engagement": 0-100,
  "human_voice": 0-100,
  "issues_found": ["short bullet per notable issue fixed"],
  "notes": "one short paragraph summarizing what changed"
}}
===QA_REPORT_END===
"""


def parse_polish_response(raw: str, fallback_markdown: str) -> tuple[str, dict]:
    """Extract the revised article + QA report from a polish-pass response.

    Falls back to the pre-polish draft (with an empty report) if the model didn't
    follow the marker format — callers should treat an empty report as "unscored"
    rather than "failed", since the revised text itself may still be usable.
    """
    article_match = re.search(
        r"===REVISED_ARTICLE_START===\s*(.*?)\s*===REVISED_ARTICLE_END===", raw, re.DOTALL
    )
    report_match = re.search(
        r"===QA_REPORT_START===\s*(.*?)\s*===QA_REPORT_END===", raw, re.DOTALL
    )

    revised = article_match.group(1).strip() if article_match else fallback_markdown
    if not article_match:
        print_err("Polish pass didn't return a parseable revised article — keeping pre-polish draft")

    report: dict = {}
    if report_match:
        report_raw = report_match.group(1).strip()
        report_raw = re.sub(r"^```(?:json)?\s*", "", report_raw, flags=re.MULTILINE)
        report_raw = re.sub(r"\s*```$", "", report_raw, flags=re.MULTILINE)
        try:
            report = json.loads(report_raw)
        except Exception as e:
            print_err(f"Could not parse QA report JSON: {e}")

    return revised, report


QA_SCORE_KEYS = ("seo", "readability", "factual_consistency", "grammar", "heading_engagement", "human_voice")
QA_MIN_SCORE_DEFAULT = 70


def polish_article(md_content: str, topic: str, primary_keyword: str,
                    args: argparse.Namespace) -> tuple[str, dict]:
    """Run the editorial pass over a generated draft. Returns (revised_markdown, qa_report).

    On any hard failure (network error, unparseable response) this degrades to
    returning the original draft with an empty report rather than raising —
    a polish failure shouldn't block publishing an otherwise-fine article.
    """
    prompt = POLISH_PROMPT.format(TOPIC=topic, KEYWORD=primary_keyword or topic, DRAFT=md_content)
    try:
        raw = generate_text(prompt, args, temperature=0.4, max_output_tokens=16384)
    except Exception as e:
        print_err(f"Polish pass failed ({e}) — keeping unpolished draft")
        return md_content, {}
    return parse_polish_response(raw, md_content)


def print_qa_report(report: dict, min_score: int = QA_MIN_SCORE_DEFAULT) -> None:
    if not report:
        print_step("📋", "QA report: unavailable (polish pass didn't return scores)")
        return
    scores = {k: report.get(k) for k in QA_SCORE_KEYS if isinstance(report.get(k), (int, float))}
    if scores:
        summary = "  ".join(f"{k}={v}" for k, v in scores.items())
        print_step("📋", f"QA scores: {summary}")
        low = {k: v for k, v in scores.items() if v < min_score}
        if low:
            print_err(f"Below threshold ({min_score}): {', '.join(low)} — review before publishing")
    notes = report.get("notes")
    if notes:
        print(f"     ↳ {notes}")


# ─── Local coverage state (subjects → topics → generated blogs) ───────────────

DEFAULT_STATE_FILE = Path(__file__).resolve().parent / "blog_state.json"


def load_state(path: Path = DEFAULT_STATE_FILE) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print_err(f"Could not parse state file {path} ({e}) — starting fresh")
    return {"subjects": {}}


def save_state(state: dict, path: Path = DEFAULT_STATE_FILE) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def state_topic_key(topic_id: str | None, topic_name: str) -> str:
    return topic_id or slugify(topic_name)


def state_existing_titles(state: dict, subject_id: str, topic_id: str | None, topic_name: str) -> list[str]:
    """Titles already recorded locally for this subject/topic, used to steer ideation away from dupes."""
    subj = state.get("subjects", {}).get(subject_id)
    if not subj:
        return []
    top = subj.get("topics", {}).get(state_topic_key(topic_id, topic_name))
    if not top:
        return []
    return [b["title"] for b in top.get("blogs", [])]


def state_record_blog(state: dict, subject_id: str, subject_name: str,
                       topic_id: str | None, topic_name: str, blog: dict) -> None:
    subj = state.setdefault("subjects", {}).setdefault(subject_id, {"name": subject_name, "topics": {}})
    subj["name"] = subject_name
    top = subj.setdefault("topics", {}).setdefault(state_topic_key(topic_id, topic_name), {"name": topic_name, "blogs": []})
    top["name"] = topic_name
    top["blogs"].append(blog)


def seed_state_from_remote(state: dict, subject_id: str, subject_name: str, existing_blogs: list) -> None:
    """Merge blogs already on the server (fetched via fetch_existing_blogs) into local state.

    Blogs are attributed to every topicId they're tagged with — a blog can only be
    matched to a topic name if the caller supplies an id→name map, so this stores
    under the raw topicId as the key (state_topic_key falls back to slugify(name)
    for freeform topics, so remote topicIds and local freeform keys can coexist).
    """
    for blog in existing_blogs:
        topic_ids = blog.get("topicIds") or [None]
        for topic_id in topic_ids:
            state_record_blog(
                state, subject_id, subject_name, topic_id, topic_id or "general",
                {"title": blog["title"], "slug": blog["slug"], "id": blog.get("id"), "source": "remote"},
            )


# ─── Blog payload / pipeline ────────────────────────────────────────────────

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
                   args: argparse.Namespace, template_type: str, build_prompt) -> bool:
    """Generate and optionally save a blog for one topic. Returns True on success.

    `build_prompt(topic_name, exam_name, subject_name, difficulty, angle) -> str`
    is supplied by the calling template script (it already knows whether to
    fold in a code section, since only the coding script has one).
    """
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
    # instead of asking Ollama again (saves one LLM call + guarantees uniqueness).
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

    print_step("🤖", f"Generating article [{template_type}] with {args.model}…")
    t0 = time.time()
    prompt = build_prompt(topic_name, exam_name, subject_name, difficulty, angle)
    md_content = ollama_generate(prompt, args.model, args.ollama)
    elapsed = time.time() - t0
    words = len(md_content.split())
    print_ok(f"Generated {words:,} words in {elapsed:.0f}s")

    html_content = markdown_to_html(md_content)

    if args.output_dir:
        out_path = Path(args.output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        fname = slugify(topic_name) + ".md"
        (out_path / fname).write_text(md_content, encoding="utf-8")
        print_ok(f"Saved markdown → {out_path / fname}")

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
    return False


def build_arg_parser(template_type: str, description: str, extra_epilog: str = "") -> argparse.ArgumentParser:
    """Shared CLI surface for every generate_blogs_<template>.py script."""
    script_name = Path(sys.argv[0]).name
    p = argparse.ArgumentParser(
        description=description,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(f"""
        ─── Entity IDs (all optional — any combination works) ─────────────────────
          --exam-id       Associate blog with an exam (context only; can be omitted)
          --subject-id    Associate + fetch topics from this subject
          --topic-id      Filter to one specific topic (requires --subject-id)
          --topic-name    Freeform topic name — skips DB lookup entirely
{extra_epilog}        ─── Examples ───────────────────────────────────────────────────────────────
          # Whole subject, ~5-10 blogs (default --count):
          python {script_name} --subject-id <uuid> --exam-id <uuid>

          # Freeform topic, several distinct articles:
          python {script_name} --topic-name "Quadratic Equations" --count 6

          # Dry run + save markdown locally:
          python {script_name} --subject-id <uuid> --dry-run --output-dir ./out
        """),
    )
    p.add_argument("--exam-id", dest="exam_id", help="Exam UUID (optional context / association)")
    p.add_argument("--subject-id", dest="subject_id", help="Subject UUID (optional — needed to fetch topic list)")
    p.add_argument("--topic-id", dest="topic_id", help="Topic UUID filter (requires --subject-id)")
    p.add_argument("--topic-name", dest="topic_name", help="Freeform topic name — skips DB topic lookup")
    p.add_argument("--count", type=int, default=DEFAULT_COUNT,
                    help=f"Blogs to generate per subject/topic — aim for 5-10 (default: {DEFAULT_COUNT})")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"Ollama model name (default: {DEFAULT_MODEL})")
    p.add_argument("--ollama", default=OLLAMA_BASE, help=f"Ollama base URL (default: {OLLAMA_BASE})")
    p.add_argument("--base-url", default=DEFAULT_BASE_URL, dest="base_url",
                    help=f"Scholar247 API base URL (default: {DEFAULT_BASE_URL})")
    p.add_argument("--api-key", dest="api_key", help="Seed API key (auto-detected from base URL if not set)")
    p.add_argument("--output-dir", dest="output_dir", help="Also save generated markdown to this local directory")
    p.add_argument("--dry-run", action="store_true", help="Generate content but skip API POST")
    return p


def run(args: argparse.Namespace, template_type: str, build_prompt) -> None:
    """Shared main-loop body: validate, fetch context, build topic list, process each."""
    if not args.api_key:
        args.api_key = LOCAL_SEED_KEY if "localhost" in args.base_url else PROD_SEED_KEY

    print("═" * 60)
    print(f"  Scholar247 Blog Generator — {template_type.title()}")
    print(f"  API:      {args.base_url}")
    print(f"  Model:    {args.model}  (Ollama: {args.ollama})")
    print("═" * 60)

    if not args.topic_name and not args.subject_id:
        print_err("Provide at least one of: --topic-name, --subject-id")
        print_err("Run with --help to see all examples.")
        sys.exit(1)

    if not check_ollama(args.ollama, args.model):
        sys.exit(1)

    exam = None
    if args.exam_id:
        print_step("🏫", "Fetching exam details…")
        all_exams = fetch_entity(args.base_url, args.api_key, "exams") or []
        exam = next((e for e in all_exams if e.get("id") == args.exam_id), None)
        if exam:
            print_ok(f"Exam: {exam['name']}")
        else:
            print_err(f"Exam {args.exam_id} not found — continuing without exam context")

    subject = None
    if args.subject_id:
        print_step("📚", "Fetching subject details…")
        all_subjects = fetch_entity(args.base_url, args.api_key, "subjects") or []
        subject = next((s for s in all_subjects if s.get("id") == args.subject_id), None)
        if subject:
            print_ok(f"Subject: {subject['name']}")
        else:
            print_err(f"Subject {args.subject_id} not found — will proceed without subject name")

    exam_name = exam["name"] if exam else ""
    subject_name = subject["name"] if subject else ""

    if args.topic_name:
        if args.count == 1:
            topics = [{"id": args.topic_id or "", "name": args.topic_name, "depth": 0, "pathNames": []}]
            print_ok(f"Freeform topic: {args.topic_name}")
        else:
            print_step("💡", f"Planning {args.count} distinct articles on '{args.topic_name}'…")
            ideas = ideate_articles(args.topic_name, exam_name, subject_name, args.count,
                                     template_type, args.model, args.ollama)
            topics = [
                {
                    "id": args.topic_id or "",
                    "name": idea["title"],
                    "_slug": idea.get("slug") or slugify(idea["title"]),
                    "_difficulty": idea.get("difficulty", "Intermediate"),
                    "_angle": idea.get("angle", ""),
                    "depth": 0,
                    "pathNames": [],
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

    success, failed = 0, 0
    for i, topic in enumerate(topics, 1):
        print()
        print(f"─── [{i}/{len(topics)}] ────────────────────────────────────")
        try:
            ok = process_topic(topic, exam, subject, args, template_type, build_prompt)
            success += int(ok)
            failed += int(not ok)
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
