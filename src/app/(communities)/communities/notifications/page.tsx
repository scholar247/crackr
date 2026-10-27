import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=%2Fcommunities%2Fnotifications');

  const notifications = await communityRepository.listNotifications(session.user.id, { limit: 50 });

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-foreground">Notifications</h1>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
        {notifications.length === 0 && <p className="p-6 text-sm text-muted-foreground">No notifications yet — comments and replies on your posts will show up here.</p>}
        {notifications.map((n) => (
          <Link key={n.id} href={`/communities/${n.communitySlug}/posts/${n.postId}`} className={cn('flex items-start gap-3 p-4 transition-colors hover:bg-accent', !n.read && 'bg-primary/5')}>
            <Avatar className="h-8 w-8 shrink-0">
              {n.actorImage && <AvatarImage src={n.actorImage} alt="" />}
              <AvatarFallback>{(n.actorName ?? '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{n.actorName ?? 'Someone'}</span> {n.type === 'POST_COMMENT' ? 'commented on your post' : 'replied to your comment'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt.toISOString())}</p>
            </div>
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
