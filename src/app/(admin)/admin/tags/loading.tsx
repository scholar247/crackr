import { Skeleton } from '@/components/ui/skeleton';

export default function TagsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton key={i} className="h-7 rounded-full" style={{ width: `${60 + (i % 5) * 20}px` }} />
        ))}
      </div>
    </div>
  );
}
