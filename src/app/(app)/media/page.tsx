import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MediaLibrary } from '@/components/media/media-library';

export default async function MediaPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  return <MediaLibrary />;
}
