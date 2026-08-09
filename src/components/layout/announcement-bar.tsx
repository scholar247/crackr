import { LiveDot } from '@/components/marketing/live-dot';

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-surface-container-low/60 py-1.5 text-center backdrop-blur-md">
      <p className="text-label-caps inline-flex items-center gap-2 uppercase tracking-widest text-secondary">
        <LiveDot />
        NIMCET &amp; JEE 2026 test series updated with latest exam pattern
      </p>
    </div>
  );
}
