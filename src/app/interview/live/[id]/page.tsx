import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { interviewService, resolveCanEdit } from '@/server/services/interview.service';
import { Badge } from '@/components/ui/badge';
import { PenLine } from 'lucide-react';
import { CopyLinkButton } from './copy-link-button';
import { InterviewCanvasLoader } from '@/components/interview/canvas/interview-canvas-loader';

interface InterviewLiveRouteProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Live System Design Interview',
  robots: { index: false, follow: false }, // ad hoc interview rooms shouldn't be crawled
};

/**
 * No realtime connection yet (that's Phase 7) — each visitor has their own
 * live canvas that autosaves independently, so two people on the same link
 * right now will overwrite each other's autosaves rather than see each
 * other's cursor. Fine for one person sketching solo; Phase 7 is what makes
 * this actually collaborative.
 */
export default async function InterviewLiveRoute({ params }: InterviewLiveRouteProps) {
  const { id } = await params;
  const session = await auth();
  const { diagram, access } = await interviewService.openLive(id, session?.user?.id ?? null);
  const canEdit = resolveCanEdit(diagram, access);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <PenLine className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{diagram.title}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {diagram.visibility === 'PUBLIC' ? 'Anyone with the link' : 'Private'}
          </Badge>
          <Badge variant="secondary" className="text-xs shrink-0">
            {/* Mirrors resolveCanEdit's rule so this never says "Viewer" for
                someone who can, in fact, currently edit. */}
            {canEdit ? (access === 'OWNER' ? 'Owner' : access === 'EDITOR' ? 'Editor' : 'Anyone can edit') : 'Viewer'}
          </Badge>
        </div>
        <CopyLinkButton />
      </header>

      <InterviewCanvasLoader diagramId={diagram.id} initialContent={diagram.content} canEdit={canEdit} />
    </div>
  );
}
