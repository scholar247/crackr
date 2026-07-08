# MCQ Seeding API Reference

All seed endpoints live under `/api/seed/` and are authenticated with a static API key.
These endpoints are designed for programmatic bulk ingestion — they are **not** rate-limited but they do **dedup** automatically, so re-running the same data is safe.

---

## Base URL

| Environment | URL |
|---|---|
| **Production** | `https://scholar247.org` |
| Local | `http://localhost:3000` |

---

## Authentication

Every request **must** include the API key in the `Authorization` header.

```
Authorization: Bearer <SEED_API_KEY>
```

| Environment | Key |
|---|---|
| **Production** | `d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f` |
| Local (dev) | `f1348450339addd08b0b8fd141ee8890e77f65f256d0c06884f673a4463cbded` |

> The key is read from `SEED_API_KEY` in the server environment.
> Missing or invalid key → `401 Unauthorized`.

---

## Workflow Overview

```
1. GET /api/seed/lookup?type=exams          → get examId(s)
2. GET /api/seed/lookup?type=subjects       → get subjectId(s)
3. GET /api/seed/lookup?type=topics         → get topicId(s)  (requires subjectId)
4. POST /api/seed/mcqs                      → create MCQ(s)
```

Resolve IDs **once**, then cache them in your script. All IDs are stable UUIDs.

---

## Step 1 — Fetch Exams

```
GET /api/seed/lookup?type=exams
Authorization: Bearer <KEY>
```

**Response**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "NIMCET",
      "slug": "nimcet",
      "category": "MANAGEMENT",
      "subjectIds": ["<uuid>", "<uuid>"]
    }
  ]
}
```

**`category` values:** `ENGINEERING` | `MEDICAL` | `MANAGEMENT` | `BANKING` | `GOVERNMENT` | `SCHOOL` | `OTHER`

**curl**

```bash
curl -s "https://scholar247.org/api/seed/lookup?type=exams" \
  -H "Authorization: Bearer d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f" | jq .
```

---

## Step 2 — Fetch Subjects

```
GET /api/seed/lookup?type=subjects
Authorization: Bearer <KEY>
```

**Response**

```json
{
  "data": [
    { "id": "<uuid>", "name": "Mathematics", "slug": "mathematics" },
    { "id": "<uuid>", "name": "Reasoning",   "slug": "reasoning" }
  ]
}
```

Subjects are **global** (not scoped to an exam). An exam references subjects via its `subjectIds[]`.
To know which subjects belong to a specific exam, cross-reference the `subjectIds` array from the exam lookup above.

**curl**

```bash
curl -s "https://scholar247.org/api/seed/lookup?type=subjects" \
  -H "Authorization: Bearer d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f" | jq .
```

---

## Step 3 — Fetch Topics

Topics are **scoped to a subject**. You must pass `subjectId`.

```
GET /api/seed/lookup?type=topics&subjectId=<subjectId>
Authorization: Bearer <KEY>
```

**Response**

```json
{
  "data": [
    {
      "id": "<uuid>",
      "name": "Algebra",
      "slug": "algebra",
      "depth": 0,
      "parentId": null,
      "pathNames": []
    },
    {
      "id": "<uuid>",
      "name": "Quadratic Equations",
      "slug": "quadratic-equations",
      "depth": 1,
      "parentId": "<algebra-uuid>",
      "pathNames": ["Algebra"]
    }
  ]
}
```

**Depth meaning:**

| `depth` | Level |
|---|---|
| `0` | Chapter |
| `1` | Section |
| `2` | Sub-topic |

Always use the **most specific** (deepest) `topicId` that applies to your MCQ.

**curl**

```bash
curl -s "https://scholar247.org/api/seed/lookup?type=topics&subjectId=<SUBJECT_ID>" \
  -H "Authorization: Bearer d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f" | jq .
