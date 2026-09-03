# Mock Progress Tracking Feature

## Overview

The Progress Tracking feature enables users to monitor their mock test performance across different dimensions:
- **By Exam**: Overall performance across different exams (NIMCET, JEE, NEET, etc.)
- **By Subject**: Performance aggregated by subject (Mathematics, Physics, Chemistry, etc.)
- **By Chapter**: Performance broken down by individual chapters within subjects

## Architecture

### Database Schema

```
assessmentAttempts
├── id (UUID, Primary Key)
├── assessmentId (FK → assessments)
├── userId (FK → users)
├── attemptNumber (int)
├── status (SUBMITTED | IN_PROGRESS | EXPIRED | ABANDONED)
├── countsTowardProgress (boolean) ✨ Key field
├── score (decimal)
├── percentage (decimal)
├── timeSpentSeconds (int)
├── submittedAt (timestamp)
└── startedAt (timestamp)

attemptResponses
├── id (UUID, Primary Key)
├── attemptId (FK → assessmentAttempts)
├── questionId (FK → questions)
├── selectedOptionKeys (JSON array)
├── isCorrect (boolean)
├── marksAwarded (decimal)
├── timeSpentSeconds (int)
└── markedForReview (boolean)

assessments
├── id (UUID)
├── examId (FK → exams)
├── type (MOCK | TEST | CHALLENGE | OFFICIAL)
└── ...other fields

assessmentSections
├── id (UUID)
├── assessmentId (FK → assessments)
├── nodeId (FK → curriculumNodes) ✨ Links to subject/chapter
├── title (string)
└── ...other fields
```

### Key Fields

- **`countsTowardProgress`**: Boolean flag on `assessmentAttempts` that determines if an attempt should be included in progress calculations. Users can mark attempts as "practice only" when starting.
- **`nodeId`**: References `curriculumNodes` (subject/chapter in the exam hierarchy)
- **`examId`**: References the exam a mock test is associated with

### API Endpoints

#### GET `/api/v1/progress?type=exam|subject|chapter`

Returns progress data grouped by the specified dimension.

**Query Parameters:**
- `type`: `'exam'` | `'subject'` | `'chapter'` (default: 'exam')

**Response Format:**
```json
{
  "data": [
    {
      "examId": "uuid-or-null",
      "totalAttempts": 5,
      "avgPercentage": 72.5,
      "attempts": [...]
    }
  ]
}
```

### Component Hierarchy

```
/progress (Page)
├── Tabs (exam | subject | chapter)
├── ProgressByExam (Component)
│  └── Fetches: /api/v1/progress?type=exam
├── ProgressBySubject (Component)
│  └── Fetches: /api/v1/progress?type=subject
└── ProgressByChapter (Component)
   └── Fetches: /api/v1/progress?type=chapter
```

## Frontend Components

### 1. ProgressByExam
- **Location**: `src/components/progress/progress-by-exam.tsx`
- **Features**:
  - Lists all exams with attempts
  - Shows average percentage for each exam
  - Displays attempt count
- **Dependencies**: Recharts (optional), ShadcnUI (Card, Progress, Badge)

### 2. ProgressBySubject
- **Location**: `src/components/progress/progress-by-subject.tsx`
- **Features**:
  - Groups attempts by subject/chapter node
  - Shows performance indicators (✨ Great / 📈 Keep practicing / ⚠️ Needs more)
  - Color-coded badges (70%+ = green, 50%+ = yellow, <50% = red)
  - Sorted by performance (highest first)

### 3. ProgressByChapter
- **Location**: `src/components/progress/progress-by-chapter.tsx`
- **Features**:
  - Bar chart visualization of chapter-wise performance
  - List view of individual chapters
  - Performance metrics per chapter

## Backend Implementation

### Repository Method: `getUserProgress()`

**Location**: `src/server/repositories/assessment.repository.ts`

**Logic**:
1. Fetch all `SUBMITTED` attempts by the user with `countsTowardProgress = true`
2. Group by the requested dimension (exam, subject, or chapter)
3. Calculate aggregate statistics:
   - `totalAttempts`: Count of attempts in group
   - `avgPercentage`: Average score percentage
4. Fetch node details (subject/chapter names) from `curriculumNodes`
5. Return sorted and formatted data

