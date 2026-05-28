import { Metadata } from 'next';
import { UsersClient } from './users-client';

export const metadata: Metadata = { title: 'Users | Admin' };

export default function AdminUsersPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage user roles and group assignments</p>
      </div>
      <UsersClient />
    </div>
  );
}
