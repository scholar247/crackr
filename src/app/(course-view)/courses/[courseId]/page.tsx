import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen, Clock, Users, Globe, Award, Play,
  CheckCircle, Lock, FileText, Video, FileIcon, HelpCircle
} from 'lucide-react';
import { serverGet } from '@/lib/server-fetch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { EnrollButton } from '@/components/courses/enroll-button';
import { LiveSessionCard } from '@/components/courses/live-session-card';
import { cn } from '@/lib/utils';
import type { LessonType } from '@/types/course.types';

const LESSON_ICONS: Record<LessonType, React.ElementType> = {
  VIDEO: Video,
  TEXT: FileText,
  PDF: FileIcon,
  QUIZ: HelpCircle,
  ASSIGNMENT: CheckCircle,
};

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId } = await params;
  try {
    const data = await serverGet<{ course: any }>(`/api/courses/${courseId}/landing`);
    return { title: data?.course ? `${data.course.title} | scholar247` : 'Course | scholar247' };
  } catch {
    return { title: 'Course | scholar247' };
  }
}

export default async function CourseLandingPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  const { courseId } = await params;

  const data = await serverGet<{
    course: any; curriculum: any[]; enrollment: any; upcomingSessions: any[]; exam: any; teachers: any[];
  }>(`/api/courses/${courseId}/landing`).catch(() => null);

  if (!data?.course || (data.course.status !== 'PUBLISHED' && data.course.status !== 'COMING_SOON' && session.user.role === 'STUDENT')) {
    notFound();
  }

  const { course, curriculum, enrollment, upcomingSessions, exam, teachers } = data;
  const subjects = curriculum;

  const isEnrolled = enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED';

  const totalLessons = curriculum.reduce((s: number, sub: any) => s + sub.topics.reduce((ts: number, t: any) => ts + t.lessons.length, 0), 0);
  const freeLessons = curriculum.reduce((s: number, sub: any) => s + sub.topics.reduce((ts: number, t: any) => ts + t.lessons.filter((l: any) => l.isFree).length, 0), 0);

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      {course.bannerUrl && (
        <div className="relative h-56 md:h-72 w-full">
          <Image src={course.bannerUrl} alt={course.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Title + badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                  {exam?.name ?? course.examId}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{course.type}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{course.level}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium flex items-center gap-1">
                  <Globe className="h-3 w-3" />{course.language}
                </span>
              </div>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-muted-foreground">{course.shortDescription}</p>
              )}
            </div>

            {/* Teachers */}
            {teachers.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {teachers.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {t.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                {(course.type === 'LIVE' || course.type === 'HYBRID') && (
                  <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="pt-4 space-y-6">
                {course.description && (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                )}

                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: BookOpen, label: 'Subjects', value: subjects.length },
                    { icon: Play, label: 'Lessons', value: totalLessons },
                    { icon: Clock, label: 'Hours', value: `${course.totalHours}h` },
                    { icon: Users, label: 'Enrolled', value: course.enrolledCount.toLocaleString() },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                      <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="curriculum" className="pt-4 space-y-4">
                {(curriculum as any[]).map((subject: any) => (
                  <div key={subject.id} className="rounded-xl border border-border overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 font-semibold text-sm flex items-center justify-between">
                      <span>{subject.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {subject.topics.length} topics · {subject.topics.reduce((s: number, t: any) => s + t.lessons.length, 0)} lessons
                      </span>
                    </div>
                    {(subject.topics as any[]).map((topic: any) => (
                      <details key={topic.id} className="group">
                        <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-accent/50 list-none flex items-center justify-between">
                          <span>{topic.title}</span>
                          <span className="text-xs text-muted-foreground">{topic.lessons.length} lessons</span>
                        </summary>
                        <div className="divide-y divide-border">
                          {(topic.lessons as any[]).map((lesson: any) => {
                            const Icon = LESSON_ICONS[lesson.type as LessonType];
                            return (
                              <div key={lesson.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="flex-1">{lesson.title}</span>
                                {lesson.isFree ? (
                                  <span className="text-xs text-primary font-medium">Free</span>
                                ) : !isEnrolled ? (
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : null}
                                {lesson.duration && (
                                  <span className="text-xs text-muted-foreground">{Math.ceil(lesson.duration / 60)}m</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="sessions" className="pt-4 space-y-3">
                {upcomingSessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No upcoming sessions scheduled.</p>
                ) : (
                  upcomingSessions.map((s) => (
                    <LiveSessionCard key={s.id} session={s} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT — sticky enrollment card */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {course.thumbnailUrl && (
                <div className="relative aspect-video">
                  <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="text-center">
                  {course.isSubscriptionRequired ? (
                    <p className="text-sm font-semibold text-amber-600">Subscription Required</p>
                  ) : (
                    <p className="text-2xl font-bold text-success">Free</p>
                  )}
                </div>

                <EnrollButton
                  courseId={courseId}
                  isEnrolled={isEnrolled}
                  isSubscriptionRequired={course.isSubscriptionRequired}
                  courseStatus={course.status}
                  className="w-full"
                />

                {isEnrolled && enrollment && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Your progress</span>
                      <span className="font-semibold">{enrollment.progress}%</span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                    {enrollment.lastLessonId && (
                      <p className="text-xs text-muted-foreground">
                        Last: lesson in progress
                      </p>
                    )}
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  {[
                    { icon: BookOpen, text: `${subjects.length} subjects` },
                    { icon: Play, text: `${totalLessons} lessons` },
                    ...(freeLessons > 0 ? [{ icon: Award, text: `${freeLessons} free preview lessons` }] : []),
                    ...(course.totalLiveSessions > 0 ? [{ icon: Users, text: `${course.totalLiveSessions} live sessions` }] : []),
                    { icon: Globe, text: `${course.language}` },
                  ].map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Live session CTA */}
            {upcomingSessions.length > 0 && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/courses/${courseId}/live`}>
                  View All Sessions ({upcomingSessions.length} upcoming)
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
