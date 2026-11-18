'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** Shares the page with the system share sheet (WhatsApp, Telegram…), or copies the link. */
export function SharePageButton({ title, text, url, className }: { title: string; text: string; url: string; className?: string }) {
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied — share it with your classmates!');
      }
      trackEvent('exam_page_shared', { url });
    } catch {
      // Share sheet dismissed.
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this page"
      title="Share with friends"
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-4 text-sm font-semibold text-foreground backdrop-blur transition hover:border-primary/40 hover:text-primary',
        className,
      )}
    >
      <Share2 className="h-4 w-4" /> <span className="sm:hidden lg:inline">Share</span>
    </button>
  );
}
