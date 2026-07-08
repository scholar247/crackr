import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background">
      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} scholar247 — Free practice for every student.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/subjects" className="hover:text-foreground transition-colors">Subjects</Link>
            <Link href="/exams" className="hover:text-foreground transition-colors">Exams</Link>
            <Link href="/pyp" className="hover:text-foreground transition-colors">PYP</Link>
            <Link href="/blogs" className="hover:text-foreground transition-colors">Blogs</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            {!session?.user && (
              <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