```

---

## Step 4 — Create MCQ(s)

```
POST /api/seed/mcqs
Authorization: Bearer <KEY>
Content-Type: application/json
```

Accepts a **single object** or a **JSON array** for bulk insert. Both are idempotent — a duplicate question (same `subjectId` + identical first-block text) is detected and returned without creating a second copy.

---

### Single MCQ

**Request body**

```json
{
  "subjectId":  "<uuid>",
  "topicId":    "<uuid>",
  "examIds":    ["<uuid>"],
  "examSectionIds": [],
  "questionType": "SINGLE",
  "difficulty": "MEDIUM",
  "question":   "If $x^2 - 5x + 6 = 0$, find the values of $x$.",
  "options": [
    { "content": "2 and 3", "isCorrect": true  },
    { "content": "1 and 6", "isCorrect": false },
    { "content": "3 and 4", "isCorrect": false },
    { "content": "2 and 5", "isCorrect": false }
  ],
  "explanation": "Factorising: $(x-2)(x-3)=0$ → $x=2$ or $x=3$.",
  "isPreviousYear": false,
  "isActive": true
}
```

**Response — created (201)**

```json
{
  "data": {
    "id": "<new-uuid>",
    "status": "DRAFT",
    "isActive": true,
    ...
  },
  "meta": { "existing": false }
}
```

**Response — duplicate (200)**

```json
{
  "data": { "id": "<existing-uuid>", ... },
  "meta": { "existing": true }
}
```

---

### Bulk MCQs (array)

Send an array — up to ~500 items per request is practical. Processing is sequential for duplicates safety.

**Request body**

```json
[
  {
    "subjectId": "<uuid>",
    "topicId":   "<uuid>",
    "examIds":   ["<uuid>"],
    "difficulty": "EASY",
    "question":  "What is $2 + 2$?",
    "options": [
      { "content": "3",  "isCorrect": false },
      { "content": "4",  "isCorrect": true  },
      { "content": "5",  "isCorrect": false },
      { "content": "22", "isCorrect": false }
    ]
  },
  { ... }
]
```

**Response (201 if at least one created)**

```json
{
  "data": {
    "results": [
      { "index": 0, "id": "<uuid>", "existing": false },
      { "index": 1, "id": "<uuid>", "existing": true  }
    ]
  },
  "meta": { "total": 2, "created": 1, "existing": 1, "failed": 0 }
}
```

---

### Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `subjectId` | `string` | ✅ | UUID from `/lookup?type=subjects` |
| `topicId` | `string` | ✅ | UUID from `/lookup?type=topics` |
| `examIds` | `string[]` | ✅ | At least one exam UUID |
| `examSectionIds` | `string[]` | — | Defaults to `[]` |
| `questionType` | `"SINGLE"` \| `"MULTIPLE"` | — | Defaults to `"SINGLE"` |
| `difficulty` | `"EASY"` \| `"MEDIUM"` \| `"HARD"` \| `"EXPERT"` | ✅ | |
| `question` | `string` \| `ContentBlock[]` | ✅ | Plain string or rich block array |
| `options` | `Option[]` | ✅ | 2–6 items, at least one `isCorrect: true` |
| `explanation` | `string` \| `ContentBlock[]` | — | |
| `hint` | `string` \| `ContentBlock[]` | — | |
| `tagIds` | `string[]` | — | Defaults to `[]` |
| `source` | `string` | — | Book/paper reference |
| `isPreviousYear` | `boolean` | — | Defaults to `false` |
| `isActive` | `boolean` | — | Defaults to `true` (published) |

**Option object**

```json
{ "content": "string or ContentBlock[]", "isCorrect": true }
```

**ContentBlock (rich content)**

```json
{ "type": "TEXT", "content": "Use $x^2$ for inline math" }
```

| `type` | Use |
|---|---|
| `TEXT` | Inline text with `$math$` / `$$block math$$` / `\ce{chemistry}` |
| `IMAGE` | `content` = image URL |
| `AUDIO` | `content` = audio URL |
| `VIDEO` | `content` = video URL |

> For most MCQs, passing a plain **string** for `question`, `options[].content`, and `explanation` is sufficient. The renderer parses `$...$` and `$$...$$` automatically.

---

## Other Seed Endpoints

These are less commonly needed but available for initial data setup.

### Create Subject

```
POST /api/seed/subjects
Authorization: Bearer <KEY>
Content-Type: application/json
```

```json
{
  "name": "Mathematics",
  "shortName": "Math",
  "description": "...",
  "iconName": "BookOpen",
  "color": "#6366f1",
  "isActive": true
}
```

Dedup key: `slug` (auto-derived from `name`). Returns existing if already present.

---

### Create Exam

```
POST /api/seed/exams
Authorization: Bearer <KEY>
Content-Type: application/json
```

```json
{
  "name": "NIMCET",
  "fullName": "NIT MCA Common Entrance Test",
  "category": "MANAGEMENT",
  "conductedBy": "NIT Raipur (Rotating)",
  "subjectIds": ["<math-uuid>", "<reasoning-uuid>"],
  "isFeatured": true,
  "isActive": true
}
```

Dedup key: `slug`. Note: `subjectIds` are **not merged** on an existing exam — use the admin UI for that.

---

### Create Topic

```
POST /api/seed/topics
Authorization: Bearer <KEY>
Content-Type: application/json
```

```json
{
  "name": "Algebra",
  "subjectId": "<uuid>",
  "parentId": null,
  "order": 0,
  "isActive": true
}
```

Dedup key: `(slug + subjectId + parentId)`. For a hierarchy, create parents first — child rows can reference newly created parent IDs in the same bulk array (processing is sequential).

**Bulk hierarchy example**

```json
[
  { "name": "Algebra",               "subjectId": "<sid>", "parentId": null,        "order": 0 },
  { "name": "Quadratic Equations",   "subjectId": "<sid>", "parentId": "<algebra-id>", "order": 0 },
  { "name": "Linear Equations",      "subjectId": "<sid>", "parentId": "<algebra-id>", "order": 1 }
]
```

> ⚠️ In a single bulk call the `parentId` must be an ID that **already exists in the database** — IDs from the same batch are not resolved inline. Create chapters first, then sections in a second call.

---

## Error Codes

| Status | Meaning |
|---|---|
| `200` | OK — item already existed (dedup hit) |
| `201` | Created |
| `400` | Validation failed — check `details.fieldErrors` |
| `401` | Missing or invalid API key |
| `500` | Server error — check server logs |

---

## Full curl Example (prod)

```bash
#!/bin/bash
BASE="https://scholar247.org"
KEY="d846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f"
AUTH="Authorization: Bearer $KEY"

