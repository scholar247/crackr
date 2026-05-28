import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMCQLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 flex-1 min-w-48 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}
