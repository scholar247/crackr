'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, User, ExternalLink, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LiveSessionClient } from '@/types/course.types';

interface LiveSessionCardProps {
  session: LiveSessionClient;
  variant?: 'compact' | 'full';
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LIVE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

function useCountdown(targetMs: number) {
  const [diff, setDiff] = useState(targetMs - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(targetMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return diff;
}

export function LiveSessionCard({ session, variant = 'full' }: LiveSessionCardProps) {
  const scheduledMs = new Date(session.scheduledAt).getTime();
  const diff = useCountdown(scheduledMs);
  const isLive = session.status === 'LIVE';
  const isUpcoming = session.status === 'SCHEDULED';
  const isPast = session.status === 'COMPLETED' || session.status === 'CANCELLED';

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-border bg-card text-sm">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{session.title}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(session.scheduledAt), 'EEE d MMM · h:mm a')} IST
          </p>
        </div>
        {isLive && session.joinUrl ? (
          <Button size="sm" asChild className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white">
            <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">Join</a>
          </Button>
        ) : isUpcoming ? (
          <Button size="sm" variant="outline" className="shrink-0">
            <Bell className="h-3 w-3 mr-1" />
            Remind
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3',
      isLive ? 'border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20' : 'border-border bg-card'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[session.status])}>
              {isLive ? (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  LIVE
                </span>
              ) : session.status}
            </span>
          </div>
          <h3 className="font-semibold leading-snug">{session.title}</h3>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {format(new Date(session.scheduledAt), 'EEE d MMM · h:mm a')} IST
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {session.duration} min
        </span>
        {session.teacherId && (
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            Teacher
          </span>
        )}
      </div>

      {/* Countdown for upcoming */}
      {isUpcoming && diff > 0 && (
        <p className="text-sm font-medium text-primary">
          Starts {formatDistanceToNow(scheduledMs, { addSuffix: true })}
        </p>
      )}

      {/* CTA */}
      <div className="flex gap-2 flex-wrap">
        {isLive && session.joinUrl ? (
          <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white">
            <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Live Class
            </a>
          </Button>
        ) : isUpcoming ? (
          <>
            {session.joinUrl && (
              <Button asChild variant="default">
                <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">
                  Join
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => downloadIcs(session)}>
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
          </>
        ) : session.recordingUrl ? (
          <Button asChild variant="outline">
            <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch Recording
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function downloadIcs(session: LiveSessionClient) {
  const start = new Date(session.scheduledAt);
  const end = new Date(start.getTime() + session.duration * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${session.title}`,
    session.joinUrl ? `URL:${session.joinUrl}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${session.title.replace(/\s+/g, '-')}.ics`;
  a.click();
}
