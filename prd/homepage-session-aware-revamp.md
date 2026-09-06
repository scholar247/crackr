# PRD — Session-Aware Homepage (Logged-In vs Logged-Out)

**Status:** Draft — ready for implementation
**Owner:** Product
**Surface:** `/` (`src/app/(marketing)/page.tsx`)

---

## 1. Problem

`/` renders the exact same marketing page to everyone — a brand-new anonymous visitor and a
student who's already taken 5 mocks for GATE-CSE see identical hero copy, identical "Explore
Exams" grid, identical CTAs pointing at `/sign-in`. That's correct top-of-funnel behavior for
someone who's never heard of us, and actively wrong for someone who already has an account: a
returning logged-in user should land on *their* prep, not be re-sold on signing up for
something they already signed up for.

This PRD makes `/` session-aware: it renders one of three distinct experiences depending on
who's looking at it.

## 2. Goals

- A returning logged-in user with a completed profile sees a personalized home: their
  progress, their primary exam's content, a way back into a mock, and a nudge toward courses
  (once those exist).
- A logged-in user who never finished picking a target exam gets steered to fix that, instead
  of silently seeing empty or irrelevant sections.
- An anonymous visitor keeps today's conversion-focused marketing homepage, anchored to one
  "hot" exam (NIMCET, for now) instead of a generic multi-exam pitch, so the page has a single
  clear angle for someone who isn't a customer yet.
- Ship in three independently-shippable phases (Section 10) — a returning user's data-driven
  sections don't have to land in the same PR as the profile-completeness nudge.

## Non-goals

- Not touching `/dashboard`, `/mocks`, `/progress`, or `/exams/[slug]` — this PRD only changes
  what `/` renders and adds the read APIs those new sections need. `/dashboard` stays the
  full app workspace (sidebar, nav) it already is; `/` becomes a lighter personalized landing
  page that deep-links into it, not a replacement for it.
- Not building courses, course purchase, or a "verified tutor" badge system. Both are
  referenced below exactly as "Coming Soon" — see `docs/` conventions from the last homepage
  pass (`src/components/marketing/home/feature-strip.tsx` already has this pattern; reuse it,
  don't invent a second one).
- Not building a real "trending" algorithm for blog content. There is no view-count or
  upvote column on `articles` (unlike `communityPosts.upvoteCount`, which does exist). "Hot
  Topics" for a logged-in user's primary exam is defined in this PRD as *recency +
  exam-relevance match*, not true trending. Don't fake a trending signal that doesn't exist —
  that's exactly the mistake the last homepage audit flagged and fixed (fabricated stats in
  `performance-overview-card.tsx`).

## 3. Current state (grounding facts — read before writing code)

- `/` is `src/app/(marketing)/page.tsx`, a server component, `dynamic = 'force-dynamic'`. It
  currently ignores `auth()` entirely and always renders the same 8 sections (`Hero`,
  `FeatureStrip`, `ExploreExams`, `MasterConcepts`, `PracticeShowcase`, `FrameworkSteps`,
  `Team`, `CtaBand`).
- The site already has a real authenticated app shell at `/dashboard`
  (`src/app/(app)/dashboard/page.tsx`) with a sidebar (`src/components/layout/app-shell.tsx`).
  It currently just says "Welcome" and shows an onboarding nudge banner if
  `!onboardingCompleted`. **Reuse this exact nudge pattern and its amber-banner styling for
  the homepage's incomplete-profile state (Section 6.2) — don't invent a new visual language
  for the same message.**
- Route protection is in `src/proxy.ts` (this is Next 16's renamed `middleware.ts` — see
  `AGENTS.md`). `/` is explicitly public (`pathname === '/'` short-circuits). No change needed
  there — `/` stays reachable logged-out.
