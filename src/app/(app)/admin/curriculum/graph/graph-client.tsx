'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamTreeView } from './exam-tree-view';
import { NodeLineageView } from './node-lineage-view';

type View = 'exam' | 'lineage';

export function SyllabusGraphClient() {
  const [view, setView] = useState<View>('exam');
  const [examId, setExamId] = useState<string | null>(null);
  // Visited nodes in the lineage view; the last entry is the one in focus, earlier ones back the "Back" button.
  const [lineageHistory, setLineageHistory] = useState<string[]>([]);

  function showLineage(nodeId: string) {
    setLineageHistory((h) => (h[h.length - 1] === nodeId ? h : [...h, nodeId]));
    setView('lineage');
  }

  function openExam(id: string) {
    setExamId(id);
    setView('exam');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Syllabus graph</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Scroll to zoom, drag to pan, click a node for its details and double-click to focus on it.
      </p>

      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="mt-6">
        <TabsList>
          <TabsTrigger value="exam">Exam tree</TabsTrigger>
          <TabsTrigger value="lineage">Node lineage</TabsTrigger>
        </TabsList>
        <p className="mt-2 text-xs text-muted-foreground">
          {view === 'exam'
            ? 'An exam and everything under it: subjects → chapters → topics → subtopics.'
            : 'One node with every parent and exam it belongs to on the left, and its children on the right.'}
        </p>
        {/* forceMount keeps each view's focus, search and zoom while switching tabs. */}
        <TabsContent value="exam" forceMount className="mt-4 data-[state=inactive]:hidden">
          <ExamTreeView examId={examId} onExamChange={setExamId} onShowLineage={showLineage} />
        </TabsContent>
        <TabsContent value="lineage" forceMount className="mt-4 data-[state=inactive]:hidden">
          <NodeLineageView
            nodeId={lineageHistory[lineageHistory.length - 1] ?? null}
            canGoBack={lineageHistory.length > 1}
            onNavigate={showLineage}
            onBack={() => setLineageHistory((h) => h.slice(0, -1))}
            onOpenExam={openExam}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
