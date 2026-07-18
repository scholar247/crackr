import { Metadata } from 'next';
import { SeedMonitorClient } from './seed-monitor-client';

export const metadata: Metadata = { title: 'AI Seed Monitor' };

export default function SeedMonitorPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seed Monitor</h1>
        <p className="text-muted-foreground mt-1">Track and retry AI Content Factory generation jobs</p>
      </div>
      <SeedMonitorClient />
    </div>
  );
}
