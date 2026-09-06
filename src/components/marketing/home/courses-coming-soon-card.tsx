import { GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Section 7.6 — same "Coming Soon" convention as feature-strip.tsx. No payment
// integration or course model exists yet; this is purely a roadmap preview so the
// primary-exam section doesn't look incomplete without it.
export function CoursesComingSoonCard({ examName }: { examName: string }) {
  return (
    <section className="bg-surface-container-lowest py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="border-dashed">
          <CardHeader className="flex-row items-center gap-4 space-y-0 border-b-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">A Guided {examName} Course</CardTitle>
                <Badge variant="warning">Coming Soon</Badge>
              </div>
              <CardDescription>A structured, syllabus-mapped course — in the works.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