**Query Structure**:
```sql
SELECT
  aa.id, aa.score, aa.percentage,
  a.examId, a.title,
  s.nodeId,
  cn.name, cn.nodeType
FROM assessment_attempts aa
INNER JOIN assessments a ON a.id = aa.assessmentId
LEFT JOIN assessment_sections s ON s.assessmentId = a.id
LEFT JOIN curriculum_nodes cn ON cn.id = s.nodeId
WHERE aa.userId = ? 
  AND aa.status = 'SUBMITTED'
  AND aa.counts_toward_progress = true
ORDER BY aa.submitted_at DESC
```

## Testing Locally

### Step 1: Run Database Migrations

Ensure all database tables exist:

```bash
# MySQL/MariaDB must be running
npm run db:migrate
```

### Step 2: Create a Test User (if needed)

If you don't already have the user `shivam.anuj.pradhan@gmail.com`, create one through the sign-up flow or manually:

```bash
# Via the sign-up flow at http://localhost:3000/sign-in
```

### Step 3: Set Up Test Data

Run the seed script to create sample mocks and attempts:

```bash
DATABASE_URL=mysql://root@127.0.0.1:3306/scholar247 npx tsx scripts/seed-progress-mocks.ts
```

**What it creates:**
- 3 sample mock tests associated with NIMCET exam
- 7 total attempts (2-3 per mock) with varying scores
- Sample responses for each question
- Performance data spanning the last 30 days
- Links to curriculum nodes (subjects/chapters)

**Expected output:**
```
🌱 Seeding progress mocks...

✓ Found user: Shivam Pradhan (user-id)
✓ Found exam: NIMCET
✓ Found 5 curriculum nodes

📝 Creating mock: NIMCET Practice Mock 1
  ✓ Assessment created: ...
  ✓ Section created: General English
  ✓ Section created: Analytical Ability and Logical Reasoning
  ✓ Section created: NIMCET Mathematics
  ✓ Added 30 questions to assessment
  ✓ Attempt 1 created: Score 28.5/40 (71.3%)
  ✓ Attempt 2 created: Score 32.1/40 (80.2%)

... (more mocks and attempts)

✅ Seed completed successfully!

📊 Sample data created:
   • 3 mock tests for user shivam.anuj.pradhan@gmail.com
   • 7 total attempts across mocks
   • Varying scores and performance metrics

🚀 Visit /progress to see the progress tracking dashboard!
```

### Step 4: Start the Development Server

```bash
npm run dev
```

Visit: http://localhost:3000/progress

### Step 5: Verify the Dashboard

The Progress page should display:
- **By Exam tab**: All exams with attempts and average scores
- **By Subject tab**: Each subject with sorted performance (best to worst)
- **By Chapter tab**: Bar chart + list of chapter-wise performance

## Features & Behavior

### 1. Progress Calculation

Progress is calculated **only from submissions that count toward progress**:
- When a user starts a mock, they choose: "Practice attempt" or "Real attempt"
- Only "Real attempt" submissions with `countsTowardProgress = true` are included
- Practice attempts are excluded from progress tracking
- This allows users to practice freely without affecting official progress metrics

### 2. Performance Indicators

**By Subject View:**
- ✨ 70%+ : "Great performance"
- 📈 50-69%: "Keep practicing"
- ⚠️ <50%: "Needs more practice"

**Colors:**
- Green (default): ≥70%
- Yellow (secondary): 50-69%
- Red (destructive): <50%

### 3. Grouping Logic

**By Exam:**
- Groups all attempts by their associated exam ID
- Calculates average percentage across all attempts for that exam

**By Subject:**
- Groups by the `nodeId` field in `assessmentSections`
- Fetches node names/details from `curriculumNodes`
- Filters out attempts without a nodeId
- Aggregates performance per subject

**By Chapter:**
- Similar to subject, but displays individually
- Creates bar chart visualization
- Lists chapters sorted by performance

### 4. Loading States

- Skeleton loaders while fetching data
- Error messages if API fails
- "No data" message if user has no attempts

## Database Queries (Drizzle ORM)

### Example: Fetch Progress by Exam

```typescript
const attempts = await db
  .select({
    attemptId: assessmentAttempts.id,
    score: assessmentAttempts.score,
    percentage: assessmentAttempts.percentage,
    examId: assessments.examId,
  })
  .from(assessmentAttempts)
  .innerJoin(assessments, eq(assessments.id, assessmentAttempts.assessmentId))
  .where(and(
    eq(assessmentAttempts.userId, userId),
    eq(assessmentAttempts.status, 'SUBMITTED'),
    eq(assessmentAttempts.countsTowardProgress, true),
  ));

// Group by examId and calculate averages
```

