import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-64 rounded-lg" />
      <Skeleton className="h-[480px] rounded-xl" />
    </div>
  );
}
