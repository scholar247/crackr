#!/usr/bin/env python3
from __future__ import annotations
"""
Scholar247 Blog Generator — Subject Orchestrator (Gemini-powered)
=====================================================================
Give it a --subject-id and it will:

  1. Fetch the subject's topic tree from the live API (scholar API).
  2. Fetch every blog already created for that subject (any status), and merge
     that with a local cache (scripts/blog_state.json) so re-runs never
     re-ideate or re-generate an angle that already exists.
  3. For each topic still short of coverage, ask Gemini to brainstorm several
     DISTINCT, specific sub-blog angles (e.g. "Sorting Algorithms" → Bubble
     Sort, Quick Sort, Merge Sort, Stability comparison, ...) — explicitly
     told to avoid what's already covered.
  4. Generate a full, code-included article per angle (reuses the coding
     template from generate_blogs_coding.py — this script is CS-first).
  5. Run an editorial "polish" pass that rewrites for a human voice and
     scores SEO / readability / factual consistency / grammar / heading
     engagement, then POSTs the final article as a DRAFT blog.

USAGE:
  python generate_blogs_subject.py --subject-id <uuid> --exam-id <uuid>
  python generate_blogs_subject.py --subject-id <uuid> --topics-limit 10 --blogs-per-topic 6
  python generate_blogs_subject.py --subject-id <uuid> --dry-run --output-dir ./out

PREREQUISITES:
  pip install requests markdown2 python-dotenv
  GEMINI_API_KEY in scripts/.env (or --gemini-api-key / env var)
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path
from types import SimpleNamespace

from blog_common import (
    DEFAULT_BASE_URL, DEFAULT_GEMINI_MODEL, DEFAULT_STATE_FILE, LOCAL_SEED_KEY, PROD_SEED_KEY,
    OLLAMA_BASE, DEFAULT_MODEL, SLEEP_BETWEEN, QA_MIN_SCORE_DEFAULT,
    fetch_entity, fetch_topics_flat, fetch_existing_blogs, post_blog,
    check_gemini, check_ollama, get_gemini_api_key, generate_text,
    slugify, markdown_to_html, build_blog_payload, polish_article, print_qa_report,
    load_state, save_state, seed_state_from_remote, state_existing_titles, state_record_blog,
    print_step, print_ok, print_err,
)
from generate_blogs_coding import build_prompt as build_coding_prompt

IDEATION_PROMPT_CS = """\
You are a content strategist for a computer-science exam-prep blog (GATE / NIMCET / \
placements / technical interviews).

Broad topic: {TOPIC}
Exam context: {EXAM}
Subject: {SUBJECT}

Generate exactly {COUNT} DISTINCT, SPECIFIC article ideas that together give \
comprehensive coverage of "{TOPIC}". For a broad topic like "Sorting Algorithms" you \
would propose one idea per algorithm/variant (Bubble Sort, Quick Sort, Merge Sort, ...) \
or per angle (stability comparison, in-place vs not, best sort for nearly-sorted data) \
— never one vague overview article.

{EXCLUSION_BLOCK}

Rules:
- Each idea must be a genuinely different sub-topic or angle — no near-duplicates of \
each other or of the already-covered list above
- Titles must be SPECIFIC and written the way a student would actually search (SEO intent)
- Mix difficulty levels across the set: some Beginner, some Intermediate, some Advanced
- Every idea should be something a student preparing for {EXAM} would realistically search for

