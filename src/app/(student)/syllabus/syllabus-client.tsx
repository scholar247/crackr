'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExamClient, SubjectClient, UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

interface SyllabusSection {
  sectionId: string;
  topicId: string;
  subjectId: string;
  displayName: string;
  mcqCount: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  lastAttemptedAt: string | null;
}

async function fetchProfile(): Promise<UserProfile | null> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function fetchAllExams(): Promise<ExamClient[]> {
  const res = await fetch('/api/exams');
  return (await res.json()).data ?? [];
}

async function fetchSubjectsForExam(examId: string): Promise<SubjectClient[]> {
  const res = await fetch(`/api/exams/subjects?examIds=${examId}`);
  return (await res.json()).data ?? [];
}

async function fetchCoverage(examId: string): Promise<SyllabusSection[]> {
  const res = await fetch(`/api/exams/${examId}/coverage?forUser=true`);
  return (await res.json()).data ?? [];
}

function TopicStatusIcon({ attempted, accuracy }: { attempted: number; accuracy: number | null }) {
  if (attempted === 0) return <Circle className="h-4 w-4 text-muted-foreground/50" />;
  if (accuracy !== null && accuracy >= 70)
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  return <AlertCircle className="h-4 w-4 text-amber-500" />;
}

function SectionRow({ section, examId, onPractice }: {
  section: SyllabusSection;
  examId: string;
  onPractice: (topicId: string) => void;
}) {
  const isNotStarted = section.attempted === 0;
  const isStrong = section.accuracy !== null && section.accuracy >= 70;

  return (
    <div className={cn(
      'flex items-center gap-4 rounded-lg border border-border/60 p-3 hover:bg-accent/30 transition-colors',
      isStrong && 'border-success/20 bg-success/5',
      !isStrong && section.attempted > 0 && 'border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/10'
    )}>
      <TopicStatusIcon attempted={section.attempted} accuracy={section.accuracy} />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isNotStarted && 'text-muted-foreground'
        )}>
          {section.displayName}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {section.mcqCount} questions
          </span>
          {section.attempted > 0 && (
            <>
              <span className="text-xs text-muted-foreground">
                {section.attempted} attempted
              </span>
              <span className={cn(
                'text-xs font-medium',
                isStrong ? 'text-success' : 'text-amber-600 dark:text-amber-400'
              )}>
                {section.accuracy}% accuracy
              </span>
            </>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-xs"
        onClick={() => onPractice(section.topicId)}
      >
        Practice
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

export function SyllabusClient() {
  const router = useRouter();
  const [activeExamId, setActiveExamId] = useState<string>('');
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: allExams = [] } = useQuery({ queryKey: ['exams-all'], queryFn: fetchAllExams });

  // Filter to only user's target exams
  const myExams = allExams.filter((e) => profile?.targetExamIds?.includes(e.id));

  // Auto-select primary exam
  const selectedExamId = activeExamId || profile?.primaryExamId || myExams[0]?.id || '';

  const { data: subjects = [] } = useQuery({
    queryKey: ['exam-subjects', selectedExamId],
    queryFn: () => fetchSubjectsForExam(selectedExamId),
    enabled: !!selectedExamId,
  });

  const selectedSubjectId = activeSubjectId || subjects[0]?.id || '';

  const { data: coverage = [], isLoading: coverageLoading } = useQuery({
    queryKey: ['syllabus-coverage', selectedExamId],
    queryFn: () => fetchCoverage(selectedExamId),
    enabled: !!selectedExamId,
  });

  // Filter coverage to selected subject
  const subjectSections = coverage.filter((s) => s.subjectId === selectedSubjectId);
  const totalAttempted = subjectSections.filter((s) => s.attempted > 0).length;
  const totalSections = subjectSections.length;
  const avgAccuracy =
    subjectSections.filter((s) => s.accuracy !== null).length > 0
      ? Math.round(
          subjectSections.filter((s) => s.accuracy !== null).reduce((a, s) => a + (s.accuracy ?? 0), 0) /
          subjectSections.filter((s) => s.accuracy !== null).length
        )
      : null;

  const handlePractice = (topicId: string) => {
    const params = new URLSearchParams({ examId: selectedExamId, topicId });
    router.push(`/practice?${params}`);
  };

  if (myExams.length === 0 && profile?.onboardingCompleted) {
    return (
      <EmptyState
        icon="study"
        title="No exams in your profile"
        description="Add target exams in your settings to track your syllabus coverage."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Exam selector */}
      {myExams.length <= 4 ? (
        <Tabs
          value={selectedExamId}
          onValueChange={(v) => { setActiveExamId(v); setActiveSubjectId(''); }}
        >
          <TabsList>
            {myExams.map((exam) => (
              <TabsTrigger key={exam.id} value={exam.id}>
                {exam.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : (
        <Select
          value={selectedExamId}
          onValueChange={(v) => { setActiveExamId(v); setActiveSubjectId(''); }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select exam" />
          </SelectTrigger>
          <SelectContent>
            {myExams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Subject tabs */}
      {subjects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubjectId(sub.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                selectedSubjectId === sub.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              )}
              style={selectedSubjectId === sub.id ? undefined : { borderColor: sub.color + '60' }}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Subject overview */}
      {totalSections > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {subjects.find((s) => s.id === selectedSubjectId)?.name ?? ''} Coverage
            </p>
            <p className="text-sm text-muted-foreground">
              {totalAttempted}/{totalSections} topics attempted
            </p>
          </div>
          <Progress value={totalSections > 0 ? (totalAttempted / totalSections) * 100 : 0} className="h-2" />
          {avgAccuracy !== null && (
            <p className="text-xs text-muted-foreground">
              Average accuracy: <span className="font-medium text-foreground">{avgAccuracy}%</span>
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Strong (≥70%)</span>
        <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Needs work</span>
        <span className="flex items-center gap-1"><Circle className="h-3.5 w-3.5 text-muted-foreground/50" /> Not started</span>
      </div>

      {/* Sections list */}
      {coverageLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : subjectSections.length === 0 ? (
        <EmptyState
          icon="study"
          title="No syllabus data"
          description="No sections found for this exam and subject. Contact an admin to set up the exam syllabus."
        />
      ) : (
        <div className="space-y-2">
          {subjectSections.map((section) => (
            <SectionRow
              key={section.sectionId}
              section={section}
              examId={selectedExamId}
              onPractice={handlePractice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
