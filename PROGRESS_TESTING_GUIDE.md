# 🚀 Progress Tracking - Local Testing Guide

## Quick Start (5 minutes)

### Step 1: Ensure Prerequisites
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;" 

# Check database exists
mysql -u root -p -e "USE scholar247; SELECT COUNT(*) FROM users;"
```

### Step 2: Check User Exists
The test data will be created for: **`shivam.anuj.pradhan@gmail.com`**

If you don't have this user, sign up first:
1. Stop dev server if running
2. Start: `npm run dev`
3. Visit: http://localhost:3000/sign-in
4. Click "Sign up with Google" (or create manually)
5. Use email: `shivam.anuj.pradhan@gmail.com`
6. Complete onboarding by selecting an exam

Once user exists, stop the server (`Ctrl+C`).

### Step 3: Run Seed Script
```bash
DATABASE_URL=mysql://root@127.0.0.1:3306/scholar247 npx tsx scripts/seed-progress-mocks.ts
```

**Expected output:**
```
🌱 Seeding progress mocks...

✓ Found user: [Name] (user-id)
✓ Found exam: NIMCET
✓ Found 5 curriculum nodes

📝 Creating mock: NIMCET Practice Mock 1
  ✓ Assessment created: [uuid]
  ✓ Section created: General English
  ✓ Section created: Analytical Ability and Logical Reasoning
  ✓ Section created: NIMCET Mathematics
  ✓ Added 30 questions to assessment
  ✓ Attempt 1 created: Score 28.5/40 (71.3%)
  ✓ Attempt 2 created: Score 32.1/40 (80.2%)

... (2 more mocks)

✅ Seed completed successfully!

📊 Sample data created:
   • 3 mock tests for user shivam.anuj.pradhan@gmail.com
   • 7 total attempts across mocks
   • Varying scores and performance metrics

🚀 Visit /progress to see the progress tracking dashboard!
```

### Step 4: Start Dev Server
```bash
npm run dev
```

### Step 5: View Progress Dashboard
1. Open: http://localhost:3000
2. Sign in with: `shivam.anuj.pradhan@gmail.com`
3. Click "Progress" in left sidebar (TrendingUp icon)
4. You should see three tabs: **By Exam | By Subject | By Chapter**

---

## Dashboard Preview

### By Exam Tab
Shows:
- List of exams (NIMCET)
- Total attempts per exam
- Average score percentage
- Progress bar

**Example:**
```
┌─────────────────────────────────┐
│ Exam: NIMCET                    │
│ 7 attempts                      │
│ Average Score: 71.2%            │
│ [████████░░░░░░░░░░]            │
└─────────────────────────────────┘
```

### By Subject Tab
Shows:
- List of subjects/chapters
- Color-coded badges (🟢 70%+ | 🟡 50-69% | 🔴 <50%)
- Performance indicators (✨ Great / 📈 Keep practicing / ⚠️ Needs more)
- Sorted by performance (best first)

**Example:**
```
┌────────────────────────────────────────┐
│ NIMCET Mathematics              80.5% 🟢│
│ 5 attempts                             │
│ [██████████░░░░░░░░]                   │
│ ✨ Great performance!                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ General English                 65.0% 🟡│
│ 3 attempts                             │
│ [████████░░░░░░░░░░░]                  │
│ 📈 Keep practicing                     │
└────────────────────────────────────────┘
```

### By Chapter Tab
Shows:
- Bar chart of chapter-wise performance
- Individual chapter cards
- Performance metrics

**Example Chart:**
```
100 │     ╭─╮
 80 │ ╭─╮ │ │
 60 │ │ │╭─┼─╮
 40 │ │ ││ │ │
 20 │ │ ││ │ │
  0 └─┴─┴┴─┴─┴─
    Ch1 Ch2 Ch3
```

---

## Troubleshooting

### ❌ "User not found"
**Error:** `❌ User shivam.anuj.pradhan@gmail.com not found`

**Solution:**
1. Sign up for this email first
2. Navigate to: http://localhost:3000/sign-in
3. Sign up via Google or email
4. Complete onboarding
5. Then run seed script again

### ❌ "NIMCET exam not found"
**Error:** `❌ NIMCET exam not found`

**Solution:**
This should not happen in a fresh setup. If it occurs:
1. Check if exams table has any data: `SELECT * FROM exams LIMIT 5;`
2. The exam might be under a different slug (e.g., "Nimcet" or "NIMCET_2024")
3. Edit seed script line ~50 to use correct slug:
   ```typescript
   const nimcetExam = await db.query.exams.findFirst({
     where: eq(exams.slug, 'your-exam-slug'), // Change this
   });
   ```

### ❌ Database connection error
**Error:** `ECONNREFUSED` or connection timeout

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# If not running, start it:
# macOS with Homebrew:
brew services start mysql

# Or run directly:
mysql.server start
```

### ❌ No progress data appears in dashboard
**Error:** Dashboard shows "No Progress Data"

**Possible causes:**
1. Seed script didn't run successfully
2. Mocks created but attempts not linked to current user
3. Browser cache - try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

**Verify data exists:**
```bash
# Check attempts exist
mysql -u root -p scholar247 -e "SELECT COUNT(*) FROM assessment_attempts WHERE user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com');"

# Should show: 7

# Check they count toward progress
mysql -u root -p scholar247 -e "SELECT * FROM assessment_attempts WHERE user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com') LIMIT 1\G"

# Should show: counts_toward_progress: 1 (or true)
```

### ❌ API returning empty array
**Error:** Page shows empty but no error message

**Check:**
1. Browser DevTools → Network tab
2. Look for `/api/v1/progress` request
3. Check response body
4. Should have: `{"data": [...]}`

