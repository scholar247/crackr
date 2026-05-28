# crackr

An EdTech platform for practising MCQs, taking mock tests, and tracking exam preparation progress. Built for JEE, NEET, UPSC, and similar competitive exams.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Auth**: NextAuth v5 (Google OAuth + Credentials)
- **Database**: Firebase Firestore (Admin SDK server-side, Firebase client SDK client-side)
- **Storage**: AWS S3 (question images)
- **UI**: Tailwind CSS v4, Radix UI, shadcn/ui components
- **State**: TanStack Query v5, Zustand
- **Charts**: Recharts
- **Rich text**: Tiptap v3 (MCQ editor with LaTeX via KaTeX)
- **Forms**: React Hook Form + Zod v4

## Project Structure

```
src/
  app/
    (student)/          # Student routes: dashboard, practice, mocks, tests, progress
    (admin)/admin/      # Admin portal: MCQs, tests, users, groups, subjects, reports
    api/                # API route handlers
    page.tsx            # Public landing page / auth redirect
  components/
    mcq/                # MCQ renderer, editor, answer selector
    shared/             # EmptyState, SectionErrorBoundary, etc.
    ui/                 # shadcn/ui primitives
    landing/            # Public landing page
  server/
    repositories/       # Firestore data access layer
    services/           # Business logic
  lib/
    auth.ts             # NextAuth configuration
    firebase-admin.ts   # Admin SDK singleton
    firebase.ts         # Client SDK singleton
  stores/               # Zustand stores (practice session)
  types/                # Shared TypeScript types
  schemas/              # Zod validation schemas
```

## Setup

### Prerequisites

- Node.js 20+
- Firebase project with Firestore enabled
- Google Cloud project (for OAuth)
- AWS S3 bucket (for image uploads)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
# NextAuth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth — https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=

# Firebase Client SDK — Firebase Console > Project Settings > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK — Firebase Console > Project Settings > Service Accounts > Generate new private key
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database** in production mode
3. Enable **Authentication** with Google and Email/Password providers
4. Go to **Project Settings > Service Accounts** and generate a new private key — paste the values into `.env.local`
5. Deploy Firestore security rules:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Promote the first admin

After signing up, open your Firestore database, find the user document in the `users` collection, and manually set `role` to `SUPER_ADMIN`. All subsequent role assignments can be done from the admin portal.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Roles

| Role | Access |
|------|--------|
| `STUDENT` | Dashboard, Practice, Mocks, Tests, Progress |
| `TEACHER` | All student pages + Admin portal (read + create MCQs/tests) |
| `ADMIN` | All of the above + user and group management |
| `SUPER_ADMIN` | All of the above + role assignment |

## Features

- **Practice Browser** — Browse the full MCQ bank by subject, difficulty, and search. Instant feedback with explanations. Session-level accuracy and streak tracking.
- **Mock Tests** — Generate randomised timed tests from any subject/category/difficulty combination. Score, percentile, and per-question breakdown.
- **Assigned Tests** — Teacher-created tests with scheduled start/end windows. Auto-graded.
- **Progress Reports** — Score trend over time, subject radar chart, difficulty breakdown, weak-area identification, and activity feed.
- **Admin MCQ Editor** — Rich-text editor with LaTeX math, image upload, single/multi-select, tags, and difficulty.
- **Admin Test Builder** — Pick MCQs from the bank, set a schedule window, assign to groups.
- **User & Group Management** — Assign students to groups; tests can be targeted at groups.
- **Platform Reports** — KPI summary, daily attempts chart, score distribution, top tests — with CSV export.

## Build for production

```bash
npm run build
npm start
```

Deploy to Vercel by connecting the repository and adding all environment variables from `.env.local` in the Vercel project settings.

## Firestore Security Rules

See `firestore.rules`. The rules allow authenticated users to read content they have access to; all writes go through the server via the Admin SDK (client writes are denied).

## Known type-level workarounds

- `zodResolver(...) as any` — Zod v4 `.default()` fields cause a type mismatch with `@hookform/resolvers`. Runtime behaviour is correct.
- Recharts tooltip `formatter` callbacks are cast to `any` — Recharts 3.x has a known `ValueType | undefined` variance issue.
- `src/proxy.ts` is the Next.js 16 equivalent of `middleware.ts`.
- JWT augmentation uses `declare module '@auth/core/jwt'` (not `next-auth/jwt`) for NextAuth v5.