## Performance Considerations

### Optimization Strategies

1. **Indexing**:
   - Add index on `(userId, status, countsTowardProgress, submittedAt)` in `assessment_attempts`
   - Add index on `(assessmentId, nodeId)` in `assessment_sections`
   - Add index on `(nodeId)` in `curriculum_nodes`

2. **Query Efficiency**:
   - Currently fetches all user attempts then groups in-memory
   - For large datasets (1000+ attempts), consider server-side aggregation
   - Add pagination if needed

3. **Caching**:
   - Progress data can be cached for 5-15 minutes
   - Invalidate cache after new attempt submission

### Suggested Indexes

```sql
CREATE INDEX idx_attempts_user_status_progress 
ON assessment_attempts(user_id, status, counts_toward_progress, submitted_at);

CREATE INDEX idx_sections_assessment_node 
ON assessment_sections(assessment_id, node_id);

CREATE INDEX idx_nodes_exam 
ON curriculum_nodes(exam_id);
```

## Edge Cases & Handling

### 1. No Attempts
- Shows "No Progress Data" card with message
- Directs user to take mocks

### 2. Multiple Nodes per Section
- Currently, a section can only have one `nodeId`
- If future design allows multiple nodes per section, update grouping logic

### 3. Null NodeIds
- Attempts without a nodeId are excluded from subject/chapter views
- Included in exam view (associated via `assessments.examId`)

### 4. Abandoned/Expired Attempts
- Only `SUBMITTED` status is counted
- `ABANDONED`, `EXPIRED`, `IN_PROGRESS` are excluded

## File Structure

```
src/
├── app/
│  ├── api/v1/progress/
│  │  └── route.ts              (API endpoint)
│  └── (app)/progress/
│     └── page.tsx              (Main progress page)
├── components/progress/
│  ├── progress-by-exam.tsx      (Exam-grouped view)
│  ├── progress-by-subject.tsx   (Subject-grouped view)
│  └── progress-by-chapter.tsx   (Chapter-grouped view)
├── server/repositories/
│  └── assessment.repository.ts  (Database queries + getUserProgress)
└── components/layout/
   └── app-nav-config.ts         (Updated with Progress link)

scripts/
└── seed-progress-mocks.ts       (Test data seeding script)
```

## Future Enhancements

1. **Historical Trends**:
   - Line chart showing score progression over time
   - Identify improvements/regressions

2. **Comparative Analysis**:
   - Compare performance across mocks
   - Benchmark against average user performance

3. **Predictions**:
   - Estimate final exam score based on mock performance
   - Identify weak areas for targeted practice

4. **Export/Sharing**:
   - PDF report of progress
   - Share performance with mentors/coaches

5. **Goal Tracking**:
   - Set target scores per subject
   - Progress rings showing goal achievement

6. **Analytics Dashboard**:
   - Time spent per topic
   - Accuracy trends
   - Common mistake patterns

## Troubleshooting

### "No Progress Data" appearing when mocks exist

**Possible Causes:**
1. Attempts have `status != 'SUBMITTED'` (check status)
2. Attempts have `countsTowardProgress = false` (marked as practice)
3. Attempts are not associated with the current user_id

**Solution:**
```sql
-- Check attempts for a user
SELECT id, status, counts_toward_progress, submitted_at
FROM assessment_attempts
WHERE user_id = 'user-id'
ORDER BY submitted_at DESC
LIMIT 10;
```

### API returning empty data

**Check:**
1. User ID is being passed correctly to `getUserProgress()`
2. Database connection is working
3. Attempts table has data for the user

### Progress component not rendering

**Check:**
1. Browser console for errors
2. Network tab for API response
3. Component mounting and fetching logic

## Related Documentation

- [Mock Test Feature](./MOCKS.md) (if exists)
- [Assessment Schema](./src/server/db/schema/assessment.ts)
- [Assessment Repository](./src/server/repositories/assessment.repository.ts)
- [Curriculum/Taxonomy](./src/server/db/schema/taxonomy.ts)

---

**Last Updated**: 2026-09-04  
**Author**: Claude Code  
**Status**: ✅ Production Ready (with sample data for testing)