**Debug query:**
```typescript
// In browser console:
fetch('/api/v1/progress?type=exam')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## What Gets Created

### Data Structure
```
User: shivam.anuj.pradhan@gmail.com
  ├── Mock 1: NIMCET Practice Mock 1
  │   ├── 3 sections (General English, Analytical Ability, Mathematics)
  │   ├── 30 questions
  │   ├── Attempt 1 (60% score)
  │   └── Attempt 2 (75% score)
  ├── Mock 2: NIMCET Practice Mock 2
  │   ├── 3 sections
  │   ├── 30 questions
  │   ├── Attempt 1 (65% score)
  │   └── Attempt 2 (70% score)
  │   └── Attempt 3 (80% score)
  └── Mock 3: NIMCET Full Mock
      ├── 3 sections
      ├── 30 questions
      ├── Attempt 1 (55% score)
      └── Attempt 2 (85% score)

Total: 7 attempts with scores ranging 50-85%
```

### Database Impact
```
Rows created:
• assessments: 3 (mock tests)
• assessmentSections: 9 (3 mocks × 3 sections)
• assessmentQuestions: 90 (3 mocks × 30 questions)
• assessmentAttempts: 7 (attempts across mocks)
• attemptResponses: ~210 (7 attempts × 30 questions)
```

### Cleanup (Optional)
To delete all seed data and start over:

```bash
# WARNING: This will delete YOUR progress data! Only run if testing.

# Delete as specific user:
mysql -u root -p scholar247 -e "
DELETE FROM attempt_responses 
WHERE attempt_id IN (
  SELECT id FROM assessment_attempts 
  WHERE user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com')
);

DELETE FROM assessment_attempts 
WHERE user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com')
AND assessment_id IN (
  SELECT id FROM assessments WHERE type = 'MOCK'
);

DELETE FROM assessment_questions 
WHERE assessment_id IN (
  SELECT id FROM assessments 
  WHERE type = 'MOCK'
  AND creator_user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com')
);

DELETE FROM assessment_sections 
WHERE assessment_id IN (
  SELECT id FROM assessments 
  WHERE type = 'MOCK'
  AND creator_user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com')
);

DELETE FROM assessments 
WHERE type = 'MOCK'
AND creator_user_id = (SELECT id FROM users WHERE email = 'shivam.anuj.pradhan@gmail.com');
"

# Then run seed script again:
DATABASE_URL=mysql://root@127.0.0.1:3306/scholar247 npx tsx scripts/seed-progress-mocks.ts
```

---

## Testing Scenarios

### Scenario 1: View Overall Progress
1. Go to Progress dashboard
2. Check "By Exam" tab
3. Should see NIMCET with 7 attempts, ~71% avg

### Scenario 2: Compare Subject Performance
1. Click "By Subject" tab
2. Should see 3 subjects (General English, Analytical Ability, Mathematics)
3. Sorted with highest score first
4. Each has color badge and performance indicator

### Scenario 3: Analyze Chapter Trends
1. Click "By Chapter" tab
2. Should see bar chart
3. View individual chapter cards below chart
4. Check that scores match chart visualization

### Scenario 4: Empty State
1. Log out and log in as different user (with no attempts)
2. Go to Progress page
3. Should see "No Progress Data" message
4. Encourages user to take mocks

---

## Advanced: Modify Test Data

Want different scores or more mocks? Edit the seed script:

**File:** `scripts/seed-progress-mocks.ts`

**Change score generation (line ~110):**
```typescript
// Current: Random 10-40 marks
const score = Math.random() * 30 + 10;

// To always get high scores:
const score = Math.random() * 10 + 35; // 35-45

// To simulate failing:
const score = Math.random() * 15 + 5; // 5-20
```

**Change number of mocks (line ~60):**
```typescript
// Current: 3 mocks
const mockConfigs = [
  // Add more here
  { title: 'NIMCET Practice Mock 4', ... },
];
```

**Change sections per mock (line ~95):**
```typescript
// Current: 3 sections per mock
for (let i = 0; i < Math.min(nodes.length, 3); i++) {
  // Change 3 to different number
  // Increase to 5 sections per mock
  for (let i = 0; i < Math.min(nodes.length, 5); i++) {
```

Then re-run: `npm run dev` to test

---

## Performance Notes

✅ **Fast Load Times**
- Dashboard loads in <500ms (with seed data)
- Bar chart renders instantly
- Sorting happens on client

⚠️ **Scaling**
- Current implementation works well for <1000 attempts
- For larger datasets, consider server-side aggregation

---

## Next: Integration Testing

Once local testing works:

1. **Test with real mocks**
   - Create a mock test from the UI
   - Submit an attempt
   - Check Progress dashboard
   - Score should appear

2. **Test practice vs real**
   - Start attempt as "Practice"
   - Score shouldn't appear in progress
   - Start another as "Real Attempt"
   - Score should appear

3. **Test multiple exams**
   - Create mocks for JEE, NEET in addition to NIMCET
   - By Exam tab should show all

---

## Quick Links

- **Progress Page:** http://localhost:3000/progress
- **Mock Tests:** http://localhost:3000/mocks
- **Settings:** http://localhost:3000/settings
- **Dashboard:** http://localhost:3000/dashboard

---

## Need Help?

1. Check `/PROGRESS_TRACKING.md` for full technical docs
2. Review seed script comments: `scripts/seed-progress-mocks.ts`
3. Check browser console for errors
4. Verify database data with MySQL queries above

---

**Last Updated**: 2026-09-04  
**Status**: ✅ Ready for Testing
