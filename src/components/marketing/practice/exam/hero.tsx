import Link from 'next/link';
import { Zap, LogIn, Target, Trophy, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarStack } from '@/components/marketing/avatar-stack';
import { auth } from '@/lib/auth';

// Illustrative — no attempt-tracking is wired yet (same caveat as prep-dashboard.tsx /
// todays-practice.tsx). Placeholder numbers pending real per-user progress queries.
const PLACEHOLDER_SNAPSHOT = {
  targetScore: '650 / 1000',
  globalRank: '#4,210',
  streak: '14 Days',
};

interface HeroProps {
  examName: string;
  examSlug: string;
  questionCount: number;
  topicCount: number;
}

export async function Hero({ examName, examSlug, questionCount, topicCount }: HeroProps) {
  const session = await auth();

  return (
    <section className="bg-gradient-to-b from-secondary/10 via-background to-background py-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:items-start lg:px-8">
        <div>
          <span className="text-label-caps inline-flex items-center rounded-full border border-border bg-card px-4 py-2 uppercase text-secondary">
            {examName} {new Date().getFullYear()}
          </span>

          <h1 className="text-display-lg mt-6 text-foreground">Master the {examName} with Precision Practice.</h1>

          <p className="text-body-lg mt-4 max-w-xl text-muted-foreground">
            {questionCount > 0 ? `${questionCount}+` : 'Targeted'} questions across {topicCount > 0 ? `${topicCount}+` : 'every'}{' '}
            topics. Identify weaknesses, track progress, and build the endurance needed for a top rank.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={`/practice/exams/${examSlug}/questions`}>
                <Zap className="h-4 w-4" /> Start Random Practice
              </Link>
            </Button>
            <AvatarStack label="Aspirants practicing" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {session?.user ? (
            <>
              <p className="text-body-md font-semibold text-foreground">Your Snapshot</p>
              <div className="mt-4 space-y-4">
                <SnapshotRow icon={<Target className="h-4 w-4" />} label="Target Score" value={PLACEHOLDER_SNAPSHOT.targetScore} />
                <SnapshotRow icon={<Trophy className="h-4 w-4" />} label="Global Rank" value={PLACEHOLDER_SNAPSHOT.globalRank} />
                <SnapshotRow icon={<Flame className="h-4 w-4" />} label="Current Streak" value={PLACEHOLDER_SNAPSHOT.streak} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <LogIn className="h-5 w-5" />
              </div>
              <p className="text-body-md font-semibold text-foreground">Your Snapshot</p>
              <p className="text-body-sm text-muted-foreground">Sign in to see your target score, rank, and streak.</p>
              <Button size="sm" className="text-label-caps mt-1 w-full rounded-full uppercase tracking-wider" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SnapshotRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-body-sm flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-body-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