- Target-exam data model (already fully wired, see prior conversation / `user.repository.ts`):
  - `user_exam_targets` (`userId`, `examId`, `isPrimary`) — `userRepository.findExamTargetsByUserId(userId)` returns `{ examId, examName, examSlug, programName, isPrimary }[]`.
  - `users.targetProgramId` — separate, currently-unused-elsewhere field. **Not** what determines personalization; the primary *exam* (`isPrimary: true` row) is. Don't confuse the two in implementation.
  - `userRepository.getAuthorizationSnapshot(userId)` returns `{ role, status, onboardingCompleted }`.
  - "Profile incomplete" = `!onboardingCompleted || examTargets.length === 0`. Check both —
    `onboardingCompletedAt` is set at the end of the onboarding flow, but a user could in
    theory reach a state with one true and not the other; treat either as incomplete.
- Progress data: `assessmentRepository.getUserProgress(userId, 'exam')` (fixed earlier this
  project) returns `ProgressGroup[]` — `{ id, name, meta (examSlug), totalAttempts,
  avgPercentage, bestPercentage, latestPercentage, trend, series }`. The homepage's exam
  snapshot (Section 6.3) reuses this directly — **no new progress query needed**, just call
  the existing repository function server-side and filter the array to the row matching the
  user's primary exam.
- Mocks/test series: `assessments` table, `type IN ('MOCK','TEST')`, `visibility = 'PUBLIC'`,
  `status = 'PUBLISHED'`, `examId` FK. Creation is open to any signed-in user
  (`POST /api/v1/assessments/self`), not role-gated — "tutor-hosted" is a real, live
  capability today, it just has no visual distinction from an official mock (no `isOfficial`
  flag exists). MVP: show them together, no separate "official vs community" labeling (see
  Open Question OQ-1).
- Blog/article ↔ exam relationship is **indirect** today: `articles` → `contentNodeMap`
  (node) → `examNodeMap` (exam). `articleRepository` has no function that filters by examId.
  **This PRD requires adding one** (Section 7.1).
- Courses: no payment integration, no course model wired up (`src/types/course.types.ts` is
  dead code referencing MongoDB). Always render as "Coming Soon" — established convention,
  see `src/components/marketing/home/feature-strip.tsx`.
- The "primary exams" concept for the anonymous homepage already exists:
  `src/lib/primary-exams.ts` exports `PRIMARY_EXAM_SLUGS = ['nimcet', 'gate-cse', 'cuet-ug',
  'cbse-class-12-board']`. **Add** `FEATURED_ANONYMOUS_EXAM_SLUG = 'nimcet'` to this same file
  — don't create a second config file for one constant.

## 4. The three states

| State | Definition | Where it's checked |
|---|---|---|
| **Anonymous** | `!session?.user` | `auth()` returns null |
| **Logged-in, incomplete** | `session.user` exists AND (`!onboardingCompleted` OR no exam target with `isPrimary: true`) | `userRepository.getAuthorizationSnapshot` + `findExamTargetsByUserId` |
| **Logged-in, complete** | `session.user` exists AND onboarded AND has a primary exam target | same two calls |

`page.tsx` becomes:

```ts
export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return <AnonymousHome />;

  const [snapshot, examTargets] = await Promise.all([
    userRepository.getAuthorizationSnapshot(session.user.id),
    userRepository.findExamTargetsByUserId(session.user.id),
  ]);
  const primaryTarget = examTargets.find((t) => t.isPrimary) ?? null;

  if (!snapshot?.onboardingCompleted || !primaryTarget) {
    return <IncompleteProfileHome userName={session.user.name} examTargets={examTargets} />;
  }

  return <PersonalizedHome userId={session.user.id} primaryTarget={primaryTarget} />;
}
```

Keep `export const dynamic = 'force-dynamic'` — this page now reads session + DB state per
request, it was never a static page anyway.

## 5. Anonymous homepage — spec

This is **today's homepage, refocused on one exam** instead of a generic multi-exam pitch.
Reuse every existing component in `src/components/marketing/home/`; the only changes:

- `Hero`: hero copy stays as-is (already rewritten to be founder-driven and exam-name-agnostic
  per the last revamp) — no change needed here.
