import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted/30">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-border">
            {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-4" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