# 1. Get all exams
curl -s "$BASE/api/seed/lookup?type=exams" -H "$AUTH" | jq '.'

# 2. Get all subjects
curl -s "$BASE/api/seed/lookup?type=subjects" -H "$AUTH" | jq '.'

# 3. Get topics for Mathematics (replace SUBJECT_ID)
SUBJECT_ID="<paste-math-subject-id>"
curl -s "$BASE/api/seed/lookup?type=topics&subjectId=$SUBJECT_ID" -H "$AUTH" | jq '.'

# 4. Create a single MCQ (replace IDs)
curl -s -X POST "$BASE/api/seed/mcqs" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "<SUBJECT_ID>",
    "topicId":   "<TOPIC_ID>",
    "examIds":   ["<EXAM_ID>"],
    "difficulty": "MEDIUM",
    "question":  "What is the sum of first $n$ natural numbers?",
    "options": [
      { "content": "$\\frac{n(n+1)}{2}$",  "isCorrect": true  },
      { "content": "$n^2$",                 "isCorrect": false },
      { "content": "$\\frac{n(n-1)}{2}$",  "isCorrect": false },
      { "content": "$2n$",                  "isCorrect": false }
    ],
    "explanation": "Standard formula: $S = \\frac{n(n+1)}{2}$."
  }' | jq '.'
```
