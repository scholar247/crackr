'use client';

import { useState } from 'react';
import { FileCheck2, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { samplePaperFileUrl, type SamplePaperDoc } from '@/lib/sample-papers';
import { PdfViewer } from './pdf-viewer';
import { DownloadButton } from './download-button';

// Question paper / marking scheme switcher with a download button for whichever is open.
// Radix unmounts the inactive tab, so only the PDF being read is fetched.
export function PaperDocumentTabs({ paperId, title, hasMarkingScheme }: { paperId: string; title: string; hasMarkingScheme: boolean }) {
  const [doc, setDoc] = useState<SamplePaperDoc>('paper');

  return (
    <Tabs value={doc} onValueChange={(v) => setDoc(v as SamplePaperDoc)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="h-11">
          <TabsTrigger value="paper" className="gap-1.5 px-4 py-2">
            <FileText className="h-4 w-4" /> Question paper
          </TabsTrigger>
          <TabsTrigger value="scheme" className="gap-1.5 px-4 py-2" disabled={!hasMarkingScheme}>
            <FileCheck2 className="h-4 w-4" /> Marking scheme
          </TabsTrigger>
        </TabsList>
        <DownloadButton paperId={paperId} doc={doc} />
      </div>
      <TabsContent value="paper" className="mt-4">
        <PdfViewer src={samplePaperFileUrl(paperId, 'paper')} title={`${title} question paper`} />
      </TabsContent>
      {hasMarkingScheme && (
        <TabsContent value="scheme" className="mt-4">
          <PdfViewer src={samplePaperFileUrl(paperId, 'scheme')} title={`${title} marking scheme`} />
        </TabsContent>
      )}
    </Tabs>
  );
}
