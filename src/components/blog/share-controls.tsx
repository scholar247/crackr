'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Check, Link as LinkIcon } from 'lucide-react';

const SHARE_TARGETS = [
  {
    name: 'X',
    href: (url: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    label: 'Share on X',
  },
  {
    name: 'LinkedIn',
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    label: 'Share on LinkedIn',
  },
  {
    name: 'WhatsApp',
    href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    label: 'Share on WhatsApp',
  },
];

export function ShareControls({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
        {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      {SHARE_TARGETS.map((target) => (
        <Button key={target.name} variant="outline" size="sm" asChild>
          <a href={target.href(url, title)} target="_blank" rel="noopener noreferrer" aria-label={target.label}>
            {target.name}
          </a>
        </Button>
      ))}
    </div>
  );
}
