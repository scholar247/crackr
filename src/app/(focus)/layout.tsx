import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// Distraction-free surface for the exam room — no AppShell (no sidebar/topbar), just the
// auth guard every (app) page gets. Nests directly under the true root layout
// (src/app/layout.tsx) the same way (app) and (marketing) each do.
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');
  return <>{children}</>;
}
