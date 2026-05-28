import { Metadata } from 'next';
import { PYPClient } from './pyp-client';

export const metadata: Metadata = { title: 'Previous Year Papers | Admin' };

export default function AdminPYPPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Previous Year Papers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage PYPs and their question mappings
        </p>
      </div>
      <PYPClient />
    </div>
  );
}
