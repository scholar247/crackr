import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/lib/auth';
import { ProgressByExam } from '@/components/progress/progress-by-exam';
import { ProgressBySubject } from '@/components/progress/progress-by-subject';
import { ProgressByChapter } from '@/components/progress/progress-by-chapter';
import { TrendingUp } from 'lucide-react';

export default async function ProgressPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Mock Progress</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Track your mock test performance across exams, subjects, and chapters.
        </p>
      </div>

      <Tabs defaultValue="exam" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exam">By Exam</TabsTrigger>
          <TabsTrigger value="subject">By Subject</TabsTrigger>
          <TabsTrigger value="chapter">By Chapter</TabsTrigger>
        </TabsList>

        <TabsContent value="exam" className="space-y-4">
          <ProgressByExam userId={session.user.id} />
        </TabsContent>

        <TabsContent value="subject" className="space-y-4">
          <ProgressBySubject userId={session.user.id} />
        </TabsContent>

        <TabsContent value="chapter" className="space-y-4">
          <ProgressByChapter userId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
