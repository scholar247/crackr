'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Download, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { samplePaperDownloadUrl, type SamplePaperDoc } from '@/lib/sample-papers';

/**
 * Download for signed-in users, "Sign in to download" for everyone else. The paper pages
 * are ISR-cached (same HTML for every visitor), so the session is read on the client.
 * The server checks again: the download route itself requires sign-in and records each
 * download, so this button is only the UI for that rule.
 */
export function DownloadButton({ paperId, doc }: { paperId: string; doc: SamplePaperDoc }) {
  const { status } = useSession();
  const pathname = usePathname();
  const label = doc === 'scheme' ? 'marking scheme' : 'paper';

  if (status === 'loading') {
    return (
      <Button variant="outline" className="rounded-full" disabled>
        <Download className="mr-1.5 h-4 w-4" /> Download
      </Button>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Button variant="outline" className="rounded-full" asChild>
        <Link href={`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`} title={`Sign in to download the ${label}`}>
          <Lock className="mr-1.5 h-4 w-4" /> Sign in to download
        </Link>
      </Button>
    );
  }

  return (
    <Button className="rounded-full" asChild>
      {/* Plain <a>, not <Link>: a file response, and no prefetching that would log a download. */}
      <a href={samplePaperDownloadUrl(paperId, doc)} download onClick={() => toast.success(`Downloading the ${label}…`)}>
        <Download className="mr-1.5 h-4 w-4" /> Download {label}
      </a>
    </Button>
  );
}
