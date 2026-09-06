import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Deliberately small — a nudge, not a full section. All three scopes route to the same
// self-mock wizard (/mocks/new/self already lets you build a chapter-, subject-, or
// full-exam-scoped mock in a few clicks); there's no query-param prefill into that wizard
// today, so this stays a prompt rather than a pre-configured deep link.
export function MockPromptCard() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
      <Card className="border-primary/20 bg-primary/5 transition-all duration-200 hover:shadow-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-body-sm font-medium text-foreground">Ready to test yourself? Give a mock by chapter, subject, or the full exam.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/mocks/new/self">Build a Mock</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
