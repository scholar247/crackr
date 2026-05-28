import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTestsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
