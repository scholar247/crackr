import { auth } from '@/lib/auth';

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <div className="mt-6 max-w-md space-y-4 rounded-lg border border-border p-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</div>
          <div className="mt-1 text-sm text-foreground">{session?.user?.name}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
          <div className="mt-1 text-sm text-foreground">{session?.user?.email}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</div>
          <div className="mt-1 text-sm text-foreground">{session?.user?.role}</div>
        </div>
      </div>
    </div>
  );
}
