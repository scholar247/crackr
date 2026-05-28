'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Radio, ExternalLink, Pencil, Trash2, X, Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LiveSessionClient } from '@/types/course.types';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LIVE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

interface TeacherLiveManagerClientProps {
  courseId: string;
  courseTitle: string;
  sessions: LiveSessionClient[];
  teacherId: string;
}

export function TeacherLiveManagerClient({
  courseId, courseTitle, sessions: initialSessions, teacherId,
}: TeacherLiveManagerClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionModal, setSessionModal] = useState<{ session?: LiveSessionClient } | null>(null);
  const [goLiveModal, setGoLiveModal] = useState<{ sessionId: string } | null>(null);
  const [recordingModal, setRecordingModal] = useState<{ sessionId: string } | null>(null);
  const [goLiveUrl, setGoLiveUrl] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');

  const upcoming = sessions
    .filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = sessions
    .filter((s) => s.status === 'COMPLETED' || s.status === 'CANCELLED')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const handleGoLive = async () => {
    if (!goLiveModal || !goLiveUrl) return;
    const res = await fetch(`/api/teacher/courses/${courseId}/live/${goLiveModal.sessionId}/go-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinUrl: goLiveUrl }),
    });
    if (!res.ok) { toast.error('Failed to go live'); return; }
    const { data } = await res.json();
    setSessions((prev) => prev.map((s) => s.id === data.id ? data : s));
    setGoLiveModal(null);
    setGoLiveUrl('');
    toast.success('Session is now LIVE! Students have been notified.');
  };

  const handleCancel = async (sessionId: string) => {
    if (!confirm('Cancel this session?')) return;
    const res = await fetch(`/api/teacher/courses/${courseId}/live/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    if (res.ok) {
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, status: 'CANCELLED' as const } : s));
      toast.success('Session cancelled');
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;
    const res = await fetch(`/api/teacher/courses/${courseId}/live/${sessionId}`, { method: 'DELETE' });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Session deleted');
    }
  };

  const handleAddRecording = async () => {
    if (!recordingModal || !recordingUrl) return;
    const res = await fetch(`/api/admin/courses/${courseId}/live/${recordingModal.sessionId}/recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingUrl }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setSessions((prev) => prev.map((s) => s.id === data.id ? data : s));
      setRecordingModal(null);
      setRecordingUrl('');
      toast.success('Recording added');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{courseTitle}</h1>
          <p className="text-sm text-muted-foreground">Live Session Manager</p>
        </div>
        <Button onClick={() => setSessionModal({})}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[s.status])}>
                      {s.status === 'LIVE' && (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse mr-1" />
                      )}
                      {s.status}
                    </span>
                    <span className="font-medium truncate">{s.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(s.scheduledAt), 'EEE d MMM · h:mm a')} · {s.duration}min
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === 'SCHEDULED' && (
                    <Button
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-600 text-white"
                      onClick={() => { setGoLiveModal({ sessionId: s.id }); setGoLiveUrl(s.joinUrl ?? ''); }}
                    >
                      <Radio className="h-3.5 w-3.5 mr-1.5" />
                      Go Live
                    </Button>
                  )}
                  {s.status === 'LIVE' && s.joinUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={s.joinUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Open
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSessionModal({ session: s })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancel(s.id)}
                    disabled={s.status === 'CANCELLED'}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <details>
            <summary className="text-sm font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer mb-3 list-none">
              Past Sessions ({past.length})
            </summary>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border mt-3">
              {past.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_COLORS[s.status])}>
                        {s.status}
                      </span>
                      <span className="font-medium truncate">{s.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(s.scheduledAt), 'EEE d MMM · h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.recordingUrl ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-3.5 w-3.5 mr-1.5" />Recording
                        </a>
                      </Button>
                    ) : s.status === 'COMPLETED' && (
                      <Button size="sm" variant="outline" onClick={() => setRecordingModal({ sessionId: s.id })}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Add Recording
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="font-medium">No sessions scheduled yet</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setSessionModal({})}>
            Schedule First Session
          </Button>
        </div>
      )}

      {/* Go Live modal */}
      <Dialog open={!!goLiveModal} onOpenChange={() => setGoLiveModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Go Live</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Paste your meeting link to start the session</p>
            <div className="space-y-1.5">
              <Label>Meeting URL (Zoom / Meet / YouTube Live)</Label>
              <Input value={goLiveUrl} onChange={(e) => setGoLiveUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setGoLiveModal(null)}>Cancel</Button>
              <Button
                onClick={handleGoLive}
                className="bg-rose-500 hover:bg-rose-600 text-white"
                disabled={!goLiveUrl}
              >
                <Radio className="h-4 w-4 mr-2" />Start Live
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Recording modal */}
      <Dialog open={!!recordingModal} onOpenChange={() => setRecordingModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Recording</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Recording URL</Label>
              <Input value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRecordingModal(null)}>Cancel</Button>
              <Button onClick={handleAddRecording} disabled={!recordingUrl}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Session modal */}
      {sessionModal !== null && (
        <SessionFormModal
          courseId={courseId}
          teacherId={teacherId}
          session={sessionModal.session}
          onSave={(saved) => {
            setSessions((prev) =>
              sessionModal.session
                ? prev.map((s) => s.id === saved.id ? saved : s)
                : [...prev, saved]
            );
            setSessionModal(null);
          }}
          onClose={() => setSessionModal(null)}
        />
      )}
    </div>
  );
}

function SessionFormModal({
  courseId, teacherId, session, onSave, onClose,
}: {
  courseId: string;
  teacherId: string;
  session?: LiveSessionClient;
  onSave: (session: LiveSessionClient) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(session?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    session?.scheduledAt ? new Date(session.scheduledAt).toISOString().slice(0, 16) : ''
  );
  const [duration, setDuration] = useState(session?.duration?.toString() ?? '60');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !scheduledAt) { toast.error('Fill in all required fields'); return; }
    setSaving(true);
    const isNew = !session;
    const url = isNew
      ? `/api/teacher/courses/${courseId}/live`
      : `/api/teacher/courses/${courseId}/live/${session.id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, teacherId, scheduledAt, duration: parseInt(duration) }),
    });
    if (!res.ok) { toast.error('Failed to save session'); setSaving(false); return; }
    const { data } = await res.json();
    onSave(data);
    toast.success(isNew ? 'Session scheduled' : 'Session updated');
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{session ? 'Edit Session' : 'Schedule Session'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={15} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
