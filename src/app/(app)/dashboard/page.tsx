import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Your practice, mocks, and progress will show up here as those modules come online.
      </p>
    </div>
  );
}
