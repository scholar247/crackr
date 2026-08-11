You are a content writer for scholar247, an Indian competitive-exam prep platform. Generate blog articles as a strict JSON array — one article per exam listed below — profiling the top schools/colleges/institutes relevant to each exam.

## Output contract (must match exactly)

Return ONLY a JSON array. No markdown code fences, no commentary before or after, no trailing commas.

Each array element is an object with exactly these fields:

- "title": string, 3–160 chars. E.g. "Top Medical Colleges Accepting NEET-UG Scores".
- "slug": string, 3–160 chars, kebab-case, url-safe (lowercase letters, digits, hyphens only). Derive from title.
- "summary": string, max 500 chars. One or two sentences, no markdown, used ion.
- "body": string, markdown (GitHub-Flavored Markdown — tables, bold, lists all supported; math via $...$/$$...$$ is also supported but not needed here). This is the full article
  content. Escape all quotes/backslashes/newlines correctly for valid JSON str
- "status": always the literal string "PUBLISHED".
- "visibility": always the literal string "PUBLIC".

Do not include any other fields (no id, no author, no dates, no tags — the p

## Content brief (applies to every article's "body")

Structure each article body as:
1. A 2–3 sentence intro paragraph giving context on the exam and why institute choice matters.
2. A "## Top Institutes" section listing 8–12 institutes as a bulleted list,
   **Institute Name** (City) — one-line note on what it's known for (specialization, legacy, outcomes). Keep each note factual and generic ("a leading choice for X"), not a
   specific numbered ranking, and do not invent NIRF ranks, cutoff scores, fee istics you cannot verify — if unsure, describe reputation qualitativelyinstead of quoting a number. link also
3. A short closing "## How to Choose" paragraph (2–4 sentences) with genericon, specialization fit, infrastructure, alumni outcomes) — nothingtime-sensitive (no "this year's cutoff" type claims).

Tone: neutral, informative, editorial — not promotional/marketing copy. Avoid superlatives you can't back up ("the best", "guaranteed placements").

## Exams to cover (one article each, 13 total)

For each, the institute type to profile is noted in parentheses:

1. AIIMS-UG (top AIIMS campuses / medical colleges now reached via NEET-UG counselling — note the historical merger briefly)
2. BHU-MCA (top MCA-granting institutes reachable via this exam)
3. CBSE Class 10 Board (top CBSE-affiliated schools, not colleges)
4. CBSE Class 12 Board (top CBSE-affiliated senior secondary schools)
5. CUET-UG (top central universities accepting CUET-UG scores)
6. GATE-CSE (top M.Tech/PSU destinations for GATE-CSE — IITs, NITs, PSUs)
7. GATE-ECE (top M.Tech/PSU destinations for GATE-ECE)
8. JEE Advanced (top IITs)
9. JEE Main (top NITs, IIITs, GFTIs)
10. JIPMER-UG (JIPMER campuses — note it's now via NEET-UG counselling)
11. NEET-UG (top medical colleges in India, general list)
12. NIMCET (top NIT MCA programs)
13. UPSEE (top UP state engineering colleges — note that many seats are now via JEE Main; keep this brief and factual)

Generate exactly 13 objects in the output array, one per exam above, in the same order.                                                                                           
---

The script is ready at scripts/submit-articles.ts. Here's the workflow that avoids burning Claude tokens after this point:

1. Generate content once with Gemini using the prompt from before — save its JSON array output to a file, e.g. articles.json. (Make sure Gemini's raw text response is the array itself, or strip any wrapping code fences before saving.)

2. Preview it (no submission, no API key needed):
   npx tsx scripts/submit-articles.ts articles.json --dry-run
   This validates every object has title/body and shows what would be sent — catches malformed entries before anything touches your DB.

3. Submit to dev first, to sanity-check rendering:
   SEED_API_KEY=<from .env.development> API_BASE_URL=http://localhost:3000 npx tsx scripts/submit-articles.ts articles.json

4. Submit to production once you're happy:
   SEED_API_KEY=<from .env.production> API_BASE_URL=https://scholar247.org npx tsx scripts/submit-articles.ts articles.json

It prints a per-article ✓/✗ line (with the new numeric id and final slug on success), continues past individual failures instead of aborting the whole batch, and exits non-zero if anything failed so you can tell at a glance in a terminal/CI log.

This is entirely self-contained — reading the JSON file and doing a fetch POST loop — so you (or Gemini/Codex itself, if you want it to run the submission step too) can reuse it indefinitely without needing me involved again. If you ever want the "manual" path instead (pasting into the admin UI form one at a time), the JSON-escaping issue from your last message is exactly why: the UI form's markdown editor expects real newlines, so that path only works if whatever you paste from has already been JSON-decoded, same as this script does automatically.