import Link from 'next/link';
import { Cog, Laptop, Briefcase, Landmark, Wallet, Grid2x2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Single source of truth for category chips: label shown + keyword matched against exam
// name/description/program name in page.tsx (no DB category field exists — see plan).
export const EXAM_CATEGORIES = [
  { id: 'engineering', label: 'Engineering', icon: Cog, keyword: 'engineering' },
  { id: 'computer-applications', label: 'Computer Applications', icon: Laptop, keyword: 'computer' },
  { id: 'management', label: 'Management', icon: Briefcase, keyword: 'management' },
  { id: 'govt-services', label: 'Govt. Services', icon: Landmark, keyword: 'govt' },
  { id: 'banking', label: 'Banking', icon: Wallet, keyword: 'bank' },
] as const;

export function CategoryBrowse({ active }: { active?: string }) {
  return (
    <section id="browse-by-category" className="bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Browse by Category</h2>
        <p className="text-body-md mt-1 text-muted-foreground">Explore exams curated for specific career paths.</p>

        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {EXAM_CATEGORIES.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/exams?category=${id}`}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-primary/40',
                active === id ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-body-sm font-medium text-foreground">{label}</p>
            </Link>
          ))}

          <Link
            href="/exams"
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-primary/40',
              !active ? 'border-primary bg-primary/5' : 'border-border'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Grid2x2 className="h-5 w-5" />
            </div>
            <p className="text-body-sm font-medium text-foreground">View All</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
