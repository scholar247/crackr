import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { CommunitiesShell } from '@/components/community/communities-shell';

// Public — no sign-in required to browse. Unlike the (app) group, this layout never
// redirects; individual pages/actions that need a session (posting, joining, My Hub,
// notifications, creating a community) handle the anonymous case themselves.
export default async function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const mine = session?.user ? await communityRepository.listMine(session.user.id) : [];

  return <CommunitiesShell mine={mine.map((c) => ({ slug: c.slug, name: c.name }))}>{children}</CommunitiesShell>;
}