Return ONLY a JSON array with EXACTLY {COUNT} objects (no markdown fences, no commentary):
[
  {{
    "title": "Specific article title (50-75 chars)",
    "slug": "specific-url-friendly-slug",
    "difficulty": "Beginner",
    "angle": "One sentence describing what makes this article unique",
    "primaryKeyword": "main search phrase for this specific article"
  }}
]
"""


def ideate_cs_articles(topic_name: str, exam_name: str, subject_name: str, count: int,
                        existing_titles: list[str], args: argparse.Namespace) -> list[dict]:
    if existing_titles:
        exclusion = (
            "Articles ALREADY PUBLISHED on this topic (do NOT duplicate these — "
            "propose different sub-topics/angles):\n" + "\n".join(f"- {t}" for t in existing_titles)
        )
    else:
        exclusion = ""

    prompt = IDEATION_PROMPT_CS.format(
        TOPIC=topic_name, EXAM=exam_name or "competitive exams", SUBJECT=subject_name or topic_name,
        COUNT=count, EXCLUSION_BLOCK=exclusion,
    )
    try:
        raw = generate_text(prompt, args, temperature=0.8, max_output_tokens=4096)
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
        ideas = json.loads(raw)
        if not isinstance(ideas, list):
            raise ValueError("Response is not a JSON array")

        seen_slugs = {slugify(t) for t in existing_titles}
        clean = []
        for idea in ideas:
            title = idea.get("title", "").strip()
            if not title:
                continue
            slug = idea.get("slug") or slugify(title)
            if slug in seen_slugs:
                slug = f"{slug}-{len(clean) + 1}"
            seen_slugs.add(slug)
            idea["slug"] = slug
            idea["title"] = title
            clean.append(idea)

        print_ok(f"Planned {len(clean)} new article(s) for '{topic_name}'")
        for i, idea in enumerate(clean, 1):
            print(f"     {i:2}. {idea['title'][:70]}  [{idea.get('difficulty', 'Intermediate')}]")
        return clean
    except Exception as e:
        print_err(f"Ideation failed for '{topic_name}' ({e}) — skipping this topic")
        return []


def build_metadata(idea: dict, topic_name: str, exam_name: str, subject_name: str) -> dict:
    title = idea["title"]
    keyword = (idea.get("primaryKeyword") or title).lower()
    description = f"Learn {title} with clear explanations, code, and exam-focused practice"
    description += f" for {exam_name}." if exam_name and exam_name != "General" else "."
    return {
        "title": title,
        "seoTitle": title[:60],
        "metaDescription": description[:155],
        "slug": idea["slug"],
        "primaryKeyword": keyword,
        "keywords": list(dict.fromkeys(filter(None, [
            keyword, topic_name.lower(),
            subject_name.lower() if subject_name and subject_name != "General" else None,
            exam_name.lower() if exam_name and exam_name != "General" else None,
        ]))),
        "tags": list(dict.fromkeys(filter(None, [
            slugify(topic_name),
            slugify(subject_name) if subject_name and subject_name != "General" else None,
            slugify(idea.get("difficulty", "")),
        ]))),
    }


def process_idea(idea: dict, topic: dict, exam: dict | None, subject: dict | None,
                  args: argparse.Namespace, state: dict) -> bool:
    topic_name = topic.get("name", "Unknown Topic")
    topic_id = topic.get("id") or None
    exam_name = exam.get("name", "General") if exam else "General"
    subject_name = subject.get("name", "General") if subject else "General"
    subject_id = subject["id"] if subject else args.subject_id

    metadata = build_metadata(idea, topic_name, exam_name, subject_name)
    print()
    print_step("📝", f"{topic_name} → {metadata['title'][:70]}")

    code_args = SimpleNamespace(code=args.code)
    prompt = build_coding_prompt(
        metadata["title"], exam_name, subject_name, idea.get("difficulty", "Intermediate"),
        idea.get("angle", ""), code_args,
    )

    print_step("🤖", f"Generating draft with {args.engine}…")
    t0 = time.time()
    try:
        draft_md = generate_text(prompt, args, temperature=0.75, max_output_tokens=16384)
    except Exception as e:
        print_err(f"Generation failed: {e}")
        return False
    print_ok(f"Drafted {len(draft_md.split()):,} words in {time.time() - t0:.0f}s")

    if args.skip_polish:
        final_md, qa_report = draft_md, {}
    else:
        print_step("✏️", "Running editorial polish pass (SEO / readability / factual / grammar / headings)…")
        final_md, qa_report = polish_article(draft_md, metadata["title"], metadata["primaryKeyword"], args)
        print_qa_report(qa_report, args.min_score)

    html_content = markdown_to_html(final_md)

    if args.output_dir:
        out_path = Path(args.output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / f"{metadata['slug']}.md").write_text(final_md, encoding="utf-8")
        print_ok(f"Saved markdown → {out_path / (metadata['slug'] + '.md')}")

    record = {
        "title": metadata["title"], "slug": metadata["slug"],
        "difficulty": idea.get("difficulty", ""), "qa": {k: v for k, v in qa_report.items()
                                                           if k != "issues_found"},
    }

    if args.dry_run:
        print_ok("Dry run — skipping API POST")
        record["posted"] = False
        record["note"] = "dry-run"
        state_record_blog(state, subject_id, subject_name, topic_id, topic_name, record)
        return True

    payload = build_blog_payload(metadata, html_content, args.exam_id, subject_id, topic_id)
    payload["status"] = "PUBLISHED" if args.publish else "DRAFT"

    print_step("🚀", "Posting to API…")
    result = post_blog(args.base_url, args.api_key, payload)
    if not result:
        return False

    print_ok(f"Created blog: id={result.get('id')}  slug={result.get('slug')}  status={payload['status']}")
    record["posted"] = True
    record["id"] = result.get("id")
    state_record_blog(state, subject_id, subject_name, topic_id, topic_name, record)
    return True


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Scholar247 Blog Generator — Subject Orchestrator (Gemini-powered, CS-first)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--subject-id", dest="subject_id", required=True, help="Subject UUID (required)")
    p.add_argument("--exam-id", dest="exam_id", help="Exam UUID (optional context / association)")
    p.add_argument("--topic-id", dest="topic_id", help="Limit to a single topic UUID within the subject")
    p.add_argument("--topics-limit", dest="topics_limit", type=int, default=5,
                    help="Max number of topics to process this run (default: 5)")
    p.add_argument("--blogs-per-topic", dest="blogs_per_topic", type=int, default=4,
                    help="Target distinct blogs per topic, existing coverage counts toward this (default: 4)")

    p.add_argument("--engine", choices=["gemini", "ollama"], default="gemini",
                    help="Generation backend (default: gemini)")
    p.add_argument("--gemini-api-key", dest="gemini_api_key",
                    help="Gemini API key (default: GEMINI_API_KEY env / scripts/.env)")
    p.add_argument("--gemini-model", dest="gemini_model", default=DEFAULT_GEMINI_MODEL,
                    help=f"Gemini model id (default: {DEFAULT_GEMINI_MODEL})")
    p.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model name (only used with --engine ollama)")
    p.add_argument("--ollama", default=OLLAMA_BASE, help="Ollama base URL (only used with --engine ollama)")

    p.add_argument("--no-code", dest="code", action="store_false",
                    help="Skip the multi-language Code Implementation section (default: included)")
    p.set_defaults(code=True)
    p.add_argument("--skip-polish", action="store_true",
                    help="Skip the SEO/readability/grammar/factual editorial pass")
    p.add_argument("--min-score", dest="min_score", type=int, default=QA_MIN_SCORE_DEFAULT,
                    help=f"QA score threshold to flag for manual review (default: {QA_MIN_SCORE_DEFAULT})")

    p.add_argument("--base-url", default=DEFAULT_BASE_URL, dest="base_url", help="Scholar247 API base URL")
    p.add_argument("--api-key", dest="api_key", help="Seed API key (auto-detected from base URL if not set)")
    p.add_argument("--state-file", dest="state_file", default=str(DEFAULT_STATE_FILE),
                    help=f"Local coverage-tracking JSON file (default: {DEFAULT_STATE_FILE})")
    p.add_argument("--output-dir", dest="output_dir", help="Also save generated markdown to this local directory")
    p.add_argument("--dry-run", action="store_true", help="Generate content but skip API POST")
    p.add_argument("--publish", action="store_true", help="Create blogs as PUBLISHED instead of DRAFT")
    p.add_argument("--sleep", type=float, default=SLEEP_BETWEEN, help="Seconds to sleep between generations")
    return p


def main() -> None:
    args = build_arg_parser().parse_args()

    if not args.api_key:
        args.api_key = LOCAL_SEED_KEY if "localhost" in args.base_url else PROD_SEED_KEY
    if args.engine == "gemini":
        args.gemini_api_key = get_gemini_api_key(args.gemini_api_key)

    print("═" * 60)
    print("  Scholar247 Blog Generator — Subject Orchestrator")
    print(f"  API:      {args.base_url}")
    print(f"  Engine:   {args.engine}" + (f" ({args.gemini_model})" if args.engine == "gemini" else f" ({args.model})"))
    print("═" * 60)

    engine_ok = check_gemini(args.gemini_api_key, args.gemini_model) if args.engine == "gemini" \
        else check_ollama(args.ollama, args.model)
    if not engine_ok:
        sys.exit(1)

    print_step("📚", "Fetching subject details…")
    all_subjects = fetch_entity(args.base_url, args.api_key, "subjects") or []
    subject = next((s for s in all_subjects if s.get("id") == args.subject_id), None)
    if not subject:
        print_err(f"Subject {args.subject_id} not found")
        sys.exit(1)
    subject_name = subject["name"]
    print_ok(f"Subject: {subject_name}")

    exam = None
    if args.exam_id:
        print_step("🏫", "Fetching exam details…")
        all_exams = fetch_entity(args.base_url, args.api_key, "exams") or []
        exam = next((e for e in all_exams if e.get("id") == args.exam_id), None)
        if exam:
            print_ok(f"Exam: {exam['name']}")
        else:
            print_err(f"Exam {args.exam_id} not found — continuing without exam context")

    print_step("🗂️", "Fetching topics…")
    topics = fetch_topics_flat(args.base_url, args.api_key, args.subject_id, args.topic_id)
    if not topics:
        print_err("No topics found. Check --subject-id / --topic-id values.")
        sys.exit(1)
    topics = topics[: args.topics_limit]
    print_ok(f"Found {len(topics)} topic(s) to evaluate")

    print_step("🔎", "Fetching already-created blogs for this subject…")
    existing_blogs = fetch_existing_blogs(args.base_url, args.api_key, args.subject_id)
    print_ok(f"{len(existing_blogs)} blog(s) already exist on the server for this subject")

    state_path = Path(args.state_file)
    state = load_state(state_path)
    seed_state_from_remote(state, args.subject_id, subject_name, existing_blogs)
    save_state(state, state_path)

    total_created, total_failed, total_skipped = 0, 0, 0

    for i, topic in enumerate(topics, 1):
        topic_name = topic.get("name", "Unknown Topic")
        topic_id = topic.get("id") or None
        path_label = " › ".join(topic.get("pathNames", [])) + (" › " if topic.get("pathNames") else "") + topic_name

        print()
        print(f"─── [{i}/{len(topics)}] {path_label} ────────────────────────────────")

        existing_titles = state_existing_titles(state, args.subject_id, topic_id, topic_name)
        slots = args.blogs_per_topic - len(existing_titles)
        if slots <= 0:
            print_ok(f"Already has {len(existing_titles)} blog(s) — target met, skipping")
            total_skipped += 1
            continue

        print_step("💡", f"Planning {slots} new article(s) (already have {len(existing_titles)})…")
        ideas = ideate_cs_articles(topic_name, exam["name"] if exam else "", subject_name, slots,
                                    existing_titles, args)
        if not ideas:
            total_failed += 1
            continue

        for idea in ideas:
            try:
                ok = process_idea(idea, topic, exam, subject, args, state)
            except KeyboardInterrupt:
                print("\nInterrupted by user")
                save_state(state, state_path)
                print(f"\nDone — {total_created} created, {total_failed} failed, {total_skipped} topics skipped")
                return
            except Exception as e:
                print_err(f"Unexpected error: {e}")
                ok = False

            total_created += int(ok)
            total_failed += int(not ok)
            save_state(state, state_path)

            if args.sleep:
                time.sleep(args.sleep)

    print()
    print("═" * 60)
    print(f"  Done — {total_created} created, {total_failed} failed, {total_skipped} topics already covered")
    print(f"  State saved to {state_path}")
    print("═" * 60)


if __name__ == "__main__":
    main()
