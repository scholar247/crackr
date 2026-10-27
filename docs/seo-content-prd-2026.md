# PRD — Prep Diary organic content growth

**Owner:** Growth + Content + Product  
**Status:** Proposed  
**Market:** India first; international study-abroad second  
**Planning horizon:** 2 quarters

## 1. Summary

Build an authoritative discovery layer around examinations, admissions and preparation. Each reader should be able to progress from a Google query such as “NEET 2026 syllabus PDF”, “JEE Main rank 25,000 colleges” or “IELTS 7.0 universities in Canada” to a verified answer, a personalised next step, and then relevant Prep Diary practice or mock tests.

The recommended launch order is:

1. India national UG admissions: NEET-UG, JEE Main/Advanced, CUET-UG.
2. India jobs and PG: SSC CGL, UPSC CSE, CAT, GATE, CLAT, NIMCET.
3. India state admission clusters: KCET/COMEDK/MHT-CET, then WBJEE and TS EAMCET/AP EAPCET.
4. International, focused on Indian outbound students: IELTS, PTE, TOEFL, SAT, GRE and GMAT.

Do **not** begin with a generic “all exams” blog strategy. The winning units are useful, maintainable decision pages: rank-vs-college tables, category/state cutoff data, score targets, official syllabus breakdowns and programme/country eligibility guides.

## 2. Evidence and interpretation

### What the live SERPs indicate

Research on Google India (7 August 2026) consistently returned specialist pages for these page shapes:

| Search-intent pattern | What appears in the result pages | Product implication |
| --- | --- | --- |
| `[exam] cutoff [year]` | Exam, state/category, round and college-specific cutoff pages | Structured tables, yearly versions and a historical archive are table stakes. |
| `[exam] rank wise colleges` / `[exam] marks vs rank` | Rank-band lists and “safe score” explainers | Create an input-led college finder, with a crawlable static version for every major rank band. |
| `top colleges [course/state]` | Rankings combined with fees, placements, admissions and cutoffs | A college page must answer outcomes and admission likelihood, not merely show a ranking. |
| `[exam] syllabus [year] PDF` | Official-syllabus explainers and downloadable material | Publish the official source first, then subject/chapter weightage and an immediate practice CTA. |
| `[test] accepting colleges/universities` | Country, score range and tuition/eligibility pages | Use score bands rather than the misleading word “cutoff” for international admissions. |

For example, the observed results emphasised KCET cutoff and rank-wise college lists, JEE rank-wise colleges, NEET score/rank/cutoff content, and SAT/GMAT accepting-college or score-range pages. This demonstrates strong search intent and entrenched competition; it is not an estimate of exact monthly Google keyword volume.

### Demand proxies

Exact keyword volume requires Google Keyword Planner, Google Search Console, or a paid SEO data source. Until that access is available, prioritise by (a) annual candidate pool, (b) number of decision combinations (course × college × category/state/round), (c) recurring annual freshness, and (d) direct fit with Prep Diary practice.

