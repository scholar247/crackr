import { Metadata } from 'next';
import { GroupsClient } from './groups-client';

export const metadata: Metadata = { title: 'Groups | Admin' };

export default function AdminGroupsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Groups</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage student groups for targeted test access</p>
      </div>
      <GroupsClient />
    </div>
  );
}
