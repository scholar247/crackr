'use client';

import type { ReactNode } from 'react';
import { LayoutDashboard, BookOpen, FileCheck2, Map, HelpCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PlaceholderTab } from './placeholder-tab';

const TAB_LIST = [
  { value: 'overview', label: 'Overview' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'subjects', label: 'Subjects' },
  { value: 'study-material', label: 'Study Material' },
  { value: 'mock-tests', label: 'Mock Tests' },
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'faq', label: 'FAQ' },
] as const;

interface ExamTabsProps {
  defaultTab?: string;
  overview: ReactNode;
  subjects: ReactNode;
}

export function ExamTabs({ defaultTab, overview, subjects }: ExamTabsProps) {
  const initial = TAB_LIST.some((t) => t.value === defaultTab) ? defaultTab : 'overview';

  return (
    <Tabs defaultValue={initial} className="w-full">
      <div className="border-b border-border bg-card">
        <TabsList className="mx-auto h-auto w-full max-w-6xl justify-start gap-6 overflow-x-auto rounded-none bg-transparent px-4 py-0 sm:px-6 lg:px-8">
          {TAB_LIST.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'text-body-sm shrink-0 rounded-none border-b-2 border-transparent px-1 py-3.5 text-muted-foreground shadow-none',
                'data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none'
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <TabsContent value="overview" className="mt-0 space-y-10">
          {overview}
        </TabsContent>
        <TabsContent value="dashboard" className="mt-0">
          <PlaceholderTab icon={LayoutDashboard} label="Detailed Dashboard" />
        </TabsContent>
        <TabsContent value="subjects" className="mt-0">
          {subjects}
        </TabsContent>
        <TabsContent value="study-material" className="mt-0">
          <PlaceholderTab icon={BookOpen} label="Study Material" />
        </TabsContent>
        <TabsContent value="mock-tests" className="mt-0">
          <PlaceholderTab icon={FileCheck2} label="Mock Tests" />
        </TabsContent>
        <TabsContent value="roadmap" className="mt-0">
          <PlaceholderTab icon={Map} label="Roadmap" />
        </TabsContent>
        <TabsContent value="faq" className="mt-0">
          <PlaceholderTab icon={HelpCircle} label="FAQ" />
        </TabsContent>
      </div>
    </Tabs>
  );
}