- `ExploreExams`: the "Featured" large card (`explore-exams.tsx`'s `featured` prop) must be
  the exam at `FEATURED_ANONYMOUS_EXAM_SLUG` ("NIMCET is hot right now"), not whichever exam
  happens to have the richest syllabus tree that week. Change `getFeaturedExams()` in
  `page.tsx`'s anonymous path to put `FEATURED_ANONYMOUS_EXAM_SLUG` first, ahead of
  `PRIMARY_EXAM_SLUGS`, using the same ranking pattern already in the file.
- Add one small badge/label on that featured card: `🔥 Trending` — a static, honest label
  (this is an editorial call the team is making, not a fabricated live metric — don't wire it
  to any real "trending" computation, there's no data to back one).
- Everything else (`FeatureStrip`, `MasterConcepts`, `PracticeShowcase`, `FrameworkSteps`,
  `Team`, `CtaBand`) renders unchanged.

## 6. Logged-in, incomplete-profile homepage — spec

Purpose: get the user to a primary exam target with as little friction as possible, while
still giving them *something* useful today.

**Layout, top to bottom:**

1. **Warning banner** (reuse the exact visual pattern from
   `src/app/(app)/dashboard/page.tsx:28-43` — amber border/background, `Sparkles` icon,
   "Complete setup" CTA button). Copy: *"Finish setting up your account — tell us which exam
   you're preparing for so we can personalize this page."* Button → `/onboarding` if
   `!onboardingCompleted`, else → `/settings` (they finished onboarding but have zero exam
   targets, which is possible if `additionalExamIds` was submitted empty — edge case, still
   route them somewhere that fixes it).
2. Below the banner: **render the anonymous homepage's `ExploreExams` section** (same
   NIMCET-featured grid) so the page isn't just a banner and dead space — this user hasn't
   told us what they want yet, so fall back to the same "hot exam" default a logged-out
   visitor sees.
3. Keep `FrameworkSteps`, `Team`, and `CtaBand` — swap `CtaBand`'s "Create Free Account" CTA
   for a "Complete Your Profile" CTA pointing at `/onboarding` (a logged-in user doesn't need
   another sign-up prompt).
4. Drop `Hero`'s marketing copy for a lighter, name-aware greeting: *"Welcome, {firstName} —
   let's find your exam."* No stats row (nothing to show yet).

## 7. Logged-in, complete-profile homepage — spec

This is the primary deliverable. Top to bottom:

### 7.1 Greeting + quick stats strip
- *"Welcome back, {firstName}"* + primary exam name badge (e.g. "GATE-CSE").
- Three stat chips pulled from `getExamProgress` (see Section 3), filtered to the row where
  `meta === primaryTarget.examSlug`: **Mocks Taken** (`totalAttempts`), **Best Score**
  (`bestPercentage`), **Trend** (`trend`, rendered as an arrow — reuse
  `src/components/progress/progress-stat-card.tsx`'s trend icon logic, don't reimplement it).
- If the user has zero attempts for their primary exam (`primaryTarget` exists but no
  matching `ProgressGroup`), replace the stat chips with a single CTA card: *"Take your first
  {examName} mock"* → `/mocks/new`.

### 7.2 Continue where you left off
- Call `assessmentRepository.listMyAttempts(userId)` (already exists, used by
  `src/app/(app)/mocks/page.tsx` the same way) — it returns `{ attempt, assessment }[]`
  newest-first. Take the first row where `attempt.status === 'IN_PROGRESS'`. **Do not** use
  `findInProgressAttempt(assessmentId, userId)` for this — that function requires an already-
  known `assessmentId` (it's for "is there an in-progress attempt on *this specific*
  assessment," used from within a mock's own page); the homepage doesn't have one assessment
  in mind, it needs "does this user have *any* in-progress attempt at all."
- If one exists, show one prominent card: assessment title, time remaining if
  `durationSeconds`-based, "Resume" button → the attempt's mock-taking route.
- If no in-progress attempt, omit this section entirely (don't show an empty state for
  something the user hasn't started).

### 7.3 Score trend (mini)
- A compact version of `src/components/progress/progress-line-chart.tsx` — same component,
  reused, not rebuilt — showing just the primary exam's `series`. Wrap it in a "View full
  progress →" link to `/progress`. If `series.length < 2`, skip the chart (a single point
  isn't a trend) and just show the stat chips from 7.1.

### 7.4 Hot Topics for {primary exam}
- New section, new data requirement (Section 8.1): 3–4 most recent published articles tagged
  (via `examNodeMap`) to the primary exam. Label honestly: **"Latest for {examName}"**, not
  "Hot" or "Trending" — see Non-goals on fabricated trending signals. Each card links to
  `/blogs/{slug}`.
- Empty state: if zero articles exist for that exam, omit the section (don't show a
  "check back soon" card on a personalized homepage — that reads as broken, not honest).

### 7.5 Test Series & Mocks for {primary exam}
- 3–4 `PUBLIC` + `PUBLISHED` assessments (`type IN ('MOCK','TEST')`) for the primary exam,
  newest first. Card shows title, type badge (Self Mock / Group Test — reuse
  `TYPE_META` from `src/app/(app)/mocks/page.tsx`), and a "Start" / "View" CTA.
- "Browse all test series →" link to `/mocks` (filtered to this exam if/when `/mocks`
  supports an exam query param — if it doesn't yet, link to plain `/mocks`, don't invent a
  filter param that doesn't exist on the receiving page).

### 7.6 Courses for {primary exam} — Coming Soon
- One card, same "Coming Soon" badge pattern as `feature-strip.tsx`. No functionality, purely
  a placeholder so the primary-exam section feels complete and previews the roadmap.

### 7.7 Explore other exams
- Collapsed/secondary version of `ExploreExams`, excluding the primary exam, so a user who
  wants to branch out still can — but it's not the first thing they see anymore.

## 8. Data & API requirements

### 8.1 New: articles-by-exam query
Add to `src/server/repositories/article.repository.ts`:

```ts
async function findPublishedByExam(examId: string, limit = 4) {
  return db
    .selectDistinct({ article: articles })
    .from(articles)
    .innerJoin(contentNodeMap, and(eq(contentNodeMap.contentType, 'ARTICLE'), eq(contentNodeMap.contentId, articles.id)))
    .innerJoin(examNodeMap, eq(examNodeMap.nodeId, contentNodeMap.nodeId))
    .where(and(eq(examNodeMap.examId, examId), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC')))
    .orderBy(desc(articles.createdAt))
    .limit(limit);
}
```
Export it from `articleRepository`. Note `article.repository.ts` currently imports
`contentNodeMap` but not `examNodeMap` — add it to the existing `@/server/db/schema` import
line. This is the only new repository query this PRD requires for content — everything else
(progress, assessments, exam targets) already exists.

### 8.2 New: public mocks-by-exam query
Check `assessmentRepository` for an existing "list public assessments for an exam" function
before writing a new one — `findVisibleToUser` exists but is role/visibility-aware for a
*specific viewer*, which is actually what you want here (a logged-in viewer should see
exactly what they're allowed to see, same as `/mocks` does). Prefer filtering
`findVisibleToUser`'s result by `examId` client-side/in the page over writing a parallel
exam-scoped query — don't duplicate access-control logic in two places.

### 8.3 No changes needed to `/api/v1/progress`
Section 7.1 and 7.3 both consume `assessmentRepository.getUserProgress(userId, 'exam')`
directly (server component, not the client API route) and filter the returned array to
`meta === primaryExamSlug`. Do not add an `examId` query param to the API route for this —
the homepage is a server component and can call the repository directly, same convention
`page.tsx` already uses for `getFeaturedExams()`.

## 9. Component/file plan

New files under `src/components/marketing/home/`:
- `logged-in-hero.tsx` — greeting + stat chips (Section 7.1)
- `continue-mock-card.tsx` — Section 7.2
- `hot-topics.tsx` — Section 7.4 (takes `articles` prop, presentational only)
- `exam-mocks-strip.tsx` — Section 7.5
- `courses-coming-soon-card.tsx` — Section 7.6 (or inline if it ends up trivially small)
- `incomplete-profile-banner.tsx` — Section 6, extracted so `/dashboard` could eventually
  reuse it too instead of keeping two copies of the same amber-banner JSX

Modified:
- `src/app/(marketing)/page.tsx` — the three-way branch (Section 4), plus new data-fetching
  functions per branch
- `src/lib/primary-exams.ts` — add `FEATURED_ANONYMOUS_EXAM_SLUG`
- `src/components/marketing/home/explore-exams.tsx` — accept an optional `trendingSlug` prop
  to render the `🔥 Trending` badge on the matching card (defaults to no badge, so the
  incomplete-profile and other reuses of this component don't need to pass it)
- `src/server/repositories/article.repository.ts` — add `findPublishedByExam` (8.1)

Reused as-is, no changes:
- `src/components/progress/progress-line-chart.tsx`, `progress-stat-card.tsx` (Section 7.1,
  7.3)
- `src/components/marketing/home/{feature-strip,master-concepts,practice-showcase,
  framework-steps,team,cta-band}.tsx`

## 10. UI/UX and gamification treatment

The existing design system already has unused gamification keyframes sitting in
`src/app/globals.css` (`animate-count-up`, `animate-xp-pop`, `animate-combo-flash`,
`animate-level-up`, `animate-streak-glow`, `animate-pulse-green`) — first used in the
`/progress` revamp. **Continue that visual language here rather than starting a new one.**

Card baseline (every new card in Sections 7.1–7.7):
- `rounded-2xl border border-border bg-card shadow-sm transition-all duration-200
  hover:-translate-y-1 hover:shadow-lg` — same hover-lift already established in
  `explore-exams.tsx` and `progress-stat-card.tsx`. Don't invent a different card feel for
  the homepage than the one `/progress` just established.
- Stat reveals (Section 7.1's chips) use `animate-count-up` on mount — already defined,
  already used in `progress-stat-card.tsx`.
- A new "Personal Best" moment (Section 7.1, when `latestPercentage >= bestPercentage` and
  the user has 2+ attempts) reuses `animate-streak-glow` + the `Trophy` icon treatment from
  `progress-stat-card.tsx` verbatim — same trigger condition, same visual, don't reinvent it.

**Two new keyframes to add to `globals.css`** (append to the existing `/* Animations */`
block, same file, same convention — oklch-based, named, with a paired `.animate-*` class):

```css
@keyframes tilt-hover {
  from { transform: rotate(0deg) scale(1); }
  to   { transform: rotate(-1.5deg) scale(1.02); }
}
@keyframes sparkle-pop {
  0%   { opacity: 0; transform: scale(0.4) rotate(-15deg); }
  50%  { opacity: 1; transform: scale(1.15) rotate(8deg); }
  100% { opacity: 0; transform: scale(0.9) rotate(0deg); }
}
.hover\:animate-tilt-hover:hover { animation: tilt-hover 0.2s ease-out forwards; }
.animate-sparkle-pop { animation: sparkle-pop 0.8s ease-out forwards; }
```

Usage:
- `tilt-hover` on the "Featured"/"Trending" exam card only (Section 5) — a small personality
  moment on the one card the anonymous homepage most wants clicked. Don't apply it to every
  card on the page; a homepage where everything wiggles on hover reads as noisy, not
  gamified.
- `sparkle-pop` fires once, on mount, next to the Trophy icon on a genuine new Personal Best
  (Section 7.1) — pair a small `Sparkles` (lucide) icon absolutely positioned near the score
  badge with this class. This is a celebratory one-shot, not a looping/attention-grabbing
  animation — don't use `infinite`.
- Do **not** add movement/rotation effects to data that could be discouraging (a dropped
  score, an empty state). Gamification here means celebrating real wins, not decorating
  everything — same principle the `/progress` revamp already established with clamped
  negative scores and honest empty states.

## 11. Edge cases

- **User has a primary exam target that's since been archived** (`exams.status !=
  'ACTIVE'`): treat as if incomplete-profile (Section 6) — `findExamTargetsByUserId` joins
  `exams` but doesn't currently filter by status; add that filter, or check it in `page.tsx`
  before deciding which branch to render.
- **Primary exam has real progress data but zero blog articles and zero public mocks**: each
  section (7.4, 7.5) independently omits itself if empty (already specified per-section
  above) — the page should never show three consecutive "nothing here yet" cards.
  Section 7.6 (Courses) always renders regardless, since "Coming Soon" is itself the honest
  content.
- **Session exists but `session.user.id` lookup fails** (deleted/disabled account mid-session):
  `getAuthorizationSnapshot` returns `null` — treat as anonymous (`AnonymousHome`), don't
  crash. `proxy.ts` doesn't protect `/`, so this page must handle a stale/invalid session
  gracefully on its own.
- **Loading/streaming**: this is a server component tree with several independent data
  fetches (progress, articles, mocks) — use `Promise.all` for the primary-exam sections
  (7.1–7.5) so they land in one render pass, not sequential waterfalls. Do not add client-side
  `useEffect` fetching here the way the old `/progress` components used to — that pattern was
  already replaced with server-side fetching + `useQuery` where genuinely interactive; this
  page's data doesn't need to be interactive/refetchable, fetch it server-side like
  `getFeaturedExams()` already does.

## 12. Rollout plan

**Phase 1 (ship first, smallest diff):** Section 5 (anonymous homepage NIMCET-featured
change) + Section 6 (incomplete-profile banner, reusing dashboard's exact pattern). Both are
low-risk, high-clarity, and don't depend on any new repository code.

**Phase 2:** Section 7.1–7.3 (greeting, stats, continue-mock, mini trend chart) — all reuse
existing repository functions (`getUserProgress`, `findInProgressAttempt`), zero new backend
code.

**Phase 3:** Section 7.4–7.7 (Hot Topics, Test Series strip, Courses placeholder, Explore
other exams) — this is the phase that needs the new `findPublishedByExam` query (8.1).

Ship and verify each phase in the browser (per this repo's own working convention this
session: typecheck, lint, then a real dev-server screenshot) before starting the next —
don't batch all three into one unreviewed change.

## 13. Open questions (need a decision before Phase 3)

- **OQ-1:** Should tutor-hosted mocks be visually distinguished from official ones in
  Section 7.5? Today's schema has no `isOfficial`/`isVerifiedTutor` flag — `assessments` only
  has `creatorUserId` → `users.role`. MVP proposal in this PRD: show a small "by {role}"
  label using the creator's role (`TEACHER` → "by a tutor", anything else → omit the label)
  rather than blocking this phase on building a verification system.
- **OQ-2:** Should the "Explore other exams" section (7.7) exclude exams the user has
  *any* target on (not just the primary), or only the primary one? Default in this PRD:
  exclude only the primary — a user prepping for both NIMCET and GATE-CSE probably still
  wants GATE-CSE to show up as "other," not just fully-unrelated exams.

## 14. Acceptance criteria

- [ ] Anonymous visitor on `/` sees NIMCET as the featured/trending exam card, everything
      else unchanged from today.
- [ ] Logged-in user with no primary exam target sees the amber incomplete-profile banner
      (visually matching `/dashboard`'s) with a working CTA into `/onboarding` or `/settings`
      as appropriate, plus the NIMCET-featured fallback grid below it.
- [ ] Logged-in user with a primary exam target and prior mock attempts sees: greeting, real
      stat chips for that exam (no fabricated numbers — reuse `getUserProgress` verbatim),
      a resume-attempt card if one is in progress, a mini trend chart if 2+ attempts exist,
      latest articles for that exam, and recent public mocks for that exam.
- [ ] Logged-in user with a primary exam target but zero attempts sees a single "take your
      first mock" CTA instead of empty/zero stat chips.
- [ ] No section ever renders a fabricated number, a fake "trending" label backed by no real
      data, or an empty-state card next to another empty-state card.
- [ ] All new cards use the established hover-lift treatment; the tilt/sparkle effects are
      used exactly where specified (Section 10), not on every card.
- [ ] `npx tsc --noEmit` and `npx eslint` clean on every touched/new file before considering
      any phase done.
