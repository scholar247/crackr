'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NotificationView {
  id: number;
  type: 'POST_COMMENT' | 'COMMENT_REPLY';
  postId: number;
  communitySlug: string;
  actorName: string | null;
  read: boolean;
  createdAt: string;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const data = await fetchJson('/api/v1/communities/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent — the bell just stays at its last known state
    }
  }

  useEffect(() => {
    fetchJson('/api/v1/communities/notifications').then(
      (data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      },
      () => {},
    );
  }, []);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) await load();
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetchJson('/api/v1/communities/notifications/read-all', { method: 'POST' });
    } catch {
      load();
    }
  }

  async function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetchJson(`/api/v1/communities/notifications/${id}/read`, { method: 'POST' });
    } catch {
      load();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>}
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={`/communities/${n.communitySlug}/posts/${n.postId}`}
              onClick={() => !n.read && markRead(n.id)}
              className={cn('block border-b border-border p-3 text-sm last:border-b-0 hover:bg-accent', !n.read && 'bg-primary/5')}
            >
              <p className="text-foreground">
                <span className="font-medium">{n.actorName ?? 'Someone'}</span>{' '}
                {n.type === 'POST_COMMENT' ? 'commented on your post' : 'replied to your comment'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
            </Link>
          ))}
        </div>
        <Link href="/communities/notifications" className="block border-t border-border p-2.5 text-center text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
