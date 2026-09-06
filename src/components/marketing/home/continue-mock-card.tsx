import Link from 'next/link';
import { PlayCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContinueMockCardProps {
  assessmentId: string;
  title: string;
  durationSeconds: number | null;
}

// Section 7.2 — only ever rendered when a genuine IN_PROGRESS attempt exists (checked in
// page.tsx via listMyAttempts); there is no "nothing to resume" state for this component,
// because the caller simply doesn't render it in that case.
export function ContinueMockCard({ assessmentId, title, durationSeconds }: ContinueMockCardProps) {
  return (
    <Card className="border-primary/30 bg-primary/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-label-caps uppercase text-primary">Continue where you left off</p>
            <p className="text-body-md font-semibold text-foreground">{title}</p>
            {durationSeconds && (
              <p className="text-body-sm mt-0.5 flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {Math.round(durationSeconds / 60)} min
              </p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/mocks/${assessmentId}`}>Resume</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