NTA’s 2025 NEET result reporting shows **22,76,069 registrations**, demonstrating the scale of medical-admissions demand. CUET is used for UG admissions at central and participating universities. These are strong volume signals, alongside the broad JEE ecosystem. [NTA NEET reporting](https://medicine.careers360.com/articles/how-many-students-appeared-for-neet) and [CUET official site](https://cuet.nta.nic.in/).

## 3. Users and jobs to be done

| Audience | Primary job | Critical answer |
| --- | --- | --- |
| Class 10–12 student (India) | Select a course/exam and prepare | “What exam should I take, what is the syllabus, and can I get a good college at my score?” |
| UG applicant | Convert rank into a realistic counselling list | “Which colleges/branches can I get by category, quota and state?” |
| PG/MBA applicant | Choose test and programme | “Which test, score and profile do I need for this programme?” |
| Government-job candidate | Build a study plan | “Am I eligible, what is the pattern, and what should I practise today?” |
| Study-abroad applicant | Choose country/test/university | “Which universities accept my score, what are the requirements, and what should I improve?” |

## 4. Content product requirements

### 4.1 Required page types

| Page type | User value | SEO title pattern | Required fields | Prep Diary conversion |
| --- | --- | --- | --- | --- |
| Exam hub | One reliable starting point | `[Exam] [Year]: Dates, Syllabus, Pattern, Eligibility & Prep` | official link, dates, eligibility, pattern, syllabus, fees, FAQs, update log | “Start free practice” and exam-specific mock CTA |
| Syllabus hub | Know what to study | `[Exam] Syllabus [Year]: Subject-wise Topics, PDF & Weightage` | source PDF/link, version date, topics, subject/chapter tags, changes | Create a 7/30/90-day plan |
| Cutoff hub | Assess admission likelihood | `[Exam] Cutoff [Year]: College, Course, Category & Round-wise` | counselling authority, round, quota, category, course, opening/closing rank, source | “Find colleges for my rank” |
| Rank/score predictor | Shortlist realistic options | `[Exam] Rank vs Marks [Year]: Score, Percentile & College Predictor` | score/rank input, confidence range, assumptions, historical method | Save shortlist; take diagnostic mock |
| College/programme profile | Compare a single decision | `[College] [Course] Admission [Year]: Cutoff, Fees, Placements & Ranking` | course, seats, accepted exams, cutoffs, fees, placement source/year, rankings and methodology | Compare/save + related exam practice |
| Comparison guide | Resolve choice | `[Exam A] vs [Exam B]: Syllabus, Difficulty, Colleges & Career Paths` | decision criteria, eligibility, dates, accepted colleges, prep overlap | Pick a path and start practice |
| Study plan | Move from research to action | `[Exam] [N]-Month Study Plan [Year]` | topic sequence, weekly targets, mock cadence, revision path | One-click plan creation |

### 4.2 Data and editorial rules

- Every time-sensitive field must display **“last verified”**, source URL, source date, and the editorial review owner.
- Show official information as fact. Label projected cutoffs, score targets and ranks as estimates, state their method, and never claim certainty.
- Store cutoff data as rows, not prose. Required dimensions: exam year, counselling authority, college, campus, course, programme, quota, category, gender, round, opening rank, closing rank and source.
- Separate central counselling (for example JoSAA/MCC) from state counselling. Never merge them into one “cutoff” value.
- Programme pages should cite the ranking agency and ranking year (NIRF/QS/THE/other); do not present rankings as a universal quality score.
- Use a consistent localisation model: `India → state → city`, and `International → country → university`.

## 5. Highest-priority India clusters

Priority is a traffic-and-conversion assessment, not a claimed keyword-volume ranking.

| Priority | Exam/programme cluster | Why it matters | First content batch |
| --- | --- | --- | --- |
| P0 | **NEET-UG → MBBS/BDS/AYUSH** | Very large candidate pool and extremely high state/category/college cutoff intent; perfect mock/practice fit | NEET hub; syllabus; marks-vs-rank; All India + 10 high-demand state cutoffs; 50 medical-college profiles |
| P0 | **JEE Main/Advanced → BTech/BArch** | Broad national demand; rank × college × branch × quota creates many valuable pages | JEE hubs; syllabus; percentile/rank; JoSAA rank-wise college finder; IIT/NIT/IIIT branch pages |
| P0 | **CUET-UG → BA/BCom/BSc/BBA** | Cross-discipline audience and recurring university/course cutoff demand | CUET hub; subject syllabus; DU/BHU/JMI/central-university course pages; score-to-course guide |
| P1 | **SSC CGL/CHSL/MTS/CPO → government jobs** | Large, repeat-use audience; syllabus, eligibility, vacancies, PYQs and practice align tightly | SSC exam family hub; tier-pattern guides; subject/topic practice pages; post-wise eligibility/salary pages |
| P1 | **UPSC CSE → IAS/IPS/IFS** | High topical interest and exceptional study-plan/PYQ intent, though smaller conversion audience | UPSC hub; Prelims/Mains syllabus; optional-subject hubs; PYQ topic maps; 12-month plan |
| P1 | **CAT → MBA/IIM** | High-value PG and college-comparison intent | CAT hub; syllabus; percentile-to-IIM/call predictor; IIM programme profiles; CAT vs XAT/NMAT/SNAP |
| P1 | **GATE → MTech/PSU** | Subject-specific practice gives strong product fit | GATE hub by paper; syllabus/weightage; score-vs-rank; IIT/NIT MTech and PSU guides |
| P1 | **CLAT/AILET → Law** | High-intent, contained college universe, strong rank/cutoff pages | CLAT hub; syllabus; rank-wise NLUs; NLU profiles; CLAT vs AILET |
| P2 | **KCET + COMEDK + MHT-CET → Karnataka/Maharashtra engineering** | SERPs visibly reward rank-wise college and round-wise cutoff pages; regional reach | Separate hubs, 2026 cutoffs, rank bands, college/branch tables and state-counselling explainers |
| P2 | **NIMCET → MCA** | Existing platform support; lower volume but very strong practice relevance | Refresh hub, syllabus, rank-vs-NIT/campus, eligibility and PYQ plan |
| P2 | **WBJEE, TS EAMCET/AP EAPCET, KEAM** | Expand after the P0/P1 template and data pipeline work | State-specific pages only where reliable counselling data can be maintained |

### India title bank

Publish titles with the current year token, but preserve a stable evergreen canonical page plus an annual snapshot where dates/cutoffs materially change.

| Cluster | Search-title templates |
| --- | --- |
| Syllabus | `[Exam] syllabus [Year] PDF`, `[Exam] chapter-wise syllabus and weightage`, `[Exam] deleted syllabus [Year]`, `[Exam] subject-wise study plan` |
| Dates/eligibility | `[Exam] [Year] registration date, exam date and fees`, `[Exam] eligibility [Year]: age, marks, attempts and subjects`, `[Exam] application form: documents and photo size` |
| Scores | `[Exam] marks vs rank [Year]`, `[Exam] percentile vs rank [Year]`, `is [score/rank] good for [exam]?`, `[Exam] safe score for [college/course]` |
| Cutoffs | `[Exam] cutoff [Year]`, `[College] [course] cutoff [Exam] [Year]`, `[Exam] cutoff for [category/quota/state]`, `[Exam] round-wise closing rank` |
| Colleges | `best colleges for [course] in [state]`, `[exam] rank [band] colleges`, `[college] [course] fees, cutoff, placement and ranking`, `top [course] colleges accepting [exam]` |
| Preparation | `[Exam] previous year papers with solutions`, `[Exam] mock test free`, `[Exam] [N]-month timetable`, `[subject] important chapters for [exam]` |

## 6. International / outbound India clusters

Do not frame international admissions as a single cutoff. Universities assess a profile; show disclosed minimums/typical ranges, test-policy status and source year.

| Priority | Test/programme cluster | Core markets | First content batch |
| --- | --- | --- | --- |
| P0 | **IELTS Academic + PTE + TOEFL** | UK, Canada, Australia, US, Ireland, Germany | Test comparison; score conversion explainer; country/university acceptance guides; programme-level language-score pages |
| P0 | **SAT → undergraduate admissions** | US, India, Singapore, UAE, Europe | Digital SAT syllabus; score range guides; test-optional policy tracker; US/India/Singapore university profiles |
| P1 | **GRE → MS/PhD** | US, Canada, Germany, Europe | GRE syllabus; score range by subject/university; GRE-waiver tracker; MS CS/data-science programme pages |
| P1 | **GMAT Focus → MBA/MiM** | US, UK, Europe, Canada, Singapore | GMAT format; school score ranges; GMAT vs GRE; MBA/MiM country and school profiles |
| P2 | **US high school: AP/ACT** | US and international schools | Start only if product will support its subject-level question bank; otherwise content-to-practice handoff is weak |
| P2 | **Professional credentials: CFA/ACCA/CPA** | Global/India | Valuable career intent; add when the content team has credential expertise and a distinct prep offering |

### International title bank

- `IELTS 7 band universities in [country] [Year]`
- `PTE vs IELTS: score comparison, acceptance and which to choose`
- `TOEFL accepted universities in [country] [Year]`
- `SAT score for [university] [Year]: range, policy and admission profile`
- `SAT accepting colleges in India / [country]`
- `GRE score for MS in [subject] at [university]`
- `GRE waived universities for MS in [country] [Year]`
- `GMAT score for [business school]: class profile and requirements`
- `best universities for [programme] in [country]: ranking, fees, requirements and outcomes`
- `[university] MS [programme] requirements for Indian students [Year]`

## 7. Experience requirements

### Navigation and templates

1. Add a public **Exams** index with filters: goal (UG/PG/jobs/study abroad), stream, country/state, exam date and mode.
2. Every exam hub contains tabs for Overview, Syllabus, Pattern, Dates, Cutoffs/Score, Colleges, PYQs and Practice.
3. Create a structured college explorer with filters appropriate to each funnel: exam, rank/score, course/branch, location, category/quota, fee band and ranking source.
4. Every content page has one context-specific CTA, not a generic sign-up wall. Examples: “Practise Biology for NEET”, “Take CAT Quant diagnostic”, “Build my 90-day plan”.
5. Include a non-intrusive saved-state feature: saved exam, target score/rank, shortlisted colleges and current preparation plan.

### SEO and technical acceptance criteria

- Server-rendered pages with a unique title, description, canonical URL, breadcrumb and `lastReviewed` date.
- Implement JSON-LD where eligible: `BreadcrumbList`, `FAQPage`, `Course` only when it truly represents a course, and `ItemList` for an ordered college/rank list. Do not add misleading `AggregateRating` or fabricated FAQ markup.
- A static, indexable equivalent exists for each predictor/list result. Interactive filters must not hide core content from crawlers.
- Use `Article` schema on editorial explainers, with author/reviewer identity and sources.
- Sitemaps segment pages by type: exam, syllabus, cutoff, college, programme and article. Exclude thin parameter combinations and stale annual pages with no historical value.
- Meet Core Web Vitals on mobile. Tables need responsive progressive disclosure and downloadable CSV only when the underlying source licence permits it.

## 8. Content roadmap

| Phase | Scope | Output | Exit criterion |
| --- | --- | --- | --- |
| 0 — Weeks 1–2 | Data model, source policy, template design | One exam template, one cutoff table, one college template, editorial checklist | Each page can show source, review date and structured fields |
| 1 — Weeks 3–6 | P0 India | NEET/JEE/CUET hubs, 12 supporting pages each, first 100 verified college/course rows | Pages indexed; practice CTAs connected; data QA sample passes |
| 2 — Weeks 7–10 | India admission utility | JoSAA/MCC-style cutoff browser, score/rank pages, 100 additional profiles | User can complete shortlist-to-practice journey |
| 3 — Weeks 11–14 | P1 India | SSC, CAT, GATE, CLAT, UPSC foundations | ≥60% of pages have an exam-specific preparation CTA |
| 4 — Weeks 15–18 | International MVP | IELTS/PTE/TOEFL/SAT/GRE/GMAT guide clusters and 50 university/programme pages | Clearly separated policy vs typical-score data |

## 9. Measurement

### North-star metric

**Qualified organic learners who begin an exam-specific practice session or mock within 14 days of a content visit.**

### Supporting metrics

| Funnel | Metric | Initial target |
| --- | --- | --- |
| Discovery | Non-brand impressions and clicks to priority clusters | +20% QoQ after indexing baseline |
| Quality | % of priority pages with official source + review date | 100% |
| Utility | Rank/score tool completion rate | ≥20% of tool visitors |
| Activation | Content visitor → exam selected | ≥8% |
| Conversion | Content visitor → first practice/mock in 14 days | ≥4% |
| Retention | Activated content users returning for a second session in 30 days | ≥25% |
| Trust | Material factual corrections per 100 published pages | <2, resolved within 48 h |

Track page template, exam, source country/state, query intent, CTA shown, saved shortlist, selected exam and first practice/mock start. Connect Search Console query data to the page type monthly to replace these initial prioritisation proxies with actual demand.

## 10. Risks and decisions

| Risk | Mitigation |
| --- | --- |
| Cutoffs and dates become stale or wrong | Source registry, annual review schedule, visible versioning and an owner per exam family |
| Thin / programmatic pages fail to rank | Publish only pages with distinct data, original decision support and internal links; no city/college permutations without value |
| Over-promising predictions | Use ranges, methodology and historical data; state “estimate” prominently |
| Competitive publishers outpace generic explainers | Prioritise calculators, verified tables, preparation analytics and internal product utility competitors cannot easily copy |
| International policies vary by programme | Model programme/term/policy source dates; avoid blanket university claims |

### Decisions requested

1. Approve India-first P0: NEET, JEE and CUET as the initial content-and-product cluster.
2. Confirm whether Prep Diary will provide practice for SSC/CAT/GATE/CLAT before P1 publishing; otherwise make those pages education-first without a misleading practice CTA.
3. Provide Search Console and Keyword Planner read access (or an exported keyword report) before setting numeric traffic forecasts or declaring exact “most searched” keywords.

## 11. Sources consulted

- Google India SERPs observed 7 August 2026 for exam/cutoff/college-ranking and study-abroad query families. They showed dedicated result pages for KCET cutoffs and rank-wise colleges, JEE rank-wise college lists, NEET results/cutoff content, and SAT/GMAT accepting-college/score-range pages.
- [NTA CUET-UG official site](https://cuet.nta.nic.in/) — CUET scores are used by central and participating universities.
- [NTA CUET-UG 2025 result notice](https://nta.ac.in/Download/Notice/Notice_20250704143213.pdf) — official 2025 result reporting and participation data.
- [NTA NEET 2025 reporting](https://medicine.careers360.com/articles/how-many-students-appeared-for-neet) — 22,76,069 registrations reported for NEET 2025; use the originating NTA notice when publishing.
- [JoSAA](https://josaa.nic.in/) and [MCC](https://mcc.nic.in/) — authoritative counselling sources for JEE and NEET admission data.
- [NIRF](https://www.nirfindia.org/) — official Indian ranking source; retain its ranking year and category in all displays.

